const study=litScene('#c7e0df','#bfd7d1'), room=group(study.s);
const wood=painted(1024,512,(c,w,h)=>{
 c.fillStyle='#b57a50';c.fillRect(0,0,w,h);
 for(let i=0;i<1300;i++){const y=rng()*h,seed=rng()*9;c.beginPath();c.moveTo(0,y);
   for(let x=0;x<=w;x+=18)c.lineTo(x,y+1.6*Math.sin(x/92+seed)+1.1*Math.sin(x/27+seed));
   c.lineWidth=.3+rng()*1.6;c.strokeStyle=rng()>.5?'rgba(91,46,31,.13)':'rgba(255,220,159,.18)';c.stroke();}
});
wood.wrapS=wood.wrapT=T.RepeatWrapping;wood.repeat.set(2,1.8);
box(room,0,-.28,.35,15,.48,9,'#9b6045');floorGraphic(room,0,-.031,.35,15,9,wood);
for(let z=-3.45;z<4.5;z+=1.22)box(room,0,-.023,z,15,.012,.014,'#ac7850');
for(const x of [-6.7,6.7])for(const z of [-3,3.6])box(room,x,-2.25,z,.47,4.15,.46,'#8c5944');
box(room,0,1.05,-3.9,28,2.32,.5,'#9bb6aa');
box(room,0,2.31,-3.76,28,.16,.67,'#e2c6a0');
for(let i=-7;i<8;i++){const x=i*3.3;box(room,x,5.0,-3.81,.13,5.4,.23,'#6c8e87');box(room,x+.10,5,-3.80,.032,5.4,.28,'#f4d7a6')}
box(room,0,6.5,-3.82,40,.14,.28,'#71938d');
const outdoors=group(room);
for(let i=0;i<70;i++){
 let x=rng()*76-38,z=-9-rng()*29,h=1+rng()*5;
 box(outdoors,x,h/2-1,z,2.1+rng()*2.5,h,2.5,'#dec7ac');
 const roof=mesh(outdoors,new T.ConeGeometry(2.9,1.35,4),'#ac8271',x,h-.34,z);roof.rotation.y=.77;
 for(let j=0;j<2;j++)box(outdoors,x+j-.6,h-1.9,z+1.26,.48,.8,.03,'#82a09f');
}
for(let i=0;i<130;i++){
 const x=rng()*62-31,z=-6.7-rng()*25;
 ball(outdoors,x,1.5+rng()*3.3,z,1+rng()*2.5,1.4+rng()*2,1+rng()*2,['#8fb98d','#86aa86','#b3bf8f','#7fa397','#a6bb88'][i%5],true);
}
const curtains=[];
for(const x of [-5.2,4.45]){
 const g=group(study.s,x,7.3,-3.35);g.userData.moving=true;
 const geo=new T.PlaneGeometry(2.0,4.55,22,16);
 const o=mesh(g,geo,'#f4e2b7',0,-2.27,0);o.castShadow=false;
 curtains.push({geo,orig:geo.attributes.position.array.slice(),side:Math.sign(x)});
}
const leafTex=painted(256,256,(c,w,h)=>{c.fillStyle='#679575';c.fillRect(0,0,w,h);c.strokeStyle='#adc198';c.lineWidth=6;c.beginPath();c.moveTo(8,245);c.lineTo(244,8);c.stroke()});
function plant(x,z,sc){
 const g=group(room,x,0,z);g.scale.setScalar(sc);
 taper(g,0,.48,0,.59,.39,.94,'#c16a50');taper(g,0,.94,0,.64,.61,.16,'#df8c67');taper(g,0,1.035,0,.52,.50,.05,'#665b48');
 for(let j=0;j<11;j++){
  const a=j*2.39,h=1.45+rng()*.68, reach=.58+rng()*.63,ex=Math.cos(a)*reach,ez=Math.sin(a)*reach;
  rod(g,[0,1,0],[ex*.78,h,ez*.78],.018,'#64886b');
  const tip=[ex*1.5,h+.23,ez*1.5],base=[ex*.49,h-.18,ez*.49],mid=[ex,h+.22,ez],w=.23;
  face(g,[base,[ex+Math.sin(a)*w,h,ez-Math.cos(a)*w],mid,tip],'#55876c');
  face(g,[base,mid,tip,[ex-Math.sin(a)*w,h,ez+Math.cos(a)*w]],'#729775');
 }
}
plant(3.8,-2.15,.88);
const fan=group(room,-2.03,0,-.29),fanHead=group(fan,0,2.27,0);fanHead.userData.moving=true;
ball(fan,0,.13,0,.86,.15,.72,'#397e78');ball(fan,0,.20,0,.79,.105,.66,'#72a798');
for(let j=0;j<4;j++)box(fan,-.31+j*.20,.29,.31,.115,.05,.17,j===1?'#ce7158':'#eddcbb');
taper(fan,0,.82,-.12,.14,.21,1.28,'#7da39a');rod(fan,[-.45,1.3,-.07],[-.47,2.34,-.07],.055,'#458479');
rod(fan,[.45,1.30,-.07],[.47,2.34,-.07],.055,'#458479');ball(fanHead,0,0,-.24,.47,.47,.55,'#4a9084');
const rotor=group(fanHead,0,0,.10);rotor.userData.moving=true;
for(let j=0;j<4;j++){
 const shp=new T.Shape();shp.moveTo(.09,-.07);shp.bezierCurveTo(.39,-.25,.96,-.24,1.04,.04);shp.bezierCurveTo(1.10,.28,.81,.68,.58,.72);shp.bezierCurveTo(.30,.73,.48,.28,.09,.08);
 const blade=mesh(rotor,new T.ExtrudeGeometry(shp,{depth:.032,bevelEnabled:false,curveSegments:10}),'#74a99b',0,0,0);blade.rotation.z=j*TAU/4;
}
for(let j=0;j<32;j++){
 const a=j*TAU/32,rad=k=>[Math.cos(a)*k,Math.sin(a)*k];
 wire(fanHead,[[...rad(.18),.55],[...rad(.65),.47],[...rad(1.07),.26],[...rad(1.15),.04],[...rad(1.14),-.16]],.012,'#d2cead',12);
}
for(const [r,z] of [[1.15,.04],[1.14,-.16],[.82,.406],[.52,.505],[.22,.555]]){
 mesh(fanHead,new T.TorusGeometry(r,r>1?.031:.015,6,72),'#d6ccb0',0,0,z);
}
ball(fanHead,0,0,.57,.22,.22,.067,'#aebba6');ball(fanHead,0,0,.625,.125,.125,.023,'#c99962');bake(fanHead);
const calendar=group(room,1.02,0,-.87);calendar.rotation.y=-.08;
const board=group(calendar,0,.15,.24);board.rotation.x=-.23;
box(board,0,1,0,2.20,2.09,.16,'#995746');box(board,0,1.006,.086,2.13,1.94,.036,'#f2e8cc');
const calTextures={};
function calTex(m){
 if(calTextures[m])return calTextures[m];
 return calTextures[m]=painted(520,480,(c,w,h)=>{
   c.fillStyle='#fff4d5';c.fillRect(0,0,w,h);c.fillStyle='#ce654b';c.fillRect(0,0,w,61);
   words(c,'2026',29,44,31,'#fff2d0',650);words(c,'日  历',w-28,44,29,'#fff2d0',680,'right');
   words(c,String(m).padStart(2,'0'),w*.5,311,224,'#b14c39',750,'center','Georgia,serif');
   c.fillStyle='#b99372';c.fillRect(37,339,w-74,2);words(c,m+' 月',w*.5,409,47,'#435f59',700,'center');
 });
}
const pageBase=graphic(board,0,1.02,.117,2.01,1.86,calTex(7));pageBase.userData.moving=true;
const flip=group(board,0,1.95,.139);flip.userData.moving=true;
const flap=graphic(flip,0,-.93,0,2.01,1.86,calTex(7));
for(let j=0;j<8;j++)mesh(board,new T.TorusGeometry(.090,.023,6,16),'#675e50',-.83+j*.238,1.99,.05).rotation.y=Math.PI/2;
face(calendar,[[-1.05,0,-.72],[-1.05,1.99,-.20],[-1.05,0,.20]],'#995b45');
const note=painted(650,470,(c,w,h)=>{c.fillStyle='#d6e3c8';c.fillRect(0,0,w,h);c.fillStyle='#72918b';c.fillRect(27,0,9,h);for(let i=0;i<10;i++){c.strokeStyle='#acc6b3';c.beginPath();c.moveTo(0,55+i*42);c.lineTo(w,55+i*42);c.stroke()}
 words(c,'暑 假 作 业',w*.54,194,60,'#355e59',760,'center');words(c,'四 年 级',w*.54,268,32,'#4f7770',620,'center');});
