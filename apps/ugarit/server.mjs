import sharp from 'sharp';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const DATA=process.env.UGARIT_DATA_DIR || path.join(ROOT,'data');
const FILE=path.join(DATA,'menu.json');
const CREDENTIALS=path.join(DATA,'credentials.json');
const FEEDBACK_FILE=path.join(DATA,'feedback.json');
let feedback=[];
let feedbackQueue=Promise.resolve();
const saveFeedback=async(value=feedback)=>{const tmp=FEEDBACK_FILE+'.tmp';await fs.writeFile(tmp,JSON.stringify(value,null,2));await fs.rename(tmp,FEEDBACK_FILE)};
const editFeedback=fn=>{const task=feedbackQueue.then(async()=>{const draft=structuredClone(feedback);const result=fn(draft);await saveFeedback(draft);feedback=draft;return result});feedbackQueue=task.catch(()=>{});return task};
const PORT=Number(process.env.PORT || 4177);
const BIND=process.env.HOST || '127.0.0.1';
const MAX_BODY=7*1024*1024;
const tokenTTL=8*60*60*1000;
let records={sections:[],items:[],updatedAt:null};
let creds;
const sessions=new Map();

const loginAttempts = new Map();
const feedbackAttempts = new Map();

function rateLimit(store, key, max, windowMs) {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

// Remove expired counters periodically
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const store of [loginAttempts, feedbackAttempts]) {
    for (const [key, value] of store) {
      if (now >= value.resetAt) store.delete(key);
    }
  }
}, 10 * 60 * 1000);

cleanup.unref();

