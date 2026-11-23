const opts=new URLSearchParams(location.search), portrait=opts.has('v'), coverLayout=opts.has('cover');
const W=portrait?1080:(coverLayout&&opts.get('cover')!=='16x9'?1440:1920),H=portrait?(coverLayout?1440:1920):1080;
const canvas=document.querySelector('#film');canvas.width=W;canvas.height=H;
const ctx=canvas.getContext('2d',{alpha:false}), renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
renderer.setSize(W,H,false);renderer.outputColorSpace=T.SRGBColorSpace;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
let shadowScene=null;
const camera=new T.PerspectiveCamera(45,W/H,.13,1200),mirrorCamera=camera.clone();
const highway=makeHighway(),track=makeTrack();
const highwayCars=[],trackCars=[];
for(let i=-25;i<=22;i++){
 const o=car(i===0?0:1+modulo(i*5+(i%3===0?1:0),7));highwayCars.push(o);highway.add(o);
}
for(let i=0;i<count;i++){const o=car(i===0?0:1+modulo(i*5,7));trackCars.push(o);track.add(o)}
// Grounded navigation signs provide fixed points even while the camera moves.
function signAt(x,name){
 const c=document.createElement('canvas');c.width=256;c.height=256;const p=c.getContext('2d');
 p.fillStyle='#194d54';p.fillRect(0,0,256,256);p.strokeStyle='#d6e5d6';p.lineWidth=8;p.strokeRect(12,12,232,232);
 p.fillStyle='#fff6ca';p.font='bold 172px Arial';p.textAlign='center';p.textBaseline='middle';p.fillText(name,128,143);
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 const b=new Batch();b.b(x,.89,-3.47,.125,1.78,.125,'#6a8484');highway.add(b.finish());
 const face=new T.Mesh(new T.PlaneGeometry(1.3,1.3),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}));face.position.set(x,2.22,-3.47);highway.add(face);
}
signAt(-23,'A');signAt(8,'B');
const skyG=new T.SphereGeometry(780,38,16);
function sky(scene,top,horizon){
 const m=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color(top)},horizon:{value:new T.Color(horizon)}},
   vertexShader:'varying vec3 ray;void main(){ray=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:`varying vec3 ray; uniform vec3 top; uniform vec3 horizon; void main(){vec3 r=normalize(ray);vec3 c=mix(horizon,top,smoothstep(-.02,.54,r.y));float s=distance(r,normalize(vec3(.80,.16,-.50)));c=mix(c,vec3(1.,.86,.60),.7*exp(-s*7.));c=mix(c,vec3(1.,.95,.75),1.-smoothstep(.046,.05,s));gl_FragColor=vec4(c,1.);
   #include <colorspace_fragment>
   }`});
 scene.add(new T.Mesh(skyG,m));
}
sky(highway,'#6faebd','#f3d4ad');sky(track,'#82b3b4','#eddcb9');
function positionCamera(eye,look,fov,roll=0){
 camera.fov=fov;camera.updateProjectionMatrix();camera.position.set(...eye);camera.up.set(0,1,0);camera.lookAt(...look);camera.rotateZ(roll);camera.updateMatrixWorld();
}
const white='#fff9e8',yellow='#ffda39',berry='#ff7157',ink='#17363b';
function font(size,weight=700){return weight+' '+size+'px "PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif'}
function write(str,x,y,size,col=white,weight=700){
 ctx.fillStyle=col;ctx.font=font(size,weight);ctx.fillText(str,x,y);
}
function at(x,y,z,cam=camera){
 const v=vec(x,y,z).project(cam);return {x:(v.x+1)*W/2,y:(1-v.y)*H/2,seen:v.z<1&&v.z>-1};
}
function stroke(points,color,width,dash=[]){
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.setLineDash([]);
}
function fadeBand(y1,y2,c1,c2){const g=ctx.createLinearGradient(0,y1,0,y2);g.addColorStop(0,c1);g.addColorStop(1,c2);ctx.fillStyle=g;ctx.fillRect(0,y1,W,y2-y1)}
function pointer(p,label,color,dx,dy){
 if(!p.seen||p.x<-40||p.x>W+40||p.y<0||p.y>H)return;
 const size=portrait?35:31;ctx.font=font(size,750);let width=ctx.measureText(label).width+35;
 const tx=clamp(p.x+dx,18,W-width-18), ty=clamp(p.y+dy,90,H-120);
 stroke([p,{x:tx+width*.35,y:ty+6}],'rgba(13,47,49,.9)',6);
 stroke([p,{x:tx+width*.35,y:ty+6}],color,2.3);
 ctx.fillStyle=color;ctx.beginPath();ctx.arc(p.x,p.y,5.5,0,TAU);ctx.fill();
 ctx.fillStyle='#184449';ctx.fillRect(tx,ty-size-5,width,size+20);
 ctx.fillStyle=color;ctx.fillRect(tx,ty-size-5,5,size+20);write(label,tx+16,ty+2,size,color,720);
}
function arrowAt(x,y,z,x2,y2,z2,color){
 const a=at(x,y,z),b=at(x2,y2,z2);if(!a.seen||!b.seen)return;
 const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<15)return;
 const ux=dx/len,uy=dy/len,sz=clamp(len*.32,10,22);
 ctx.save();ctx.lineCap='round';stroke([a,b],color,portrait?5:4.5);
 stroke([{x:b.x-ux*sz+uy*sz*.48,y:b.y-uy*sz-ux*sz*.48},b,{x:b.x-ux*sz-uy*sz*.48,y:b.y-uy*sz+ux*sz*.48}],color,4.5);ctx.restore();
}
function markSlow(i,p,t){
 const q=at(p.x,.075,1.34),r=at(p.x,.075,-1.34);if(!q.seen||!r.seen)return;
 const alpha=smooth((2.7-p.v)/2.5);if(!alpha)return;
 ctx.save();ctx.globalAlpha=alpha*.93;
 for(const z of [-1.30,1.30]){const l=at(p.x-1.7,.07,z),r=at(p.x+1.7,.07,z);stroke([l,r],'#ff674e',portrait?6:5);}
 ctx.restore();
}
function ringMarks(st){
 for(const p of st){const alpha=smooth((3.25-p.v)/2.8);if(!alpha)continue;
   ctx.save();ctx.globalAlpha=alpha;
   for(const side of [-1,1]){const points=[];for(let k=-3;k<=3;k++){const a=p.angle+k*.022,r=R+side*1.52;points.push(at(r*Math.cos(a),.08,r*Math.sin(a)));}
     stroke(points,'#fa543b',portrait?5:5);}
   ctx.restore();
 }
}
function curvedArrow(a,b,r,col){
 const pts=[];for(let k=0;k<=26;k++){const ang=mix(a,b,k/26);pts.push(at(r*Math.cos(ang),.19,r*Math.sin(ang)));}
 ctx.save();ctx.lineCap='round';stroke(pts,col,portrait?8:7);
 const p=pts[26],q=pts[23],angle=Math.atan2(p.y-q.y,p.x-q.x),d=portrait?18:16;
 stroke([{x:p.x-d*Math.cos(angle-.66),y:p.y-d*Math.sin(angle-.66)},p,{x:p.x-d*Math.cos(angle+.66),y:p.y-d*Math.sin(angle+.66)}],col,portrait?7:6);ctx.restore();
}
function queueAngle(st){
 let x=0,z=0;for(const p of st){const a=Math.max(0,2.7-p.v);x+=a*Math.cos(p.angle);z+=a*Math.sin(p.angle);}
 return Math.atan2(z,x);
}
const captions=[
 [0,'车都在往前开，','堵车怎么往后走？'],
 [2,'盯住路边的两个标记。','车从 A 开向 B。'],
 [4,'B 点先堵住了。','几秒后，A 点也堵了。'],
 [6,'看这辆黄车。','前车一慢，它也得减速。'],
 [8,'黄车开始走了，','后车还在踩刹车。'],
 [10,'前面一辆接一辆离开，','后面一辆接一辆慢下来。'],
 [12,'把路弯成一个圈。','22 辆车，绕 230 米。'],
 [14,'没有红灯，也没有岔路。','一开始，大家几乎匀速。'],
 [16,'车距很小时，','一点减速，可能越传越大。'],
 [18,'车沿着圆环向前开，','这团慢车却在往回移。'],
 [20,'轮到黄车开出拥堵，','眼前的路，又畅通了。'],
 [22,'那刚才堵在哪儿？','看后视镜。'],
 [23,'你已经开出来了。','堵点，传到了你身后。']
];
function typeLayer(bar,t,cover=false){
 let item=captions.slice().reverse().find(d=>bar>=d[0])||captions[0];
 const opening=bar<2||cover, ending=bar>=22;
 const age=(bar-item[0])*BAR, inT=cover?1:smooth(age/.32), in2=cover?1:smooth((age-(opening?.25:.16))/.34);
 let x=portrait?77:94;
 // The opener and the explanation use different type scales but keep the picture alive underneath.
 const bottom=portrait?(opening?H*.77:H*.78):(opening?H*.855:H*.84);
 let a=opening?(portrait?76:85):(portrait?57:52), b=opening?(portrait?89:102):(portrait?63:66);
 if(coverLayout){
   const wide=opts.get('cover')==='16x9';
   a=portrait?113:wide?145:120;b=portrait?136:wide?184:150;
 }
 const measure=(s,sz)=>{ctx.font=font(sz,850);return ctx.measureText(s).width;};
 const maxW=coverLayout&&portrait?W*.92:portrait?W-166:W*.88;
 a=Math.min(a,a*maxW/measure(item[1],a));b=Math.min(b,b*maxW/measure(item[2],b));
 let y1=bottom-b*1.12, y2=bottom;
 if(coverLayout){
   ctx.font=font(a,780);const first=ctx.measureText(item[1]);
   ctx.font=font(b,850);const second=ctx.measureText(item[2]);
   const spacing=b*1.12;
   y1=(H+first.actualBoundingBoxAscent-spacing-second.actualBoundingBoxDescent)/2;
   y2=y1+spacing;x=W/2;
   fadeBand(H*.23,H*.50,'rgba(10,28,34,0)','rgba(10,28,34,.55)');
   fadeBand(H*.50,H*.73,'rgba(10,28,34,.55)','rgba(10,28,34,0)');
 }else{
   fadeBand(portrait?H*.52:H*.48,H,'rgba(9,28,34,0)','rgba(7,25,30,.83)');
 }
 ctx.save();ctx.shadowColor='rgba(9,32,35,.35)';ctx.shadowBlur=10;ctx.shadowOffsetY=3;
 if(coverLayout)ctx.textAlign='center';
 ctx.globalAlpha=inT;write(item[1],x,y1+13*(1-inT),a,white,780);
 ctx.globalAlpha=in2;write(item[2],x,y2+15*(1-in2),b,opening||ending?yellow:white,850);ctx.restore();
 // Slim editorial folio, plus a source caption only during the reconstruction.
 fadeBand(0,portrait?205:126,'rgba(9,31,33,.51)','rgba(9,31,33,0)');
 const hx=portrait?70:84,hy=portrait?116:70;ctx.fillStyle=yellow;ctx.fillRect(hx,hy-23,8,26);
 write('vibe 知识大赏',hx+21,hy,portrait?32:27,white,740);
 if(bar>=12&&bar<20){
   const str=bar>=16?'环道模型演示 · 一段时间后':'2008 年环道实验 · 模型演示';
   write(str,x,bottom+(portrait?68:53),portrait?29:25,'#e6eace',530);
 }
}
function mirror(roadTime,carX){
 const mw=portrait?W*.68:W*.34,mh=mw*.287,mx=(W-mw)/2,my=portrait?H*.20:H*.121;
 mirrorCamera.fov=14;mirrorCamera.aspect=mw/mh;mirrorCamera.updateProjectionMatrix();
 mirrorCamera.position.set(carX-2.45,2.45,.24);mirrorCamera.up.set(0,1,0);mirrorCamera.lookAt(carX-45,1.04,0);mirrorCamera.updateMatrixWorld();
 // Match camera and viewport aspect ratio before resampling into the mirror.
 renderer.setViewport(0,0,Math.round(mw),Math.round(mh));renderer.setScissor(0,0,Math.round(mw),Math.round(mh));renderer.setScissorTest(true);
 renderer.render(highway,mirrorCamera);
 ctx.save();ctx.shadowColor='rgba(10,29,31,.58)';ctx.shadowBlur=20;ctx.fillStyle='#243b3e';
 ctx.beginPath();ctx.roundRect(mx-12,my-12,mw+24,mh+24,48);ctx.fill();ctx.shadowBlur=0;
 ctx.beginPath();ctx.roundRect(mx,my,mw,mh,37);ctx.clip();
 ctx.translate(mx+mw,my);ctx.scale(-1,1);ctx.drawImage(renderer.domElement,0,H-Math.round(mh),Math.round(mw),Math.round(mh),0,0,mw,mh);
 ctx.restore();renderer.setScissorTest(false);renderer.setViewport(0,0,W,H);
}
function render(t,cover=false){
 const bar=t/BAR, part=Math.floor(bar/2)*2, u=clamp((bar-part)/2);
 const ring=bar>=12&&bar<20;let rtime=0, roadTime=0,states=[],hero=0;
 if(ring){
   rtime=bar<16?(bar-12)*BAR*1.15:177+(bar-16)*BAR*1.35;
   states=trackCars.map((o,i)=>{const p=ringState(i,rtime);o.position.set(p.x,0,p.z);o.rotation.y=p.yaw;setBrakes(o,p.light);return p});
   if(part===12){
     const f=smooth(u),eye=portrait?[mix(60,77,f),mix(22,142,f),mix(21,54,f)]:[mix(54,56,f),mix(15,74,f),mix(24,52,f)];
     positionCamera(eye,[mix(35,0,f),0,mix(4,0,f)],portrait?49:47);
   }else if(part===14){
     const a=.62+u*.215, d=portrait?125:77;positionCamera([Math.cos(a)*d,portrait?117:65,Math.sin(a)*d],[0,0,0],portrait?47:47);
   }else if(part===16){
     const ang=queueAngle(states),x=R*Math.cos(ang),z=R*Math.sin(ang);
     positionCamera([x+Math.cos(ang+.48)*(portrait?40:28),portrait?46:27,z+Math.sin(ang+.48)*(portrait?40:28)],
       [x*.91,0,z*.91],portrait?51:49);
   }else{
     const a=1.40+u*.14,d=portrait?86:40;positionCamera([Math.cos(a)*d,portrait?139:88,Math.sin(a)*d],[0,0,0],portrait?50:49);
   }
 }else{
   roadTime=bar<2?mix(-1.2,2.65,u):bar<6?(bar-2)*BAR+.68:bar<12?(bar-6)*BAR+.10:5.8+(bar-20)*BAR*1.15;
   highwayCars.forEach((o,j)=>{const s=roadState(j-25,roadTime);states.push(s);o.position.set(s.x,0,0);setBrakes(o,s.light);o.visible=Math.abs(s.x)<300});
   hero=states[25].x;
   if(coverLayout){
     positionCamera([hero-7.6,portrait?5.9:4.7,portrait?6.2:6.5],[hero+1.9,.04,0],portrait?49:43,-.02);
     const down=portrait?.22:opts.get('cover')==='16x9'?.30:.276;
     camera.setViewOffset(W,H,0,-H*down,W,H);
   }else if(part===0){
     positionCamera([hero-(portrait?10.2:9.4)+u*1.6,portrait?6.1+u*1.15:3.9+u*.6,portrait?6.7:6.0],
       [hero+(portrait?3.2:2.6),portrait?.02:.28,0],portrait?50:43,-.026+u*.015);
   }else if(part===2||part===4){
     positionCamera(portrait?[-56,36,8]:[-21,29,38],portrait?[-11,0,0]:[-9,0,0],portrait?48:44);
   }else if(part===6){
     positionCamera([hero-(portrait?6.2:5.3)-u*1.2,portrait?3.5:2.23,portrait?5.8:4.65],[hero+.42,.72,0],portrait?48:42);
   }else if(part===8){
     const focus=mix(hero,states[24].x,smooth(u)*.75);
     positionCamera([focus-(portrait?11:7),portrait?10:7.8,portrait?6.5:13.6],[focus+.5,.1,0],portrait?48:42);
   }else if(part===10){
     const x=8-(roadTime-2)*5.25;positionCamera(portrait?[x-35+4*u,30,7]:[x-4,23,30],[x,0,0],portrait?49:47);
   }else if(part===20){
     positionCamera([hero-(portrait?7:5.3),portrait?4.2:2.35,portrait?4.4:4.8],[hero+mix(4,8,u),.44,0],portrait?52:46);
   }else{
     positionCamera([hero+.62,1.68,.16],[hero+26,1.13,.1],portrait?61:56);
   }
 }
 const location=ring?track:highway;
 if(shadowScene!==location){renderer.shadowMap.needsUpdate=true;shadowScene=location;}
 renderer.render(location,camera);ctx.drawImage(renderer.domElement,0,0,W,H);
 if(part===2||part===4){
   for(let j=0;j<states.length;j++)markSlow(j,states[j],t);
   for(const [x,letter,col,dx,dy,idx] of [[-23,'A',white,portrait?-123:-75,portrait?50:90,20],[8,'B',yellow,portrait?58:48,portrait?-57:-73,25]]){
     const waiting=states[idx].v<2&&Math.abs(states[idx].x-x)<2;
     pointer(at(x,1.45,-2.5),letter+(waiting?' · 慢':''),waiting?'#ff9b80':col,dx,dy);
   }
   for(let i=0;i<3;i++){const x=-20+modulo(t*3+i*6,21);arrowAt(x,.06,1.94,x+2.15,.06,1.94,'rgba(246,237,201,.95)')}
 }
 if(part===8||part===10){states.forEach((p,i)=>markSlow(i,p,t));
   if(part===8&&u>.16)pointer(at(states[24].x,.82,0),'后车',white,portrait?-112:-90,-77);
 }
 if(ring&&bar>=16){
   ringMarks(states);
   if(part===18){
     const a=queueAngle(states),b=states[0].angle;
     curvedArrow(b-.47,b+.12,R-5.8,yellow);
     curvedArrow(a+.51,a-.29,R+5.7,berry);
     const p=at(0,.5,-1);ctx.save();
     const sz=portrait?32:34,tw=sz*2.95,x=p.x-tw;
     ctx.fillStyle='rgba(20,52,50,.84)';ctx.fillRect(x-12,p.y-sz-7,tw*2+24,sz+20);
     write('车流',x,p.y,sz,yellow,760);write('堵点',p.x+sz*.66,p.y,sz,'#ff8b73',760);ctx.restore();
   }
 }
 if(part===22)mirror(roadTime,hero);
 typeLayer(bar,t,cover);
}
window.render=render;window.duration=END;window.ready=true;
render(0);
if(!opts.has('render')){const start=performance.now();function tick(n){render(((n-start)/1000)%END);requestAnimationFrame(tick)}requestAnimationFrame(tick);}
