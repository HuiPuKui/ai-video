// Reference times for the four shots, starting at the rear tracking shot.
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import timeline from './镜头字幕.json';
import {archiveStart,filmDuration,prepareArchive} from './标本桌.mjs';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d', {alpha:false});
const stage = document.createElement('canvas');
const renderer = new T.WebGLRenderer({canvas:stage, alpha:true, antialias:true});
renderer.setClearColor(0,0);
renderer.outputColorSpace = T.SRGBColorSpace;
const scene = new T.Scene(), camera = new T.PerspectiveCamera(32, 1, .04, 80);
const V = (x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const tau = 2*Math.PI, lerp = T.MathUtils.lerp, clamp = T.MathUtils.clamp;
const smooth = x=>T.MathUtils.smoothstep(x,0,1);
const actor = new T.Group();
scene.add(actor);
const glb = Uint8Array.from(atob(document.querySelector('#model').textContent), v=>v.charCodeAt(0));
const {scene:animal} = await new GLTFLoader().parseAsync(glb.buffer,'');
actor.add(animal);

const plates = await Promise.all([...document.querySelectorAll('[data-plate]')].map(async tag=>{
  const im = new Image(); im.src = 'data:image/jpeg;base64,'+tag.textContent;
  await im.decode(); return im;
}));
function greenWaterPlate(image){
  const grade=document.createElement('canvas');
  grade.width=image.width;grade.height=image.height;
  const paint=grade.getContext('2d',{willReadFrequently:true});
  paint.drawImage(image,0,0);
  const pixels=paint.getImageData(0,0,grade.width,grade.height);
  const {data}=pixels;
  for(let i=0;i<data.length;i+=4){
    const r=data[i],g=data[i+1],b=data[i+2];
    const water=smooth((Math.max(g,b)-r-6)/58)*smooth((b-.73*g+14)/45);
    data[i]=lerp(r,.46*g+.19*b,water);
    data[i+1]=lerp(g,.65*g+.43*b,water);
    data[i+2]=lerp(b,.40*b+.25*g,water);
  }
  paint.putImageData(pixels,0,0);
  return grade;
}
const [seabed,rockWall,reef]=plates;
const greenReef=greenWaterPlate(reef);
const backgrounds=[seabed,null,greenWaterPlate(rockWall),greenReef];
const sky = new T.HemisphereLight(0xcde5e7,0x808275,1.03);
const sun = new T.DirectionalLight(0xffedce,2.05), rim = new T.DirectionalLight(0xb8eeee,1.22);
sun.position.set(-4,6,-3); rim.position.set(1,3,4);
scene.add(sky,sun,rim);
const waterTime = {value:0}, redShell = {value:0};
const trunkWave = {value:new T.Vector4()};
const trunkHeightScale=1.28, waveStart=-.94, waveLength=3.04, waveNumber=1.86;
function trunkLift(x){
  return trunkWave.value.y*smooth((x-waveStart)/waveLength)
    *Math.sin(trunkWave.value.x-waveNumber*(x-waveStart));
}
// A lateral pull at the head reaches the posterior segments progressively later.
function trunkSweep(x){
  const d=x-waveStart;
  const {z:beat,w:strength}=trunkWave.value;
  return strength*smooth(d/waveLength)*(Math.sin(beat)-Math.sin(beat-1.05*d));
}
const shell = new T.MeshStandardMaterial({vertexColors:true, roughness:.47, side:T.DoubleSide});
shell.onBeforeCompile = sh=>{
  Object.assign(sh.uniforms,{waterTime,redShell});
  sh.vertexShader = 'varying vec3 shellPoint;\n'+sh.vertexShader.replace('#include <begin_vertex>',
    '#include <begin_vertex>\nshellPoint=position;');
  sh.fragmentShader = `varying vec3 shellPoint;uniform float waterTime,redShell;
    float speck(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
    float skinNoise(vec3 p){
      vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(mix(speck(i),speck(i+vec3(1,0,0)),f.x),mix(speck(i+vec3(0,1,0)),speck(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(speck(i+vec3(0,0,1)),speck(i+vec3(1,0,1)),f.x),mix(speck(i+vec3(0,1,1)),speck(i+vec3(1,1,1)),f.x),f.y),f.z);
    }
  `+sh.fragmentShader.replace('#include <color_fragment>',`
    #include <color_fragment>
    vec3 p=shellPoint;
    float cloud=sin(8.*p.x+3.*sin(11.*p.z)+2.*p.y)*sin(10.*p.z-3.*p.x);
    float fold=sin(31.*p.x+4.*sin(7.*p.z+2.*p.y));
    float pore=sin(180.*p.x+19.*sin(p.z*52.))*sin(160.*p.z+p.y*171.);
    vec3 ochre=diffuseColor.rgb;
    float value=dot(ochre,vec3(.36,.52,.12));
    float mottling=.62*skinNoise(12.*p)+.27*skinNoise(30.*p)+.11*skinNoise(87.*p);
    float grain=skinNoise(p*230.);
    vec3 red=mix(vec3(.105,.014,.023),vec3(.52,.082,.047),smoothstep(.06,.43,value));
    red=mix(red,vec3(.066,.009,.017),.49*(1.-smoothstep(.28,.54,mottling)));
    red=mix(red,vec3(.68,.20,.095),.42*smoothstep(.55,.77,mottling));
    red=mix(red,vec3(.69,.29,.134),.72*smoothstep(.38,.58,value));
    diffuseColor.rgb=mix(ochre,red,redShell)*(.62+.62*mottling+.12*grain+.12*cloud+.07*fold+.04*pore);
    float ripple=sin(3.8*p.x+4.5*p.z+waterTime*.8)+sin(4.8*p.z-2.1*p.x-waterTime*.56);
    diffuseColor.rgb*=.97+.15*smoothstep(1.15,1.85,ripple);
  `);
};
const trunkShell=shell.clone();
trunkShell.onBeforeCompile=shader=>{
  shell.onBeforeCompile(shader);
  shader.uniforms.trunkWave=trunkWave;
  shader.vertexShader=`
    uniform vec4 trunkWave;
    float trunkLift(float x){
      float d=x-(${waveStart});
      return (trunkWave.y/${trunkHeightScale})*smoothstep(0.,${waveLength},d)
        *sin(trunkWave.x-${waveNumber}*d);
    }
    float trunkSweep(float x){
      float d=x-(${waveStart});
      return trunkWave.w*smoothstep(0.,${waveLength},d)
        *(sin(trunkWave.z)-sin(trunkWave.z-1.05*d));
    }
  `+shader.vertexShader.replace('#include <beginnormal_vertex>',`
    #include <beginnormal_vertex>
    float slope=(trunkLift(position.x+.01)-trunkLift(position.x-.01))/.02;
    float lateralSlope=(trunkSweep(position.x+.01)-trunkSweep(position.x-.01))/.02;
    objectNormal.x-=slope*objectNormal.y+lateralSlope*objectNormal.z;
  `).replace('shellPoint=position;', 'shellPoint=position;transformed.y+=trunkLift(position.x);transformed.z+=trunkSweep(position.x);');
};
const flaps = [];
animal.traverse(node=>{
  if(node.isMesh) node.material=shell;
  if(node.name.startsWith('Frontal_appendage_')) node.visible=false;
  if(node.name.startsWith('Swimming_flap_')) {
    const side = node.name.includes('_R_') ? 1 : -1;
    const index = Number(node.name.slice(-2))-1;
    flaps.push({node,side,index,restY:node.position.y,restZ:node.position.z});
    node.scale.set(1.53,1.29,1.38);
  }
});
const trunk=animal.getObjectByName('Body_eyes_tail');
trunk.scale.y=trunkHeightScale;
trunk.traverse(node=>{if(node.isMesh)node.material=trunkShell;});

// Form each podomere in its local frame; its spines rotate with the cuticle.
function surface(nu,nv,point,color){
  const pos=[], rgb=[], indices=[];
  for(let i=0;i<=nu;i++) for(let j=0;j<=nv;j++){
    const u=i/nu, v=j/nv;
    pos.push(...point(u,v).toArray()); rgb.push(...color(u,v).toArray());
    if(i<nu && j<nv){
      const a=i*(nv+1)+j,b=a+nv+1;
      indices.push(a,b,a+1,b,b+1,a+1);
    }
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  geo.setAttribute('color',new T.Float32BufferAttribute(rgb,3));
  geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
const color = hex=>new T.Color(hex);
const amber=color('#b57d4f'), ivory=color('#ebd09d'), crease=color('#594b45');
function spine(base,tip,r) {
  const delta=tip.clone().sub(base);
  const side=V(0,0,1), normal=delta.clone().cross(side).normalize();
  return surface(6,10,(u,v)=>{
    const h=r*(1-u*.995),a=v*tau;
    return base.clone().addScaledVector(delta,u).addScaledVector(normal,h*Math.cos(a)+.027*Math.sin(Math.PI*u)).addScaledVector(side,h*Math.sin(a));
  },(u)=>ivory.clone().lerp(crease,.63*Math.pow(u,3)));
}
const arms=[[],[]];
for(let i=0;i<14;i++) {
  const k=i/13, len=.167-.062*k, radius=.172*(1-.74*k);
  const armor=surface(10,30,(u,v)=>{
    const r=radius*(.91+.15*Math.sin(Math.PI*u)-.07*u),a=v*tau;
    return V(-len*(u*1.04-.02),r*Math.cos(a),r*.85*Math.sin(a));
  },(u,v)=>amber.clone().lerp(ivory,.12+.13*Math.cos(v*tau)+.15*k)
    .lerp(crease,.83*Math.exp(-u*12)+.14*Math.pow(Math.sin(v*tau*2),4)));
  const pieces=[armor];
  if(i>0){
    const h=(i%2 ? .29:.215)*(1-.60*k);
    for(const z of [-1,1]){
      const a=V(-.52*len,-.61*radius,z*radius*.31);
      const b=a.clone().add(V(-.045+.105*k,-h,z*.026));
      pieces.push(spine(a,b,.032*(1-.58*k)));
      const fork=a.clone().lerp(b,.52);
      pieces.push(spine(fork,fork.clone().add(V(.057,-h*.39,z*.012)),.013*(1-.5*k)));
    }
  }
  const geom=mergeGeometries(pieces);
  for(const arm of arms){const joint=new T.Mesh(geom,shell); actor.add(joint);arm.push({joint,len});}
}
const eyeMat=new T.MeshPhysicalMaterial({color:0x283536,roughness:.38,clearcoat:.35,clearcoatRoughness:.34});
eyeMat.onBeforeCompile=sh=>{
  sh.vertexShader='varying vec2 lensUV;\n'+sh.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nlensUV=uv;');
  sh.fragmentShader='varying vec2 lensUV;\n'+sh.fragmentShader.replace('#include <color_fragment>',`
    #include <color_fragment>
    vec2 cells=lensUV*vec2(102.,55.);cells.x+=.5*mod(floor(cells.y),2.);
    float facets=1.-smoothstep(.27,.53,length(fract(cells)-.5));
    diffuseColor.rgb*=.65+.48*facets;
    diffuseColor.rgb+=vec3(.021,.036,.04)*smoothstep(.46,.80,lensUV.y);
  `);
};
const eyeG=new T.SphereGeometry(1,48,32);
for(const sign of [-1,1]){
  const eye=new T.Mesh(eyeG,eyeMat);eye.scale.set(.16,.148,.155);eye.position.set(-1.265,.179,sign*.637);
  actor.add(eye);
}
const mouth=new T.Group();mouth.position.set(-1.15,-.274,0);
mouth.rotation.z=-.12;actor.add(mouth);
const disk=new T.Mesh(eyeG,new T.MeshStandardMaterial({color:0x211e19,roughness:.93}));
disk.scale.set(.237,.048,.23);mouth.add(disk);
const teeth=[];
for(let i=0;i<32;i++){
  const a=i/32*tau,cs=Math.cos(a),sn=Math.sin(a);
  teeth.push(surface(8,8,(u,v)=>{
    const width=.026*(1-.88*u)*Math.cos(v*tau),r=.235-.137*u;
    return V(cs*r-sn*width,-.025-.033*Math.sin(Math.PI*u)-.014*Math.sin(v*tau),sn*r+cs*width);
  },(u)=>ivory.clone().lerp(crease,.28+.37*u)));
}
const toothMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.71,side:T.DoubleSide});
const restingTeeth=new T.Mesh(mergeGeometries(teeth),toothMat);
mouth.add(restingTeeth);

function oralPlates(aperture){
  const rim=surface(8,64,(u,v)=>{
    const a=v*tau, r=lerp(.27,aperture+.012,u);
    return V(r*Math.cos(a),-.050-.027*Math.sin(u*Math.PI*.86),r*Math.sin(a));
  },(u,v)=>amber.clone().lerp(crease,.48+.29*u+.08*Math.cos(v*tau*32)));
  const plates=[rim];
  for(let i=0;i<32;i++){
    const a=i/32*tau,cs=Math.cos(a),sn=Math.sin(a),major=i%8===0;
    plates.push(surface(8,8,(u,v)=>{
      const cross=v*tau,r=lerp(.258,aperture+(major?-.003:.008),u);
      const width=r*(major?.112:.085)*lerp(1,.12,u)*Math.cos(cross);
      return V(cs*r-sn*width,-.060-.042*Math.sin(Math.PI*u*.86)-.010*Math.sin(cross),sn*r+cs*width);
    },(u)=>amber.clone().lerp(ivory,.23+.68*u).lerp(crease,.18*(1-u))));
  }
  return mergeGeometries(plates);
}
const closedMouth=oralPlates(.017), openMouth=oralPlates(.157);
closedMouth.morphAttributes.position=[openMouth.attributes.position];
closedMouth.morphAttributes.normal=[openMouth.attributes.normal];
const movingTeeth=new T.Mesh(closedMouth,toothMat);
mouth.add(movingTeeth);

// The shell follows the gripping joints until it reaches the oral cone.
const prey=new T.Group();
const preyMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.54,side:T.DoubleSide});
const preyShell=surface(154,60,(u,v)=>{
  const a=tau*u, b=(v-.5)*Math.PI, z=Math.sin(b);
  const ridge=.020*Math.cos(13*a+2.7*Math.abs(z));
  const r=.235+ridge+.049*Math.exp(-14*z*z);
  return V(r*Math.cos(b)*Math.sin(a),r*Math.cos(b)*Math.cos(a),.29*z);
},(u,v)=>color('#584437').lerp(color('#967957'),.48+.44*Math.cos(13*tau*u+2.7*Math.abs(Math.sin((v-.5)*Math.PI)))));
prey.add(new T.Mesh(preyShell,preyMat));
actor.add(prey);

