import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const r=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
r.outputColorSpace=T.SRGBColorSpace;r.setClearColor(0,0);
const canvas=document.querySelector('canvas');const c=canvas.getContext('2d',{alpha:false});
const s=new T.Scene(),cam=new T.PerspectiveCamera(34,1,.08,70),V=(...v)=>new T.Vector3(...v);
const model=new T.Group();s.add(model);s.fog=new T.FogExp2('#22505a',.044);
let seed=17147;const rnd=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
const mix=(a,b,u)=>a+(b-a)*u,cl=u=>Math.max(0,Math.min(1,u)),ease=u=>cl(u)**2*(3-2*cl(u));
const cut=(t,a,b)=>cl((t-a)/(b-a));
const hemi=new T.HemisphereLight('#b8e1db','#394b50',1.02);s.add(hemi);
for(const [h,p,k] of [['#fff1c7',[-4.2,5.5,2.4],1.55],['#88d9e7',[1,2,-4],2.1],['#6fa7ad',[-2,-.3,4],.32]]){
 const l=new T.DirectionalLight(h,k);l.position.set(...p);s.add(l);
}
// Distant photography, a modeled seabed, sponges and suspended grains have separate parallax.
const terrain=[],colA=new T.Color(),geoMaterial=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.94});
function staticMesh(g,p,sc,rot,color){
 const m=new T.Matrix4().compose(p,new T.Quaternion().setFromEuler(new T.Euler(...rot)),sc);
 let h=g.index?g.toNonIndexed():g.clone();h.deleteAttribute('uv');h.applyMatrix4(m);const a=h.attributes.position,co=[];
 const base=new T.Color(color);for(let i=0;i<a.count;i++){const y=a.getY(i);colA.copy(base).multiplyScalar(.85+.10*Math.cos(a.getX(i)*3.4+y)+.12*Math.sin(a.getZ(i)*3.8+y));co.push(...colA.toArray());}
 h.setAttribute('color',new T.Float32BufferAttribute(co,3));terrain.push(h);
}
const rock=new T.IcosahedronGeometry(1,1);
const floor=(x,z)=>-2.2+.18*Math.sin(x*.62+z*.16)+.17*Math.cos(z*.68);
const floorG=new T.PlaneGeometry(37,30,100,80);floorG.rotateX(-Math.PI/2);const pp=floorG.attributes.position;
for(let i=0;i<pp.count;i++){const x=pp.getX(i),z=pp.getZ(i);pp.setY(i,floor(x,z)+.036*Math.sin(x*3.4+z*.8));}
floorG.computeVertexNormals();staticMesh(floorG,V(0,0,0),V(1,1,1),[0,0,0],'#526864');
for(let i=0;i<260;i++){const x=rnd()*29-14.5,z=rnd()*24-12;
 const scale=.12+Math.pow(rnd(),3)*1.12;staticMesh(rock,V(x,floor(x,z)+.018,z),V(scale*(1+rnd()),scale*.22,scale*.85),[rnd()*.14,rnd()*6,rnd()*.11],['#435b58','#727a66','#3e5860'][i%3]);}
