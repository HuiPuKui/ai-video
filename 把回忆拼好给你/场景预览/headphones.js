const movie=document.getElementById("movie");
const g=movie.getContext("2d");
const cues=[[1.5,"我们都是渺小真实存在"],[5,"祈愿小世界里不只有挫败"],[8,"直到遇见你我以为就光明起来"],[11.5,"眼睛里看到的都是广袤无垠的大海"]];
function clamp(v){return Math.max(0,Math.min(1,v))}
function line(c,path,color,width){
  c.strokeStyle=color;c.lineWidth=width;c.lineJoin="round";c.lineCap="round";c.stroke(new Path2D(path));
}
function tape(x,y,s,t){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  rect(-17,-12,34,22,"#383b54");rect(-15,-10,30,11,"#ffce86");rect(-11,-7,22,6,"#545773");
  for(const rx of [-8,8]){ellipse(rx,-4,3.4,3.4,"#fff1c9");rect(rx-1,-5,2,2,"#4c4760")}
  rect(-11,4,22,3,"#968aa1");ctx.restore();
}
function crowd(t){
  for(let row=0;row<2;row++){
    const step=row?128:88;
    for(let j=0;j<Math.ceil(900/step);j++){
      const x=(j*step+900+(row?-25:21)*t+row*42)%900-48;
      clawd(x,316+row*17+(j%3)*2,row?.71:.53,false,t+j*.21,true);
    }
  }
}
function day(t){
  street(Math.min(t,5));crowd(t);
  const x=263+Math.min(t,5)*13;
  const approach=clamp((t-7.3)/1.35);
  const girl=493-Math.min(t,5)*4-approach*71;
  clawd(x,354,1,false,t<5?t:0);
  clawd(girl,350,1,true,t<5||approach>0&&approach<1?t:0);
  const drop=clamp((t-5)/.55),wind=clamp((t-8.35)/1.45);
  const tx=x+34+drop*10,ty=324+drop*27;
  if(drop>0){
    const slack=(1-wind)*drop;
    line(ctx,`M ${tx} ${ty} q ${34*slack} ${-18*slack} ${32*slack} 2 q ${-17*slack} 19 ${-35*slack} 7 t ${-34*slack} 2`,"#533e50",2.8);
  }
  tape(tx,ty,.68);
  if(t>=8&&t<10){
    const angle=t*11;
    ctx.save();ctx.translate(tx+5,ty-3);ctx.rotate(angle);rect(-2,-17,4,20,"#ffbe51");rect(-2,-18,4,3,"#f893aa");ctx.restore();
  }
  if(t>=9.65){
    const hand=clamp((t-9.65)/.8),endX=girl-25+(x+25-girl+25)*hand;
    line(ctx,`M ${girl-24} 315 Q ${girl-5} 356 ${tx} 348 Q ${tx-9} 367 ${endX} 318`,"#3a4058",2.8);
    for(const e of [girl-24,endX]){rect(e-3,313,7,7,"#fff8da");rect(e,319,3,5,"#49526e")}
  }
  lamps(Math.min(t,5));
  // Crop the props and the actors from the same world when the tape falls.
  const zoom=1+.6*clamp((t-5)/.45),w=400/zoom,h=225/zoom;
  const cropX=(400-w)*.46,cropY=(225-h)*.82;
  g.imageSmoothingEnabled=false;g.drawImage(canvas,cropX,cropY,w,h,0,0,960,540);
}
function wave(y,amplitude,freq,offset,fill){
  g.beginPath();g.moveTo(-10,545);
  for(let x=-10;x<=975;x+=6)g.lineTo(x,y+amplitude*Math.sin(x*freq+offset));
  g.lineTo(975,545);g.closePath();g.fillStyle=fill;g.fill();
}
function paperActor(x,y,pink){
  g.save();g.translate(x,y);g.rotate(pink?.04:-.05);
  const draw=(path,fill)=>{const p=new Path2D(path);g.fillStyle=fill;g.fill(p)};
  const c=pink?"#f49fb2":"#f49869";
  draw("M-35 -34 L-48 -25 L-45 -20 L-34 -26 M33 -33 L44 -44 L50 -39 L34 -24",c);
  for(const n of [-27,-16,13,25]){g.fillStyle="#935c62";g.fillRect(n,-15,6,15)}
  draw("M-36 -57 L35 -60 L38 -13 L-34 -11Z",c);
  draw("M-34 -19 L37 -26 L38 -13 L-34 -11Z",pink?"#de879d":"#dc825d");
  g.fillStyle="#3c3546";g.fillRect(-13,-46,5,10);g.fillRect(14,-46,5,10);
  if(pink){draw("M9 -60 L28 -64 L30 -58 L10 -54Z","#be4677");}
  g.restore();
}
function ocean(t){
  g.fillStyle="#f7e9c8";g.fillRect(0,0,960,540);
  g.fillStyle="#ef926b";g.beginPath();g.arc(750,98,48,0,Math.PI*2);g.fill();
  for(let j=0;j<3;j++)wave(177+j*45,12+j*4,.009+j*.001,t*(.6+j*.35),["#adcfca","#7dbbbf","#459bab"][j]);
  for(let j=0;j<5;j++)line(g,`M-20 ${233+j*13} Q240 ${197+j*13} 480 ${243+j*13} T990 ${223+j*13}`,"#e9e1b9",1.5);
  // A note moves under each actor on each landing.
  const period=.5,scroll=t/period*94;
  for(let lane=0;lane<2;lane++){
    const anchor=lane?520:345,y=lane?351:304;
    for(let j=-4;j<18;j++){
      const x=anchor+j*94-scroll;
      if(x<-25||x>985)continue;
      g.fillStyle=lane?"#feb9a9":"#ffdf91";g.beginPath();g.ellipse(x,y,16,7,-.22,0,7);g.fill();
      g.fillRect(x+12,y-28,3,28);
    }
    const phase=t%period/period;
    paperActor(anchor,y-3-32*Math.sin(Math.PI*phase),!!lane);
    if(phase<.25){g.strokeStyle="#fff4b7";g.lineWidth=3;g.beginPath();g.ellipse(anchor,y+6,20+phase*80,5+phase*10,0,0,7);g.stroke()}
  }
  wave(392,14,.012,t*1.8,"#266f84");
}
function renderFrame(t){
  g.setTransform(1,0,0,1,0,0);
  if(t<11.5)day(t);else ocean(t-11.5);
  if(t>=11.15&&t<11.8){
    const f=clamp((t-11.15)/.65);
    for(let j=0;j<5;j++){
      const y=275+j*11;
      line(g,`M${-100+f*1150} ${y} Q480 ${y-50} ${Math.min(1050,f*1800)} ${y+8}`,"#41405b",2);
    }
  }
  const cue=cues.filter(c=>c[0]<=t).pop();
  if(!cue)return;
  g.fillStyle="#37354e";g.fillRect(26,428,908,96);
  g.fillStyle="#fff4d7";g.fillRect(30,432,900,87);
  g.fillStyle="#f8d6ae";g.fillRect(43,444,67,62);
  g.drawImage(portrait,47,451,59,44);
  g.fillStyle="#96503f";g.font="bold 15px monospace";g.fillText("Clawd",126,460);
  g.fillStyle="#383447";g.font="bold 24px sans-serif";g.fillText(cue[1],126,494);
}
const portrait=new Image();portrait.src="../资源/A5060C2C-1223-4B33-A324-4388AEA7F60C.png";
