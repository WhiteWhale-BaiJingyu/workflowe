import * as THREE from 'three';
import {buildStoreFixtures,buildBatchProducts,disposeModels} from './models.js';
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
export function createScene(host,{onSelect,onOutside,onHover,onFPS}){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#e6e9e5');scene.fog=new THREE.Fog('#e6e9e5',125,260);
 const camera=new THREE.PerspectiveCamera(43,1,.1,450);camera.position.set(-66,61,85);
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=false;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.append(renderer.domElement);
 const labels=new CSS2DRenderer();labels.domElement.className='labels';host.append(labels.domElement);
 const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,0,0);orbit.enableDamping=true;orbit.zoomToCursor=true;orbit.screenSpacePanning=true;orbit.maxPolarAngle=Math.PI*.48;orbit.minDistance=8;orbit.maxDistance=190;
 const pointer=new PointerLockControls(camera,renderer.domElement);pointer.pointerSpeed=.65;
 const ambient=new THREE.HemisphereLight(0xffffff,0x708078,1.7);scene.add(ambient);
 const sun=new THREE.DirectionalLight(0xfff4df,2.1);sun.position.set(25,65,35);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-65,right:65,top:45,bottom:-45});scene.add(sun);
 const box=new THREE.BoxGeometry(1,1,1),colliders=[],outside=[],shelfPositions={};
 function mesh(w,h,d,x,y,z,color,collision=false){const m=new THREE.Mesh(box,new THREE.MeshStandardMaterial({color,roughness:.85}));m.scale.set(w,h,d);m.position.set(x,y,z);m.receiveShadow=true;m.castShadow=true;scene.add(m);if(collision)colliders.push({x,z,w,d});return m;}
 // Floor texture is generated locally; no downloaded images or CDN.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#d9ddd5';ctx.fillRect(0,0,256,256);ctx.strokeStyle='#c8cec4';ctx.strokeRect(0,0,256,256);const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(50,30);
 const floor=mesh(WIDTH,.2,DEPTH,0,-.15,0,0xffffff);floor.material.map=texture;
 mesh(100,5,.4,0,2.5,-30,0xa4ada5,true);mesh(.4,5,60,-50,2.5,0,0xa4ada5,true);mesh(.4,5,60,50,2.5,0,0xa4ada5,true);
 mesh(37,5,.4,-31.5,2.5,30,0xa4ada5,true);mesh(37,5,.4,31.5,2.5,30,0xa4ada5,true);
 const ceiling=mesh(100,.2,60,0,5.3,0,0xd9ddd8);ceiling.visible=false;
 function label(text,x,y,z,cls='zone-label'){const el=document.createElement('div');el.className=cls;el.textContent=text;const obj=new CSS2DObject(el);obj.position.set(x,y,z);scene.add(obj);return obj;}
 for(const zone of ZONES){const m=mesh(zone.w,.035,zone.d,zone.x,.015,zone.z,zone.color||0xc6cbc7);m.userData.zone=zone;if(!zone.color)outside.push(m);label(zone.name,zone.x,4.5,zone.z-zone.d/2+1,zone.color?'zone-label':'zone-label muted');if(!zone.color)label('范围外：另行研究',zone.x,3,zone.z,'outside-label');
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
 let batchProducts=null;
 let batches=[],batchMesh=null,visible=[],hover=-1,selected=-1;
 const highlight=new THREE.BoxHelper(new THREE.Mesh(box),0x243d32);highlight.visible=false;scene.add(highlight);
 const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2(),hoverBox=new THREE.Mesh(box); hoverBox.matrixAutoUpdate=true;
 function slot(i,zone,total){const ps=shelfPositions[zone];const p=ps[i%ps.length];const n=Math.ceil(total/ps.length),cols=Math.ceil(Math.sqrt(n)),rows=Math.ceil(n/cols),j=Math.floor(i/ps.length);return {x:p.x-p.w*.38+(j%cols)*p.w*.76/Math.max(1,cols-1),z:p.z-p.d*.38+Math.floor(j/cols)*p.d*.76/Math.max(1,rows-1),y:3.65,size:Math.min(.7,p.w*.6/cols,p.d*.6/rows)};}
 function rebuild(tier='',zone=''){
  if(batchMesh){scene.remove(batchMesh);batchMesh.dispose();batchMesh.material.dispose();}
  if(batchProducts){scene.remove(batchProducts);disposeModels(batchProducts);batchProducts=null;}
  visible=batches.filter(b=>(!tier||b.tier===tier)&&(!zone||b.zone===zone));hover=selected=-1;highlight.visible=false;
  if(!visible.length){batchMesh=null;return;}
  batchMesh=new THREE.InstancedMesh(box,new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}),visible.length);const counters={},totals={};batches.forEach(b=>totals[b.zone]=(totals[b.zone]||0)+1);
  // Slot positions stay stable when filtering.
  const slots=new Map();for(const b of batches){const i=counters[b.zone]||0;counters[b.zone]=i+1;slots.set(b.id,slot(i,b.zone,totals[b.zone]));}
  visible.forEach((b,i)=>{const p=slots.get(b.id);dummy.position.set(p.x,p.y,p.z);dummy.scale.set(p.size*1.5,p.size*1.5,p.size*1.5);dummy.updateMatrix();batchMesh.setMatrixAt(i,dummy.matrix);batchMesh.setColorAt(i,new THREE.Color(COLORS[b.tier]));});batchMesh.castShadow=false;batchMesh.computeBoundingSphere();scene.add(batchMesh);
  batchProducts=buildBatchProducts(visible.map(b=>({batch:b,p:slots.get(b.id),color:COLORS[b.tier]})));scene.add(batchProducts);
 }
 function mark(i){if(!batchMesh||i<0){highlight.visible=false;return;}batchMesh.getMatrixAt(i,dummy.matrix);dummy.matrix.decompose(dummy.position,dummy.quaternion,dummy.scale);hoverBox.position.copy(dummy.position);hoverBox.scale.copy(dummy.scale).multiplyScalar(1.18);hoverBox.updateMatrixWorld();highlight.setFromObject(hoverBox);highlight.visible=true;}
 function pick(event){if(pointer.isLocked)return null;const r=renderer.domElement.getBoundingClientRect();mouse.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera);return raycaster.intersectObjects([...(batchMesh?[batchMesh]:[]),...outside])[0];}
 renderer.domElement.addEventListener('dblclick',e=>{if(pointer.isLocked)return;const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera);const point=raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),new THREE.Vector3());if(point&&Math.abs(point.x)<50&&Math.abs(point.z)<30){const shift=point.clone().sub(orbit.target);camera.position.add(shift);orbit.target.copy(point);orbit.update();}});
 renderer.domElement.addEventListener('pointermove',e=>{const hit=pick(e);hover=hit?.object===batchMesh?hit.instanceId:-1;mark(hover>=0?hover:selected);renderer.domElement.style.cursor=hit?'pointer':'grab';onHover(hover>=0?visible[hover]:hit?.object.userData.zone);});
 let down;renderer.domElement.addEventListener('pointerdown',e=>down={x:e.clientX,y:e.clientY});renderer.domElement.addEventListener('click',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;const hit=pick(e);if(hit?.object===batchMesh){selected=hit.instanceId;mark(selected);onSelect(visible[selected]);}else if(hit)onOutside(hit.object.userData.zone);});
 const keys=new Set();window.addEventListener('keydown',e=>{if(!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))keys.add(e.code);});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());
 pointer.addEventListener('lock',()=>{orbit.enabled=false;camera.position.set(5,1.75,27);document.body.classList.add('walking');});pointer.addEventListener('unlock',()=>{keys.clear();orbit.enabled=true;document.body.classList.remove('walking');orbit.target.set(camera.position.x,1.6,camera.position.z-8);});
 function blocked(x,z){return x<-49||x>49||z<-29||z>29||colliders.some(p=>Math.abs(x-p.x)<p.w/2+.42&&Math.abs(z-p.z)<p.d/2+.42);}
 const map=document.querySelector('#minimap'),mapctx=map.getContext('2d');
 function drawMap(){const c=mapctx;c.clearRect(0,0,220,132);c.fillStyle='#f1f2eb';c.fillRect(0,0,220,132);for(const z of ZONES){c.fillStyle=z.color?'#'+z.color.toString(16):'#c5cbc5';c.fillRect((z.x-z.w/2+50)*2.2,(z.z-z.d/2+30)*2.2,z.w*2.2,z.d*2.2);}c.strokeStyle='#63756b';c.strokeRect(1,1,218,130);c.fillStyle='#c0432f';c.beginPath();c.arc((camera.position.x+50)*2.2,(camera.position.z+30)*2.2,4,0,Math.PI*2);c.fill();}
 const clock=new THREE.Clock();let frames=0,elapsed=0;renderer.setAnimationLoop(()=>{const rawDelta=clock.getDelta(),dt=Math.min(rawDelta,.05);if(pointer.isLocked){const direction=new THREE.Vector3();camera.getWorldDirection(direction);direction.y=0;direction.normalize();const right=new THREE.Vector3().crossVectors(direction,new THREE.Vector3(0,1,0));const step=new THREE.Vector3();if(keys.has('KeyW'))step.add(direction);if(keys.has('KeyS'))step.sub(direction);if(keys.has('KeyD'))step.add(right);if(keys.has('KeyA'))step.sub(right);step.normalize().multiplyScalar(dt*(keys.has('ShiftLeft')||keys.has('ShiftRight')?9:4));if(!blocked(camera.position.x+step.x,camera.position.z))camera.position.x+=step.x;if(!blocked(camera.position.x,camera.position.z+step.z))camera.position.z+=step.z;camera.position.y=1.75;}else orbit.update();renderer.render(scene,camera);labels.render(scene,camera);drawMap();frames++;elapsed+=rawDelta;if(elapsed>1){onFPS(Math.round(frames/elapsed));frames=elapsed=0;}});
 new ResizeObserver(()=>{const {width,height}=host.getBoundingClientRect();if(width<1||height<1)return;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);labels.setSize(width,height);}).observe(host);
 return {setData(data,tier='',zone=''){batches=data;rebuild(tier,zone);},filter:rebuild,checkout(){pointer.unlock();camera.position.set(-9,7,31);orbit.target.set(-3,1,23);orbit.update();},ceiling(){ceiling.visible=!ceiling.visible;return ceiling.visible;},shadows(){renderer.shadowMap.enabled=!renderer.shadowMap.enabled;return renderer.shadowMap.enabled;},enter(){pointer.lock();},view(mode,zone){pointer.unlock();if(zone){const z=ZONES.find(z=>z.id===zone);camera.position.set(z.x-12,10,z.z+14);orbit.target.set(z.x,1.5,z.z);}else{camera.position.set(...(mode==='top'?[0,125,.1]:[-66,61,85]));orbit.target.set(0,0,0);}orbit.update();},focus(id){const i=visible.findIndex(b=>b.id===id);if(i<0||!batchMesh)return;selected=i;mark(i);batchMesh.getMatrixAt(i,dummy.matrix);const p=new THREE.Vector3().setFromMatrixPosition(dummy.matrix);camera.position.set(p.x-6,10,p.z+12);orbit.target.copy(p);onSelect(visible[i]);}};
}