const json=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
const fail=(res,status,message)=>json(res,status,{error:message});
const hash=(p,s)=>crypto.scryptSync(p,s,64).toString('hex');
const invalid=message=>Object.assign(new Error(message),{status:400});
const safeText=(v,max=500)=>{if(v===undefined)return '';if(typeof v!=='string')throw invalid('Text must be a string');const text=v.trim();if([...text].length>max)throw invalid(`Text exceeds ${max} characters`);return text;};
const uuid=()=>crypto.randomUUID();
const validMoney=(v)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<1e7;
const write=async(value=records)=>{const tmp=FILE+'.tmp';await fs.writeFile(tmp,JSON.stringify(value,null,2));await fs.rename(tmp,FILE);};
let mutationQueue=Promise.resolve();
const mutate=(fn)=>{const task=mutationQueue.then(async()=>{const draft=structuredClone(records);const result=fn(draft);draft.updatedAt=new Date().toISOString();await write(draft);records=draft;return result;});mutationQueue=task.catch(()=>{});return task;};
async function readBody(req){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY)throw Object.assign(new Error('Request too large'),{status:413});chunks.push(chunk);}try{const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));if(!value||typeof value!=='object'||Array.isArray(value))throw Error();return value}catch{throw Object.assign(new Error('Invalid JSON'),{status:400})}}
const auth=req=>{const header=req.headers.authorization||'';const token=header.startsWith('Bearer ')?header.slice(7):'';const expiry=sessions.get(token);if(!expiry)return false;if(Date.now()>expiry){sessions.delete(token);return false}return token;};
function normalizeSection(body, old={}){for(const k of ['visible','available'])if(body[k]!==undefined&&typeof body[k]!=='boolean')throw invalid('Invalid '+k);if(body.sortOrder!==undefined&&!Number.isFinite(Number(body.sortOrder)))throw invalid('Invalid sort order');const name=safeText(body.name,100);if(!name)throw invalid('Section name required');if(records.sections.some(s=>s.id!==old.id&&s.name.trim().replace(/\s+/gu,' ').toLocaleLowerCase()===name.replace(/\s+/gu,' ').toLocaleLowerCase()))throw Object.assign(new Error('Category name already exists'),{status:409});return {...old,name,description:safeText(body.description,300),image:(()=>{const v=safeText(body.image,2048);if(v&&!/^\/(uploads|categories|dishes)\/[a-z0-9._-]+$|^https:\/\//i.test(v))throw Object.assign(new Error('Invalid cover image URL'),{status:400});return v})(),sortOrder:Number.isFinite(Number(body.sortOrder))?Number(body.sortOrder):0,visible:body.visible!==false};}
function normalizeItem(body,old={}){for(const k of ['visible','available'])if(body[k]!==undefined&&typeof body[k]!=='boolean')throw invalid('Invalid '+k);if(body.sortOrder!==undefined&&!Number.isFinite(Number(body.sortOrder)))throw invalid('Invalid sort order');const name=safeText(body.name,140);if(!name)throw Object.assign(new Error('Item name required'),{status:400});if(!records.sections.some(s=>s.id===body.sectionId))throw Object.assign(new Error('Valid section required'),{status:400});const price=(typeof body.price==='number'||typeof body.price==='string'&&body.price.trim()!=='')?Number(body.price):NaN;if(!validMoney(price)||body.price===''||body.price===null)throw Object.assign(new Error('Valid price required'),{status:400});const image=safeText(body.image,5_500_000);if(image&&!/^\/(uploads|dishes)\/[a-z0-9._-]+$|^https:\/\//i.test(image))throw Object.assign(new Error('Image must be an HTTPS URL or uploaded image'),{status:400});return {...old,name,sectionId:body.sectionId,price,description:safeText(body.description,1000),image,available:body.available!==false,visible:body.visible!==false,sortOrder:Number(body.sortOrder)||0};}
function publicMenu(){const sections=records.sections.filter(x=>x.visible).sort((a,b)=>a.sortOrder-b.sortOrder);const ids=new Set(sections.map(x=>x.id));return {sections,items:records.items.filter(x=>x.visible&&ids.has(x.sectionId)).sort((a,b)=>a.sortOrder-b.sortOrder),updatedAt:records.updatedAt,currency:'USD'};}
const exists=async p=>fs.access(p).then(()=>true).catch(()=>false);
const sendFile=async(res,file,type)=>{const contents=await fs.readFile(file);res.writeHead(200,{'Content-Type':type,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; img-src 'self' data: https:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"});res.end(contents);};
async function main(){await fs.mkdir(DATA,{recursive:true});await fs.mkdir(path.join(ROOT,'public','uploads'),{recursive:true});try{records=JSON.parse(await fs.readFile(FILE,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;await write();}
try{creds=JSON.parse(await fs.readFile(CREDENTIALS,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;const password=process.env.UGARIT_ADMIN_PASSWORD;if(!password||password.length<12)throw new Error('First start: set UGARIT_ADMIN_PASSWORD to at least 12 characters.');const salt=crypto.randomBytes(32).toString('hex');creds={username:process.env.UGARIT_ADMIN_USER||'admin',salt,hash:hash(password,salt)};await fs.writeFile(CREDENTIALS,JSON.stringify(creds,null,2),{mode:0o600});}
try{feedback=JSON.parse(await fs.readFile(FEEDBACK_FILE,'utf8'));if(!Array.isArray(feedback))throw Error('Invalid feedback store')}catch(e){if(e.code!=='ENOENT')throw e;await saveFeedback()}
http.createServer(async(req,res)=>{try{const base='http://localhost';const u=new URL(req.url,base);const p=u.pathname;const method=req.method;
if(method==='GET'&&p==='/admin')return await sendFile(res,path.join(ROOT,'public','admin.html'),'text/html; charset=utf-8');
if(method==='GET'&&p==='/admin.css')return await sendFile(res,path.join(ROOT,'public','admin.css'),'text/css; charset=utf-8');
if(method==='GET'&&p==='/admin.js')return await sendFile(res,path.join(ROOT,'public','admin.js'),'text/javascript; charset=utf-8');
if(method==='GET'&&p==='/menu'&&!(await exists(path.join(ROOT,'dist','index.html'))))return await sendFile(res,path.join(ROOT,'public','menu.html'),'text/html; charset=utf-8');
if(method==='GET'&&p.startsWith('/uploads/')){const name=p.slice('/uploads/'.length);if(!/^[a-z0-9._-]+$/.test(name))return fail(res,404,'Not found');const ext=path.extname(name);const mime={'.png':'image/png','.webp':'image/webp','.jpeg':'image/jpeg','.jpg':'image/jpeg'}[ext];if(!mime)return fail(res,404,'Not found');return await sendFile(res,path.join(ROOT,'public','uploads',name),mime);}
if(method==='GET'&&p==='/api/menu')return json(res,200,publicMenu());
if(method==='GET' && (p==='/'||p==='/menu'||p.startsWith('/assets/')||p.startsWith('/dishes/')||p.startsWith('/categories/')||/^\/[a-zA-Z0-9._-]+\.(webp|jpg|jpeg|png|svg|ico)$/.test(p))){
 const name=p==='/'||p==='/menu'?'index.html':decodeURIComponent(p.slice(1));
 if(name.includes('..')||name.includes('\\'))return fail(res,400,'Invalid path');
 const ext=path.extname(name).toLowerCase();
 const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon'}[ext];
 if(!mime)return fail(res,404,'Not found');
 const dist=path.join(ROOT,'dist',name);const pub=path.join(ROOT,'public',name);
 if(await exists(dist))return await sendFile(res,dist,mime);
 if(name!=='index.html'&&await exists(pub))return await sendFile(res,pub,mime);
 return fail(res,404,name==='index.html'?'Build site first: npm run build':'Not found');
}

if(method==='POST'&&p==='/api/login'){const clientIP = req.socket.remoteAddress || 'unknown';

if (!rateLimit(loginAttempts, clientIP, 10, 15 * 60 * 1000)) {
  res.setHeader('Retry-After', '900');
  return fail(res, 429, 'Too many login attempts. Try again later.');
}const b=await readBody(req);const okUser=typeof b.username==='string'&&b.username===creds.username;const inputHash=hash(String(b.password||''),creds.salt);const a=Buffer.from(inputHash,'hex'),c=Buffer.from(creds.hash,'hex');if(!okUser||!crypto.timingSafeEqual(a,c))return fail(res,401,'Invalid credentials');const token=crypto.randomBytes(32).toString('hex');sessions.set(token,Date.now()+tokenTTL);return json(res,200,{token,username:creds.username});}
if(method==='POST'&&p==='/api/feedback'){const clientIP = req.socket.remoteAddress || 'unknown';

if (!rateLimit(feedbackAttempts, clientIP, 5, 60 * 60 * 1000)) {
  res.setHeader('Retry-After', '3600');
  return fail(res, 429, 'Too many feedback submissions. Try again later.');
}
 const b=await readBody(req);const rating=typeof b.rating==='number'?b.rating:NaN;const notes=safeText(b.notes,3000);
 if(!Number.isInteger(rating)||rating<1||rating>5||!notes)return fail(res,400,'Rating and message are required');
 const email=safeText(b.email,254);if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return fail(res,400,'Invalid email');
 if(safeText(b.website))return json(res,201,{ok:true});
 const occasion=safeText(b.occasion,60);
 const record={id:uuid(),rating,name:safeText(b.name,120),email,occasion,notes,status:'new',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
 await editFeedback(feedback=>feedback.push(record));return json(res,201,{ok:true,id:record.id});
}
const token=auth(req);if(!token)return fail(res,401,'Authentication required');
if(method==='POST'&&p==='/api/logout'){sessions.delete(token);return json(res,200,{ok:true});}
if(method==='GET'&&p==='/api/admin/data')return json(res,200,records);
if(method==='GET'&&p==='/api/admin/feedback')return json(res,200,{feedback});
const fb=p.match(/^\/api\/admin\/feedback\/([a-f0-9-]+)$/);
if(fb&&method==='PATCH'){const b=await readBody(req);if(!['new','read','resolved'].includes(b.status))return fail(res,400,'Invalid status');let result;await editFeedback(feedback=>{const record=feedback.find(x=>x.id===fb[1]);if(!record)throw Object.assign(new Error('Not found'),{status:404});record.status=b.status;record.updatedAt=new Date().toISOString();result=record});return json(res,200,result)}
if(fb&&method==='DELETE'){await editFeedback(feedback=>{const before=feedback.length;feedback.splice(0,feedback.length,...feedback.filter(x=>x.id!==fb[1]));if(feedback.length===before)throw Object.assign(new Error('Not found'),{status:404})});return json(res,200,{ok:true})}
if(method==='POST'&&p==='/api/admin/password'){const b=await readBody(req);if(hash(String(b.current||''),creds.salt)!==creds.hash)return fail(res,403,'Incorrect current password');if(typeof b.next!=='string'||b.next.length<12)return fail(res,400,'New password must be at least 12 characters');const salt=crypto.randomBytes(32).toString('hex');const nextCreds={...creds,salt,hash:hash(b.next,salt)};await fs.writeFile(CREDENTIALS,JSON.stringify(nextCreds,null,2),{mode:0o600});creds=nextCreds;sessions.clear();return json(res,200,{ok:true});}
if(method==='POST'&&p==='/api/admin/upload'){const b=await readBody(req);const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(b.image||'');if(!match)return fail(res,400,'Only PNG, JPEG or WebP supported');const bytes=Buffer.from(match[2],'base64');if(bytes.length>4*1024*1024||bytes.length<12)return fail(res,400,'Image must be under 4 MB');try{const decoded=sharp(bytes,{failOn:'warning',limitInputPixels:40_000_000});const meta=await decoded.metadata();if(meta.format!==match[1]||!meta.width||!meta.height)throw Error();await decoded.raw().toBuffer();}catch{return fail(res,400,'Invalid or corrupt image content');}const ext=match[1]==='jpeg'?'jpg':match[1];const name=uuid()+'.'+ext;await fs.writeFile(path.join(ROOT,'public','uploads',name),bytes,{flag:'wx'});return json(res,201,{url:'/uploads/'+name});}
const sec=p.match(/^\/api\/admin\/sections(?:\/([a-f0-9-]+))?$/);if(sec){const id=sec[1];if(method==='POST'&&!id){const b=await readBody(req);let item;await mutate(records=>{item={id:uuid(),...normalizeSection(b)};records.sections.push(item)});return json(res,201,item);}if(method==='PUT'&&id){const b=await readBody(req);let result;await mutate(records=>{const index=records.sections.findIndex(x=>x.id===id);if(index<0)throw Object.assign(new Error('Not found'),{status:404});result={...records.sections[index],...normalizeSection(b,records.sections[index])};records.sections[index]=result});return json(res,200,result);}if(method==='DELETE'&&id){await mutate(records=>{if(records.items.some(x=>x.sectionId===id))throw Object.assign(new Error('Move or delete section items first'),{status:409});const n=records.sections.length;records.sections=records.sections.filter(x=>x.id!==id);if(n===records.sections.length)throw Object.assign(new Error('Not found'),{status:404})});return json(res,200,{ok:true});}}
const it=p.match(/^\/api\/admin\/items(?:\/([a-f0-9-]+))?$/);if(it){const id=it[1];if(method==='POST'&&!id){const b=await readBody(req);let result;await mutate(records=>{result={id:uuid(),...normalizeItem(b)};records.items.push(result)});return json(res,201,result);}if(method==='PUT'&&id){const b=await readBody(req);let result;await mutate(records=>{const i=records.items.findIndex(x=>x.id===id);if(i<0)throw Object.assign(new Error('Not found'),{status:404});result={...records.items[i],...normalizeItem(b)};records.items[i]=result});return json(res,200,result);}if(method==='DELETE'&&id){await mutate(records=>{const n=records.items.length;records.items=records.items.filter(x=>x.id!==id);if(n===records.items.length)throw Object.assign(new Error('Not found'),{status:404})});return json(res,200,{ok:true});}}
return fail(res,404,'Not found');
}catch(e){if(e.code==='ENOENT')return fail(res,404,'Not found');console.error('Request error:',e.message);return fail(res,e.status||500,e.status?e.message:'Internal server error');}}).listen(PORT,BIND,()=>console.log(`Ugarit admin: http://${BIND}:${PORT}/admin | public preview: /menu`));}
main().catch(e=>{console.error(e.message);process.exit(1)});
