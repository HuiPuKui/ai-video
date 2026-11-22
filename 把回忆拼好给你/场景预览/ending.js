function stopClock(x,y,hour,minute,minuteColor="#545267"){
  box(x-12,y-12,24,24,"#505b70");box(x-10,y-10,20,20,"#fff0c9");
  for(const [time,span,length,color] of [[hour+minute/60,12,5,"#545267"],[minute,60,8,minuteColor]]){
    const a=time/span*Math.PI*2;
    for(let n=0;n<=length;n++)box(x+Math.sin(a)*n,y-Math.cos(a)*n,1,2,color);
  }
}
function differentSchedules(t){
  if(t<43.62){
    box(0,0,200,225,"#d0ddda");box(8,35,100,59,"#8799a0");box(11,38,94,53,"#9cdbed");
    for(let j=0;j<5;j++)box(13+j*18,70-(j*7)%19,14,21+(j*7)%19,"#91b7ca");
    box(58,37,3,55,"#ece4c9");
    box(0,144,200,81,"#ac9d91");
    // Desk pose: the animated square at the keyboard is the entire right hand.
    for(const x of [64,71,91,98])box(x,138,4,7,"#493e49");
    box(55,128,5,6,"#493e49");box(56,129,4,3,"#e76d5e");
    box(60,115,45,25,"#493e49");box(62,117,41,21,"#e76d5e");
    box(63,117,38,1,"#f8a189");box(62,136,41,2,"#c45650");
    box(76,122,3,7,"#493e49");box(96,122,3,7,"#493e49");
    box(13,142,172,7,"#886e62");box(20,149,6,25,"#6d6869");box(170,149,6,25,"#6d6869");
    box(113,95,54,35,"#48586c");box(116,98,48,28,"#a3ced7");
    for(let j=0;j<4;j++)box(120,102+j*5,12+(j*7)%19,2,"#61889b");
    box(136,130,5,8,"#525969");box(127,138,23,3,"#525969");box(93,138,32,3,"#5a6371");
    const keyLift=Math.round(2*(1-Math.cos((t-42)*18)));
    box(108,134-keyLift,4,4,"#e76d5e");
    box(200,0,200,225,"#686b89");box(237,35,123,65,"#46516c");box(242,39,112,55,"#6a687e");
    for(let j=0;j<7;j++)box(244+j*16,39,6,54,"#595970");box(299,39,3,55,"#ffe8be");
    box(215,146,169,15,"#806764");box(220,160,6,13,"#604f59");box(373,160,6,13,"#604f59");
    box(220,128,158,19,"#c8bcc3");box(226,117,46,22,"#f0dfcf");
    const breath=Math.round(Math.sin((t-42)*3));
    box(238,112+breath,38,24,"#956f80");box(240,114+breath,34,19,"#eca7b6");
    box(248,123+breath,5,1,"#674959");box(261,123+breath,5,1,"#674959");box(263,110+breath,10,3,"#f081a8");
    box(273,116+breath,101,28,"#94a1bb");box(274,116+breath,8,27,"#bec3d2");
  }else{
    const f=ease((t-43.62)/.85);
    box(0,0,200,225,"#eed4b3");box(12,35,85,60,"#956f60");box(16,39,77,52,"#e5a89e");
    box(67,47,13,13,"#ffdd97");box(51,39,3,52,"#d4b591");
    box(0,147,200,78,"#bd9b83");box(143,112,27,26,"#a58470");box(146,116,21,16,"#ddbc94");
    person(65,147,false,1.34);box(26,141,151,9,"#916f5e");box(33,150,6,24,"#795e55");box(166,150,6,24,"#795e55");
    const plateX=82+9*f;
    box(plateX-12,137,24,3,"#fff1cd");box(plateX-9,140,18,2,"#d0bab0");box(plateX-6,133,12,4,"#e1a266");
    box(plateX+15,132,1,9,"#685762");box(plateX+18,132,1,9,"#685762");
    box(plateX-2+Math.sin(t*4)*2,125,2,4,"#fff2d8");
    box(200,0,200,225,"#929daa");box(200,144,200,81,"#9fa5a9");
    box(316,32,72,114,"#647682");box(321,38,61,106,"#c1cfd0");box(326,44,51,41,"#759fae");
    box(360,104,14,3,"#63717b");
    const x=278+f*32;
    const feet=147-Math.sin(f*Math.PI*4)*1.5;
    person(x,feet,true,1.25,false,0,riders);
    box(x-13,133,28,6,"#7799a3");box(x-3,133,5,4,"#e8e5ce");
    box(334,104,12,19,"#475964");box(337,107,6,3,"#d2c5a8");
    box(x+27,feet-29,10,8,"#fff1ce");box(x+29,feet-27,3,3,"#d593aa");
  }
  const morning=t<43.62;
  const elapsedMinutes=(t-(morning?42:43.62))*30;
  stopClock(160,48,morning?9:19,(morning?10:0)+elapsedMinutes,"#bc574a");
  stopClock(morning?299:240,morning?18:48,morning?6:22,(morning?40:30)+elapsedMinutes,"#bc574a");
}
function platform(warm){
  box(0,0,400,225,warm?"#ffbf99":"#86dcff");
  box(0,73,400,41,warm?"#ffe8af":"#c6f2ff");
  for(let j=0;j<25;j++){
    const y=94-(j*13)%32;
    box(j*16,y,14,115-y,warm?"#db9ba1":"#77bcd9");
    box(j*16+3,y+5,3,3,warm?"#fff0bb":"#d8f6ff");
  }
  box(0,110,400,22,warm?"#c78e91":"#76a8bf");
  box(0,119,400,2,warm?"#ffd6b0":"#bce7ee");
  box(0,132,400,93,warm?"#f4cda9":"#c8e9ec");
  box(0,137,400,3,"#ffeca9");
  for(const x of [35,305]){
    box(x,128,60,5,"#957669");box(x-1,139,62,5,"#bb9273");
    box(x+4,144,4,11,"#756879");box(x+52,144,4,11,"#756879");
  }
}
function keepsakes(grip,gripY,photoGripX,photoGripY){
  for(const [dx,dy] of [[-8,-13],[-3,-19],[3,-14]]){
    for(let n=0;n<10;n++)box(grip+dx*n/9,gripY+dy*n/9,2,2,"#487658");
    const x=grip+dx,y=gripY+dy;
    box(x-4,y-2,8,4,"#c84a65");box(x-2,y-4,4,8,"#fb788d");box(x-1,y-1,2,2,"#ffe6a8");
  }
  box(grip-2,gripY-4,5,3,"#efbb70");
  const px=Math.round(photoGripX),py=Math.round(photoGripY-15);
  box(px,py,19,18,"#655361");box(px+1,py+1,17,16,"#fff0d7");
  water.drawImage(print,px+2,py+2,15,11);
}
const reunionRiders=[false,true].map(pink=>riderSprite(pink,0,0));
function reunionActor(x,y,pink){
  const side=pink?-1:1;
  water.save();water.translate(x,y);water.scale(side*1.04,1.04);
  water.drawImage(reunionRiders[Number(pink)],7*density,0,41*density,30*density,-16,-28,41,30);
  water.scale(-1,1);
  water.drawImage(reunionRiders[Number(pink)],39*density,0,9*density,30*density,16,-28,9,30);
  water.restore();
  return [x-side*1.04*19,y-1.04*13];
}
function reunion(t){
  const approach=ease((t-45)/1.35),merge=ease((t-46.18)/.96);
  const meet=ease((t-47.08)/1.22);
  platform(true);
  if(merge<1){
    water.save();water.beginPath();water.rect(0,0,200,225);water.clip();
    water.globalAlpha=1-merge;platform(false);water.restore();
    water.save();water.globalAlpha=1-merge;box(199,0,2,225,"#fff0cd");water.restore();
  }
  const distance=141-80*approach-42*meet;
  const step=2*Math.abs(Math.sin(Math.PI*(4*approach+3*meet)));
  const y=157-step;
  keepsakes(...reunionActor(200-distance,y,false),...reunionActor(200+distance,y,true));
}
const endingBeats=kickTimes.filter(time=>time>=49.18);
function handInHand(t){
  platform(true);
  const hit=endingBeats.findLastIndex(time=>time<=t);
  let lift=0;
  if(hit>=0){
    const start=endingBeats[hit],end=endingBeats[hit+1]??start+.43;
    const phase=Math.min(1,(t-start)/(end-start));
    lift=9*4*phase*(1-phase);
  }
  const redFeet=157-(hit%2===0?Math.round(lift):0);
  const pinkFeet=157-(hit%2===1?Math.round(lift):0);
  keepsakes(...reunionActor(181,redFeet,false),...reunionActor(219,pinkFeet,true));
  for(let i=Math.max(0,hit-2);i<=hit;i++){
    const age=t-endingBeats[i];
    if(age>1)continue;
    const side=i%2===0?-1:1;
    const x=200+side*(18+age*7),y=107-age*29;
    water.save();water.globalAlpha=1-ease((age-.5)/.5);
    const color=side<0?"#db536c":"#e46a99";
    box(x-5,y-3,4,3,color);box(x+1,y-3,4,3,color);box(x-5,y,10,3,color);
    box(x-3,y+3,6,2,color);box(x-1,y+5,2,2,color);
    water.restore();
  }
}
function ending(t){
  develop();water.imageSmoothingEnabled=false;
  if(t<45){
    differentSchedules(t);box(199,0,2,225,"#f7e5c5");
  }else if(t<48.5)reunion(t);
  else handInHand(t);
  g.imageSmoothingEnabled=false;g.drawImage(waterCanvas,0,0,960,540);
  const fade=ease((t-57.68)/1.14);
  if(fade){g.save();g.globalAlpha=fade;g.fillStyle="#202835";g.fillRect(0,0,960,540);g.restore()}
}
