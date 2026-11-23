const opts=new URLSearchParams(location.search),vertical=opts.has('v'),cover=opts.has('cover');
const W=vertical?1080:(cover&&opts.get('cover')!=='wide'?1440:1920),H=vertical?(cover?1440:1920):1080;
const canvas=document.getElementById('film');canvas.width=W;canvas.height=H;
const c=canvas.getContext('2d',{alpha:false});
const renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setSize(W,H,false);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
renderer.outputColorSpace=T.SRGBColorSpace;
const cam=new T.PerspectiveCamera(43,W/H,.07,190);
const END=49.0,WARM='#fff4da',YELLOW='#ffdc78',INK='#263d3c',VERM='#df7157';
function pose(eye,look,fov,aspect=W/H,roll=0){
 cam.fov=fov;cam.aspect=aspect;cam.updateProjectionMatrix();cam.position.set(...eye);cam.up.set(0,1,0);cam.lookAt(...look);cam.rotateZ(roll);cam.updateMatrixWorld();
}
const withShadows=new Set();
function scene(s){
 if(!withShadows.has(s)){renderer.shadowMap.needsUpdate=true;withShadows.add(s)}
 renderer.render(s,cam);
}
function boatView(canal,u,aspect=W/H){
 const {x,z}=canal.update(u);
 const small=aspect<.83,dist=small?4.20:3.85,side=small?1.30:2.03;
 pose([x+side+.10*Math.sin(u*3),small?2.06:1.95,z+dist],[x-.10,small?.70:.55,z-(small?2.62:2.33)],small?57:56,aspect,-.011*Math.sin(u*TAU));
 scene(canal.s);
}
function asPhoto(canal,t){
 renderer.setSize(600,440,false);boatView(canal,t,600/440);
 const can=document.createElement('canvas');can.width=600;can.height=440;can.getContext('2d').drawImage(renderer.domElement,0,0);return can;
}
const photos=[asPhoto(canalA,.39),asPhoto(canalB,.063),asPhoto(canalB,.623),asPhoto(canalB,.958)];
renderer.setSize(W,H,false);
const archive=litScene('#c6b491','#d6c5a1'),table=group(archive.s);
box(table,0,-.21,0,19,.38,17,'#b4815c');floorGraphic(table,0,-.009,0,19,17,wood);
// A bound album: linen texture, covers, spine, page edges and individual photographs.
const albumTex=painted(800,600,(p,w,h)=>{
 p.fillStyle='#f1dfb8';p.fillRect(0,0,w,h);const r=random(99);
 for(let i=0;i<17500;i++){p.fillStyle=r()>.5?'rgba(117,92,64,.09)':'rgba(255,251,214,.21)';p.fillRect(r()*w,r()*h,1.4,1.4);}
 for(let i=0;i<6;i++){p.fillStyle='rgba(122,95,63,'+(.12-i*.016)+')';p.fillRect(i*3,0,3,h)}
});
const album=group(table,0,.04,0);album.rotation.y=.045;
box(album,0,.07,0,8.9,.14,5.96,'#5e8072');box(album,0,.145,0,8.68,.10,5.78,'#cabb97');
for(let j=0;j<5;j++)box(album,0,.20+j*.016,0,8.70-j*.014,.012,5.79-j*.018,j%2?'#d8c9a3':'#f0ddad');
for(const dir of [-1,1]){floorGraphic(album,dir*2.16,.302,0,4.31,5.70,albumTex);}
box(album,0,.312,0,.052,.024,5.72,'#ac9775');box(album,1.77,.29,2.99,.23,.035,.74,'#c05d4d');
for(const [x,y,z,w,d,h,angle,col] of [[-5.15,.23,-2.8,1.7,2.2,.4,-.18,'#bb6754'],[-5.15,.66,-2.74,1.7,2.15,.32,-.10,'#b8bd92']]){
 const o=box(table,x,y,z,w,h,d,col);o.rotation.y=angle;
}
const photoInk=['岸边','风筝','桥洞','荷花'];
const mounts=photos.map((image,index)=>{
 const p=group(archive.s);
 const tex=painted(640,540,(g,w,h)=>{
  g.fillStyle='#fff0d1';g.fillRect(0,0,w,h);g.drawImage(image,20,18,600,440);
  words(g,photoInk[index],33,510,37,'#46574e',620);g.fillStyle=index?'#bc6d56':'#7b9a86';g.fillRect(529,486,72,6);
 });
 const o=floorGraphic(p,0,0,0,2.53,2.14,tex);o.castShadow=true;
 return p;
});
const albumPencil=group(table,4.66,.12,1.64);albumPencil.rotation.y=.38;
rod(albumPencil,[0,0,0],[0,0,2.15],.063,'#cda247',6);rod(albumPencil,[0,0,2.1],[0,0,2.33],.032,'#b09a76',6);
bake(table);
function photosAt(t){
 const layout=[[-2.47,-.18,-.11],[.95,-1.13,.11],[2.81,-.21,-.05],[1.04,1.22,-.14]];
 for(let i=0;i<4;i++){
  const u=ease((t-(i===0?0:1.60+.61*(i-1)))/.66),[x,z,r]=layout[i];
  const p=mounts[i];p.visible=u>0;p.position.set(x+(1-u)*1.55,.35+i*.028+(1-u)*2.35,z-(1-u)*1.5);
  p.rotation.set((1-u)*-.46,r+(1-u)*.34,(1-u)*.17);
 }
}
function deskPose(t,shot){
 deskTime(t,shot==='end');const v=vertical;
 if(shot==='open'||shot==='cover'){
   const u=clamp(t/4.75),d=shot==='cover'?0:u;
   pose([v?-.97-.35*d:-2.48+.54*d,v?3.30:3.10,v?6.63:6.37-d*.42],[v?-.30:-.18,1.06,-.13],v?54:43,W/H,.014);
 }else if(shot==='boat'){
   const f=ease(clamp((t-4.75)/3.25));
   pose([mix(v?-1.36:-1.92,-.35,f),mix(3.16,1.64,f),mix(v?6.76:6.09,v?3.83:3.53,f)],
     [mix(-.20,.22,f),mix(1.05,.54,f),mix(-.08,1.28,f)],v?52:43);
 }else{
   const f=clamp((t-40)/9);
   pose([mix(.82,-1.63,f),mix(v?2.72:2.35,3.39,f),mix(v?4.15:3.71,v?6.69:6.9,f)],
    [mix(.22,-.13,f),mix(.66,1.19,f),mix(1.08,-.18,f)],v?53:43);
 }
 scene(study.s);
}
function gradient(top,bottom,from,to){
 const g=c.createLinearGradient(0,top,0,bottom);g.addColorStop(0,from);g.addColorStop(1,to);c.fillStyle=g;c.fillRect(0,top,W,bottom-top);
}
function type(str,x,y,size,fill,weight=750,align='left',family){
 words(c,str,x,y,size,fill,weight,align,family);
}
function folio(){
 gradient(0,vertical?230:140,'rgba(14,37,37,.54)','rgba(14,37,37,0)');
 const x=vertical?70:87,y=vertical?109:73;
 c.fillStyle=YELLOW;c.fillRect(x,y-23,7,26);type('vibe 知识大赏',x+20,y,vertical?32:29,WARM,700);
}
function caption(t,start,top,bottom,accent=true,opening=false){
 const x=vertical?66:82, y=H*(vertical?.775:.877), max=W-(vertical?142:160);
 const a=opening?(vertical?75:71):(vertical?54:49), b=opening?(vertical?88:91):(vertical?64:69);
 gradient(H*(vertical?.52:.46),H,'rgba(12,34,35,0)','rgba(13,31,32,.84)');
 function line(s,size,base,col,delta){
   c.font='780 '+size+'px "PingFang SC", sans-serif';size=Math.min(size,max*size/c.measureText(s).width);
   const u=ease((t-start+delta)/.22);c.globalAlpha=u;c.shadowColor='rgba(12,36,34,.28)';c.shadowBlur=8;
   type(s,x,base+(1-u)*12,size,col,800);
 }
 c.save();line(top,a,y-b*1.22,WARM,.12);line(bottom,b,y,accent?YELLOW:WARM,.035);c.restore();
}
function ident(letter){
 const x=vertical?68:88,y=vertical?184:139;
 c.fillStyle='rgba(24,51,49,.79)';c.fillRect(x,y,vertical?136:135,vertical?58:48);
 type('片段 '+letter,x+14,y+(vertical?42:35),vertical?34:28,WARM,680);
}
function drawImageTo(can,x,y,w,h){
 c.drawImage(can,0,0,can.width,can.height,x,y,w,h);
}
function compare(t){
 const u=clamp((t-22.75)/6),real=u*6;
 // During the question the two moving thumbnails are a paired replay, without timing cues.
 const play=t<22.75?.4+(t-20)*.082:t>28.75?1+(t-28.75)*.08:u;
 const panels=vertical?[[0,0,W,H*.50],[0,H*.50,W,H*.50]]:[[0,0,W*.5,H],[W*.5,0,W*.5,H]];
 for(let i=0;i<2;i++){
   const [x,y,w,h]=panels[i];
   // The export viewport stays at film resolution. The camera aspect represents the displayed panel.
   boatView(i?canalB:canalA,play,w/h);drawImageTo(renderer.domElement,x,y,w,h);
   const lx=x+(vertical?65:59),ly=y+(vertical?165:171);
   c.fillStyle='rgba(27,52,47,.76)';c.fillRect(lx,ly-38,133,51);type('片段 '+(i?'B':'A'),lx+15,ly,30,WARM,680);
   if(t>=22.75){
     let cy=y+h*(vertical?.34:.50);
     c.save();c.shadowColor='rgba(14,35,31,.69)';c.shadowBlur=14;
     type(real.toFixed(2)+' s',x+w*.5,cy,vertical?93:105,YELLOW,750,'center','"Avenir Next",Arial,sans-serif');c.restore();
     const len=w*.62,px=x+w*.19;c.fillStyle='rgba(22,51,49,.56)';c.fillRect(px,cy+21,len,7);c.fillStyle=YELLOW;c.fillRect(px,cy+21,len*u,7);
   }
 }
 c.fillStyle='#f2dfb9';if(vertical)c.fillRect(0,H*.5-2,W,4);else c.fillRect(W*.5-2,0,4,H);
}
function coverWords(){
 gradient(H*.15,H*.5,'rgba(11,36,33,0)','rgba(14,34,33,.62)');
 gradient(H*.5,H*.81,'rgba(14,34,33,.62)','rgba(11,36,33,0)');
 const first='小时候的暑假',second='怎么那么长？',sz=vertical?122:W===1920?160:133;
 const cy=H*.5;
 c.save();c.shadowColor='rgba(16,42,36,.45)';c.shadowBlur=12;
 type(first,W/2,cy-sz*.12,sz*.88,WARM,820,'center');
 type(second,W/2,cy+sz*.99,sz,YELLOW,850,'center');c.restore();
}
function render(t){
 c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;
 if(cover){deskPose(1.33,'cover');drawImageTo(renderer.domElement,0,0,W,H);folio();coverWords();return}
 if(t<8){
   deskPose(t,t<4.75?'open':'boat');drawImageTo(renderer.domElement,0,0,W,H);
   if(t<4.75)caption(t,0,'小时候的暑假那么长，','怎么现在一年就过了？',true,true);
   else caption(t,4.75,'跟着这只纸船，','看两段小小的漂流。');
 }else if(t<20){
   const isB=t>=14;boatView(isB?canalB:canalA,clamp((t-(isB?14:8))/6));drawImageTo(renderer.domElement,0,0,W,H);ident(isB?'B':'A');
 }else if(t<30.25){
   compare(t);
   if(t<22.75)caption(t,20,'凭第一印象，','哪一段更长？');
   else if(t<28.75)caption(t,22.75,'把两段放在一起，','从同一刻开始重播。',false);
   else caption(t,28.75,'答案揭晓。','两段都是 6 秒。');
 }else if(t<40){
   const f=t-30.25;photosAt(f+.13);
   const zoom=vertical?11.4:7.10;
   const focus=vertical?mix(-1.23,.65,ease(f/3.5)):mix(-.51,.28,ease(f/6));
   pose([focus+1.13-.07*f,zoom+.50*Math.sin(f*.35),3.05-.13*f],[focus,0,0],vertical?46:46,W/H,.035);
   scene(archive.s);drawImageTo(renderer.domElement,0,0,W,H);
   if(f<3.35)caption(t,30.25,'回想第一段，','也许只剩下「沿河漂」。',false);
   else if(f<6.85)caption(t,33.60,'第二段呢？','遇风筝、过桥洞、见荷花。');
   else caption(t,37.10,'回忆时，能分出几件事，','会影响我们对时长的判断。',false);
 }else{
   deskPose(t,'end');drawImageTo(renderer.domElement,0,0,W,H);
   if(t<44.6)caption(t,40,'有些暑假，回想起来很长。','也许是因为，记得的事多。',false);
   else caption(t,44.6,'今年到现在，','哪一天，你还记得最清楚？');
 }
 folio();
}
window.render=render;window.duration=END;window.ready=true;render(0);
if(!opts.has('render')&&!cover){const epoch=performance.now();function loop(now){render(((now-epoch)/1000)%END);requestAnimationFrame(loop)}requestAnimationFrame(loop);}