function sponge(x,z,h,rad,slant){
 const pts=[],colors=[],idx=[];const ringN=18;
 const layers=[[.0,.39],[.28,.58],[.64,.88],[.86,1],[1,.88],[.99,.63],[.77,.49]];
 layers.forEach(([height,w],j)=>{for(let k=0;k<ringN;k++){const a=k/ringN*2*Math.PI,dx=rad*w*Math.cos(a),dz=rad*w*Math.sin(a);
   pts.push(x+dx+slant*height*height,floor(x,z)+h*height+.015*Math.cos(3*a),z+dz);
   const color=new T.Color(j>=5?'#243d3c':j===4?'#ac9c78':'#74836c');color.multiplyScalar(.83+.17*Math.cos(6*a));colors.push(...color.toArray());
 }});for(let j=0;j<layers.length-1;j++)for(let i=0;i<ringN;i++){const a=j*ringN+i,b=j*ringN+(i+1)%ringN;idx.push(a,b,a+ringN,b,b+ringN,a+ringN);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(idx);g.computeVertexNormals();terrain.push(g.toNonIndexed());
}
for(let i=0;i<20;i++){const x=rnd()*19-9.5,z=rnd()*14-8;for(let j=0;j<4;j++)sponge(x+rnd()*.8,z+rnd()*.5,.30+rnd()*.5,.058+rnd()*.075,rnd()*.16-.08);}
const bed=new T.Mesh(mergeGeometries(terrain),geoMaterial);s.add(bed);
const points=[],sizes=[];for(let i=0;i<720;i++){points.push(rnd()*23-11.5,rnd()*8-2.5,rnd()*22-12);sizes.push(.4+rnd()*1.4);}
const snowG=new T.BufferGeometry();snowG.setAttribute('position',new T.Float32BufferAttribute(points,3));snowG.setAttribute('size',new T.Float32BufferAttribute(sizes,1));
const snow=new T.Points(snowG,new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uT:{value:0}},vertexShader:`attribute float size;uniform float uT;varying float shade;void main(){vec3 p=position;p.y+=.06*sin(uT*.4+p.x);p.x+=.11*sin(uT*.35+p.z);vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(size*7./-v.z,1.,4.);shade=.12+.17*min(1.,2./max(1.,-v.z));}`,fragmentShader:`varying float shade;void main(){float f=1.-smoothstep(.12,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(.70,.87,.83,f*shade);}`}));
s.add(snow);
const cache={};async function loadImage(key,path){const im=new Image();im.src=path;await im.decode();cache[key]=im;}
const files={
 sea:'底图/海底远景.png',table:'底图/桌面.png',rock:'可动图层/01_附肢石板.png',history:'可动图层/03_历史记录卡.png',head:'可动图层/04_头部化石.png',
 right:'可动图层/04_纸岩右.png',left:'可动图层/04_纸岩左.png',redL:'可动图层/05_左侧根部描线.png',redR:'可动图层/05_右侧根部描线.png',vellum:'可动图层/06_半透明描图纸.png'};
