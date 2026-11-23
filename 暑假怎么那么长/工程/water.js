function branchTree(g,x,z,height,rand){
 const plant=group(g,x,.45,z);
 taper(plant,0,height*.36,0,.09*height,.12*height,height*.72,'#886f4e',7);
 for(let j=0;j<5;j++){const a=j*2.4,s=.3+.57*rand(),cx=Math.cos(a)*height*.29,cz=Math.sin(a)*height*.24;
   rod(plant,[0,height*.48,0],[cx,height*(.82+.2*s),cz],height*.045,'#897651',7);
   const o=ball(plant,cx,height*(.9+.23*s),cz,height*(.31+.13*s),height*(.29+.13*s),height*.32,['#6f9565','#94aa6e','#8fab68','#a6b575','#648966'][j],true);o.rotation.y=a;}
}
function makeCanal(scenic){
 const rand=random(scenic?591:733),data=litScene(scenic?'#d6e4ce':'#d4e2de',scenic?'#cadaae':'#c6d8c5');
 const earth=group(data.s);
 const distant=random(811);
 for(let j=0;j<14;j++){
   const x=(j-6.5)*9,h=3+distant()*5.2;const hill=ball(earth,x,-.9,-75-distant()*17,12+distant()*8,h,8+distant()*10,j%3?'#a1b8a9':'#a5b9a6',true);
   hill.rotation.y=distant()*2;
 }
 const wr=4.95;
 const wt=painted(512,512,(p,w,h)=>{
   const grain=random(411);p.fillStyle='#deefea';p.fillRect(0,0,w,h);
   for(let i=0;i<340;i++){const x=grain()*w,y=grain()*h,k=5+grain()*47;
     p.strokeStyle=i%3?'rgba(116,170,160,.24)':'rgba(255,255,238,.60)';p.lineWidth=.6+grain()*1.2;
     p.beginPath();p.moveTo(x,y);p.bezierCurveTo(x+k*.36,y-3,x+k*.65,y+2,x+k,y-1);p.stroke();}
 });wt.wrapS=wt.wrapT=T.RepeatWrapping;wt.repeat.set(1.3,16);
 const surface=new T.MeshStandardMaterial({color:scenic?'#55aea6':'#71ada8',map:wt,roughness:.40,metalness:.08,flatShading:true});
 const g=new T.PlaneGeometry(wr*2,118,14,170);g.rotateX(-Math.PI/2);
 const water=mesh(data.s,g,surface,0,0,-23);water.castShadow=false;
 const vertices=g.attributes.position.array.slice();
 const glintMat=new T.MeshBasicMaterial({color:scenic?'#cbe5bd':'#cee6cf',transparent:true,opacity:.72,side:T.DoubleSide,depthWrite:false});
 const positions=new Float32Array(6*3*182);
 const glints=new T.BufferGeometry();const attr=new T.BufferAttribute(positions,3);glints.setAttribute('position',attr);
 const sparkMesh=new T.Mesh(glints,glintMat);data.s.add(sparkMesh);sparkMesh.frustumCulled=false;
 const specks=Array.from({length:182},()=>({x:(rand()-.5)*9.5,z:31-rand()*90,w:.13+rand()*.65,k:rand()*TAU}));
 for(const side of [-1,1]){
   box(earth,side*17,-.12,-20,24,1,115,scenic?'#a8ad77':'#a4b380');
   for(let j=0;j<92;j++){
     let z=33-j*1.11, wob=scenic?.45*Math.sin(z*.21):0;
     const stone=box(earth,side*(4.82+wob),.09+rand()*.13,z,.62+rand()*.35,.58+rand()*.28,1.20,
       scenic?['#a6ae97','#b8b7a3','#b8bb9b','#9bab95'][j%4]:['#acaf9b','#b1b49f','#aeb29e','#b5b8a4'][j%4]);stone.rotation.y=(rand()-.5)*.20;
     if(j%2===0){const x=side*(5.3+wob+rand()*.55);
       for(let k=0;k<3;k++){const h=.3+rand()*.8,a=rand()*2;
         face(earth,[[x-.045,.4,z],[x+.055,.4,z+.05],[x+Math.cos(a)*.23,.45+h,z+Math.sin(a)*.24]],['#748c59','#8eaa67','#b1b778'][k]);}}
   }
   for(let j=0;j<36;j++){
     const z=30-j*3.12,k=side*(6.7+(scenic?rand()*1.8:0));
     box(earth,k,.78,z,.14,.9,.14,'#af9d76');
     if(!scenic||z>0){box(earth,k,.95,z-1.56,.078,.085,3.15,'#c5b596');box(earth,k,.66,z-1.56,.076,.064,3.15,'#c3b391');}
   }
   for(let j=0;j<18;j++){const z=30-j*5.65;
     if(!scenic||z>5||z<-19)branchTree(earth,side*(scenic?8+rand()*5:9+rand()),z,3+rand()*1.6,rand);
   }
   for(let j=0;j<9;j++){const z=29-j*10.3,y=.4,x=side*(13+rand()*5);box(earth,x,y+1.52,z,3.5,3.05,4.4,'#e4d4ad');
     const roof=mesh(earth,new T.ConeGeometry(3.32,1.54,4),j%3?'#ac8370':'#899b90',x,y+3.65,z);roof.rotation.y=Math.PI/4;
     for(const dz of [-1.1,.5])box(earth,x-side*1.765,y+1.8,z+dz,.034,.79,.65,'#8ba3a0');
   }
 }
 // The first broken symmetry is a red fabric kite reaching the blackberry hedge.
 const kite=group(data.s,-1.53,2.38,6);kite.rotation.y=.25;
 const center=[0,0,.23],top=[0,1.12,0],left=[-.91,.12,0],right=[.91,.12,0],bottom=[0,-.94,0];
 face(kite,[top,left,center],'#eb7853');face(kite,[top,center,right],'#ffd693');face(kite,[left,bottom,center],'#f3ae6a');face(kite,[center,bottom,right],'#ca5342');
 wire(kite,[[0,-.94,0],[-.1,-1.13,.1],[.22,-1.44,.26],[.19,-1.82,.43]],.015,'#8c6553');
 for(let k=0;k<3;k++){const y=-1.08-k*.27;face(kite,[[.08,y,0],[-.16,y+.09,.02],[-.16,y-.085,.06]],'#e98d5b');face(kite,[[.08,y,0],[.31,y+.08,.05],[.30,y-.09,.08]],'#eac487')}
 if(scenic){
   wire(earth,[[-6,.6,9],[-4.9,.9,8],[-3.3,1.4,7.1],[-1.55,2.36,6]],.014,'#ad8a68');
   // Masonry arch with a clear opening, individual voussoirs and abutments.
   const z=-.8,rx=5.15,ry=3.35,topY=5.05;
   const oldBrick=printed(painted(512,512,(p,w,h)=>{
     const n=random(9235);p.fillStyle='#c1b19a';p.fillRect(0,0,w,h);
     for(let row=0;row<10;row++){const d=(row%2)*49;
       for(let col=-1;col<6;col++){const x=col*100+d,y=row*51;p.fillStyle=['#bfac92','#c4b297','#c9b8a0','#c5b39a'][Math.floor(n()*4)];
         p.fillRect(x+1,y+1,97,48);p.fillStyle='rgba(247,234,199,.29)';p.fillRect(x+2,y+2,94,2);}}
     for(let k=0;k<4800;k++){p.fillStyle=k%2?'rgba(95,81,62,.09)':'rgba(246,228,194,.16)';p.fillRect(n()*w,n()*h,1+n()*2,1);}
   }));
   for(let j=0;j<25;j++){
     const xa=-rx+2*rx*j/25,xb=-rx+2*rx*(j+1)/25;
     const arch=x=>.56+ry*Math.sqrt(Math.max(0,1-(x/rx)**2));
     const ya=arch(xa),yb=arch(xb);
     for(const side of [-1,1]){
       const zz=z+side*1.12;const facade=face(earth,[[xa,ya,zz],[xb,yb,zz],[xb,topY,zz],[xa,topY,zz]],oldBrick);
       const coord=facade.geometry.attributes.position,uv=[];
       for(let k=0;k<coord.count;k++)uv.push((coord.getX(k)+rx)/(2*rx),coord.getY(k)/topY);
       facade.geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
       face(earth,[[xa,ya,zz+side*.015],[xb-.032,yb,zz+side*.015],[xb-.032,yb+.34,zz+side*.015],[xa,ya+.35,zz+side*.015]],['#d7c2a1','#d9c5a2','#c5af92'][j%3]);
     }
     face(earth,[[xa,ya,z-1.12],[xb,yb,z-1.12],[xb,yb,z+1.12],[xa,ya,z+1.12]],'#89928a');
   }
   box(earth,0,5.10,z,14.6,.20,2.65,'#cbbc9f');
   for(const side of [-1,1]){
     box(earth,0,5.9,z+side*1.19,14.6,.12,.15,'#927f6b');
     for(let k=0;k<17;k++)box(earth,-7+k*.875,5.52,z+side*1.19,.14,.88,.15,'#ae9880');
   }
   for(const x of [-6.05,6.05]){
     box(earth,x,2.38,z,1.9,5.45,2.29,oldBrick);
     for(let k=0;k<24;k++){const dx=rand()*1.4-.7,dy=rand()*1.35;ball(earth,x+dx,4.99-dy,z+1.18,.18,.17+rand()*.14,.06,k%2?'#7b976a':'#90a674',true)}
   }
   // Individual cut-out lily pads and blossoms after the shaded arch.
   for(let j=0;j<58;j++){
     const side=j%2?1:-1,z=-7.9-rand()*22,x=side*(1.55+rand()*2.85),r=.20+rand()*.31,angle=rand()*TAU;
     const pts=[[x,.065,z]];for(let k=0;k<=10;k++){const a=angle+.31+k*(TAU-.62)/10;pts.push([x+Math.cos(a)*r,.075+.017*Math.sin(k),z+Math.sin(a)*r*.87]);}
     face(earth,pts,j%3?'#749958':'#92ad68');
     if(j%4===0){for(let k=0;k<7;k++){const a=k*TAU/7;
       const petal=ball(earth,x+Math.cos(a)*.13,.19,z+Math.sin(a)*.13,.098,.16,.098,k%2?'#f6b4a5':'#f6c8ae',true);petal.rotation.z=-Math.cos(a)*.6;petal.rotation.x=Math.sin(a)*.6;}
       ball(earth,x,.29,z,.075,.095,.075,'#ecc06c',true);}
   }
 }else kite.visible=false;
 const wakeMat=new T.MeshBasicMaterial({color:'#e7efc7',transparent:true,opacity:.46});
 const wakes=group(data.s);
 for(let j=0;j<5;j++){
   for(const s of [-1,1]){
     const z=.61+j*.43,w=.19+j*.13;
     wire(wakes,[[s*w,0,z],[s*(w+.07),0,z+.095],[s*(w+.10),0,z+.20]],.011,wakeMat,7).castShadow=false;
   }
 }
 const boat=origami(data.s,0,.1,0,.79);bake(boat);bake(earth);
 boat.traverse(o=>o.castShadow=false);kite.traverse(o=>o.castShadow=false);
 const shade=painted(96,96,(p,w,h)=>{const g=p.createRadialGradient(w/2,h/2,0,w/2,h/2,w*.49);g.addColorStop(0,'rgba(32,68,57,.52)');g.addColorStop(.5,'rgba(32,68,57,.38)');g.addColorStop(1,'rgba(32,68,57,0)');p.fillStyle=g;p.fillRect(0,0,w,h)});
 const cast=mesh(data.s,plane,new T.MeshBasicMaterial({map:shade,transparent:true,depthWrite:false}),0,.074,0,1.6,2.45,1);cast.rotation.x=-Math.PI/2;cast.castShadow=false;
 function update(u){
   const z=mix(14,-10,u),time=u*6,x=.14*Math.sin(u*4.7)+.11*Math.sin(u*8.3);
   boat.position.set(x,.091+.026*Math.cos(time*3.7),z);boat.rotation.set(.021*Math.cos(time*3.4),-.045*Math.cos(u*5),.05*Math.sin(time*2.1));
   cast.position.set(x+.12,.074,z+.17);
   wakes.position.set(x,.087,z);wakes.rotation.y=boat.rotation.y;wakes.scale.x=1+.07*Math.cos(time*3);
   kite.rotation.z=-.17+.19*Math.sin(time*2.1);kite.position.y=2.38+.17*Math.sin(time*1.44);kite.position.x=-1.53+.12*Math.sin(time*.88);
   wt.offset.y=-time*.012;
   const p=g.attributes.position.array;for(let i=0;i<p.length;i+=3){const x=vertices[i],z=vertices[i+2];p[i+1]=.038*Math.sin(z*1.63+time*2.7+x*.67)+.021*Math.cos(x*1.31+z*.48-time*2.1);}
   g.attributes.position.needsUpdate=true;g.computeVertexNormals();
   for(let j=0;j<specks.length;j++){
     const s=specks[j],x=s.x+.117*Math.sin(time+s.k),zw=s.z+.12*Math.cos(time+s.k),w=s.w*(.52+.42*Math.sin(s.k+time*1.6)),h=.027;
     const vs=[x-w,.075,zw,x,.075,zw-h,x+w,.075,zw,x-w,.075,zw,x+w,.075,zw,x,.075,zw+h];positions.set(vs,j*18);
   }attr.needsUpdate=true;
   return {x,z};
 }
 return {...data,boat,update};
}
const canalA=makeCanal(false),canalB=makeCanal(true);