let seed=501;
const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
const dustPos=[];
for(let i=0;i<620;i++) dustPos.push((random()-.5)*17,(random()-.5)*10,(random()-.5)*17);
const dustG=new T.BufferGeometry();dustG.setAttribute('position',new T.Float32BufferAttribute(dustPos,3));
const dust=new T.Points(dustG,new T.ShaderMaterial({
  uniforms:{t:waterTime},transparent:true,depthWrite:false,
  vertexShader:`uniform float t;varying float alpha;void main(){
    vec3 p=position;p.x+=.16*sin(t*.36+p.y);p.y+=.09*cos(t*.29+p.z);
    vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;
    gl_PointSize=clamp(5./max(.3,-v.z),1.,3.);alpha=.10*smoothstep(.4,2.,-v.z);
  }`,
  fragmentShader:`varying float alpha;void main(){float a=1.-smoothstep(.08,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(.77,.86,.79,a*alpha);}`
}));scene.add(dust);

// Each lens is specified by the height of its field at the point of interest.
// The horizontal anchor and portrait safety width keep the same action legible vertically.
const cuts=timeline.cuts;
const fades=[0,.20,.24,.24];
let width,height,aspect;
function rearTracking(elapsed,q){
  const drift=elapsed*2.65+.36;
  return {
    distance:q*(.58+.42*q),
    heave:Math.sin(drift),
    sway:Math.sin(drift*.79+.7),
    roll:.031*Math.sin(drift-.82)+.009*Math.sin(drift*1.7),
  };
}
function lens(eye,focus,field,cx,cy,safety,roll=0,portraitX=.5+(cx-.5)*.35){
  camera.position.copy(eye).add(focus);camera.up.set(0,1,0);camera.lookAt(focus);camera.rotateZ(roll);
  const viewHeight=Math.max(field,safety/aspect);
  camera.fov=2*Math.atan(viewHeight/(2*eye.length()))*180/Math.PI;
  camera.aspect=aspect;camera.updateProjectionMatrix();
  camera.projectionMatrix.elements[8]=1-2*(aspect<1?portraitX:cx);
  camera.projectionMatrix.elements[9]=2*cy-1;
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  camera.updateMatrixWorld();
}
const closingSwim=4;
function pose(shot,t,q,tracking){
  const underbelly=shot===1, feeding=shot===2, closing=shot===closingSwim, red=shot>=2;
  const elapsed=closing?t:t-cuts[shot];
  const phase=feeding?1.4+elapsed*2.7:t*5.4;
  const sway=Math.sin(phase*.48);
  const lift=feeding?smooth((elapsed-.35)/2.03):0;
  const biting=feeding?smooth((elapsed-2.35)/.48):0;
  const bitePhase=Math.max(0,elapsed-2.35)*6.70;
  const cycle=(bitePhase/tau)%1;
  // Build tension, hold the shell at the mouth, then let the joints extend.
  const pull=biting*(smooth(cycle/.36)-smooth((cycle-.48)/.52));
  const turn=1.4*biting*Math.sin(bitePhase);
  redShell.value=red?1:0;
  waterTime.value=t;prey.visible=feeding;dust.visible=!closing;
  sky.intensity=feeding?1.30:underbelly?1.29:1.08;
  sky.color.set(red?0xc9e3c6:0xd1e4da);
  sun.color.set(red?0xffe4bf:0xffe4ba);
  sun.intensity=feeding?1.79:underbelly?1.40:1.89;
  sun.position.set(-4,underbelly?-4:6,closing?3:-3);
  eyeMat.color.set(red?0x362523:0x332f29);
  const advance=tracking?-8.10*tracking.distance:underbelly?lerp(.62,-.74,q):closing?lerp(2.1,-2.1,q):0;
  const rise=tracking?.06*q:0;
  const drift=feeding?.52:1;
  actor.position.set(advance-.024*pull,rise+.033*drift*Math.sin(phase*.8)+.018*pull,.038*drift*sway+.015*turn);
  const pitch=feeding?lerp(-.13,-.29,lift):0;
  actor.rotation.set(.046*drift*Math.sin(phase*.53)+.016*pull,.043*drift*sway+.054*turn,pitch+.029*drift*Math.cos(phase*.52)+.047*pull);
  restingTeeth.visible=!underbelly&&!feeding;
  movingTeeth.visible=underbelly||feeding;
  mouth.position.y=underbelly?-.305:-.274;
  mouth.scale.setScalar(underbelly?1.17:1);
  if(underbelly){
    const cycle=.5+.5*Math.cos(elapsed*tau/1.98-.54);
    movingTeeth.morphTargetInfluences[0]=smooth(cycle);
  }else if(feeding){
    movingTeeth.morphTargetInfluences[0]=.76-.56*pull;
  }
  // Follow the same traveling curve at the swimming flaps' attachment points.
  const bendAmplitude=feeding?.15+.055*pull:tracking?.18:closing?.13:0;
  trunkWave.value.set(elapsed*(feeding?1.85:3.9)+1.15,bendAmplitude,bitePhase,.18*biting);
  for(const {node,index,side,restY,restZ} of flaps){
    const wave=phase-index*.50+side*.09+side*.14*turn;
    const x=node.position.x;
    const slope=(trunkLift(x+.01)-trunkLift(x-.01))/.02;
    const lateralSlope=(trunkSweep(x+.01)-trunkSweep(x-.01))/.02;
    node.position.y=restY+trunkLift(x);
    node.position.z=restZ+trunkSweep(x);
    node.rotation.x=side*(.035+.52*Math.sin(wave)+.075*Math.sin(wave*2));
    node.rotation.y=-Math.atan(lateralSlope);
    node.rotation.z=.24+.51*Math.cos(wave-.69)+Math.atan(slope);
  }
  const held=V(),contactSpan=V();
  for(let j=0;j<arms.length;j++){
    const sign=j?1:-1, pulse=Math.sin(phase*.64+sign*.42);
    const armLift=feeding?smooth((elapsed-.25-j*.23)/2.0):0;
    const open=feeding?lerp(.40,.23,armLift):underbelly?.58:.33;
    const curl=feeding?lerp(2.96,4.86,armLift):underbelly?1.71:shot===3?2.88:2.17;
    const base=feeding?lerp(.22,.38,armLift)+.024*pulse:.22+.09*pulse;
    const grip=feeding?lerp(1.04,.85,armLift)+.05*pulse:.24;
    let x=-1.34,y=-.014,z=sign*.30;
    for(const [i,{joint,len}] of arms[j].entries()){
      const k=i/13;
      const tipCurl=feeding?(.12+j*.15)*pull*smooth((k-.34)/.66):0;
      const angle=base+(curl+(feeding?.034:.19)*pulse)*Math.pow(k,.90)+tipCurl;
      const spread=sign*(open*(1-k)**2-grip*smooth((k-.22)/.78));
      joint.position.set(x,y,z);joint.rotation.order='ZXY';joint.rotation.set(0,spread,angle);
      if(feeding && i===10){
        held.x+=x*.5;held.y+=y*.5;held.z+=z*.5;
        contactSpan.x+=sign*x;contactSpan.y+=sign*y;contactSpan.z+=sign*z;
      }
      x-=len*Math.cos(angle)*Math.cos(spread);y-=len*Math.sin(angle)*Math.cos(spread);z+=len*Math.sin(spread);
    }
  }
  if(feeding){
    prey.position.copy(held).add(V(-.12,lerp(.115,.17,lift),0));
    const spread=Math.max(.12,contactSpan.z);
    prey.rotation.set(.12-.42*Math.atan2(contactSpan.y,spread),
      .36*Math.atan2(contactSpan.x,spread),.31+.46*lift+.065*pull);
  }
  switch(shot){
    case 0: {
      // Keep the middle of the trunk on the same screen point through the camera roll.
      const centerX=.67;
      const focus=actor.localToWorld(V(centerX,trunkLift(centerX),0));
      const offset=Math.max(width,height)/8;
      const screenX=.25+offset/width;
      const screenY=.75-offset/height;
      lens(V(5.72,3.43+.20*tracking.heave,-.78+.42*tracking.sway),
        focus,8.64/1.5,screenX,screenY,aspect<1?7.85:8.20/1.5,tracking.roll,screenX);break;
    }
    case 1: {
      const track=smooth(q);
      lens(V(lerp(-2.75,-1.6,track),lerp(-5.85,-5.4,track),lerp(1.55,.68,track)),
        V(advance-1.16,-.34,0),lerp(2.80,1.44,track),
        .52,lerp(.55,.64,track),lerp(1.65,1.40,track),lerp(.079,.031,track),.54);break;
    }
    case 2: {
      const u=smooth(q);
      lens(V(-5.85,.17,-3.05),V(-.98-.17*u,-.35+.18*lift,0),
        lerp(3.18,2.72,u),.51,.49,3.80-.38*u,0);break;
    }
    case 3: {
      const u=smooth(q);
      lens(V(lerp(-1.56,-.78,u),.36,-5.3),V(lerp(-.59,-1.31,u),-.38,0),
        lerp(2.94,2.05,u),lerp(.52,.43,u),.51,lerp(4.02,2.20,u),.025);break;
    }
    case closingSwim: {
      const focus=V(advance+.10,-.10,0);
      lens(V(lerp(-2.95,-1.65,q),2.75+.07*sway,6.45),focus,
        lerp(5.70,6.53,q),lerp(.725,.30,q),.373+.008*sway,5.70);
      break;
    }
  }
}