function book(x,y,z,w,d,h,angle,col,texture){
 const b=group(room,x,y,z);b.rotation.y=angle;box(b,0,h/2,0,w,h,d,'#dfcda7');box(b,0,.025,0,w+.07,.05,d+.07,col);box(b,0,h+.018,0,w+.07,.046,d+.07,col);
 if(texture)floorGraphic(b,0,h+.047,0,w+.038,d+.035,texture);
 for(let i=1;i<5;i++)box(b,0,h*i/6,d/2+.006,w*.96,.009,.006,'#bcac8c');return b;
}
book(.56,.005,1.20,2.46,1.82,.12,-.15,'#98b398',note);
book(3.00,.02,-.24,1.48,2.0,.23,.05,'#c76348');
book(3.03,.31,-.28,1.43,1.93,.20,-.05,'#e7c16c');
const homeBoat=origami(study.s,.28,.26,1.48,.51);homeBoat.rotation.y=-1.1;
const pencils=group(room,1.62,0,1.75);pencils.rotation.y=.31;
for(let j=0;j<2;j++){rod(pencils,[-.05,.056,j*.13],[1.15,.056,j*.13],.048,j?'#5e8d89':'#d88b43',6);rod(pencils,[1.13,.056,j*.13],[1.26,.056,j*.13],.029,'#d1ad7a',6);}
const plate=group(room,-2.29,.02,1.63);
taper(plate,0,.045,0,.93,.76,.10,'#d4ddc6',48);mesh(plate,new T.TorusGeometry(.84,.03,6,48),'#658e87',0,.10,0).rotation.x=Math.PI/2;
const melon=group(plate,0,.12,0);melon.rotation.y=.13;
function wedge(r,z,col){const a=[],steps=28;for(let i=0;i<=steps;i++){const th=Math.PI*i/steps;a.push([Math.cos(th)*r,Math.sin(th)*r*.85,z])}
 face(melon,[[0,.01,z],...a],col);}
