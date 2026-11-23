const T=THREE, vec=(x,y,z)=>new T.Vector3(x,y,z);
let seed=102711;
function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
function choose(a){return a[Math.floor(rand()*a.length)]}
const box=new T.BoxGeometry(1,1,1), cylinder=new T.CylinderGeometry(1,1,1,16), treeBall=new T.IcosahedronGeometry(1,0);
const mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.76,metalness:.08,side:T.DoubleSide});
const bright=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});
// Bake static detail into one draw call per material; lighting remains three-dimensional.
class Batch{
  constructor(){this.positions=[];this.normals=[];this.colors=[]}
  put(shape,x,y,z,sx,sy,sz,color,rx=0,ry=0,rz=0){
    const m=new T.Matrix4().compose(vec(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),vec(sx,sy,sz));
    const normalMatrix=new T.Matrix3().getNormalMatrix(m), p=shape.attributes.position, n=shape.attributes.normal;
    const shade=new T.Color(color), v=vec(0,0,0), count=shape.index?shape.index.count:p.count;
    for(let k=0;k<count;k++){const i=shape.index?shape.index.getX(k):k;
      v.fromBufferAttribute(p,i).applyMatrix4(m);this.positions.push(v.x,v.y,v.z);
      v.fromBufferAttribute(n,i).applyMatrix3(normalMatrix).normalize();this.normals.push(v.x,v.y,v.z);
      this.colors.push(shade.r,shade.g,shade.b);}
  }
  b(x,y,z,sx,sy,sz,c,rx=0,ry=0,rz=0){this.put(box,x,y,z,sx,sy,sz,c,rx,ry,rz)}
  rod(ax,ay,az,bx,by,bz,r,c){
    const a=vec(ax,ay,az),b=vec(bx,by,bz), d=b.clone().sub(a);
    const ang=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(vec(0,1,0),d.clone().normalize()));
    this.put(cylinder,(ax+bx)/2,(ay+by)/2,(az+bz)/2,r,d.length(),r,c,ang.x,ang.y,ang.z);
  }
  finish(material=mat){
    const g=new T.BufferGeometry();
    for(const [key,values] of [['position',this.positions],['normal',this.normals],['color',this.colors]])g.setAttribute(key,new T.Float32BufferAttribute(values,3));
    g.computeBoundingSphere();return new T.Mesh(g,material);
  }
}
// Bodywork is lofted between cross-sections, with chamfered shoulders and bumpers.
function loft(rows){
  const p=[],idx=[];
  rows.forEach(([x,w,y,h])=>{for(const [u,k] of [[-.77,0],[-1,.23],[-1,.68],[-.79,1],[.79,1],[1,.68],[1,.23],[.77,0]])p.push(x,y+k*h,w*u)});
  const last=(rows.length-1)*8;
  for(let j=0;j<rows.length-1;j++)for(let i=0;i<8;i++){
    const a=j*8+i,b=j*8+(i+1)%8;idx.push(a,b,a+8,b,b+8,a+8);}
  for(let i=1;i<7;i++)idx.push(0,i+1,i,last,last+i,last+i+1);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
const paint=['#ffd025','#b7d9d0','#eee5cc','#287879','#c8624e','#93acbe','#eee4d5','#5e9291'];
function carShell(id){
  const shell=new Batch(), lamps=new Batch(), brake=new Batch(), color=paint[id], coupe=id===0||id===3||id===5;
  const body=loft([[-2.17,.73,.33,.43],[-2.03,.93,.31,.59],[-1.61,.96,.30,.67],[.78,.96,.31,.64],[1.70,.92,.33,.55],[2.17,.77,.36,.42]]);
  shell.put(body,0,0,0,1,1,1,color);
  const roof=coupe?1.40:1.51, tail=coupe?-1.59:-1.78;
  const cabin=loft([[tail,.78,.89,.04],[-.92,.78,.89,roof-.89],[-.65,.77,.9,roof-.85],[.29,.76,.9,roof-.88],[1.04,.8,.86,.055]]);
  shell.put(cabin,0,0,0,1,1,1,'#254854');
  shell.b(-.25,roof+.033,0,1.04,.054,1.22,color);
  for(const s of [-1,1]){
    shell.b(-.28,1.16,s*.776,.11,.48,.043,'#18323b',0,0,-.09);
    shell.rod(.29,roof-.015,s*.62,.96,.91,s*.78,.037,color);
    shell.rod(-.91,roof-.01,s*.62,tail,.92,s*.76,.043,color);
    shell.b(-.22,.91,s*.93,2.55,.034,.035,'#bfcac2');
    shell.b(-.41,.78,s*.955,.20,.039,.022,'#203a40');
    shell.b(.67,.993,s*1.005,.24,.15,.19,color);
    shell.b(-.01,.38,s*.94,2.27,.09,.04,'#314348');
    for(const ax of [-1.36,1.35]){
      shell.put(cylinder,ax,.39,s*.90,.386,.205,.386,'#18282b',Math.PI/2);
      shell.put(cylinder,ax,.39,s*1.006,.235,.02,.235,'#a2afb0',Math.PI/2);
      shell.put(cylinder,ax,.39,s*1.021,.153,.025,.153,'#2f4147',Math.PI/2);
      for(let k=0;k<5;k++)shell.b(ax+Math.cos(k*TAU/5)*.097,.39+Math.sin(k*TAU/5)*.097,s*1.037,.22,.029,.016,'#d0d5c9',0,0,k*TAU/5);
    }
    lamps.b(2.103,.695,s*.55,.106,.108,.37,'#fff6c1');
    lamps.b(-2.105,.701,s*.59,.125,.125,.34,'#8e1c20');
    brake.b(-2.179,.71,s*.59,.024,.096,.33,'#ff5036');
  }
  shell.b(2.135,.50,0,.075,.15,.865,'#24373b'); shell.b(-2.151,.49,0,.043,.12,.42,'#ddd7b4');
  shell.b(-2.09,.368,0,.14,.1,1.40,'#47575a');shell.b(2.1,.389,0,.13,.078,1.35,'#465457');
  if(id===0){
    for(const z of [-.14,.14]){
      shell.b(-.25,roof+.065,z,.99,.013,.075,'#fff4d2');
      shell.b(1.48,.884,z,.74,.015,.071,'#fff4d2',0,0,-.082);
    }
  }
  return [shell.finish(),lamps.finish(bright),brake.finish(bright)];
}
const shells=paint.map((_,i)=>carShell(i));
function softTexture(){
  const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,1,32,32,31);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.48,'rgba(255,255,255,.69)');g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.fillRect(0,0,64,64);return new T.CanvasTexture(c);
}
const soft=softTexture(),flat=new T.PlaneGeometry(1,1);
function patch(x,y,z,w,h,material){
  const o=new T.Mesh(flat,material);o.rotation.x=-Math.PI/2;o.position.set(x,y,z);o.scale.set(w,h,1);return o;
}
const tireShadow=new T.MeshBasicMaterial({color:0x142e36,map:soft,transparent:true,opacity:.77,depthWrite:false});
function car(id){
  const o=new T.Group(), [body,head,tail]=shells[id].map(m=>m.clone());
  const brakeMaterial=new T.MeshBasicMaterial({color:0xff5034,map:soft,transparent:true,opacity:.4,depthWrite:false});
  const reflection=patch(-2.27,.022,0,2.1,2.2,brakeMaterial);
  o.add(patch(-.20,.018,.19,6.9,3.1,tireShadow),body,head,tail,reflection);
  o.userData={tail,reflection,brakeMaterial};return o;
}
function setBrakes(o,l){o.userData.tail.visible=l>.12;o.userData.reflection.visible=l>.08;o.userData.brakeMaterial.opacity=.61*l}
const asphaltCanvas=document.createElement('canvas');asphaltCanvas.width=asphaltCanvas.height=256;
{
 const c=asphaltCanvas.getContext('2d'), im=c.createImageData(256,256);
 for(let i=0;i<im.data.length;i+=4){let v=156+rand()*46;im.data[i]=v*.96;im.data[i+1]=v;im.data[i+2]=v*1.02;im.data[i+3]=255}
 c.putImageData(im,0,0);
 for(let i=0;i<150;i++){c.fillStyle='rgba(38,44,47,.12)';c.fillRect(rand()*256,rand()*256,rand()*13,1)}
}
const roadTex=new T.CanvasTexture(asphaltCanvas);roadTex.wrapS=roadTex.wrapT=T.RepeatWrapping;roadTex.repeat.set(118,2);roadTex.colorSpace=T.SRGBColorSpace;
function lightScene(scene){
 scene.add(new T.HemisphereLight('#ffefd8','#738e92',2.05));
 const sun=new T.DirectionalLight('#ffdbad',2.05);sun.position.set(-58,85,-68);scene.add(sun);
 sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-100,right:100,top:90,bottom:-90,near:1,far:248});
 sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.035;sun.shadow.bias=-.00035;
 const rim=new T.DirectionalLight('#aeecf0',.68);rim.position.set(12,18,30);scene.add(rim);
}
function grove(b,x,h,z,s,colors){
 b.b(x,h+.9*s,z,.27*s,1.8*s,.27*s,'#566456');
 for(let j=0;j<3;j++)b.put(treeBall,x+(j-1)*.64*s,h+s*(1.88+j%2*.71),z+s*(j%2-.3)*.62,1.13*s,(1.22+j%2*.3)*s,1.04*s,colors[j],0,j*.85,0);
}
function makeHighway(){
 const scene=new T.Scene();scene.background=new T.Color('#b8d5d3');scene.fog=new T.FogExp2('#bdd0ca',.0073);lightScene(scene);
 const b=new Batch(), lumin=new Batch();
 // A raised single-direction ramp, with a river, a lower quay and skyline beyond.
 b.b(0,-.39,0,620,.74,6.45,'#70858a'); b.b(0,-1.04,0,618,.56,5.7,'#48636a');
 const roadway=new T.Mesh(new T.PlaneGeometry(620,6.25),new T.MeshStandardMaterial({color:'#5a6568',map:roadTex,roughness:.93}));
 roadway.rotation.x=-Math.PI/2;roadway.position.y=.001;roadway.receiveShadow=true;scene.add(roadway);
 for(const z of [-2.53,2.53]){
   b.b(0,.018,z,620,.017,.085,'#f3e7c3');
   b.b(0,.39,z*1.22,620,.14,.10,'#aec2bc');
   for(let i=-302;i<305;i+=3.7)b.b(i,.24,z*1.22,.10,.48,.13,'#536363');
 }
 for(let i=-299;i<300;i+=11.5){
   b.b(i,.021,-2.13,.92,.014,.14,'#dbd8bb');
   b.b(i,.025,2.82,.6,.019,.18,'#d8b17f');
 }
 for(let i=-275;i<280;i+=21){
   b.b(i,-6.0,0,1.3,12,2.2,'#7c8b88');b.b(i,-1.7,0,1.62,1.2,5.6,'#657b7e');
   b.rod(i,.12,-3.17,i,4.1,-3.17,.064,'#678185');b.rod(i,4.1,-3.17,i,4.35,-2.0,.055,'#678185');
   lumin.b(i,4.30,-1.91,.54,.052,.28,'#ffdc93');
 }
 b.b(0,-11.3,0,1150,.58,950,'#6dacae');
 for(let i=0;i<1000;i++){
   const x=rand()*670-335,z=rand()*175-87;
   b.b(x,-10.985+rand()*.012,z,.7+rand()*4,.014,.04+rand()*.1,choose(['#85babb','#78b0b2','#9dc3bd']));
 }
 for(const s of [-1,1]){
   b.b(0,-9.1,s*59,750,4,38,'#9eab92');b.b(0,-8.3,s*37,750,3.1,2.3,'#829c97');
   b.b(0,-6.99,s*42,740,.12,4,'#9d9f8d');
   for(let i=-250;i<260;i+=3.7+rand()*3)grove(b,i,-7.04,s*(43+rand()*7),1.15+rand()*1.2,['#668978','#71907b','#829a80']);
   for(let i=-270;i<270;i+=5+rand()*8){
     const h=4+rand()*19,w=3+rand()*6,z=s*(60+rand()*30);
     b.b(i,h/2-7,z,w,h,5+rand()*3,choose(['#9baaa8','#b2b7a9','#a8b9b9','#c9baa3','#91a8ad']));
     b.b(i,h-6.8,z,w*.73,.70,3.8,'#a8b5b0');
     for(let k=-4;k<h-8;k+=2.4)b.b(i,k,z-s*3.8,w*.78,.44,.06,'#809da0');
   }
 }
 for(let j=0;j<26;j++)b.put(treeBall,(j-13)*22,-8-rand()*10,-125-rand()*70,32+rand()*25,21+rand()*17,21+rand()*25,'#92aeaa');
 for(const side of [-1,1]){
   for(let k=-3;k<=3;k++){
     const x=14+53*k,z=side*(23+3*Math.cos(k*4));
     b.b(x,-10.58,z,10.8,.89,2.55,'#325968');b.b(x,-10.05,z,10.1,.25,2.46,'#b7baaa');
     b.b(x-3.71,-9.25,z,1.87,1.45,1.94,'#d7dbc6');b.b(x-3.71,-8.45,z,2.12,.18,2.2,'#c06c51');
     b.b(x-3.68,-9.12,z-side*1.01,1.4,.46,.035,'#557984');
     for(let n=0;n<3;n++)b.b(x-1.93+n*2.03,-9.6,z,1.94,.72,1.94,['#c87c57','#608784','#b4a477'][modulo(n+k,3)]);
   }
   for(let k=-4;k<=4;k++){const x=21+k*42,z=side*36;
     b.b(x,-7.36,z,8,.5,3.4,'#baaf98');b.b(x-2.8,-9.4,z,1.1,3.8,.53,'#767d70');b.b(x+2.8,-9.4,z,1.1,3.8,.53,'#767d70');
     b.rod(x,-7.28,z,x+.5,2.1,z,.22,'#d59967');b.rod(x+.5,2.1,z,x+4.6,4.45,z-side*3.3,.17,'#d59967');
     b.rod(x+.5,1.3,z,x+4.6,4.45,z-side*3.3,.079,'#a2785c');b.rod(x+4.6,4.45,z-side*3.3,x+4.6,-.6,z-side*3.3,.027,'#677878');
   }
 }
 const solid=b.finish();solid.castShadow=true;solid.receiveShadow=true;scene.add(solid,lumin.finish(bright));
 return scene;
}
function annulus(inner,outer,c){
 const g=new T.RingGeometry(inner,outer,180);const m=new T.Mesh(g,new T.MeshStandardMaterial({color:c,roughness:.88,side:T.DoubleSide}));m.rotation.x=-Math.PI/2;return m;
}
function makeTrack(){
 const scene=new T.Scene();scene.background=new T.Color('#e9e1c4');scene.fog=new T.FogExp2('#d4dbc3',.004);lightScene(scene);
 const b=new Batch();b.b(0,-.55,0,760,1,760,'#91ac84');
 for(let i=-16;i<16;i++)b.b(i*6.7,-.043,0,3.35,.022,225,'#9cb28c',0,.18,0);
 scene.add(annulus(R-3.22,R+3.22,'#526569'));
 for(const r of [R-2.46,R+2.46]){const a=annulus(r-.07,r+.07,'#eee3c4');a.position.y=.015;scene.add(a)}
 for(let k=0;k<144;k++){
   const a=k*TAU/144,r=R+3.36; b.b(r*Math.cos(a),.015,r*Math.sin(a),.35,.065,1.58,k%4<2?'#d88268':'#f1e9d0',0,-a,0);
 }
 for(let k=0;k<74;k++){
   let a=rand()*TAU, r=R+9+rand()*30;grove(b,r*Math.cos(a),0,r*Math.sin(a),.75+rand()*1.3,['#678e71','#80a07a','#729772']);
 }
 // Painted start line and trackside timing shelter give the moving cluster fixed landmarks.
 for(let j=0;j<2;j++)for(let k=0;k<10;k++)b.b(R+(k-4.5)*.48,.022,(j-.5)*.46,.478,.018,.46,(j+k)%2?'#ede9cb':'#31484c');
 b.b(-4,.11,8,12,.22,5,'#b1b69d');b.b(-4,1.25,8,5,2.40,2.7,'#dbd9ba');b.b(-4,2.56,8,5.8,.23,3.35,'#e5a06d');
 for(let k=0;k<4;k++)b.b(-5.85+k*1.21,1.51,9.37,.98,.82,.07,'#42666b');
 for(let k=0;k<5;k++){b.b(1.7+k*.51,.7,8,.12,1.4,.12,'#eee5ce')}
 for(let k=0;k<1150;k++){const x=rand()*150-75,z=rand()*150-75;if(Math.abs(Math.hypot(x,z)-R)>4.5)
   b.b(x,.008,z,.15+rand()*.8,.035,.1+rand()*.32,choose(['#9fb598','#b1c09e','#aec09d']));}
 // A timing apron, observation stand and concentric measurement ticks give scale to the field.
 for(let k=0;k<4;k++){
   b.b(-11, .17+k*.30, -9-k*.73, 10, .35+k*.60,.82,'#8a9d94');
   b.b(-11, .37+k*.60, -9-k*.73, 10.2,.10,.83,'#e4d7b6');
 }
 b.b(-4.7,-.005,-2.6,3,.08,23,'#bbba98',0,-.08,0);
 for(let k=0;k<3;k++){const x=-3+2.72*k;b.rod(x,0,-9,x,4.5,-9,.06,'#ebebce');
   b.b(x+.70,3.89,-9,1.35,.83,.035,['#e9ae55','#d26a4f','#397b7d'][k],0,-.23,k*.035);}
 for(let k=0;k<72;k++){
   const a=k*TAU/72,r=R-4.5,w=k%6===0?1.43:.44;
   b.b(r*Math.cos(a),.025,r*Math.sin(a),w,.035,.105,k%6===0?'#f1e5b9':'#c9d5b9',0,-a,0);
 }
 for(let i=0;i<4;i++){const x=7+i*.85;b.b(x,.23,7,.38,.46,.38,'#d97953');b.b(x,.37,7,.32,.06,.32,'#eddfc3');}
 const solid=b.finish();solid.castShadow=true;solid.receiveShadow=true;scene.add(solid);
 return scene;
}
