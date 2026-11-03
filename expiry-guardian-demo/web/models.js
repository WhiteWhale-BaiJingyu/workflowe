import * as THREE from 'three';
// Procedural geometry only. Display stock is decorative, never a business batch.
export function modelBuilder(){
 const group=new THREE.Group(),pools=new Map();let muted=false;
 const roofShape=new THREE.Shape();roofShape.moveTo(-.5,-.5);roofShape.lineTo(.5,-.5);roofShape.lineTo(0,.5);roofShape.closePath();const roofGeometry=new THREE.ExtrudeGeometry(roofShape,{depth:1,bevelEnabled:false});roofGeometry.translate(0,0,-.5);
 const geometries={oval:new THREE.CylinderGeometry(.5,.5,1,36),box:new THREE.BoxGeometry(1,1,1),cylinder:new THREE.CylinderGeometry(.5,.5,1,12),sphere:new THREE.SphereGeometry(.5,10,7),cup:new THREE.CylinderGeometry(.5,.38,1,12),roof:roofGeometry};
 function part(shape,x,y,z,w,h,d,color,rotation=0,glass=false){if(muted){const c=new THREE.Color(color);const l=c.r*.2126+c.g*.7152+c.b*.0722;color=new THREE.Color(l,l,l);}const key=shape+(glass?'-glass':'');if(!pools.has(key))pools.set(key,[]);pools.get(key).push({x,y,z,w,h,d,color,rotation,glass});}
 const b=(x,y,z,w,h,d,c)=>part('box',x,y,z,w,h,d,c);
 function product(kind,x,y,z,s=1,color=0xe4e7de){
  if(kind==='bottle'){
   part('cylinder',x,y+.29*s,z,.29*s,.58*s,.29*s,color);part('sphere',x,y+.56*s,z,.29*s,.21*s,.29*s,color);part('cylinder',x,y+.7*s,z,.14*s,.16*s,.14*s,0xe8ece7);part('cylinder',x,y+.79*s,z,.17*s,.06*s,.17*s,0x6e9686);part('cylinder',x,y+.29*s,z,.296*s,.22*s,.296*s,0xa2c4bf);
  }else if(kind==='cup'){
   part('cup',x,y+.18*s,z,.4*s,.36*s,.4*s,color);part('cylinder',x,y+.38*s,z,.43*s,.04*s,.43*s,0xd3bfa1);b(x,y+.2*s,z+.196*s,.18*s,.12*s,.012*s,0xe9e7de);
  }else if(kind==='carton'){
   b(x,y+.3*s,z,.35*s,.6*s,.3*s,color);part('roof',x,y+.65*s,z,.4*s,.3*s,.32*s,0xd4e0d9,0);b(x,y+.8*s,z,.045*s,.07*s,.3*s,0xf6f1df);b(x,y+.3*s,z+.153*s,.35*s,.2*s,.012*s,0x70a095);
  }else if(kind==='cake'){
   b(x,y+.06*s,z,.66*s,.12*s,.55*s,0xa18c69);b(x,y+.23*s,z,.56*s,.24*s,.46*s,color);b(x,y+.37*s,z,.57*s,.06*s,.47*s,0xf1e9cf);part('sphere',x,y+.43*s,z,.12*s,.12*s,.12*s,0xb4a08c);part('box',x,y+.3*s,z,.7*s,.55*s,.59*s,0xe2eeee,0,true);
  }else if(kind==='bread'){
   b(x,y+.04*s,z,.74*s,.08*s,.44*s,0x9c825b);part('sphere',x,y+.21*s,z,.64*s,.38*s,.36*s,color);for(let i=-1;i<=1;i++)b(x+i*.14*s,y+.36*s,z,.035*s,.02*s,.22*s,0xd5b77f);part('box',x,y+.23*s,z,.77*s,.46*s,.49*s,0xdce5e0,0,true);
  }else{b(x,y+.25*s,z,.38*s,.5*s,.25*s,color);b(x,y+.49*s,z,.4*s,.045*s,.27*s,0xcfc6ae);b(x,y+.25*s,z+.13*s,.2*s,.19*s,.01*s,0xf1ede1);}
 }
 function finish(){const dummy=new THREE.Object3D();for(const[key,items]of pools){const glass=key.endsWith('-glass'),shape=key.replace('-glass','');const material=new THREE.MeshStandardMaterial({roughness:glass?.22:.68,metalness:glass?.08:.06,transparent:glass,opacity:glass?.18:1,depthWrite:!glass});const inst=new THREE.InstancedMesh(geometries[shape],material,items.length);items.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.rotation,0);dummy.scale.set(p.w,p.h,p.d);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);inst.setColorAt(i,new THREE.Color(p.color));});inst.castShadow=!glass;inst.receiveShadow=true;inst.computeBoundingSphere();group.add(inst);}return group;}
 return {part,b,product,finish,muted(value){muted=value;}};
}
export function buildStoreFixtures(shelfPositions){
 const m=modelBuilder(),{b,part,product}=m;
 const metal=0x75817c,dark=0x34463f,light=0xd8dfd9,grey=0xa1aaa3,wood=0xa88861;
 function shelf(p,col=grey){
  for(const y of [.24,1.08,1.92,2.76])b(p.x,y,p.z,p.w,.12,p.d,col);
  for(const x of [-1,1])for(const z of [-1,1])b(p.x+x*(p.w/2-.09),1.5,p.z+z*(p.d/2-.09),.12,3,.12,dark);
  b(p.x,3.04,p.z,p.w,.13,p.d,col);
 }
 for(const [zone,positions]of Object.entries(shelfPositions))for(const[pIndex,p]of positions.entries()){
  m.muted(!['cold_dairy','bakery','packaged_short'].includes(zone));
  if(zone==='cold_dairy'){
   // Rounded open multi-deck island, based on the user's reference photographs.
   part('oval',p.x,.32,p.z,p.w+.35,.6,p.d+.35,0x34443d);
   part('oval',p.x,.68,p.z,p.w+.2,.2,p.d+.2,0xa9b7ae);
   b(p.x,1.65,p.z,.42,2.1,p.d*.65,0xbfcac0);
   for(let row=0;row<4;row++){
    const y=.83+row*.57,w=p.w-row*.53,d=p.d-row*.38;
    part('oval',p.x,y,p.z,w,.1,d,0xdce1d7);
    part('oval',p.x,y-.07,p.z,w+.08,.045,d+.08,0x72877a);
    for(let j=0;j<24;j++){
     const angle=j/24*Math.PI*2;
     product(row%3===0?'bottle':row%3===1?'cup':'carton',p.x+Math.cos(angle)*(w*.5-.28),y+.06,p.z+Math.sin(angle)*(d*.5-.28),.66,[0xf0eadc,0xc0d2c0,0xe2cbb8,0xc3d5d8][(row+pIndex)%4]);
    }
   }
   part('oval',p.x,3.05,p.z,p.w*.59,.15,p.d*.79,0xe9e9dc);
   for(const side of [-1,1]){
    b(p.x+side*p.w*.28,1.8,p.z,.06,2.25,p.d*.65,0xb4c3b9);
    part('box',p.x+side*p.w*.33,1.82,p.z,.025,2.05,p.d*.7,0xd2e6df,0,true);
   }
   for(let j=0;j<12;j++){const t=j/12*Math.PI*2;part('box',p.x+Math.cos(t)*(p.w*.5-.12),.9,p.z+Math.sin(t)*(p.d*.5-.12),.24,.1,.045,0xe8d5a0);}
  }else if(zone==='frozen'){
   b(p.x,.7,p.z,p.w,1.4,p.d,grey);b(p.x,1.4,p.z,p.w+.08,.12,p.d+.08,dark);
   for(const side of [-1,1]){part('box',p.x+side*p.w*.24,1.48,p.z,p.w*.43,.04,p.d*.88,0xb7c8c4,0,true);b(p.x+side*.2,1.51,p.z,.08,.06,p.d*.65,light);}
   b(p.x,.88,p.z+p.d/2+.02,p.w*.6,.35,.03,0xc1cac4);for(let i=0;i<5;i++)b(p.x-p.w*.3+i*p.w*.15,.35,p.z+p.d/2+.05,.08,.15,.02,0x66756c);
  }else if(zone==='bakery'){
   b(p.x,.55,p.z,p.w,1.1,p.d,wood);b(p.x,1.15,p.z,p.w+.1,.12,p.d+.1,0xdecba7);
   b(p.x,1.9,p.z-p.d/2,.08,1.5,.08,dark);b(p.x-p.w/2,1.9,p.z,.08,1.5,p.d,dark);b(p.x+p.w/2,1.9,p.z,.08,1.5,p.d,dark);
   part('box',p.x,2.65,p.z,p.w,.04,p.d,0xe0ece7,0,true);part('box',p.x,1.9,p.z+p.d/2,p.w,1.5,.025,0xe0ece7,0,true);
   for(let x=-2;x<=2;x++)for(let z=-1;z<=1;z++)product((x+z)%2?'bread':'cake',p.x+x*.86,1.22,p.z+z*.65,.9,(x+z)%2?0xc2995f:0xd7bd8b);
  }else if(zone==='produce'){
   b(p.x,.6,p.z,p.w,1.2,p.d,grey);for(let x=-1;x<=1;x++)for(let z=-2;z<=2;z++){b(p.x+x*.85,1.25,p.z+z*.7,.78,.2,.64,0x7d8980);for(let k=0;k<4;k++)part('sphere',p.x+x*.85+(k%2-.5)*.25,1.47,p.z+z*.7+(Math.floor(k/2)-.5)*.25,.26,.26,.26,0xb2b9af);}
  }else if(zone==='deli'||zone==='meat'){
   b(p.x,.6,p.z,p.w,1.2,p.d,grey);b(p.x,1.24,p.z,p.w,.1,p.d,0xc9d0c9);part('box',p.x,1.7,p.z,p.w,.9,p.d,0xc6d4cd,0,true);
   for(let k=-1;k<=1;k++){b(p.x,1.35,p.z+k*p.d*.27,p.w*.75,.05,p.d*.22,0x7e8a82);for(let j=-1;j<=1;j++)b(p.x+j*p.w*.22,1.47,p.z+k*p.d*.27,p.w*.16,.18,p.d*.16,0xb4bab0);}
  }else{
   shelf(p,zone==='packaged_short'?0x98ab92:grey);
   for(let row=0;row<3;row++)for(let x=-1;x<=1;x++)for(let z=-2;z<=2;z++)product(zone==='packaged_short'?'pack':'carton',p.x+x*.7,.31+row*.84,p.z+z*.66,.76,zone==='packaged_short'?[0xd6bd91,0xc1cead,0xd5ccae][(pIndex+row)%3]:0xb3bcb1);
   for(let j=-1;j<=1;j++)b(p.x+j*.8,3.35,p.z,p.w*.23,.5,p.d*.75,zone==='packaged_short'?0xb9b39a:0x929f94);
  }
 }
 m.muted(false);
 // Checkout lanes: conveyor, scanner, monitor, receipt terminal and bagging surface.
 for(let x=-14;x<=10;x+=6){
  b(x,.55,24,2.4,1.1,4.8,0x73877b);b(x,1.14,23.1,2.5,.16,3.1,0xb9c7bd);b(x,1.24,23.1,1.85,.06,2.8,0x283e34);
  for(const side of [-1,1])b(x+side*1.05,1.35,23.1,.09,.18,3,0x90a398);
  b(x,1.25,25.2,2.5,.16,1.3,0xcbd2c9);b(x-.75,1.36,24.65,.5,.1,.5,0x2c4036);b(x-.75,1.42,24.65,.3,.025,.3,0x657d72);
  b(x+.85,1.65,24.8,.09,.8,.09,0x344e40);b(x+.85,2.05,24.8,.9,.6,.12,0x314d40);b(x+.85,2.05,24.88,.75,.44,.025,0x93b7a4);
  b(x+.45,1.43,25.45,.3,.25,.35,0x536d5c);product('pack',x,1.28,22.8,.7,0xb9c3a7);product('carton',x+.35,1.28,23.5,.75,0xd7e1d2);
 }
 // Entry gates / anti-theft pedestals; keep central aisle clear.
 for(const x of [-3,3]){b(x,.9,28.2,.16,1.8,1.1,0x718d7b);part('box',x,.95,28.2,.04,1.5,.8,0xc4d8cb,0,true);}
 return m.finish();
}
export function buildBatchProducts(records){const m=modelBuilder();for(const {batch,p,color}of records){const n=batch.name||'';const kind=/酸奶|发酵乳/.test(n)?'cup':/瓶|饮品|豆奶/.test(n)?'bottle':batch.zone==='cold_dairy'?'carton':/蛋糕|糕|糍/.test(n)?'cake':batch.zone==='bakery'?'bread':'pack';m.product(kind,p.x,p.y-p.size*.4,p.z,p.size*1.8,color);}return m.finish();}
export function disposeModels(group){group.traverse(o=>{if(o.isInstancedMesh){o.dispose();o.geometry.dispose();o.material.dispose();}});}
