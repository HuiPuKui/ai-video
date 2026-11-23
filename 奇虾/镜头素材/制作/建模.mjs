// Run with Node and three@0.160.1. The first argument is the destination GLB.
import * as T from 'three';
import {mergeGeometries,mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {writeFile} from 'node:fs/promises';

const root=new T.Group(); root.name='Anomalocaris_canadensis';
const fixed=new T.Group(); fixed.name='Body_eyes_tail';root.add(fixed);
const V=(x,y,z)=>new T.Vector3(x,y,z), tau=Math.PI*2;
const shell=new T.MeshStandardMaterial({vertexColors:true,roughness:.64,side:T.DoubleSide});
shell.name='Ochre_cuticle'; const tracks=[];const duration=2.4;
const ochre=new T.Color('#b57649'),ivory=new T.Color('#dfc596'),teal=new T.Color('#395950');
const color=(a,b,t)=>a.clone().lerp(b,t);
function surface(group,nu,nv,point,shade){
  const xyz=[],rgb=[],idx=[];
  for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){
    const u=i/nu,v=j/nv,p=point(u,v),c=shade(u,v,p);
    xyz.push(...p.toArray());rgb.push(...c.toArray());
  }
  for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){
    const a=i*(nv+1)+j,b=a+nv+1;idx.push(a,a+1,b,b,a+1,b+1);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));g.setAttribute('color',new T.Float32BufferAttribute(rgb,3));g.setIndex(idx);g.computeVertexNormals();
  const m=new T.Mesh(g,shell);group.add(m);return m;
}
function solid(group,g,shade){
  const ca=[];for(let i=0;i<g.attributes.position.count;i++)ca.push(...shade.toArray());
  g.setAttribute('color',new T.Float32BufferAttribute(ca,3));const m=new T.Mesh(g,shell);group.add(m);return m;
}
function ell(group,p,scale,shade){
  const m=solid(group,new T.SphereGeometry(1,24,14),shade);m.scale.copy(scale);m.position.copy(p);return m;
}
function rod(group,a,b,r0,r1,shade){
  const v=b.clone().sub(a);const m=solid(group,new T.CylinderGeometry(r1,r0,v.length(),9),shade);
  m.position.copy(a).lerp(b,.5);m.quaternion.setFromUnitVectors(V(0,1,0),v.normalize());
}
function tube(group,points,r,shade){
  solid(group,new T.TubeGeometry(new T.CatmullRomCurve3(points),points.length*3,r,6),shade);
}
function animate(group,axis,amplitude,phase,offset=0){
  const times=[],rots=[];for(let k=0;k<=32;k++){
    const t=duration*k/32;times.push(t);rots.push(...new T.Quaternion().setFromAxisAngle(axis,offset+amplitude*Math.sin(t/duration*tau+phase)).toArray());
  }
  tracks.push(new T.QuaternionKeyframeTrack(group.name+'.quaternion',times,rots));
}
const profile=[[-1.55,0,0],[-1.53,.119,.088],[-1.49,.206,.144],[-1.37,.35,.24],[-1.10,.46,.26],[-.72,.49,.26],[-.3,.55,.29],[.22,.54,.28],[.75,.47,.24],[1.3,.35,.20],[1.8,.22,.15],[2.16,.115,.09],[2.26,0,0]];
function section(x){
  let i=1;while(i<profile.length-1&&x>profile[i][0])i++;
  const a=profile[i-1],b=profile[i],u=(x-a[0])/(b[0]-a[0]);return [a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u];
}
const noise=(p)=>.5+.5*Math.sin(p.x*69.4+p.y*23.5+Math.sin(p.z*31)*3.1);
surface(fixed,196,70,(u,v)=>{
  const x=-1.55+u*3.81,[w,h]=section(x),a=v*tau,crease=x>-.82?1-.073*Math.pow((1+Math.cos((x+.82)*tau/.217))/2,7):1;
  return V(x,.025*Math.cos(u*Math.PI)+h*Math.cos(a)*crease,w*Math.sin(a)*crease);
},(u,v,p)=>{
  const back=(1+Math.cos(tau*v))/2;let c=color(ivory,ochre,back*.87);
  const band=(p.x+.82)*tau/.217+.48*Math.sin(tau*v);
  if(p.x>-.82)c.lerp(teal,.68*Math.pow((1+Math.cos(band))/2,4));
  const mottling=Math.sin(52*p.x+6*Math.sin(p.z*17))*Math.cos(38*p.z+3*Math.sin(p.x*26));
  c.lerp(teal, .26*Math.max(0,mottling)*back);c.multiplyScalar(.83+.18*noise(p)+.085*back);return c;
});
// Small, rounded cephalic sclerites distinguish the head from the flexible trunk.
ell(fixed,V(-1.22,.218,0),V(.226,.049,.182),color(ochre,ivory,.10));
for(const side of [-1,1])ell(fixed,V(-1.25,.035,side*.298),V(.178,.087,.083),color(ochre,teal,.31));
// Front limbs and eyes project from the same head, on opposite sides.
for(const side of [-1,1]){
  const arm=new T.Group();arm.name='Frontal_appendage_'+(side>0?'R':'L');
  arm.position.set(-1.29,-.035,side*.235);root.add(arm);
  const path=new T.CatmullRomCurve3([V(0,0,0),V(-.29,.01,.14*side),V(-.72,-.02,.27*side),V(-1.09,-.20,.33*side),V(-1.33,-.48,.34*side),V(-1.36,-.69,.32*side)]);
  for(let k=0;k<14;k++){
    const a=path.getPointAt(k/14),b=path.getPointAt((k+1)/14),u=k/14;
    const r=.136*(1-u*.82),dir=b.clone().sub(a).normalize(),across=V(0,0,side),up=dir.clone().cross(across).normalize();
    // Flexible intersegment membranes fill the core right through the terminal segment.
    rod(arm,a.clone().addScaledVector(dir,-.008),b.clone().addScaledVector(dir,.006),r*.78,r*.72,color(ochre,teal,.37));
    surface(arm,12,24,(h,v)=>{
      const center=a.clone().lerp(b,h),angle=v*tau,shoulder=.84+.19*Math.sin(h*Math.PI*.91);
      return center.addScaledVector(across,Math.cos(angle)*r*.84*shoulder).addScaledVector(up,Math.sin(angle)*r*shoulder);
    },(h,v,p)=>color(ochre,ivory,.13+.20*u+.09*Math.sin(v*tau)).lerp(teal,.69*Math.exp(-h*13)+.16*Math.pow(Math.cos(v*tau),2)).multiplyScalar(.85+.15*noise(p)));
    if(k<2)continue;
    const base=a.clone().lerp(b,.52),len=(k%2?.17:.29)*(1-u*.55);
    for(const t of [-1,1]){
      const tip=base.clone().add(V(-.03+u*.10,-len+t*.014,.068*t));
      rod(arm,base,tip,.031*(1-u*.45),.003,ivory);
      const mid=base.clone().lerp(tip,.67);rod(arm,mid,mid.clone().add(V(.068,-.064,0)),.011,.001,ochre);
    }
  }
  animate(arm,V(0,0,1),.041,side*.3);
  const tip=V(-1.25,.14,side*.62);
  rod(fixed,V(-1.11,.09,side*.3),tip,.08,.057,ochre);
  ell(fixed,tip,V(.15,.095,.12),new T.Color('#182e31'));
  for(let i=1;i<9;i++)for(let j=0;j<16;j++){
    const a=i*Math.PI/10,b=(j+i%2*.5)*tau/16;
    const p=tip.clone().add(V(.148*Math.sin(a)*Math.cos(b),.093*Math.cos(a),.119*Math.sin(a)*Math.sin(b)));
    const facet=solid(fixed,new T.IcosahedronGeometry(1,0),new T.Color(i<5?'#3b5553':'#273a39'));facet.scale.set(.008,.004,.008);facet.position.copy(p);
  }
}
function blade(group,side,len,chord,sweep,rise,shade,veins=true){
  function coords(u,v){
    const half=chord*(.16*(1-u)+.84*Math.pow(Math.max(0,Math.sin(Math.PI*Math.pow(u,.82))),.72))+.002;
    const a=v*tau;return V(sweep*u*u+half*Math.cos(a),rise*u+.055*Math.sin(u*Math.PI)+half*.13*Math.sin(a),side*len*u);
  }
  surface(group,30,28,coords,(u,v,p)=>{
    const fold=.5+.5*Math.cos(14*u+3*Math.cos(v*tau));return color(shade,ivory,.26*fold+.16*u).multiplyScalar(.82+.15*noise(p));
  });
  if(veins)for(const pos of [.12,.27,.40]){const pts=[];for(let i=0;i<12;i++)pts.push(coords(.04+i*.078,pos));tube(group,pts,.0035,color(shade,teal,.47));}
}
for(const side of [-1,1]){
  for(let i=0;i<16;i++){
    const x=-1.04+i*.196,[w]=section(x),t=Math.max(0,(i-3)/12);
    const len=i<3?.22+.08*i:.82*Math.pow(1-t,.64)+.12;
    const group=new T.Group();group.name='Swimming_flap_'+(side>0?'R':'L')+'_'+String(i+1).padStart(2,'0');group.position.set(x,-.033,side*w*.8);root.add(group);
    blade(group,side,len,Math.min(.26,.14+len*.12),len*.62,-len*.21,color(teal,ochre,.32+.30*t));
    animate(group,V(1,0,0),side*.55,-i*.49,.03*side);
  }
  for(let i=0;i<3;i++){const g=new T.Group();g.position.set(1.72+.19*i,.02,side*(.11-i*.024));fixed.add(g);
    blade(g,side,.63-i*.12,.13,.82-i*.09,.34+i*.06,color(ochre,teal,.52));}
}
// A small ventral oral cone remains visible in underside views.
const oral=ell(fixed,V(-1.14,-.202,0),V(.18,.04,.16),new T.Color('#53483d'));
for(let j=0;j<23;j++){const a=j*tau/23;rod(fixed,V(-1.14+.15*Math.cos(a),-.225,.13*Math.sin(a)),V(-1.14+.078*Math.cos(a),-.246,.067*Math.sin(a)),j%8===0?.034:.018,.003,ivory);}
// Fuse detail within each moving rigid part so the viewer stays inexpensive.
function bake(group){
  group.updateWorldMatrix(true,true);const inverse=group.matrixWorld.clone().invert(),gs=[];
  group.traverse(o=>{if(!o.isMesh)return;const base=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
    base.deleteAttribute('uv');base.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld));gs.push(base);});
  group.clear();group.add(new T.Mesh(mergeVertices(mergeGeometries(gs)),shell));
}
for(const o of root.children)bake(o);
root.userData={species:'Anomalocaris canadensis',interpretation:'Artistic geometry, coloration and motion. Not a 3D fossil scan.'};
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.()});}};
const scene=new T.Scene();scene.add(root);
const clip=new T.AnimationClip('Traveling_flap_wave',duration,tracks);
const glb=await new GLTFExporter().parseAsync(scene,{binary:true,animations:[clip]});
await writeFile(process.argv[2],Buffer.from(glb));
