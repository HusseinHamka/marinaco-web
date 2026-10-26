import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {publicDishes,reconcileBasket,basketLinesFor} from '../src/menu-state.js';
import sharp from 'sharp';

test('basket survives fallback IDs and uses refreshed authoritative data',()=>{
 const basket=reconcileBasket({legacy:3},{legacy:'stable'});
 const menu={sections:[{id:'s',name:'Renamed'}],items:[{id:'stable',sectionId:'s',price:12,available:true}]};
 assert.equal(basket.stable,3);assert.equal(basketLinesFor(basket,publicDishes(menu))[0].dish.price,'12.00');
 menu.items[0].price=20;assert.equal(publicDishes(menu).find(i=>i.id==='stable').price,'20.00');
 menu.items[0].available=false;assert.deepEqual(basketLinesFor(basket,publicDishes(menu)),[]);
 menu.sections[0].visible=false;assert.deepEqual(publicDishes(menu),[]);
 assert.deepEqual(basketLinesFor(basket,[]),[]);
});

test('API regression flows use isolated storage',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ugarit-tests-'));const port=19000+Math.floor(Math.random()*20000);
 const child=spawn(process.execPath,['server.mjs'],{env:{...process.env,UGARIT_DATA_DIR:dir,UGARIT_ADMIN_PASSWORD:'isolated-test-password',PORT:String(port)}});
 t.after(async()=>{child.kill();await once(child,'exit');await fs.rm(dir,{recursive:true,force:true});});
 await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('exit',()=>reject(Error('Server exited before ready')));child.stderr.once('data',x=>reject(Error(String(x))));});
 let token='';const request=async(url,method='GET',body)=>{const r=await fetch(`http://127.0.0.1:${port}${url}`,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()};};
 token=(await request('/api/login','POST',{username:'admin',password:'isolated-test-password'})).data.token;
 const section=(await request('/api/admin/sections','POST',{name:'Category',visible:true,sortOrder:4})).data;
 const item=(await request('/api/admin/items','POST',{name:'Dish',sectionId:section.id,price:5})).data;
 await t.test('duplicate normalized names and renames',async()=>{
 assert.equal((await request('/api/admin/sections','POST',{name:'  CATEGORY  '})).status,409);
 assert.equal((await request('/api/admin/sections/'+section.id,'PUT',{...section,name:'Renamed'})).status,200);
 const menu=(await request('/api/menu')).data;assert.equal(menu.items[0].sectionId,section.id);assert.equal(menu.sections[0].sortOrder,4);
 });
 await t.test('hidden categories filter all public records while admin retains them',async()=>{
 await request('/api/admin/sections/'+section.id,'PUT',{...section,visible:false});
 const menu=(await request('/api/menu')).data;assert.deepEqual(menu.items,[]);assert.deepEqual(menu.sections,[]);
 assert.equal((await request('/api/admin/data')).data.items.length,1);
 });
 await t.test('failed persistence preserves saved memory and public responses',async()=>{
 await request('/api/admin/sections/'+section.id,'PUT',{...section,visible:true});
 await fs.mkdir(path.join(dir,'menu.json.tmp'));
 assert.equal((await request('/api/admin/items/'+item.id,'PUT',{...item,price:99})).status,500);
 assert.equal((await request('/api/admin/data')).data.items[0].price,5);
 assert.equal((await request('/api/menu')).data.items[0].price,5);
 assert.equal(JSON.parse(await fs.readFile(path.join(dir,'menu.json'))).items[0].price,5);
 await fs.rmdir(path.join(dir,'menu.json.tmp'));
 });
 await t.test('invalid values, malformed JSON, oversized feedback and Unicode',async()=>{
 for(const price of [true,null,'',-1,'NaN'])assert.equal((await request('/api/admin/items/'+item.id,'PUT',{...item,price})).status,400);
 assert.equal((await request('/api/admin/sections','POST',{name:'x'.repeat(101)})).status,400);
 const malformed=await fetch(`http://127.0.0.1:${port}/api/feedback`,{method:'POST',body:'{'});assert.equal(malformed.status,400);
 assert.equal((await request('/api/feedback','POST',{rating:5,notes:'x'.repeat(3001)})).status,400);
 assert.equal((await request('/api/feedback','POST',{rating:true,notes:'hello'})).status,400);
 const notes='\u0645\u0631\u062d\u0628\u0627 \ud83c\udf7d\ufe0f';assert.equal((await request('/api/feedback','POST',{rating:5,notes})).status,201);
 assert.equal((await request('/api/admin/feedback')).data.feedback[0].notes,notes);
 });
 await t.test('uploads decode content rather than trusting signatures',async()=>{
 const upload=buffer=>request('/api/admin/upload','POST',{image:'data:image/png;base64,'+buffer.toString('base64')});
 assert.equal((await upload(Buffer.from('89504e470d0a1a0a00000000','hex'))).status,400);
 const png=await sharp({create:{width:1,height:1,channels:3,background:'white'}}).png().toBuffer();
 const valid=await upload(png);assert.equal(valid.status,201);
 // Remove only this test's generated upload.
 await fs.unlink(path.join('public',valid.data.url));
 assert.equal((await upload(Buffer.alloc(4*1024*1024+1))).status,400);
 });
});
