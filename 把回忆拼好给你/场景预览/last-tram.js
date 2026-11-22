const movie=document.getElementById("movie"), g=movie.getContext("2d");
const caption=["我们都是渺小真实存在","祈愿小世界里不只有挫败","直到遇见你我以为就光明起来","眼睛里看到的都是广袤无垠的大海","有你在的日子里不可能被取代","在最灰暗的日子你陪着我发呆","你让我学会如何拨开阴霾","将快乐全部收集将不开心全都淘汰","你对我说的情话","像转瞬即逝的烟花","只停在绽放一刹那","我却已无法自拔","我们的爱总有时差","也为你骗自己放下","爱炙热的你却忘了爱自己"];
const lyricTimes=[1.5,5,8,11.5,15.5,19,22.5,25.5,28,31.5,35,38,42,45,48.5,52.5];
// Estimated syllable onsets in seconds from the source audio, one row per caption.
const lyricOnsets=[
  [1.81,2.42,2.68,3.30,3.50,3.70,3.90,4.12,4.40,4.78],
  [5.00,5.14,5.37,5.66,5.89,6.17,6.53,6.79,7.15,7.34,7.58],
  [8.47,8.68,8.89,9.08,9.30,9.52,9.70,9.78,9.96,10.18,10.42,10.80,11.24],
  [11.85,12.04,12.10,12.26,12.48,12.56,12.72,12.88,12.97,13.12,13.18,13.34,13.54,13.76,13.82],
  [15.74,15.94,16.14,16.35,16.52,16.78,17.12,17.20,17.40,17.64,17.82,18.06,18.48],
  [19.14,19.34,19.55,19.74,19.96,20.14,20.22,20.44,20.62,20.83,21.04,21.47,21.90],
  [22.56,22.78,23.08,23.18,23.37,23.59,23.82,24.01,24.22,24.46,24.87],
  [25.70,25.88,26.06,26.12,26.32,26.52,26.58,26.76,26.97,27.15,27.21,27.39,27.63,27.79,27.95],
  [28.00,28.28,28.68,29.16,29.58,29.99,30.44],
  [31.50,31.72,32.16,32.55,32.92,33.14,33.43,33.82],
  [35.13,35.52,35.96,36.32,36.38,36.54,36.80,37.22],
  [38.53,38.92,39.33,39.75,40.21,40.63,41.00],
  [42.28,42.57,42.84,43.36,43.59,43.73,44.01,44.47],
  [45.08,45.44,45.73,46.16,46.74,46.98,47.43,47.85],
  [48.75,49.18,49.61,49.96,50.20,50.41,50.61,50.87,51.33,51.73,52.11],
];
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
// Low-frequency attack peaks measured in seconds from the source MP3.
const kickTimes=[1.87,2.29,2.72,3.15,3.57,4,4.42,4.85,5.28,5.71,6.13,6.57,6.98,7.41,7.83,8.26,8.68,9.12,9.54,9.96,10.38,10.83,11.24,11.67,12.09,12.52,12.95,13.37,13.8,14.22,14.65,15.29,15.5,15.93,16.35,16.78,17.21,17.63,18.06,18.48,18.91,
  22.75,23.17,23.60,24.02,24.45,24.88,25.30,25.73,26.15,26.58,27.01,27.43,
  28.07,28.29,28.92,29.14,29.58,29.99,30.42,30.84,31.27,31.69,32.13,32.55,32.97,33.39,33.84,34.25,34.68,35.09,35.53,35.96,36.38,36.81,37.25,37.66,38.09,38.51,38.94,39.36,39.80,40.22,40.64,41.06,41.49,41.92,
  42.28,42.56,42.77,43.20,43.62,44.05,44.47,44.90,45.33,45.76,46.18,46.61,47.03,47.46,47.89,48.31,48.74,49.18,49.59,50.02,50.44,50.87,51.29,51.72,52.15,52.57,52.99,53.43,53.85,54.28,54.70,55.13,55.56];
