/* All dimensions are in the same world units. Boxes are batched per moving group. */
const looks = [
  {name:"晨光大道", sky:"#a7d5dd", horizon:"#ffe5ba", sea:"#67a7af", land:"#b7b883", leaf:"#7f9c62", light:"#fff0cb", angle:3, sun:.72},
  {name:"黄昏商街", sky:"#ae8399", horizon:"#ffd3a0", sea:"#a07e89", land:"#c29170", leaf:"#9c8659", light:"#ffcf9a", angle:-3, sun:.30},
  {name:"林荫街道", sky:"#8fc9ce", horizon:"#f8edc2", sea:"#6bacaa", land:"#a8be75", leaf:"#759f5e", light:"#fff6c9", angle:4, sun:.28},
  {name:"高架桥下", sky:"#798b9c", horizon:"#dbd5bc", sea:"#78999d", land:"#969f93", leaf:"#748a78", light:"#f2e5c1", angle:-2, sun:.71},
  {name:"午夜霓虹", sky:"#222d53", horizon:"#8d88a2", sea:"#586787", land:"#747e84", leaf:"#586a70", light:"#dce2ff", angle:2, sun:.70}
];
const canvas=document.querySelector("canvas"), nav=document.querySelector("nav");
const renderer=new THREE.WebGLRenderer({canvas,antialias:false});
renderer.setSize(768,432,false);
const cube=new THREE.BoxGeometry(), material=new THREE.MeshLambertMaterial();
const dummy=new THREE.Object3D(), color=new THREE.Color();
let scene,camera,actors,sunlight,start,active;
function batch(parent) {
  const items=[];
  return {
    box(x,y,z,w,h,d,c){items.push([x,y,z,w,h,d,c])},
    finish(){
      const mesh=new THREE.InstancedMesh(cube,material,items.length);
      items.forEach(([x,y,z,w,h,d,c],i)=>{
        dummy.position.set(x,y,z); dummy.scale.set(w,h,d); dummy.updateMatrix();
        mesh.setMatrixAt(i,dummy.matrix); mesh.setColorAt(i,color.set(c));
      });
      parent.add(mesh);
    }
  };
}
function character(pink){
  const g=new THREE.Group(), b=batch(g), body=pink?"#edaaa9":"#ce8e8d", tip=pink?"#f5b9b6":"#db9c98";
  b.box(0,.87,0,1.82,1.05,.92,body);
  for(const side of [-1,1]){
    b.box(side*.96,.86,0,.16,.24,.35,tip);
    b.box(side*.44,.99,.475,.14,.25,.06,"#281f28");
  }
  g.userData.feet=[-.78,-.52,.52,.78].map(x=>{
    const foot=new THREE.Group(), leg=batch(foot);
    leg.box(0,-.15,0,.15,.3,.32,tip);leg.finish();
    foot.position.set(x,.35,.15);g.add(foot);return foot;
  });
  if(pink){
    b.box(.63,1.39,.42,.51,.12,.15,"#ad496d");
    b.box(.63,1.46,.43,.46,.10,.16,"#ff719b");
    b.box(.46,1.5,.45,.09,.09,.13,"#ffe3d0");
  }
  b.finish();scene.add(g);return g;
}
function background(p,i,rand){
  const sky=document.createElement("canvas");sky.width=384;sky.height=216;
  const ctx=sky.getContext("2d"), wash=ctx.createLinearGradient(0,0,0,140);
  wash.addColorStop(0,p.sky);wash.addColorStop(1,p.horizon);ctx.fillStyle=wash;ctx.fillRect(0,0,384,216);
  if(i===4){ctx.fillStyle="#e6dbcf";for(let k=0;k<70;k++)ctx.fillRect(rand()*384,rand()*69,1,1)}
  const r=i===1?16:10;ctx.fillStyle=i===4?"#faf0cf":"#ffedbb";
  for(let y=-r;y<=r;y++){const w=Math.floor(Math.sqrt(r*r-y*y));ctx.fillRect(384*p.sun-w,41+y,2*w,1)}
  ctx.globalAlpha=i===4?.24:.5;ctx.fillStyle=p.horizon;
  for(let k=0;k<13;k++){const x=rand()*384,y=8+rand()*55,w=8+rand()*39;
    ctx.fillRect(x,y,w,2);ctx.fillRect(x+4,y-2,w*.58,2)}
  const texture=new THREE.CanvasTexture(sky);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;scene.background=texture;
}
function build(i){
  if(scene){scene.background.dispose();scene.traverse(o=>{if(o.isInstancedMesh)o.dispose()})}
  active=i;const p=looks[i];let seed=872+i;
  const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  scene=new THREE.Scene();background(p,i,rand);
  scene.fog=new THREE.Fog(p.horizon,32,78);
  camera=new THREE.PerspectiveCamera(27,16/9,.1,140);
  camera.position.set(p.angle,3.5,13);camera.lookAt(0,1.52,0);
  scene.add(new THREE.HemisphereLight(i===4?0xdde5ff:0xfff4df,0xb6b4aa,1.55));
  sunlight=new THREE.DirectionalLight(p.light,2);sunlight.position.set(-5,8,4);scene.add(sunlight);
  const b=batch(scene), box=b.box;
  const night=i===4;
  const fronts=night?["#4e5270","#544d68","#455469"]:["#d8b898","#cb9785","#bcc9c3","#decdaa"];
  const glass=night?"#eeb782":"#819c9d", iron=night?"#424358":"#505d61";
  box(0,-.21,-29,40,.4,115,night?"#434356":"#787c7b");
  for(let z=-80;z<20;z+=5)box(0,.007,z,.12,.025,2.3,"#eaca86");
  for(const z of [1,-22])for(let x=-5.4;x<=5.5;x+=1.06)
    box(x,.025,z,.56,.04,2.35,night?"#aca9af":"#e2dcc7");
  for(const side of [-1,1]){
    box(side*8,.04,-31,4,.22,105,night?"#777488":"#c2b9a8");
    for(let k=0;k<13;k++){
      const z=9-k*6.7, x=side*13, height=6+Math.floor(rand()*7)*1.6;
      const facade=fronts[k%4], accent=night?["#fb8a95","#83e4dd","#eeaf69"][k%3]:["#b16d5e","#658c85","#d9aa66"][k%3];
      box(x,height/2,z,7,height,6.4,facade);
      box(x,height,z,7.2,.24,6.55,iron);
      box(side*9.46,1.3,z,.14,2.24,5.4,glass);
      for(const dz of [-2.45,-.8,.8,2.45])box(side*9.34,1.3,z+dz,.18,2.34,.10,iron);
      for(let n=0;n<9;n++)box(side*9.12,2.67,z+(n-4)*.64,.85,.28,.64,n%2?accent:"#ebe0cb");
      for(let y=4;y<height-.5;y+=1.8){
        for(const dz of [-2,-.65,.65,2]){
          box(side*9.46,y,z+dz,.16,.92,.76,night&&rand()<.5?iron:glass);
          box(side*9.33,y-.51,z+dz,.24,.10,.96,facade);
        }
      }
      if(k%2===0){
        const pole=side*6.24;
        box(pole,2.05,z,.14,4,.14,iron);box(pole-side*.54,4.02,z,1.18,.15,.20,iron);
        box(pole-side*1.05,3.89,z,.47,.13,.35,"#ffdf98");
      }
      if(i===2 || (i===0 && k%3===0)){
        box(side*7.25,1.33,z,.35,2.4,.4,"#856e58");
        for(const [dz,y,w] of [[0,3.3,2],[-.64,2.8,1.25],[.62,3.12,1.4]])
          box(side*7.25,y,z+dz,w,1.25,w,"#86a977");
      }
      if(night||i===1){
        box(side*9.12,4.3,z+2.7,.82,1.9,.35,accent);
        for(let n=0;n<3;n++)box(side*9.12,3.84+n*.39,z+2.91,.45,.10,.07,"#fff0bb");
      }
    }
  }
  // A signal at the near crossing anchors the scale of the street.
  box(-6.12,2.2,-1,.18,4.4,.18,iron);
  box(-6.12,4.05,-1,.66,1.55,.48,iron);
  ["#a8746b","#a49567","#a4e3b1"].forEach((c,k)=>box(-6.12,4.54-k*.47,-.737,.31,.29,.08,c));
  if(i===3){
    for(let z=-8;z>-70;z-=10){
      box(0,6.8,z,14.8,.85,4.2,"#969e9f");
      for(const side of [-1,1])box(side*6.72,3.4,z,.72,6.8,1.25,"#879395");
    }
  }
  b.finish();actors=[character(false),character(true)];
  actors.forEach(actor=>{
    const shadow=new THREE.Group(), shapes=batch(shadow);
    shapes.box(0,0,0,1.62,.012,.72,night?"#353543":"#696c69");
    shapes.finish();scene.add(shadow);actor.userData.shadow=shadow;
  });
  document.querySelector("#name").textContent=p.name;
  [...nav.children].forEach((btn,k)=>btn.setAttribute("aria-pressed",k===i));
  start=performance.now();
}
looks.forEach((p,i)=>{
  const btn=document.createElement("button");btn.innerHTML='<span>0'+(i+1)+'</span>'+p.name;
  btn.onclick=()=>build(i);nav.append(btn);
});
build(0);
function frame(now){
  const t=((now-start)/1000)%3.5, progress=t/3.5;
  actors.forEach((actor,k)=>{
    const step=t*7+k*1.6;
    actor.position.set((k?1.1:-1.28)+t*.13,.04+.045*Math.abs(Math.sin(step)),(k?-.9:.2)+t*.93);
    actor.rotation.y=.14;actor.rotation.z=.023*Math.sin(step);
    actor.userData.feet.forEach((foot,n)=>foot.rotation.x=.68*Math.sin(step+(n%2)*Math.PI));
    actor.userData.shadow.position.set(actor.position.x+.08,.057,actor.position.z);
  });
  const angle=[2.7,-3.3,3.6,-2.1,1.6][active];
  camera.position.set(angle,2.25+progress*.98,10+progress*5.5);
  camera.lookAt(0,1.56+progress*.74,1);
  renderer.render(scene,camera);requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
