// Display aggregation only. Never mutate workflow batches or infer a new tier.
export const TIER_ORDER=['过期','临期-高风险','临期-中风险','临期-低风险','预警','正常','待分析'];
export const tierRank=tier=>{const rank=TIER_ORDER.indexOf(tier);return rank<0?TIER_ORDER.length:rank;};
export const stackHeight=qty=>Math.max(.4,Math.min(3.2,.4+qty/50));
const days=b=>Number.isFinite(Number(b.d))?Number(b.d):Infinity;
export const sortBatches=rows=>rows.slice().sort((a,b)=>tierRank(a.tier)-tierRank(b.tier)||days(a)-days(b)||String(a.id).localeCompare(String(b.id)));
export function deriveSlots(shelves){
 const slots=[];
 // Aisle/front-facing cabinets first. Four logical shelf layers are staggered
 // across each cabinet's roof to avoid intersecting the 3.2 m aggregate stacks.
 const cold=shelves.cold_dairy.slice().sort((a,b)=>b.z-a.z).slice(0,3);
 cold.forEach((p,g)=>{for(let layer=0;layer<4;layer++)slots.push({id:`cold_dairy-${g+1}-${layer+1}`,name:`冷藏 ${g+1}柜 / ${layer+1}层`,zone:'cold_dairy',x:p.x+(layer%2===0?-1.18:1.18),z:p.z+(layer<2?2:-2),y:3.16,w:1.9,d:3.2});});
 shelves.bakery.slice().sort((a,b)=>a.x-b.x).slice(0,3).forEach((p,i)=>slots.push({id:`bakery-${i+1}`,name:`烘焙 ${i+1}号货位`,zone:'bakery',x:p.x,z:p.z,y:2.7,w:p.w*.75,d:p.d*.75}));
 shelves.packaged_short.slice().sort((a,b)=>a.x-b.x||b.z-a.z).slice(0,6).forEach((p,i)=>slots.push({id:`packaged_short-${i+1}`,name:`预包装 ${i+1}号货位`,zone:'packaged_short',x:p.x,z:p.z,y:3.65,w:p.w*.78,d:p.d*.7}));
 if(slots.length!==21)throw Error('货架布局不足以生成固定21个货位');
 return slots;
}
export function aggregateSlots(definitions,batches){
 const slots=definitions.map(s=>({...s,batches:[],qty:0,tier:null,exp:null,height:.12}));
 for(const zone of ['cold_dairy','bakery','packaged_short']){
  const targets=slots.filter(s=>s.zone===zone);
  const ordered=batches.filter(b=>b.zone===zone).slice().sort((a,b)=>days(a)-days(b)||String(a.id).localeCompare(String(b.id)));
  ordered.forEach((b,i)=>targets[i%targets.length].batches.push(b));
 }
 for(const s of slots){
  s.batches=sortBatches(s.batches);s.qty=s.batches.reduce((sum,b)=>sum+Math.max(0,Number(b.qty)||0),0);
  s.tier=s.batches[0]?.tier||null;s.exp=s.batches.map(b=>b.exp).filter(Boolean).sort()[0]||null;
  s.height=s.batches.length?stackHeight(s.qty):.12;
 }
 return slots;
}
export function summarizeSlots(slots,tier='',zone=''){
 const matched=slots.filter(s=>(!zone||s.zone===zone)&&s.batches.some(b=>!tier||b.tier===tier));
 return {total:slots.reduce((n,s)=>n+s.batches.length,0),matched:matched.reduce((n,s)=>n+s.batches.filter(b=>!tier||b.tier===tier).length,0),slotCount:matched.length,firstSlot:matched[0]||null,slots:matched};
}