function sunAccent(t){
  const hit=kickTimes.findLast(time=>time<=t);
  if(hit===undefined)return 0;
  const age=t-hit;
  return age<.045?ease(age/.045):1-ease((age-.045)/.20);
}
const windowGroups=[
  [[8,11],[19,8],[41,13],[55,8],[4,23],[22,25],[46,21]],
  [[6,10],[34,7],[47,12],[14,20],[36,24]],
  [[2,12],[16,7],[31,13],[48,6],[58,14],[9,23],[29,20],[51,24]],
  [[7,7],[23,11],[45,8],[4,20],[17,25],[45,20]]
];
function windowCrowd(brush,x,y,w,h,index){
  brush.save();brush.translate(x,y);brush.scale(w/60,h/40);
  brush.beginPath();brush.rect(0,0,60,40);brush.clip();
  for(const [cx,cy] of windowGroups[index%windowGroups.length]){
    const front=cy>=20,width=front?20:15,height=front?14:11;
    const left=cx-Math.floor(width/2);
    brush.fillStyle=front?"#686e79":"#808b96";
    brush.fillRect(left-2,cy+5,width+4,4);brush.fillRect(left,cy,width,height);
    brush.fillStyle=front?"#b2b3b6":"#a1aab0";brush.fillRect(left+1,cy+1,width-2,height-3);
    brush.fillStyle="#545c69";brush.fillRect(left+4,cy+3,2,4);brush.fillRect(left+width-5,cy+3,2,4);
    brush.fillRect(left+2,cy+height,2,3);brush.fillRect(left+width-5,cy+height,2,3);
  }
  brush.restore();
}
function tram(t){
  const offset=680*(1-ease((t-.9)/2.55));
  ctx.save();ctx.translate(offset,0);
  rect(140,182,755,140,"#363b50");rect(144,186,748,124,"#fff1ce");
  rect(153,177,716,7,"#f4bf7e");rect(160,172,687,6,"#435466");
  rect(145,277,745,21,"#e86049");rect(145,301,745,6,"#ea9170");
  for(let j=0;j<8;j++){
    const x=158+j*87;if(x>400&&x<540)continue;
    rect(x,205,78,63,"#344e63");rect(x+3,208,72,57,"#a3e3ea");
    windowCrowd(ctx,x+3,208,72,57,j);
    polygon([[x+4,210],[x+26,210],[x+6,241]],"#daf3ed");
    rect(x+37,207,3,60,"#fff0cf");rect(x+6,260,64,4,"#ddb488");
  }
  rect(425,192,108,122,"#424356");rect(431,199,97,109,"#ffcd88");
  rect(435,204,90,41,"#8ed3de");rect(431,290,97,17,"#b6785e");
  lettering("07   海 岸",167,200,10,"#413e50");
  ctx.restore();
  const reopen=ease((t-8.72)/1.20);
  if(reopen>0)clawd(482,292,.94,true,0);
  const open=ease((t-3.57)/.48)-ease((t-5.76)/.75)+reopen;
  const panel=50*(1-open);
  for(const x of [offset+429,offset+529-panel]){
    rect(x,197,panel,116,"#f3ce9f");
    if(panel>4){rect(x+2,207,panel-4,48,"#65879b");rect(x,278,panel,19,"#df654e")}
  }
  rect(offset+527,261,12,16,"#46566a");rect(offset+530,264,6,9,t<8?"#f68866":"#9beaa8");
}
// Passengers at different depths have independent walking speeds and boarding times.
const walkers=[[23,328,15,.7],[64,335,17,.79],[230,315,-16,.53],[252,313,-15,.51],[286,319,-14,.61],[543,325,21,.67],[717,313,-19,.54],[747,319,-20,.62],[844,333,-10,.79]];
const queue=[[364,343,.81,4.23,5.24],[413,348,.89,4.10,4.91],[467,335,.76,3.85,4.44],[542,341,.83,4.06,4.74],[597,347,.91,4.36,5.41],[625,337,.73,4.48,5.64]];
function city(t){
  street(Math.min(t,4),sunAccent(t));
  tram(t);
  const people=walkers.map(([x,y,v,s],i)=>[x+v*t,y,s,t+i*.37]);
  queue.forEach(([x,y,s,a,b],i)=>{
    const u=ease((t-a)/(b-a));
    if(u<1)people.push([x+(479-x)*u+(i%2?9:-9)*(1-ease(t/3)),y+(300-y)*u,s,t+i*.41]);
  });
  people.sort((a,b)=>a[1]-b[1]).forEach(([x,y,s,phase])=>clawd(x,y,s,false,phase,true));
  const approach=ease((t-1.4)/5.05);
  const reach=ease((t-6.32)/.28)*(1-ease((t-6.9)/.44));
  const relief=ease((t-9.20)/.55);
  const slump=ease((t-6.94)/.55)*(1-relief);
  const hop=Math.sin(Math.PI*ease((t-9.76)/.5))*9;
  const forward=ease((t-10.2)/.7);
  if(relief){
    ctx.save();ctx.globalAlpha=relief*.30;
    polygon([[438,308],[520,308],[558,360],[422,360]],"#fff4a2");ctx.restore();
  }
  clawd(180+293*approach-7*slump+9*forward,354-hop-8*forward,1.06,false,t<6.45||forward>0&&forward<1?t:0,false,true,reach+.55*relief,slump);
  const z=1+.68*ease((t-5)/.65);
  const w=400/z,h=225/z;
  g.imageSmoothingEnabled=false;
  g.drawImage(canvas,(400-w)*.60*density,(225-h)*.76*density,w*density,h*density,0,0,960,540);
}
function doorCloseup(t,inside){
  const gap=inside?20*ease((t-8.72)/.23):20+373*ease((t-8.95)/1.38);
  // Both angles share the same centre line and initial aperture on the reverse cut.
  rect(0,0,800,450,inside?"#ade1f5":"#ffe6ad");
  rect(0,240,800,210,inside?"#f4d49f":"#c08a72");
  if(!inside){
    rect(67,47,650,115,"#465b71");rect(76,55,631,97,"#a4dcea");
    for(const x of [154,516,659])rect(x,55,6,99,"#657d8c");
    rect(94,221,450,35,"#df896c");rect(94,255,450,12,"#8b6664");
    rect(544,31,7,251,"#a98454");rect(548,31,3,251,"#ffedb9");
  }
  clawd(inside?450:438,inside?347:339,inside?5.3:4.35,!inside,0,false,inside);
  if(!inside){rect(556,201,28,42,"#4d5960");rect(561,207,18,26,"#93d79a");rect(530,214,42,15,"#f5a5b8")}
  for(const sign of [-1,1]){
    const x=sign<0?400-gap-410:400+gap;
    rect(x,0,410,450,inside?"#d4af88":"#f2c396");
    rect(x+12,0,385,450,inside?"#ecd2ac":"#ffe9bf");
    rect(x+48,28,312,139,"#415669");rect(x+54,34,300,126,"#79afbd");
    polygon([[x+61,38],[x+156,38],[x+64,128]],"#b3d8d7");
    rect(x,287,410,28,inside?"#c89975":"#dd624f");
    rect(sign<0?x+404:x,0,6,450,"#3b4350");
  }
  if(inside){
    // Fixed cab-side switch. The arm overlaps its face throughout the hold.
    rect(0,0,238,450,"#936e60");rect(0,0,228,450,"#e4b78e");
    rect(89,95,107,151,"#6d5a58");rect(95,99,95,140,"#405366");
    rect(104,108,77,10,t>=8.34?"#b5efac":"#ebbe78");
    const press=ease((t-8.04)/.32);
    rect(110,139+press*5,65,60-press*5,"#a2dcaa");
    polygon([[117,169],[133,154],[133,183]],"#365c59");polygon([[167,169],[151,154],[151,183]],"#365c59");
    const tip=38+press*108;
    rect(-18,178,tip+20,38,"#985c75");rect(-18,172,tip+14,34,"#ffaec5");
    rect(tip-12,164,22,28,"#f8a0ba");rect(tip-10,165,18,5,"#ffd1d9");
  }
  g.imageSmoothingEnabled=false;g.drawImage(canvas,0,0,960,540);
}
const waterCanvas=document.createElement("canvas");
waterCanvas.width=canvas.width;waterCanvas.height=canvas.height;
const water=waterCanvas.getContext("2d");
water.scale(density,density);
const colourLayer=document.createElement("canvas");
colourLayer.width=canvas.width;colourLayer.height=canvas.height;
const colourInk=colourLayer.getContext("2d");
function riderSprite(pink,reach,armAngle){
  ctx.clearRect(0,0,150,90);
  clawd(72,62,1,pink,0,false,!pink,reach,0,armAngle);
  const sprite=document.createElement("canvas");sprite.width=48*density;sprite.height=30*density;
  const brush=sprite.getContext("2d");brush.imageSmoothingEnabled=false;
  brush.drawImage(canvas,13*density,3*density,48*density,28*density,0,0,48*density,28*density);
  return sprite;
}
const riders=[false,true].map(pink=>riderSprite(pink,.6));
const relaxedRiders=[false,true].map(pink=>riderSprite(pink,0,.88));
function waterShape(path,color){
  water.fillStyle=color;water.fill(new Path2D(path));
}
function splash(x,y,age,size){
  if(age<0||age>.40)return;
  const f=age/.40;
  water.fillStyle="#e7fff3";
  for(let i=-3;i<=3;i++){
    const dx=Math.round(i*(1+f*size));
    const dy=Math.round(Math.sin(Math.PI*f)*(4-Math.abs(i)*.6)*size);
    water.fillRect(Math.round(x+dx),Math.round(y-dy),2,2);
  }
}
function dolphin(t,start,x,y){
  const age=t-start, duration=.85;
  if(age<0||age>duration+.40)return;
  splash(x,y,age,2);splash(x+38,y,age-duration,2.7);
  if(age>duration)return;
  const f=age/duration;
  water.save();water.beginPath();water.rect(0,0,400,y);water.clip();
  water.translate(Math.round(x+38*f),Math.round(y+4-24*4*f*(1-f)));
  water.rotate(Math.atan2(96*(2*f-1),38)*.72);
  waterShape("M-11 4 L-16 1 L-15 6 L-18 8 L-11 7 L-6 3 L0 4 L4 7 L3 3 L8 1 L13 0 L13 -2 L8 -2 L5 -5 L1 -6 L-3 -10 L-3 -5 L-7 -3Z","#365f87");
  waterShape("M-8 2 L-3 -2 L3 -3 L8 -1 L12 -1 L8 1 L1 2 L-5 1Z","#9bd9e5");
  water.fillStyle="#253c59";water.fillRect(6,-3,1,1);water.restore();
}
function tandem(t){
  const u=t-15.5;
  const step=sunAccent(t), flight=Math.max(0,1-((t-17.205)/.425)**2);
  const x=98+65*ease(u/1.2)+u*13;
  const crest=247-u*54;
  // A travelling swell raises the board before the paired jump.
  function height(px){return 173+3*Math.sin(px*.045+u*4)-17*Math.exp(-((px-crest)**2)/700)}
  let face="M0 225";
  for(let px=0;px<=400;px+=3)face+=" L"+px+" "+Math.round(height(px));
  waterShape(face+" V225Z","#1989b4");
  for(let px=0;px<400;px+=4){
    water.fillStyle=Math.abs(px-crest)<24?"#d4fff0":"#69d5e4";
    water.fillRect(px,Math.round(height(px)),4,2);
  }
  const y=height(x)-3-31*flight;
  for(let j=0;j<13;j++){
    const gap=(u*65+j*5)%63;
    water.fillStyle=j%2?"#b7f6ef":"#65cfdf";water.fillRect(Math.round(x-46-gap),Math.round(height(x-gap)-2-gap*.07),4+j%3,2);
  }
  water.save();water.translate(Math.round(x),Math.round(y));
  water.rotate(-.065+.07*Math.sin(u*5)-.13*flight);
  waterShape("M-55 -2 L42 -3 L53 -7 L51 -2 L41 2 L-44 5 L-55 2Z","#af5449");
  waterShape("M-55 -3 L41 -5 L53 -8 L51 -5 L41 -2 L-43 1Z","#ffdb88");
  for(let i=0;i<2;i++){
    water.save();water.translate(i?20:-22,-3);water.scale(.95,1-.10*(i?sunAccent(t-.09):step));
    // Use the same four-legged silhouettes, eye placement and clip as the station sprites.
    water.imageSmoothingEnabled=false;
    water.drawImage(riders[i],-23,-28,48,30);
    water.restore();
  }
  water.restore();splash(x-35,Math.round(height(x)),t-17.63,4);
}
function ocean(t){
  const u=t-11.5;
  function tile(x,y,w,h,color){
    water.fillStyle=color;water.fillRect(Math.round(x),Math.round(y),w,h);
  }
  tile(0,0,400,225,"#79cdff");
  tile(0,71,400,20,"#a0dfff");tile(0,91,400,8,"#c7edfb");
  for(const [x,y,w] of [[26,38,37],[103,56,20],[307,29,45]]){
    tile(x-u,y,w,2,"#f1fcff");tile(x+6-u,y-2,w-15,2,"#f1fcff");
  }
  const r=Math.round(15*(1+.24*sunAccent(t)));
  for(let y=-r;y<=r;y++){
    const half=Math.round(Math.sqrt(r*r-y*y));
    tile(276-half,61+y,half*2+1,1,"#fff3c4");
  }
  tile(0,99,400,126,"#369ac7");
  tile(0,99,400,2,"#ddf7ee");tile(0,102,400,7,"#80d7e8");
  for(let band=0;band<6;band++){
    const depth=band/5, y=110+depth*depth*108;
    const spacing=22+band*9;
    for(let j=-1;j<400/spacing+2;j++){
      const x=j*spacing+(band*13-u*(2+band*2.4))%spacing;
      const h=Math.round((1+band*.6)*Math.sin(j*2.1+u*2+band));
      tile(x,y+h,7+band*3,band<3?1:2,band%2?"#67c9da":"#2589bc");
      tile(x+4,y+h-1,4+band,1,"#a4e5e8");
    }
  }
  for(let j=0;j<13;j++){
    const y=103+j*4,x=276+Math.sin(j*3+u*2.8)*(3+j*1.2);
    tile(x-j*.65,y,4+j,1+(j%3===0),"#fff0bd");
  }
  dolphin(t,13.37,269,107);
  dolphin(t,13.80,313,111);
  if(t>=15.5)tandem(t);
}
const canopy=document.createElement("canvas");
canopy.width=61*density;canopy.height=19*density;
const canopyInk=canopy.getContext("2d");
canopyInk.scale(density,density);
for(let x=-30;x<=30;x++){
  const f=x/30;
  const crown=Math.round(13*(1-Math.sqrt(1-f*f)));
  const hem=16+2*(Math.cos(f*Math.PI*3)>0);
  canopyInk.fillStyle="#88672e";canopyInk.fillRect(x+30,crown,1,hem-crown);
  canopyInk.fillStyle=f<-.4?"#eebd51":f<.3?"#ffda72":"#e3af41";
  canopyInk.fillRect(x+30,crown+1,1,hem-crown-2);
}
function quietBeach(t){
  const u=t-19;
  const tile=(x,y,w,h,c)=>{water.fillStyle=c;water.fillRect(Math.round(x),Math.round(y),w,h)};
  tile(0,0,400,225,"#a9b0b6");
  for(const [x,y,w] of [[-8,28,86],[66,30,31],[196,47,56],[221,44,72],[302,22,105]]){
    tile(x,y,w,3,"#9fa7ae");tile(x+6,y+3,w-12,2,"#a4acb2");
  }
  tile(0,78,400,5,"#bdc2c3");tile(0,83,400,142,"#83969e");
  for(let j=0;j<33;j++)tile((j*71+u*1.2)%410-10,87+j%6*5,7+j%17,1,"#a0adb1");
  for(let x=0;x<400;x+=2){
    const edge=118+.068*x+3*Math.sin(x*.036+u*.85)+1.4*Math.sin(x*.11-u*.5);
    tile(x,edge,2,225,"#b5b1aa");tile(x,edge+2,2,5,"#a7aaa7");
    tile(x,edge,2,1+(Math.sin(x*.07)>0),"#d1d3cd");
  }
  for(let j=0;j<50;j++)tile((j*73)%398,151+(j*31)%69,1+j%3,1,"#a3a29e");
  function seated(x,y,pink,lower){
    const outline="#5b5a60", coat=pink?"#c698a1":"#b8857c";
    tile(x-14,y+1,32,2,"#999791");
    tile(x-11,y-5,6,6,outline);tile(x+6,y-5,6,6,outline);
    const top=y-22+lower;
    tile(x-15,top,31,19,outline);tile(x-14,top+1,29,15,coat);
    if(!pink||u<1.45){
      tile(x-18,top+11,4,5,outline);tile(x-17,top+11,3,3,coat);
    }
    tile(x+15,top+10,4,5,outline);tile(x+15,top+11,3,3,coat);
    if(pink){tile(x+6,top-2,8,3,"#83556a");tile(x+7,top-2,6,1,"#edb6c5")}
  }
  seated(162,175,false,3);
  const shift=ease((u-.48)/.95);
  seated(213-16*shift,175,true,Math.round(3*shift));
  if(u>=1.45){
    const raise=ease((u-1.45)/.3), open=ease((u-1.70)/.32);
    const lean=ease((u-1.98)/.36);
    const gripX=180+Math.round(2*raise), gripY=167-Math.round(7*raise);
    water.save();water.translate(gripX,gripY);water.rotate(-Math.PI/30*lean);
    const topX=0, topY=-Math.round(40*raise);
    tile(0,topY,2,1-topY,"#575763");
    const span=Math.round(2+28*open);
    water.imageSmoothingEnabled=false;
    water.drawImage(canopy,-span,topY,2*span+1,19);
    tile(topX,topY-2,2,3,"#88672e");water.restore();
    tile(gripX-1,gripY,5,4,"#655e70");tile(gripX,gripY,4,2,"#d1a4ac");
  }
  g.imageSmoothingEnabled=false;g.drawImage(waterCanvas,0,0,960,540);
}
function beachQuest(t){
  const tile=(x,y,w,h,c)=>{water.fillStyle=c;water.fillRect(Math.round(x),Math.round(y),w,h)};
  const actor=(x,y,pink)=>water.drawImage(riders[Number(pink)],Math.round(x-23),Math.round(y-28),48,30);
  const slide=ease((t-22.5)/.62);
  const right=ease((t-23.10)/1.08),left=ease((t-23.83)/1.24);
  const collect=ease((t-25.45)/.42);
  const redX=162-55*left+31*collect+17*ease((t-25.96)/.65);
  const pinkX=197+67*right-19*collect;
  water.imageSmoothingEnabled=false;
  tile(0,0,400,225,"#83d5fa");tile(0,78,400,5,"#c4edec");tile(0,83,400,125,"#4aaac4");
  const sunScale=1+.24*sunAccent(t);
  water.save();water.translate(265.5,51);water.scale(sunScale,sunScale);water.translate(-265.5,-51);
  tile(256,39,19,24,"#fff1ae");tile(253,44,25,15,"#fff1ae");
  water.restore();
  for(let j=0;j<36;j++)tile((j*73+t*2)%408-8,86+j%8*4,6+j%12,1,"#91e3dd");
  for(let x=0;x<400;x+=3){
    const y=123+x*.045+Math.sin(x*.04+t)*2;
    tile(x,y,3,110,"#f4d699");tile(x,y,3,2,"#e3f4de");tile(x,y+2,3,5,"#d8be8e");
  }
  // A low fog bank breaks at the two hands, revealing the coloured beach behind it.
  for(const side of [-1,1]){
    const push=side<0?left:right;
    const centre=(side<0?105:267)+side*push*235;
    for(let j=-6;j<=6;j++){
      const h=9+Math.round(14*Math.abs(Math.sin(j*2.1+side)));
      const y=119-slide*11+(j%3)*3;
      tile(centre+j*15,y-h,26,h+29,"#788590");
      tile(centre+j*15+2,y-h-4,22,7,"#909ca4");
      tile(centre+j*15+3,y+25,18,5,"#697985");
    }
  }
  const windup=ease((t-26.44)/.20)*(1-ease((t-26.66)/.14));
  const release=ease((t-26.66)/.13)*(1-ease((t-26.88)/.24));
  actor(redX,174,false);actor(pinkX-3*windup+4*release,174+3*windup-3*release,true);
  if(release>0)tile(pinkX+18,148-release*7,5+5*release,5,"#ffaec8");
  if(t<25.5){
    for(const [x,dir,push] of [[redX,-1,left],[pinkX,1,right]]){
      if(push>0&&push<1){
        tile(x+dir*22-4,151,9,5,dir<0?"#e76d5e":"#ffaec8");
        for(let j=0;j<3;j++)tile(x+dir*(27+j*4),144+j*5,3,1,"#fff3cf");
      }
    }
  }
  function token(x,y,happy,size=1){
    water.save();water.translate(Math.round(x),Math.round(y));water.scale(size,size);
    const rim=happy?"#b67a37":"#546174", face=happy?"#ffd463":"#97a0ad";
    tile(-5,-6,10,12,rim);tile(-7,-4,14,8,rim);tile(-5,-4,10,8,face);
    tile(-3,-2,1,2,rim);tile(2,-2,1,2,rim);
    tile(-2,happy?2:1,4,1,rim);tile(-3,happy?1:2,1,1,rim);tile(2,happy?1:2,1,1,rim);
    water.restore();
  }
  const catches=[25.64,26.02,26.41];
  const caught=catches.filter(hit=>t>=hit).length;
  for(const [j,hit] of catches.entries()){
    const f=(t-hit+.56)/.56;
    if(f>=0&&f<1)token(redX+24+(1-f)*(j%2?23:-27),44+102*f*f,true);
    if(t>=hit&&t<hit+.19){
      const d=5+36*(t-hit);tile(redX+24-d,141-d,2,3,"#fff2bd");tile(redX+24+d,141-d,2,3,"#fff2bd");
    }
  }
  if(t>=25.47){
    tile(redX+12,148,26,5,"#9f654b");tile(redX+15,153,20,6,"#d9935e");
    for(let j=0;j<caught;j++)token(redX+17+j*7,147,true,.61);
    tile(333,12,54,15,"#344659");token(342,19,true,.76);
    water.fillStyle="#fff0c6";water.font="bold 10px monospace";water.fillText(caught+"/3",352,23);
  }
  for(let j=0;j<14;j++){
    const f=(t-24.96-j*.087)/.63;
    if(f>=0&&f<1){
      const origin=56+(j*53)%280;
      token(origin+(pinkX+20-origin)*f,43+(j%3)*6+98*f*f,false,.7+(j%3)*.14);
    }
  }
  if(t>=25.59){
    const flight=ease((t-26.67)/.66);
    const x=pinkX+19+65*flight-3*windup;
    const y=147+3*windup-40*flight-48*Math.sin(Math.PI*flight);
    const size=.7+ease((t-25.59)/.9)*.95;
    if(t<27.34)token(x,y,false,size);
    if(t>=27.30){
      const dive=ease((t-27.30)/.55),surface=112-130*dive;
      // Water rises across the lens as the camera follows the bundle down.
      tile(0,surface,400,245,"#257f9e");tile(0,surface,400,4,"#bbefdf");
      for(let j=0;j<18;j++)tile((j*71)%400,surface+12+j%6*25,8+j%12,1,"#368da5");
      for(let j=0;j<11;j++){
        const yy=115+j*8-(t-27.30)*(22+j*3);
        if(yy>surface+4){tile(x-12+(j*7)%24,yy,3,3,"#9cdddd");}
      }
      token(x,110+dive*12,false,size*(1-.20*dive));
      splash(x,surface,t-27.30,4);
    }
  }
  // Fade out the preceding grey beach as the cloud front reaches the characters.
  if(t<23.12){
    colourInk.drawImage(waterCanvas,0,0);
    quietBeach(t);water.globalAlpha=slide;water.drawImage(colourLayer,0,0,400,225);water.globalAlpha=1;
  }
  g.imageSmoothingEnabled=false;g.drawImage(waterCanvas,0,0,960,540);
}
function eyeToSea(t){
  ocean(t);
  const progress=ease((t-11.5)/1.55);
  if(progress>=1){g.imageSmoothingEnabled=false;g.drawImage(waterCanvas,0,0,960,540);return}
  // Right eye centre in the street's 400 x 225 sprite coordinates.
  const eyeX=241+10*1.06,eyeY=173-14.5*1.06;
  const streetZoom=1.68,px=(eyeX-(400-400/streetZoom)*.60)*2.4*streetZoom;
  const py=(eyeY-(225-225/streetZoom)*.76)*2.4*streetZoom;
  const magnification=Math.pow(150,progress);
  g.save();g.translate(px+(480-px)*progress,py+(270-py)*progress);
  g.scale(magnification,magnification);g.translate(-px,-py);
  city(11.5);
  // Widescreen reflection fits inside the original eye at the start of the push.
  g.globalAlpha=ease(progress/.23);
  g.drawImage(waterCanvas,px-3.2,py-1.8,6.4,3.6);
  g.restore();
}
function skyIntro(t){
  const descent=ease(t/1.20);
  const lift=Math.round(540*descent);
  rect(0,0,800,450,looks[0][1]);
  for(const [x,y,w] of [[59,91,95],[493,142,130],[630,55,60],[290,331,69]]){
    rect(x,y,w,6,"#e6f7ff");rect(x+13,y-5,w*.54,6,"#f5fcff");
  }
  g.save();g.translate(0,-lift);g.imageSmoothingEnabled=false;
  g.drawImage(canvas,0,0,960,540);
  if(lift){g.translate(0,540);city(1.5)}
  g.restore();
}
function moodRow(y,pink,value,x=20){
  g.save();g.translate(x,y);g.scale(1.5,1.5);
  g.fillStyle="#30384a";g.fillRect(0,0,144,41);
  g.fillStyle="#fff3d5";g.fillRect(2,2,140,37);
  g.fillStyle=pink?"#ffc4d1":"#ffc5a6";g.fillRect(5,5,31,31);
  g.fillStyle="#503c47";g.fillRect(7,13,27,15);
  g.fillStyle=pink?"#ffaec8":"#e76d5e";g.fillRect(8,14,25,13);
  g.fillStyle="#493e49";g.fillRect(14,17,2,5);g.fillRect(25,17,2,5);
  if(pink){g.fillStyle="#ba4679";g.fillRect(23,11,9,3)}
  g.fillStyle="#483d49";g.font="bold 19px sans-serif";g.fillText("心情",44,21);
  g.font="bold 19px monospace";g.textAlign="right";g.fillText(String(value),135,21);
  g.fillStyle="#dfcdbb";g.fillRect(45,23,88,8);
  g.fillStyle=pink?"#d05c88":"#cb6552";g.fillRect(45,23,Math.round(.88*value),8);
  g.restore();
}
function renderFrame(t){
  g.setTransform(movie.width/960,0,0,movie.height/540,0,0);
  const beatZoom=1+.008*sunAccent(t);
  g.translate(480,270);
  g.scale(beatZoom,beatZoom);
  g.translate(-480,-270);
  if(t<1.5)skyIntro(t);else if(t>=8&&t<8.95)doorCloseup(t,true);else if(t<11.5)city(t);else if(t>=42)ending(t);else if(t>=28)chorus(t);else if(t>=22.5)beachQuest(t);else if(t>=19)quietBeach(t);else{
    eyeToSea(t);
  }
  const i=lyricTimes.findLastIndex(start=>t>=start);
  if(i<0||i>=caption.length)return;
  g.setTransform(movie.width/960,0,0,movie.height/540,0,0);
  if(t>=42){
    const reunionFill=ease((t-45)/3.3);
    moodRow(16,false,22+Math.floor(78*reunionFill));
    moodRow(16,true,27+Math.floor(73*reunionFill),724);
  }else if(t>=26.5){
    const fill=ease((t-26.5)/1.5);
    moodRow(16,false,80+Math.floor(20*fill));
    moodRow(84,true,86+Math.floor(14*fill));
  }else{
    moodRow(16,false,t>=19?30+Math.round(50*ease((t-23.8)/2.65)):Math.round(62-40*ease((t-6.55)/.9)+68*ease((t-9.2)/1.15)));
    if(t>=9.44)moodRow(84,true,t>=19?54+Math.round(32*ease((t-23.1)/3.35)):Math.round(78+12*ease((t-9.7)/1.1)));
  }
  g.setTransform(movie.width/960,0,0,movie.height/540,0,0);
  g.fillStyle="#30384a";g.fillRect(26,430,908,94);g.fillStyle="#fff3d5";g.fillRect(29,433,902,88);
  g.fillStyle="#be5846";g.fillRect(40,443,5,66);g.fillStyle="#814e46";g.font="bold 18px monospace";g.fillText("Clawd",58,458);
  const visible=1+lyricOnsets[i].findLastIndex(onset=>t>=onset);
  g.fillStyle="#313846";g.font="bold 43px sans-serif";g.fillText(caption[i].slice(0,visible),56,507);
}