const oceanOnly=document.body.hasAttribute('data-ocean');
await Promise.all(Object.entries(files).filter(([k])=>!oceanOnly||k==='sea').map(([k,p])=>loadImage(k,p)));
// Project the sediment plate onto the bathymetry; distance blends the relief into the real-textured horizon.
const seabedMap=new T.Texture(cache.sea);seabedMap.needsUpdate=true;
const groundUniforms={picture:{value:seabedMap},screen:{value:new T.Vector2(1,1)},offset:{value:new T.Vector2()},animal:{value:new T.Vector2()}};
bed.material=new T.ShaderMaterial({uniforms:groundUniforms,transparent:true,depthWrite:true,side:T.DoubleSide,
vertexShader:`varying vec3 wp;varying vec3 norm;varying float distanceToEye;void main(){wp=(modelMatrix*vec4(position,1.)).xyz;norm=normalize(mat3(modelMatrix)*normal);vec4 mv=modelViewMatrix*vec4(position,1.);distanceToEye=-mv.z;gl_Position=projectionMatrix*mv;}`,
fragmentShader:`uniform sampler2D picture;uniform vec2 screen;uniform vec2 offset;uniform vec2 animal;varying vec3 wp;varying vec3 norm;varying float distanceToEye;
void main(){vec2 uv=gl_FragCoord.xy/screen;float aspect=screen.x/screen.y;vec2 ratio=vec2(min(1.,aspect/1.5),min(1.,1.5/aspect))/1.07;uv=(uv-.5-offset)*ratio+.5;
float near=1.-smoothstep(3.,12.,distanceToEye);uv+=.003*norm.xz*near;
vec3 rgb=texture2D(picture,uv).rgb;float shadow=exp(-dot((wp.xz-animal)/vec2(2.,.66),(wp.xz-animal)/vec2(2.,.66)));rgb*=1.-.29*shadow;
rgb*=.97+.065*dot(normalize(norm),normalize(vec3(-1.,1.,-.3)));gl_FragColor=vec4(rgb,.82*near);}`});
const gltf=await new GLTFLoader().parseAsync(Uint8Array.from(atob(document.querySelector('#model').textContent),ch=>ch.charCodeAt(0)).buffer,'');
model.add(gltf.scene);const mixer=new T.AnimationMixer(gltf.scene);mixer.clipAction(gltf.animations[0]).play();
// Gentle skin grain and moving light on the animal; this stage effect leaves the GLB portable.
const now={value:0};gltf.scene.traverse(o=>{if(!o.isMesh)return;const m=o.material;m.roughness=.52;
 m.onBeforeCompile=shader=>{shader.uniforms.tWater=now;
 shader.vertexShader='varying vec3 localSkin;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nlocalSkin=position;');
 shader.fragmentShader='uniform float tWater;varying vec3 localSkin;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float vein=sin(localSkin.x*22.+6.*sin(localSkin.z*8.))*cos(localSkin.z*21.+sin(localSkin.x*10.));
 float grain=fract(sin(dot(floor(localSkin*255.),vec3(17.1,79.3,29.7)))*4758.1);
 diffuseColor.rgb*=.88+.12*grain+.11*smoothstep(.25,1.,vein);
 float lightWave=sin(localSkin.x*3.+localSkin.z*4.4+tWater*.7)+sin(localSkin.x*4.8-localSkin.z*3.4-tWater*.4);
 diffuseColor.rgb*=.91+.14*smoothstep(.82,1.68,lightWave);`);};});
let W,H,P;
window.setup=(w,h)=>{W=w;H=h;P=h>w;canvas.width=w;canvas.height=h;r.setSize(w,h,false);groundUniforms.screen.value.set(w,h);cam.aspect=w/h;cam.updateProjectionMatrix();};
function cover(im,dx=0,dy=0){const scale=Math.max(W/im.width,H/im.height)*1.07,w=im.width*scale,h=im.height*scale;c.drawImage(im,(W-w)/2+dx,(H-h)/2+dy,w,h);}
function drawImage(im,x,y,w,alpha=1,angle=0,shadow=false){
 c.save();c.translate(x*W,y*H);c.rotate(angle);c.globalAlpha=cl(alpha);
 if(shadow){c.shadowColor='rgba(21,25,20,.29)';c.shadowBlur=W*.011;c.shadowOffsetY=H*.009;}
 const h=w*im.height/im.width;c.drawImage(im,-w/2,-h/2,w,h);c.restore();
}
function look(eye,target,fov,roll){
 cam.fov=fov;cam.updateProjectionMatrix();cam.position.copy(eye);cam.up.set(0,1,0);cam.lookAt(target);cam.rotateZ(roll);cam.updateMatrixWorld();
}
function cinematic(t){
 const phase=t<16?t:t-36;
 const x=1.57-.68*phase+.033*Math.sin(phase*4.1);
 model.position.set(x,.10+.075*Math.sin(phase*1.66),.14*Math.sin(phase*.82));
 model.rotation.set(.07*Math.sin(phase*1.2),.13*Math.cos(phase*.82),.044*Math.cos(phase*1.66));
 if(t<4.5||t>=16){
   look(P?V(-5.6,2.0,7.8):V(-2.6,1.64,7.1),V(.02,-.11,0),P?66:36,P?-.25:-.03);
 }else if(t<8.7){
   look(P?V(-4.1,2.6,5.1):V(-.92,1.3,3.76),V(-2.60,-.09,.26),P?56:38,P?-.20:-.07);
 }else{
   look(P?V(-14.7,1.89,2.65):V(-13.75,1.38,2.45),V(-6.74,-.16,.06),P?52:32,0);
 }
 mixer.setTime(t*1.42);now.value=t;snow.material.uniforms.uT.value=t;
 groundUniforms.offset.value.set(0,0);groundUniforms.animal.value.set(x+.42,model.position.z-.3);
 cover(cache.sea);r.render(s,cam);c.drawImage(r.domElement,0,0);
}
function archive(t){
 cover(cache.table);let u;
 if(t<22.2){
   u=ease((t-16)/6.2);drawImage(cache.rock,.50,.45,(P?1.17:.83)*W*mix(1.08,.95,u),1,mix(.08,-.05,u),true);
 }else if(t<27.4){
   u=ease((t-22.2)/5.2);drawImage(cache.rock,P?.57:.31,P?.34:.46,W*(P?.86:.48),1,.045,true);
   drawImage(cache.history,mix(P?.28:.65,P?.49:.70,u),P?.60:.54,W*(P?.75:.37),1,mix(-.12,-.035,u),true);
 }else{
   const headW=(P?.99:.49)*W;const xx=P?.51:.53, yy=P?.43:.43;
   drawImage(cache.head,xx,yy,headW,1,0,true);
   const l=ease((t-27.4)/2.5),rr=ease((t-30.3)/2.1);
   c.save();const ph=headW*cache.head.height/cache.head.width;c.beginPath();c.rect(xx*W-headW/2,yy*H-ph/2,headW,ph);c.clip();
   drawImage(cache.right,xx+rr*.58,yy,headW,1-rr);
   drawImage(cache.left,xx,yy+l*.63,headW,1-l);
   drawImage(cache.redL,xx,yy,headW,ease((t-29.3)/.6));drawImage(cache.redR,xx,yy,headW,ease((t-31.6)/.7));
   if(t>33.7){let v=ease((t-33.7)/1.1);drawImage(cache.vellum,xx,yy,headW,v*.71);drawImage(cache.redL,xx,yy,headW,v);drawImage(cache.redR,xx,yy,headW,v);}
   c.restore();
 }
}
const copy=[
 [0,2.1,'五亿多年前，'],[2.1,4.5,'加拿大奇虾游过这片海。'],[4.5,8.7,'看它身体两侧的叶片，','从前往后，依次起伏。'],
 [8.7,12,'再看头前这一对，','每条都分节，内侧长着刺。'],[12,16,'偏偏是它，','闹过一场乌龙。'],
 [16,19,'1892 年，研究者看到的，'],[19,22.2,'是这样一块孤立的化石。'],
 [22.2,27.4,'他把这一串弯曲的关节，','认成了一只虾的身体。'],[27.4,30.3,'后来，在另一块标本上……'],[30.3,33.7,'一条，再一条。'],[33.7,36,'两条都连在同一颗头上。'],[36,41.2,'当年的那只“虾”，','其实只是奇虾的一条前附肢。']];
function lettering(t){
 const item=copy.find(([a,b])=>t>=a&&t<b);const isSea=t<16||t>=36;
 const ink=isSea?'#fff4db':'#2c342f';const x=W*(P?.072:.062),base=H*(P?.83:.865),sz=Math.min(H*(P?.031:.048),W*.050);
 if(isSea){
   const grad=c.createLinearGradient(0,H*.63,0,H);grad.addColorStop(0,'rgba(5,22,29,0)');grad.addColorStop(1,'rgba(5,21,29,.66)');c.fillStyle=grad;c.fillRect(0,H*.63,W,H*.37);
 }else{
   const grad=c.createLinearGradient(0,H*.69,0,H);grad.addColorStop(0,'rgba(223,216,200,0)');grad.addColorStop(.7,'rgba(223,216,200,.94)');grad.addColorStop(1,'rgba(223,216,200,1)');c.fillStyle=grad;c.fillRect(0,H*.69,W,H*.31);
 }
 c.textAlign='left';c.fillStyle=ink;
 if(item){c.font='600 '+sz+'px "PingFang SC",sans-serif';const lines=item.slice(2);lines.forEach((v,i)=>c.fillText(v,x,base+i*sz*1.38));}
 const label=isSea?'寒武纪  ·  生态复原':t<22.2?'孤立附肢  /  USNM PAL 207255':t<27.4?'Whiteaves  /  1892 年图版':'清理示意  /  ROMIP 51212';
 c.font='500 '+(sz*.49)+'px "PingFang SC",sans-serif';c.fillStyle=isSea?'#d1e7dc':'#573e31';c.fillText(label,x,H*.081);
}
window.shot=(t,clean=false,read=true)=>{
 c.fillStyle='#152e35';c.fillRect(0,0,W,H);
 if(t<16||t>=36)cinematic(t);else archive(t);
 if(t>=15.58&&t<16){const tmp=document.createElement('canvas');tmp.width=W;tmp.height=H;tmp.getContext('2d').drawImage(canvas,0,0);archive(16);c.globalAlpha=1-ease((t-15.58)/.42);c.drawImage(tmp,0,0);c.globalAlpha=1;}
 if(!clean)lettering(t);
 if(read)return canvas.toDataURL('image/jpeg',.92).split(',')[1];
};
window.ready=true;
window.oceanShot=(t,read=true)=>{cinematic(t);if(read)return canvas.toDataURL('image/jpeg',.94).split(',')[1];};
if(!location.search.includes('render')){
 const resize=()=>innerWidth>innerHeight?window.setup(1280,720):window.setup(720,1280);
 resize();window.addEventListener('resize',resize);const start=performance.now();
 function tick(n){if(oceanOnly)window.oceanShot(((n-start)/1000)%16,false);else window.shot(((n-start)/1000)%42,false,false);requestAnimationFrame(tick);}requestAnimationFrame(tick);
}
