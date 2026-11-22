const canvas=document.querySelector("canvas");
canvas.width=1200;canvas.height=675;
const ctx=canvas.getContext("2d");
const ink="#211d27";
const looks=[
  ["晨光大道","#b4d5e2","#91bbb4","#f5e2b7","#9ab383","#dba084"],
  ["黄昏商街","#edc5b4","#bba1a8","#f6dbab","#adad86","#c17d69"],
  ["林荫街道","#b9dadc","#97bca9","#eaddaf","#93b475","#d59b7f"],
  ["高架桥下","#bed1d5","#9bb2b3","#dacdb2","#a6ad97","#bd9787"],
  ["午夜霓虹","#697693","#77849b","#c4b9be","#878e9d","#cb9398"]
];
let active=0,start=performance.now();
function draw(path,fill,width=1.4,stroke=ink){
  const shape=new Path2D(path);
  if(fill){ctx.fillStyle=fill;ctx.fill(shape)}
  if(width){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.lineJoin="round";ctx.lineCap="round";ctx.stroke(shape)}
}
function at(x,y,s,fn){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);fn();ctx.restore();
}
function oval(x,y,w,h,color){
  ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,w,h,0,0,Math.PI*2);ctx.fill();
}
function cloud(x,y,s){
  at(x,y,s,()=>draw("M0 12 Q-4 6 9 4 Q13 -7 30 -5 Q43 -15 59 -7 Q76 -11 85 1 Q101 0 108 11 Q117 16 108 18 Q109 24 74 24 Q27 25 7 20 Z","#f8eed8",1.35));
}
function shop(x,y,s,p,book){
  at(x,y,s,()=>{
    draw("M0 0 L126 -3 L129 114 L1 114 Z",book?p[3]:p[5]);
    draw("M-4 0 L-2 -7 L128 -10 L130 -3 Z",p[3]);
    for(const xx of [15,51,88]){
      at(xx,8,1,()=>{
        draw("M0 1 L21 0 L22 27 L0 28 Z","#a7bfc0");
        draw("M10 1 L11 27 M0 13 L21 12",null,1);
        draw("M-2 28 L24 27 L23 30 L-2 31 Z",p[3],1);
      });
    }
    draw("M5 43 L122 41 L122 61 L6 63 Z","#f7e9c9");
    ctx.fillStyle=ink;ctx.font="bold 12px serif";ctx.textAlign="center";ctx.fillText(book?"街 角 书 店":"花   房",63,57);
    draw("M10 67 L77 65 L77 104 L11 105 Z","#a1b8b4");
    draw("M83 65 L118 64 L119 114 L84 114 Z","#688582");
    draw("M89 70 L112 69 L112 91 L90 92 Z","#ccdbca",1);
    for(let k=0;k<8;k++)at(k*15+4,62,1,()=>draw("M0 0 L15 0 L18 7 Q12 12 3 8 Z",k%2?"#eee3bc":p[5],.8));
    if(book)for(let k=0;k<8;k++)at(16+k*7,99,1,()=>draw("M0 0 L-1 -12 L4 -13 L6 -1 Z",k%2?p[5]:p[3],.8));
  });
}
function tree(x,y,s,p){
  at(x,y,s,()=>{
    draw("M-3 0 Q0 -34 -3 -60 L4 -62 L4 0 Z","#ad866b");
    draw("M-26 -48 Q-42 -58 -30 -75 Q-33 -92 -16 -96 Q-9 -116 8 -106 Q25 -111 30 -91 Q45 -80 33 -66 Q39 -48 20 -46 Q6 -35 -7 -46 Q-17 -41 -26 -48 Z",p[4]);
    draw("M1 -44 L1 -68 M0 -56 L-10 -67 M2 -61 L11 -73",null,.9);
  });
}
function clawd(x,y,s,pink,t){
  const phase=t*8+(pink?1.7:0),step=Math.sin(phase);
  at(x,y,s,()=>{
    oval(0,0,43,6,"#33332738");
    ctx.translate(0,-3-Math.abs(step)*2);ctx.rotate(-.045+step*.018);
    const body=pink?"#e6a5ac":"#d77e59",shade=pink?"#cc8c94":"#b96e50";
    [-31,-15,10,26].forEach((v,j)=>at(v,-13,1,()=>{
      ctx.rotate((j%2?1:-1)*step*.27);
      draw("M0 -4 L8 -5 L9 13 L1 13 Z",shade,2.8);
    }));
    draw("M-37 -33 L-55 -23 L-52 -17 L-34 -24 Z",body,3.2);
    draw("M34 -37 L49 -48 L54 -41 L39 -29 Z",body,3.2);
    draw("M-39 -55 L39 -57 L40 -12 L-38 -10 Z",body,3.5);
    draw("M-36 -24 Q-9 -22 37 -31 L38 -14 L-36 -12 Z",shade,0);
    draw("M-20 -46 L-13 -46 L-13 -33 L-20 -33 Z",ink,.8);
    oval(-17.5,-43,1.2,1.5,"#fff4db");
    draw(pink?"M16 -45 L22 -45 L22 -33 L16 -33 Z":"M16 -39 L24 -39 L24 -35 L16 -35 Z",ink,.8);
    draw("M-4 -28 Q2 -25 8 -30",null,2.3);
    if(pink){
      draw("M14 -55 Q12 -60 18 -61 L32 -60 Q36 -57 32 -54 Z","#f18db1",2.1);
      draw("M18 -58 L29 -57",null,1,"#ffe3db");
    }
  });
}
function frame(now){
  const t=(now-start)/1000,p=looks[active],night=active===4;
  ctx.setTransform(1.5,0,0,1.5,0,0);ctx.fillStyle=p[1];ctx.fillRect(0,0,800,450);
  at(118,70,1,()=>draw("M-23 1 Q-25 -22 -4 -25 Q17 -29 24 -9 Q32 13 11 22 Q-11 30 -23 10 Z","#f4dda9",1.3));
  cloud(52-Math.sin(t*.1)*3,81,.98);cloud(472,44,.56);cloud(649,85,.83);
  const drift=(t*2)%160;
  for(let k=-1;k<7;k++)at(k*160-drift,250,1,()=>draw("M0 3 L0 -30 L22 -31 L21 -60 L46 -61 L47 -91 L70 -90 L71 -49 L101 -51 L102 -61 L130 -63 L130 -32 L160 -34 L161 5 Z",p[2],1,"#57595c"));
  draw("M-3 238 Q135 227 274 237 T570 239 Q682 232 803 227 L803 320 L-3 320 Z",p[4]);
  const offset=(t*10)%600;
  for(let k=-1;k<3;k++){
    const x=k*600-offset;
    shop(x+28,163,1.12,p,true);shop(x+183,196,.82,p,false);
    tree(x+351,291,active===2?1.16:.88,p);
    if(active===2)tree(x+414,290,.93,p);
    at(x+496,289,1,()=>{
      draw("M-2 0 L-1 -100 Q0 -113 14 -111 L24 -110",null,2.4);
      draw("M14 -108 Q21 -121 30 -109 L33 -105 L11 -105 Z",night?"#ffe2a3":p[3]);
    });
  }
  if(active===3){
    draw("M-2 134 Q330 139 802 126 L802 135 Q360 149 -2 144 Z",p[2]);
    for(let k=-1;k<4;k++)at(k*310-(t*12)%310,144,1,()=>draw("M-8 0 L13 0 L7 14 L8 144 L0 144 L-1 14 Z",p[2]));
  }
  draw("M-3 291 Q160 287 382 293 T804 287 L804 395 L-3 395 Z",night?"#aaa4a4":"#dbcaa8");
  draw("M-3 387 Q277 391 489 385 T805 387 L805 455 L-3 455 Z",night?"#717887":"#a1aba6");
  draw("M-2 392 Q289 396 500 390 T805 392",null,.8);
  for(let k=-1;k<10;k++)at(k*113-(t*23)%113,387,1,()=>draw("M0 0 L12 -15 M12 -15 L64 -15",null,.7,"#ad9c83"));
  for(let k=-1;k<8;k++)at(k*135-(t*26)%135,427,1,()=>draw("M0 0 L61 -1 L54 4 L-8 4 Z","#e6dfc8",0));
  clawd(320+Math.sin(t*.5)*5,354,.95,false,t);
  clawd(447+Math.sin(t*.5)*4,363,1.00,true,t);
  requestAnimationFrame(frame);
}
const nav=document.querySelector("nav");
function select(i){
  active=i;start=performance.now();document.querySelector("#name").textContent=looks[i][0];
  [...nav.children].forEach((b,n)=>b.setAttribute("aria-pressed",String(i===n)));
}
looks.forEach(([name],i)=>{
  const b=document.createElement("button");b.innerHTML="<span>0"+(i+1)+"</span>"+name;
  b.onclick=()=>select(i);nav.append(b);
});
select(0);requestAnimationFrame(frame);