wedge(.79,.28,'#4e8463');wedge(.73,.291,'#d8d49e');wedge(.665,.301,'#e16f58');wedge(.79,-.24,'#488265');
for(let i=0;i<26;i++){const a=i*Math.PI/26,b=(i+1)*Math.PI/26;face(melon,[[.79*Math.cos(a),.672*Math.sin(a),-.24],[.79*Math.cos(b),.672*Math.sin(b),-.24],[.79*Math.cos(b),.672*Math.sin(b),.28],[.79*Math.cos(a),.672*Math.sin(a),.28]],i%5===0?'#739369':'#528261');}
for(let j=0;j<9;j++){const a=.35+(j%5)*.59,r=j<5?.48:.30;ball(melon,Math.cos(a)*r,Math.sin(a)*r*.82,.311,.022,.045,.011,'#694f40')}
const mug=group(room,2.76,.02,1.27);
taper(mug,0,.34,0,.36,.30,.66,'#e4d5b2');taper(mug,0,.68,0,.36,.36,.022,'#3f6f6c');taper(mug,0,.689,0,.318,.318,.024,'#a0734f');
mesh(mug,new T.TorusGeometry(.224,.052,8,28),'#c5b998',.367,.40,0);
const flecks=[];for(let i=0;i<22;i++){const sparkle=ball(study.s,0,0,0,.012,.012,.012,'#ffe0a4',true);sparkle.castShadow=false;flecks.push(sparkle)}
bake(room);
function deskTime(t,last=false){
 rotor.rotation.z=-t*13.4;fanHead.rotation.y=.12+.25*Math.sin(t*.72);
 for(const p of curtains){const a=p.geo.attributes.position.array;for(let i=0;i<a.length;i+=3){
   const x=p.orig[i],y=p.orig[i+1],lo=(2.27-y)/4.54;
   a[i]=x+.16*lo*Math.sin(t*1.7+x*2+p.side);a[i+1]=y+.10*lo*Math.cos(x*3.5+t);
   a[i+2]=.15*Math.sin(x*9+.55*Math.sin(t))+.34*lo*lo*Math.sin(t*1.55+x*1.4);}
   p.geo.attributes.position.needsUpdate=true;
 }
 const progress=clamp((t-1.9)/2.55)*4,step=Math.min(3,Math.floor(progress)),f=progress-step;
 const flipping=!last&&progress>0&&progress<4;
 pageBase.material.map=calTex(last||progress>=4?11:flipping?8+step:7);
 flip.visible=flipping;flap.material.map=calTex(7+step);flip.rotation.x=-Math.PI*ease(f);
 for(let i=0;i<flecks.length;i++)flecks[i].position.set(-4+mod(i*2.31+t*.09,8),.32+mod(i*.67+t*.10,3.3),-2+mod(i*1.51+t*.08,5));
 homeBoat.rotation.y=-1.10+.015*Math.sin(t*1.9);
}
