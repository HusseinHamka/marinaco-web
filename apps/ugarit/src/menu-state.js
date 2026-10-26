import { publicUrl } from './publicPath.js';

export function publicDishes(menu){
 const sections=new Map(menu.sections.filter(s=>s.visible!==false).map(s=>[s.id,s]));
 return menu.items.filter(i=>i.visible!==false&&sections.has(i.sectionId)).map(i=>({...i,section:sections.get(i.sectionId).name,price:Number(i.price).toFixed(2),image:publicUrl(i.image)}));
}
export function reconcileBasket(basket,aliases){
 const next={};for(const [key,q] of Object.entries(basket)){if(!Number.isSafeInteger(q)||q<=0)continue;const id=aliases[key]||key;next[id]=(next[id]||0)+q;}return next;
}
export function basketLinesFor(basket,dishes){return Object.entries(basket).map(([id,quantity])=>({dish:dishes.find(d=>d.id===id&&d.available!==false),quantity})).filter(x=>x.dish&&Number.isSafeInteger(x.quantity)&&x.quantity>0);}