function photograph(shot,q,tracking){
  if(shot===1){
    const water=ctx.createRadialGradient(width*.33,height*.21,0,width*.39,height*.41,height*.92);
    water.addColorStop(0,'#3a9385');water.addColorStop(.55,'#2d8176');water.addColorStop(1,'#225c59');
    ctx.fillStyle=water;ctx.fillRect(0,0,width,height);
    return;
  }
  const image=backgrounds[shot];
  const scale=Math.max(width/image.width,height/image.height);
  const zoom=tracking?1.12+1.26*tracking.distance:shot===2?1.09:1.10+.12*q;
  const w=image.width*scale*zoom,h=image.height*scale*zoom;
  const ax=tracking?.56:shot===2?.5:.54-.22*q;
  const ay=tracking?.22:.76;
  ctx.save();
  if(tracking){
    ctx.translate(width/2,height/2);
    ctx.rotate(tracking.roll);
    ctx.translate(-width/2-width*.012*tracking.sway,-height/2+height*.015*tracking.heave);
  }
  ctx.drawImage(image,(width-w)*ax,(height-h)*ay,w,h);
  ctx.restore();
  if(shot>0){
    ctx.fillStyle='rgba(10,35,25,.13)';
    ctx.fillRect(0,0,width,height);
  }
}
function seabedShadow(shot,t){
  if(shot!==2)return;
  const x=width*.50,y=height*.831;
  ctx.save();ctx.translate(x,y);
  const radius=Math.min(width,height*1.6)*.153;
  ctx.scale(radius,height*(.032+.003*Math.sin(t*4)));
  const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'rgba(11,27,37,.43)');g.addColorStop(.49,'rgba(17,32,38,.24)');g.addColorStop(1,'rgba(17,32,38,0)');
  ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();
}
function take(index,t){
  const elapsed=t-cuts[index];
  const q=clamp(elapsed/(cuts[index+1]-cuts[index]),0,1);
  const tracking=index===0?rearTracking(elapsed,q):null;
  photograph(index,q,tracking);seabedShadow(index,t);pose(index,t,q,tracking);
  renderer.render(scene,camera);ctx.drawImage(stage,0,0);
}
const outgoing=document.createElement('canvas'), outgoingCtx=outgoing.getContext('2d');
window.setup=(w,h)=>{
  width=w;height=h;aspect=w/h;
  canvas.width=outgoing.width=w;canvas.height=outgoing.height=h;
  renderer.setSize(w,h,false);
};
const startTime=cuts[0];
window.oceanDuration=cuts[cuts.length-1]-startTime;
function drawCaption(seconds){
  const cue=timeline.captions.find(item=>seconds>=item.start && seconds<item.end);
  if(!cue)return;
  const x=width*cue.anchor[0], baseline=height*cue.anchor[1];
  ctx.save();
  ctx.globalAlpha=Math.min(1,(seconds-cue.start)/.08,(cue.end-seconds)/.10);
  ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.lineJoin='round';
  ctx.strokeStyle='rgba(10,28,23,.72)';ctx.shadowColor='rgba(4,23,19,.8)';
  ctx.shadowOffsetY=height*.003;ctx.shadowBlur=height*.007;
  for(const [i,line] of cue.lines.entries()){
    const size=Math.round(height*(i===0?.056:.070));
    const y=baseline+i*height*.089;
    ctx.font=(i===0?'600 ':'800 ')+size+'px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.lineWidth=size*.048;ctx.fillStyle=i===0?'#fff9e9':'#ffe398';
    ctx.strokeText(line,x,y);ctx.fillText(line,x,y);
  }
  ctx.restore();
}
window.oceanShot=(seconds,read=true,captions=true)=>{
  const t=startTime+T.MathUtils.euclideanModulo(seconds,window.oceanDuration);
  const index=cuts.findIndex((_,i)=>i<cuts.length-1 && t<cuts[i+1]);
  const age=t-cuts[index];
  if(index>0 && age<fades[index]){
    take(index-1,t);outgoingCtx.drawImage(canvas,0,0);take(index,t);
    ctx.globalAlpha=1-smooth(age/fades[index]);ctx.drawImage(outgoing,0,0);ctx.globalAlpha=1;
  }else take(index,t);
  if(captions)drawCaption(t-startTime);
  if(read)return canvas.toDataURL('image/jpeg',.94).split(',')[1];
};
window.shot=(t,clean=false,read=true)=>window.oceanShot(t,read,!clean);
function drawClosingSwimmer(elapsed,progress){
  pose(closingSwim,elapsed,progress,null);
  renderer.render(scene,camera);
  ctx.drawImage(stage,0,0,1152,648);
}
const archiveShot=await prepareArchive(ctx,drawClosingSwimmer);
window.filmDuration=filmDuration;
window.filmShot=(t,read=true)=>{
  if(t<archiveStart)return window.oceanShot(Math.min(t,archiveStart-1/24),read);
  archiveShot(t);
  if(read)return canvas.toDataURL('image/jpeg',.96).split(',')[1];
};
if(!new URLSearchParams(location.search).has('render')){
  window.setup(1280,720);
  const music=document.querySelector('#filmScore'),button=document.querySelector('#musicToggle');
  let silentStart=performance.now();
  function currentTime(now){
    return music.paused?((now-silentStart)/1000)%filmDuration:music.currentTime;
  }
  function updateButton(){
    const label=music.paused?'开启配乐':'关闭配乐';
    button.title=label;button.setAttribute('aria-label',label);
    button.setAttribute('aria-pressed',String(!music.paused));
  }
  function enableMusic(){
    music.currentTime=currentTime(performance.now());
    music.play().catch(updateButton);
  }
  music.addEventListener('play',updateButton);
  music.addEventListener('pause',()=>{
    silentStart=performance.now()-music.currentTime*1000;
    updateButton();
  });
  button.addEventListener('click',()=>{if(music.paused)enableMusic();else music.pause();});
  button.hidden=false;enableMusic();
  function play(now){window.filmShot(currentTime(now),false);requestAnimationFrame(play);}
  requestAnimationFrame(play);
}
window.ready=true;
