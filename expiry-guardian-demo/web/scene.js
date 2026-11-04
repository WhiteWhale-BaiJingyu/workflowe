import * as THREE from 'three';
import {buildStoreFixtures} from './models.js';
import {deriveSlots,aggregateSlots,summarizeSlots} from './slot-aggregation.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {PointerLockControls} from 'three/addons/controls/PointerLockControls.js';
import {CSS2DRenderer,CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
export const COLORS={'过期':'#C0432F','临期-高风险':'#E0702C','临期-中风险':'#E8A33D','临期-低风险':'#D9C26A','预警':'#7FB3D5','正常':'#2E8B6A'};
export const WIDTH=100,DEPTH=60;
export const ZONES=[
 {id:'cold_dairy',name:'冷藏乳品',x:43,z:-4,w:10,d:40,color:0x9fc7ce},
 {id:'bakery',name:'蛋糕与烘焙短保',x:29,z:19,w:24,d:12,color:0xe6c692},
 {id:'packaged_short',name:'预包装短保',x:23,z:-5,w:23,d:27,color:0xb6c7a4},
 {id:'frozen',name:'冷冻区',x:0,z:-25,w:74,d:7},
 {id:'produce',name:'新鲜果蔬',x:-30,z:16,w:26,d:12},
 {id:'deli',name:'熟食与菜品',x:-30,z:-1,w:26,d:12},
 {id:'meat',name:'肉禽水产',x:-44,z:-7,w:9,d:24},
 {id:'general',name:'常温百货',x:-6,z:-5,w:24,d:27}];
export function createScene(host,{onSelect,onSlotSelect,onOutside,onHover,onFPS,onControlState}){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#e6e9e5');scene.fog=new THREE.Fog('#e6e9e5',125,260);
 const camera=new THREE.PerspectiveCamera(43,1,.1,450);camera.position.set(-66,61,85);
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=false;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.append(renderer.domElement);
 const labels=new CSS2DRenderer();labels.domElement.className='labels';host.append(labels.domElement);
 const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,0,0);orbit.enableDamping=true;orbit.zoomToCursor=true;orbit.screenSpacePanning=true;orbit.maxPolarAngle=Math.PI*.48;orbit.minDistance=8;orbit.maxDistance=190;
 const pointer=new PointerLockControls(camera,renderer.domElement);pointer.pointerSpeed=1.2;pointer.minPolarAngle=.12;pointer.maxPolarAngle=Math.PI-.12;let cameraMode='orbit';
 const ambient=new THREE.HemisphereLight(0xffffff,0x708078,1.7);scene.add(ambient);
 const sun=new THREE.DirectionalLight(0xfff4df,2.1);sun.position.set(25,65,35);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-65,right:65,top:45,bottom:-45});scene.add(sun);
 const box=new THREE.BoxGeometry(1,1,1),colliders=[],outside=[],shelfPositions={},zoneFloors=new Map();
 function mesh(w,h,d,x,y,z,color,collision=false){const m=new THREE.Mesh(box,new THREE.MeshStandardMaterial({color,roughness:.85}));m.scale.set(w,h,d);m.position.set(x,y,z);m.receiveShadow=true;m.castShadow=true;scene.add(m);if(collision)colliders.push({x,z,w,d});return m;}
 // Floor texture is generated locally; no downloaded images or CDN.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#d9ddd5';ctx.fillRect(0,0,256,256);ctx.strokeStyle='#c8cec4';ctx.strokeRect(0,0,256,256);const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(50,30);
 const floor=mesh(WIDTH,.2,DEPTH,0,-.15,0,0xffffff);floor.material.map=texture;
 mesh(100,5,.4,0,2.5,-30,0xa4ada5,true);mesh(.4,5,60,-50,2.5,0,0xa4ada5,true);mesh(.4,5,60,50,2.5,0,0xa4ada5,true);
 mesh(37,5,.4,-31.5,2.5,30,0xa4ada5,true);mesh(37,5,.4,31.5,2.5,30,0xa4ada5,true);
 const ceiling=mesh(100,.2,60,0,5.3,0,0xd9ddd8);ceiling.visible=false;
 function label(text,x,y,z,cls='zone-label'){const el=document.createElement('div');el.className=cls;el.textContent=text;const obj=new CSS2DObject(el);obj.position.set(x,y,z);scene.add(obj);return obj;}
 for(const zone of ZONES){const m=mesh(zone.w,.035,zone.d,zone.x,.015,zone.z,zone.color||0xc6cbc7);m.userData.zone=zone;zoneFloors.set(zone.id,m);if(!zone.color)outside.push(m);label(zone.name,zone.x,4.5,zone.z-zone.d/2+1,zone.color?'zone-label':'zone-label muted');if(!zone.color)label('范围外：另行研究',zone.x,3,zone.z,'outside-label');
  const positions=[];
  if(zone.id==='cold_dairy'){for(const z of [-17,-4,9])positions.push({x:43,z,w:5.2,d:8});}
  else if(zone.id==='bakery'){for(let x=21;x<=37;x+=8)positions.push({x,z:19,w:5,d:2.4});}
  else{for(let x=zone.x-zone.w/2+3;x<zone.x+zone.w/2-1;x+=7)for(let z=zone.z-zone.d/2+3;z<zone.z+zone.d/2-1;z+=8)positions.push({x,z,w:3,d:4.2});}
  shelfPositions[zone.id]=positions;
 }
 const dummy=new THREE.Object3D();
 for(const [zone,ps]of Object.entries(shelfPositions))for(const p of ps)colliders.push(zone==='cold_dairy'?{...p,x:p.x-.4,w:p.w+.8}:p);
 for(let x=-14;x<=10;x+=6)colliders.push({x,z:24,w:2.5,d:4.8});
 for(const x of [-3,3])colliders.push({x,z:28.2,w:.16,d:1.1});
 scene.add(buildStoreFixtures(shelfPositions));
 for(let x=-14;x<=10;x+=6)label('收银',x,2.8,25.4,'small-label');
 label('入口 / 出口',0,1,29,'entry-label');mesh(6,.02,40,5,.04,0,0xedefe6);label('主通道',5,.3,10,'small-label');
 // Exactly 21 aggregate instances, independent of batch count.
 const definitions=deriveSlots(shelfPositions);
 let slots=aggregateSlots(definitions,[]),currentTier='',currentZone='',selected=-1,hover=-1,storeLabel='',flight=null;
 const slabs=[-.34,0,.34].map(y=>new THREE.BoxGeometry(1,.32,1).translate(0,y,0));
 const stackGeometry=mergeGeometries(slabs);slabs.forEach(g=>g.dispose());
 const alpha=new THREE.InstancedBufferAttribute(new Float32Array(21).fill(1),1);stackGeometry.setAttribute('slotOpacity',alpha);
 const stackMaterial=new THREE.MeshStandardMaterial({roughness:.75,metalness:.05,transparent:true,depthWrite:false});
 stackMaterial.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float slotOpacity; varying float vSlotOpacity;').replace('#include <begin_vertex>','#include <begin_vertex>\nvSlotOpacity = slotOpacity;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vSlotOpacity;').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a *= vSlotOpacity;');
 };
 const stacks=new THREE.InstancedMesh(stackGeometry,stackMaterial,21);stacks.frustumCulled=false;stacks.renderOrder=2;scene.add(stacks);
 const edges=new THREE.EdgesGeometry(box),outlines=definitions.map(()=>{const line=new THREE.LineSegments(edges,new THREE.LineBasicMaterial({color:0xf9e0a0,transparent:true,depthTest:false}));line.visible=false;line.renderOrder=4;scene.add(line);return line;});
 const markerLabels=definitions.map((s,i)=>{
  const el=document.createElement('button');el.className='slot-marker';el.dataset.slotId=s.id;el.setAttribute('aria-label',s.name);
  const obj=new CSS2DObject(el);scene.add(obj);
  el.onclick=e=>{e.stopPropagation();selectSlot(i);};el.onmouseenter=()=>{hover=i;repaint();onHover(slots[i]);};el.onmouseleave=()=>{hover=-1;repaint();onHover(null);};
  return obj;
 });
 // Screen-space decluttering keeps every slot label; leaders retain its anchor.
 const svgNS='http://www.w3.org/2000/svg',leaders=document.createElementNS(svgNS,'svg');leaders.classList.add('slot-leaders');host.append(leaders);
 const leaderLines=definitions.map(()=>{const line=document.createElementNS(svgNS,'line');leaders.append(line);return line;});
 const projected=new THREE.Vector3(),labelOffsets=[];
 for(let dy=-5;dy<=5;dy++)for(let dx=-4;dx<=4;dx++)labelOffsets.push({x:dx*94,y:dy*30});labelOffsets.sort((a,b)=>a.x*a.x+a.y*a.y-b.x*b.x-b.y*b.y);
 function layoutLabels(){
  const w=host.clientWidth,h=host.clientHeight,placed=[];
  if(!w||!h)return;
  markerLabels.forEach((obj,i)=>{
   projected.copy(obj.position).project(camera);const x=(projected.x+1)*w/2,y=(1-projected.y)*h/2,line=leaderLines[i];
   if(projected.z<-1||projected.z>1||x<0||x>w||y<0||y>h){line.style.display='none';return;}
   const width=obj.userData.labelWidth||90,height=26;
   let best=labelOffsets.find(o=>{const left=x+o.x-width/2,top=y+o.y-height/2;return left>4&&left+width<w-4&&top>12&&top+height<h-20&&!placed.some(p=>left<p.x+p.w+4&&left+width+4>p.x&&top<p.y+p.h+3&&top+height+3>p.y);})||{x:0,y:0};
   obj.center.set(.5-best.x/width,.5-best.y/height);placed.push({x:x+best.x-width/2,y:y+best.y-height/2,w:width,h:height});
   line.style.display=Math.abs(best.x)+Math.abs(best.y)>5?'':'none';line.setAttribute('x1',x);line.setAttribute('y1',y);line.setAttribute('x2',x+best.x);line.setAttribute('y2',y+best.y);line.style.opacity=obj.element.style.opacity;
  });
 }
 const zoneOutline=new THREE.Mesh(box,new THREE.MeshBasicMaterial({color:0x335f48,wireframe:true,transparent:true,opacity:.85}));zoneOutline.visible=false;scene.add(zoneOutline);
 const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
 function summary(tier=currentTier,zone=currentZone){return summarizeSlots(slots,tier,zone);}
 function repaint(){
  const result=summary(),matchedIds=new Set(result.slots.map(s=>s.id)),filtering=!!(currentTier||currentZone);
  slots.forEach((s,i)=>{
   const match=matchedIds.has(s.id),outsideZone=!!currentZone&&s.zone!==currentZone;
   const opacity=outsideZone?.2:filtering&&!match?.25:1,scale=filtering&&!match?.85:1;
   const color=new THREE.Color(s.tier?(COLORS[s.tier]||'#778b9d'):'#d6dcd6');
   if(filtering&&!match){const hsl={};color.getHSL(hsl);color.setHSL(hsl.h,hsl.s*.08,hsl.l);}
   const height=s.height*scale;
   dummy.position.set(s.x,s.y+height/2,s.z);dummy.scale.set(s.w*scale,height,s.d*scale);dummy.updateMatrix();
   stacks.setMatrixAt(i,dummy.matrix);stacks.setColorAt(i,color);alpha.setX(i,opacity);
   const outline=outlines[i];outline.position.copy(dummy.position);outline.scale.copy(dummy.scale).multiplyScalar(1.035);
   outline.userData.pulse=filtering&&match;outline.visible=outline.userData.pulse||selected===i||hover===i;
   outline.material.color.set(selected===i?'#214d37':hover===i?'#ffffff':'#f2bd55');
   const label=markerLabels[i],el=label.element;label.position.set(s.x,s.y+height+.38,s.z);
   el.textContent=s.batches.length?`${s.batches.length}批 / ${s.qty}件`:'空';el.title=`${storeLabel} · ${s.name}`;
   Object.assign(el.dataset,{count:String(s.batches.length),qty:String(s.qty),matched:String(match),opacity:String(opacity),tier:s.tier||'',zone:s.zone});
   el.style.opacity=String(opacity);el.style.setProperty('--slot-color','#'+color.getHexString());el.classList.toggle('selected',selected===i);el.classList.toggle('matched',filtering&&match);label.userData.labelWidth=el.textContent.length*6+20;
  });
  stacks.instanceMatrix.needsUpdate=true;stacks.instanceColor.needsUpdate=true;alpha.needsUpdate=true;stacks.computeBoundingSphere();
  for(const [id,m]of zoneFloors){m.material.transparent=true;m.material.opacity=currentZone&&id!==currentZone?.2:1;m.material.depthWrite=false;}
  const z=ZONES.find(z=>z.id===currentZone);zoneOutline.visible=!!z;if(z){zoneOutline.position.set(z.x,.18,z.z);zoneOutline.scale.set(z.w,.25,z.d);}
  Object.assign(host.dataset,{slotCount:'21',batchCount:String(result.total),matchedCount:String(result.matched),matchedSlots:String(result.slotCount),selectedZone:currentZone,selectedTier:currentTier});
  return result;
 }
 function stopFlight(){flight=null;host.dataset.flying='false';}
 orbit.addEventListener('start',stopFlight);
 function flyTo(target,distance=12){
  if(cameraMode!=='orbit')return;
  orbit.enableDamping=false;orbit.update();orbit.enableDamping=true;
  flight={start:performance.now(),from:camera.position.clone(),fromTarget:orbit.target.clone(),target:target.clone(),to:target.clone().add(new THREE.Vector3(-distance*.55,distance*.68,distance*.85))};host.dataset.flying='true';
 }
 function selectSlot(i){selected=i;repaint();onSlotSelect?.(slots[i]);}
 function focusBatch(id,{move=true}={}){const i=slots.findIndex(s=>s.batches.some(b=>b.id===id));if(i<0)return;selectSlot(i);onSelect(slots[i].batches.find(b=>b.id===id));if(move)flyTo(new THREE.Vector3(slots[i].x,slots[i].y+slots[i].height/2,slots[i].z));}
 function filter(tier='',zone=''){
  stopFlight();const zoneChanged=zone!==currentZone;currentTier=tier;currentZone=zone;const result=repaint();
  if(zoneChanged&&zone){const z=ZONES.find(z=>z.id===zone);if(z)flyTo(new THREE.Vector3(z.x,1.5,z.z),Math.max(z.w,z.d)*.72);}
  else if(result.firstSlot&&(tier||zone)){const s=result.firstSlot;flyTo(new THREE.Vector3(s.x,s.y+s.height/2,s.z));}
  return result;
 }
 function pick(event){if(cameraMode!=='orbit')return null;const r=renderer.domElement.getBoundingClientRect();mouse.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera);return raycaster.intersectObjects([stacks,...outside])[0];}
 renderer.domElement.addEventListener('dblclick',e=>{if(cameraMode!=='orbit')return;stopFlight();const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera);const point=raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),new THREE.Vector3());if(point&&Math.abs(point.x)<50&&Math.abs(point.z)<30){const shift=point.clone().sub(orbit.target);camera.position.add(shift);orbit.target.copy(point);orbit.update();}});
 renderer.domElement.addEventListener('pointermove',e=>{const hit=pick(e),next=hit?.object===stacks?hit.instanceId:-1;if(next!==hover){hover=next;repaint();}renderer.domElement.style.cursor=hit?'pointer':'grab';onHover(hover>=0?slots[hover]:hit?.object.userData.zone);});
 renderer.domElement.addEventListener('pointerleave',()=>{hover=-1;repaint();onHover(null);});
 let down;renderer.domElement.addEventListener('pointerdown',e=>down={x:e.clientX,y:e.clientY});renderer.domElement.addEventListener('click',e=>{if(cameraMode==='paused'){pointer.lock();return;}if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;const hit=pick(e);if(hit?.object===stacks)selectSlot(hit.instanceId);else if(hit)onOutside(hit.object.userData.zone);});
 repaint();
 const keys=new Set();window.addEventListener('keydown',e=>{if(e.code==='Escape'&&pointer.isLocked)pointer.unlock();if(!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))keys.add(e.code);});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());
 let walked=false;
 function setCameraMode(mode){cameraMode=mode;host.dataset.controlMode=mode;document.body.classList.toggle('walking',mode==='walk');document.body.classList.toggle('walk-paused',mode==='paused');document.body.classList.toggle('walk-session',mode!=='orbit');onControlState?.(mode);}
 function syncOrbit(){const direction=new THREE.Vector3();camera.getWorldDirection(direction);orbit.maxPolarAngle=Math.PI-.02;orbit.target.copy(camera.position).addScaledVector(direction,10);const damping=orbit.enableDamping;orbit.enableDamping=false;orbit.update();orbit.enableDamping=damping;}
 function exitWalk(){if(cameraMode==='orbit')return;stopFlight();keys.clear();setCameraMode('orbit');pointer.unlock();syncOrbit();orbit.enabled=true;}
 pointer.addEventListener('lock',()=>{
  stopFlight();orbit.enabled=false;
  if(cameraMode==='orbit'){
   // Flush residual orbit damping without applying it to the walk camera.
   const position=camera.position.clone(),orientation=camera.quaternion.clone(),damping=orbit.enableDamping;
   orbit.enableDamping=false;orbit.update();orbit.enableDamping=damping;camera.position.copy(position);camera.quaternion.copy(orientation);
  }
  if(!walked||blocked(camera.position.x,camera.position.z)){camera.position.set(7,1.75,27);camera.lookAt(7,1.75,15);}
  camera.position.y=1.75;walked=true;setCameraMode('walk');
 });
 pointer.addEventListener('unlock',()=>{keys.clear();if(cameraMode!=='orbit'){stopFlight();orbit.enabled=false;setCameraMode('paused');}});

 function blocked(x,z){return x<-49||x>49||z<-29||z>29||colliders.some(p=>Math.abs(x-p.x)<p.w/2+.42&&Math.abs(z-p.z)<p.d/2+.42);}
 const map=document.querySelector('#minimap'),mapctx=map.getContext('2d');
 function drawMap(){const c=mapctx;c.clearRect(0,0,220,132);c.fillStyle='#f1f2eb';c.fillRect(0,0,220,132);for(const z of ZONES){c.fillStyle=z.color?'#'+z.color.toString(16):'#c5cbc5';c.fillRect((z.x-z.w/2+50)*2.2,(z.z-z.d/2+30)*2.2,z.w*2.2,z.d*2.2);}c.strokeStyle='#63756b';c.strokeRect(1,1,218,130);c.fillStyle='#c0432f';c.beginPath();c.arc((camera.position.x+50)*2.2,(camera.position.z+30)*2.2,4,0,Math.PI*2);c.fill();}
 const clock=new THREE.Clock();let frames=0,elapsed=0;renderer.setAnimationLoop(()=>{const rawDelta=clock.getDelta(),dt=Math.min(rawDelta,.05);if(pointer.isLocked){const direction=new THREE.Vector3();camera.getWorldDirection(direction);direction.y=0;direction.normalize();const right=new THREE.Vector3().crossVectors(direction,new THREE.Vector3(0,1,0));const step=new THREE.Vector3();if(keys.has('KeyW'))step.add(direction);if(keys.has('KeyS'))step.sub(direction);if(keys.has('KeyD'))step.add(right);if(keys.has('KeyA'))step.sub(right);step.normalize().multiplyScalar(dt*(keys.has('ShiftLeft')||keys.has('ShiftRight')?9:4));if(!blocked(camera.position.x+step.x,camera.position.z))camera.position.x+=step.x;if(!blocked(camera.position.x,camera.position.z+step.z))camera.position.z+=step.z;camera.position.y=1.75;}else if(cameraMode==='orbit'){if(flight){const t=Math.min(1,(performance.now()-flight.start)/300),ease=t*t*(3-2*t);camera.position.lerpVectors(flight.from,flight.to,ease);orbit.target.lerpVectors(flight.fromTarget,flight.target,ease);if(t===1)stopFlight();}orbit.update();}for(const line of outlines)if(line.userData.pulse)line.material.opacity=.65+.3*Math.sin(performance.now()/180);renderer.render(scene,camera);layoutLabels();labels.render(scene,camera);drawMap();frames++;elapsed+=rawDelta;if(elapsed>1){host.dataset.cameraPosition=JSON.stringify(camera.position.toArray());host.dataset.cameraDirection=JSON.stringify(camera.getWorldDirection(new THREE.Vector3()).toArray());host.dataset.drawCalls=String(renderer.info.render.calls);host.dataset.triangles=String(renderer.info.render.triangles);onFPS(Math.round(frames/elapsed));frames=elapsed=0;}});
 new ResizeObserver(()=>{const {width,height}=host.getBoundingClientRect();if(width<1||height<1)return;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);labels.setSize(width,height);}).observe(host);
 return {setData(data,tier='',zone='',meta={}){stopFlight();slots=aggregateSlots(definitions,data);currentTier=tier;currentZone=zone;selected=hover=-1;storeLabel=meta.store_id?'门店'+meta.store_id:(meta.store||'');return repaint();},filter,summary,checkout(){if(cameraMode!=='orbit')return;stopFlight();camera.position.set(-9,7,31);orbit.target.set(-3,1,23);orbit.update();},ceiling(){ceiling.visible=!ceiling.visible;return ceiling.visible;},shadows(){renderer.shadowMap.enabled=!renderer.shadowMap.enabled;return renderer.shadowMap.enabled;},enter(){pointer.lock();},exit:exitWalk,setLookSpeed(value){pointer.pointerSpeed=Math.max(.35,Math.min(2.5,Number(value)||1.2));return pointer.pointerSpeed;},view(mode,zone){if(cameraMode!=='orbit')return;stopFlight();if(zone){const z=ZONES.find(z=>z.id===zone);camera.position.set(z.x-12,10,z.z+14);orbit.target.set(z.x,1.5,z.z);}else{camera.position.set(...(mode==='top'?[0,125,.1]:[-66,61,85]));orbit.target.set(0,0,0);}orbit.update();},focus:focusBatch};
}
