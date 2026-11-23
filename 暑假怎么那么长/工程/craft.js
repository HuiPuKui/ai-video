const T=THREE, V=(x,y,z)=>new T.Vector3(x,y,z), TAU=2*Math.PI;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(x,b)),mix=(a,b,f)=>a+(b-a)*f;
const ease=f=>{f=clamp(f);return f*f*(3-2*f)},mod=(v,n)=>(v%n+n)%n;
function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
const rng=random(73);
const materials=new Map();
function pigment(color){
 if(typeof color!=='string')return color;
 if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.75,metalness:.035,flatShading:true,side:T.DoubleSide}));
 return materials.get(color);
}
const cube=new T.BoxGeometry(1,1,1),sphere=new T.IcosahedronGeometry(1,1),lowSphere=new T.IcosahedronGeometry(1,0),plane=new T.PlaneGeometry(1,1);
function group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g}
function mesh(parent,g,c,x,y,z,w=1,h=1,d=1){
 const o=new T.Mesh(g,pigment(c));o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
}
function box(p,x,y,z,w,h,d,c){return mesh(p,cube,c,x,y,z,w,h,d)}
function ball(p,x,y,z,w,h,d,c,low=false){return mesh(p,low?lowSphere:sphere,c,x,y,z,w,h,d)}
const cylCache=new Map();
function taper(p,x,y,z,top,bot,h,c,n=16){
 const k=[top,bot,h,n].join(':');if(!cylCache.has(k))cylCache.set(k,new T.CylinderGeometry(top,bot,h,n));
 return mesh(p,cylCache.get(k),c,x,y,z);
}
function rod(p,a,b,r,c,n=8){const v=V(...a),w=V(...b),d=w.clone().sub(v),m=w.add(v).multiplyScalar(.5);
 const o=taper(p,m.x,m.y,m.z,r,r,d.length(),c,n);o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return o}
function wire(p,points,r,c,steps=24){return mesh(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(a=>V(...a))),steps,r,5,false),c,0,0,0)}
function face(p,pts,color){const geom=new T.BufferGeometry();const vs=[];
 for(let i=1;i<pts.length-1;i++)vs.push(...pts[0],...pts[i],...pts[i+1]);
 geom.setAttribute('position',new T.Float32BufferAttribute(vs,3));geom.computeVertexNormals();return mesh(p,geom,color,0,0,0)}
function painted(w,h,paint){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;paint(canvas.getContext('2d'),w,h);
 const tex=new T.CanvasTexture(canvas);tex.anisotropy=8;tex.colorSpace=T.SRGBColorSpace;return tex}
function printed(tex){return new T.MeshStandardMaterial({map:tex,roughness:.88,side:T.DoubleSide})}
function graphic(p,x,y,z,w,h,tex){return mesh(p,plane,printed(tex),x,y,z,w,h,1)}
function floorGraphic(p,x,y,z,w,h,tex){const o=graphic(p,x,y,z,w,h,tex);o.rotation.x=-Math.PI/2;return o}
function words(c,str,x,y,size,fill,weight=700,align='left',family='"PingFang SC","Hiragino Sans GB",sans-serif'){
 c.font=weight+' '+size+'px '+family;c.fillStyle=fill;c.textAlign=align;c.fillText(str,x,y);
}
// Collapse immobile pieces by material; articulated objects are marked before batching.
function bake(root){
 root.updateWorldMatrix(true,true);const inv=root.matrixWorld.clone().invert(), bins=new Map(),remove=[];
 function walk(node){
   if(node.userData.moving)return;
   if(node.isMesh&&!Array.isArray(node.material)){
     const mat=node.material;if(!bins.has(mat))bins.set(mat,{pos:[],nor:[],uv:[]});
     const bin=bins.get(mat),g=node.geometry,wp=inv.clone().multiply(node.matrixWorld),norm=new T.Matrix3().getNormalMatrix(wp);
     const v=V(0,0,0),p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;
     for(let j=0;j<(g.index?g.index.count:p.count);j++){const i=g.index?g.index.getX(j):j;
       v.fromBufferAttribute(p,i).applyMatrix4(wp);bin.pos.push(v.x,v.y,v.z);
       v.fromBufferAttribute(n,i).applyMatrix3(norm).normalize();bin.nor.push(v.x,v.y,v.z);
       bin.uv.push(u?u.getX(i):0,u?u.getY(i):0);}
     remove.push(node);
   }
   node.children.forEach(walk);
 }
 root.children.forEach(walk);remove.forEach(o=>o.removeFromParent());
 for(const [m,b] of bins){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(b.nor,3));g.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));mesh(root,g,m,0,0,0);}
}
function litScene(sky,fog,day=true){
 const s=new T.Scene();s.background=new T.Color(sky);s.fog=new T.FogExp2(fog,day?.010:.016);
 s.add(new T.HemisphereLight(day?'#fff0d8':'#cfe8e6',day?'#bba68e':'#7c9b90',day?1.72:1.42));
 const sun=new T.DirectionalLight(day?'#ffdfac':'#ffe7c8',day?2.13:1.65);sun.position.set(-10,15,-8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
 Object.assign(sun.shadow.camera,{left:-18,right:18,top:21,bottom:-21,near:.4,far:67});sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.017;sun.shadow.bias=-.0002;s.add(sun,sun.target);
 const edge=new T.DirectionalLight('#c6f0ff',.53);edge.position.set(5,5,9);s.add(edge);
 return {s,sun};
}
function origami(p,x,y,z,scale=1){
 const g=group(p,x,y,z);g.scale.setScalar(scale);
 const nose=[0,.57,-1.42],tail=[0,.57,1.42],peak=[0,.85,0];
 for(const s of [-1,1]){
   const fore=[s*.64,.415,-.45],aft=[s*.64,.415,.45],keelA=[s*.24,0,-.71],keelB=[s*.24,0,.71];
   face(g,[nose,fore,keelA],s<0?'#e9d3ad':'#fff0cf');face(g,[fore,aft,keelB,keelA],s<0?'#e6cda6':'#f7dfbb');face(g,[aft,tail,keelB],'#efe1bc');
   face(g,[nose,[0,.12,-.3],fore],'#c9b59b');face(g,[fore,[0,.12,-.3],[0,.12,.46],aft],'#e0c8a1');face(g,[aft,[0,.12,.46],tail],'#ccac8e');
   face(g,[[0,.18,-.81],peak,[s*.35,.22,.46]],s<0?'#f4dbb5':'#fff4d7');
   face(g,[peak,[0,.18,.88],[s*.35,.22,.46]],s<0?'#cda887':'#e4bf96');
   face(g,[[s*.64,.416,.45],[s*.25,.506,1.04],[s*.42,.32,.76]],s<0?'#c96b50':'#d88062');
 }
 return g;
}
