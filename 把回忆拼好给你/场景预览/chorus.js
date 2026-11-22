// Times refer to the first outward spark, including the held gold bloom.
const blooms=[
  [31.69,204,59,48,"#ffd173",36],[32.13,310,84,31,"#ff91a1",24],
  [32.55,99,73,39,"#86e5ee",27],[32.97,230,89,25,"#ffcf93",24],[33.39,266,43,42,"#ffba77",32],
  [33.84,155,66,32,"#ff94af",27],[34.25,342,68,24,"#83dfed",21],
  [34.68,116,57,35,"#ffb5cb",28],[35.09,212,61,63,"#ffce74",54]
];
function nightTile(x,y,w,h,c){
  water.fillStyle=c;water.fillRect(Math.round(x),Math.round(y),w,h);
}
function nightHarbour(t){
  const tile=nightTile;
  tile(0,0,400,225,"#26375d");tile(0,54,400,36,"#39496c");
  tile(0,90,400,20,"#565a77");tile(0,110,400,18,"#877282");
  for(let j=0;j<55;j++){
    const x=(j*131)%400,y=(j*73)%96;
    tile(x,y,1+(j%13===0),1,j%4?"#95a2bd":"#f4d6ad");
  }
  for(let j=0;j<51;j++){
    const x=j*8,h=4+((j*13)%19);
    tile(x,130-h,9,h,"#37445e");
    if(j%3)tile(x+3,132-h,1,2,"#e8b78d");
  }
  tile(0,129,400,96,"#254d69");
  for(let j=0;j<76;j++){
    const x=((j*107-t*(1+j%4))%410+410)%410-5,y=131+(j*13)%88;
    tile(x,y,2+j%11,1,j%4?"#38637b":"#73919c");
  }
  for(let j=0;j<8;j++)tile(j*54-12,173,5,52,"#33354b");
  tile(0,173,400,6,"#a37f75");tile(0,179,400,4,"#5a505c");
  for(let j=0;j<22;j++)tile(j*19+2,175,14,1,"#c69a84");
}
function fireworks(t){
  for(const [index,[start,x,y,size,color,n]] of blooms.entries()){
    const launch=index?blooms[index-1][0]:31.27;
    if(t>=launch&&t<start){
      const p=(t-launch)/(start-launch);
      const direction=index%2?1:-1;
      for(let k=4;k>=0;k--){
        const f=Math.max(0,p-k*.048);
        const headX=x+direction*13*(1-f);
        const headY=y+(129-y)*(1-f)**1.4;
        nightTile(headX,headY,k===0?3:2,k===0?4:2,k===0?"#fff2cd":color);
      }
    }
    const hero=start===35.09;
    const age=t-start;
    if(age<0||age>2.28)continue;
    const radius=size*(1-Math.exp(-age*3.45));
    water.save();water.globalAlpha=1-ease((age-.91)/1.37);
    for(let j=0;j<n;j++){
      const a=j*Math.PI*2/n,reach=radius*(.84+.16*Math.sin(j*17.3)**2);
      for(let k=0;k<4;k++){
        const r=reach*(1-k*.068);
        nightTile(x+Math.cos(a)*r,y+Math.sin(a)*r*.87+age*age*5, k===0?2:1,hero?2:1,k===0?"#fff2cd":color);
      }
      if(hero&&j%2===0)nightTile(x+Math.cos(a)*radius*.6,y+Math.sin(a)*radius*.57,2,2,"#ffa2ad");
    }
    // Short horizontal fragments give the reflection its own wave movement.
    for(let j=0;j<12;j++){
      const drift=Math.sin(t*3+j*5)*radius*(.15+j*.034);
      nightTile(x+drift,131+j*2,2+Math.round(radius*.14),1,j%3?color:"#ffebbc");
    }
    water.restore();
  }
}
const shutterTime=35.96;
const box=nightTile;
function person(x,y,pink,s=1,mirror=false,tilt=0,poses=relaxedRiders){
  water.save();water.translate(x,y);water.rotate(tilt);water.scale(mirror?-s:s,s);
  water.drawImage(poses[Number(pink)],-23,-28,48,30);water.restore();
}
const bubbleSprite=document.createElement("canvas");
bubbleSprite.width=35;bubbleSprite.height=19;
{
  const ink=bubbleSprite.getContext("2d");
  ink.fillStyle="#4f4255";ink.fillRect(2,0,31,15);ink.fillRect(0,2,35,11);ink.fillRect(7,14,5,3);ink.fillRect(7,17,2,2);
  ink.fillStyle="#fff3da";ink.fillRect(2,2,31,11);ink.fillRect(8,12,3,4);
  for(const x of [5,14,23]){
    ink.fillStyle="#dc617b";ink.fillRect(x+1,4,2,2);ink.fillRect(x+4,4,2,2);
    ink.fillRect(x,6,7,2);ink.fillRect(x+1,8,5,1);ink.fillRect(x+2,9,3,1);ink.fillRect(x+3,10,1,1);
  }
}
const carriageBeats=kickTimes.filter(time=>time>=28&&time<31.5);
function carriage(t){
  box(0,0,400,225,"#dab988");box(0,8,400,5,"#ffe7ac");box(0,16,400,7,"#90765f");
  for(let j=0;j<3;j++){
    const x=j*146-28;box(x,33,139,85,"#5c585c");box(x+4,37,131,76,"#303e61");
    for(let n=0;n<7;n++){
      const off=((n*21+t*36)%142);
      if(off<126){box(x+5+off,78+(n%3)*6,5,3,"#ecb97e");box(x+5+off,94,3,9,"#637084")}
    }
    box(x+5,109,129,4,"#b3b4a6");
  }
  box(0,125,400,9,"#916d60");box(40,133,310,27,"#ad665e");box(34,160,318,6,"#664f52");
  for(const x of [12,374]){box(x,18,3,157,"#967e65");box(x+1,18,1,157,"#ffe9b0")}
  for(const x of [54,112,296,346]){box(x,21,2,9,"#625660");box(x-3,29,8,5,"#efe0bd")}
  const lean=ease((t-28.67)/.65)*(1-ease((t-30.62)/.52));
  person(176,161+Math.round(Math.sin(t*14)*(1-lean)*1.5),false,1.43,false,0,riders);
  person(238-18*lean,161,true,1.44,true,-.15*lean,riders);
  for(let j=0;j<carriageBeats.length;j++){
    const age=t-carriageBeats[j];
    if(age<0||age>=.96)continue;
    const fromPink=j%2===0;
    water.save();water.globalAlpha=ease(age/.06)*(1-ease((age-.38)/.58));
    water.drawImage(bubbleSprite,Math.round((fromPink?220:159)+(fromPink?1:-1)*age*4),Math.round(108-age*39),35,19);
    water.restore();
  }
  if(t>31.18){const y=107-70*ease((t-31.18)/.32);box(286,y,2,13,"#ffdc85");box(285,y,4,3,"#fff4ca")}
}
function rooftop(t){
  nightHarbour(t);fireworks(t);
  const light=sunAccent(t)*.24;
  water.save();water.globalAlpha=light;box(0,112,400,21,t<32.8?"#ffb891":"#b4cfeb");water.restore();
  box(0,155,400,70,"#35374f");box(0,151,400,5,"#9a8690");box(0,157,400,3,"#615775");
  for(const x of [18,312,352]){box(x,135,24,16,"#45455c");box(x-2,133,28,3,"#7a7485")}
  box(45,100,2,51,"#464960");box(28,103,36,2,"#464960");box(33,97,2,12,"#464960");box(54,97,2,12,"#464960");
  const turn=ease((t-34.28)/.45);
  person(173,155,false,.89,false,-turn*.09,riders);person(208,155,true,.89,true,0,riders);
  if(turn>.3){box(167,139,4,5,"#e76d5e");box(170,139,2,4,"#493e49")}
}
function booth(t){
  nightHarbour(t);fireworks(t);
  for(const [x,w] of [[0,87],[309,91]]){
    box(x,0,w,225,"#934455");
    for(let k=0;k<w;k+=15){box(x+k,0,6,180,"#b55a64");box(x+k+6,0,3,180,"#793b50")}
  }
  box(83,0,230,12,"#e8b88a");box(83,12,8,141,"#e3b591");box(305,12,8,141,"#e3b591");
  box(0,131,400,94,"#a94f5c");box(0,143,400,9,"#ce746e");box(33,167,337,9,"#763d51");
  for(let i=0;i<3;i++)box(180+i*14,5,8,4,t>35+i*.30?"#fff2b7":"#80525a");
  const reach=ease((t-35.12)/.76);
  // Pose the two booth figures locally so each visible arm has one shoulder.
  for(const pink of [true,false]){
    water.save();water.translate(pink?240-4*reach:163, pink?169+5*reach:164);
    if(pink)water.rotate(-.14*reach);
    water.scale(2,2);
    const ink="#493e49",coat=pink?"#ffaec8":"#e76d5e";
    for(const foot of [-12,-7,6,11]){box(foot,-6,3,6,ink);box(foot+1,-5,1,4,coat)}
    box(-16,-22,32,18,ink);box(-15,-21,30,16,coat);
    box(-15,-7,30,2,pink?"#df859e":"#c45650");
    const outer=pink?16:-19;
    box(outer,-13,3,5,ink);box(outer,-12,2,3,coat);
    if(pink){
      box(-17,-11,2,4,ink);
      box(-17,-24,9,3,ink);box(-16,-24,7,2,"#ff78a5");
    }else{
      water.save();water.translate(15,-14);water.rotate(-.38*reach);
      box(0,-2,5+2*reach,4,ink);box(0,-1,4+2*reach,2,coat);water.restore();
    }
    box(pink?-10:-4,-17,2,5,ink);box(pink?3:9,-17,2,5,ink);
    water.restore();
  }
}
let print;
function develop(){
  if(print)return;
  booth(shutterTime);
  print=document.createElement("canvas");print.width=204*density;print.height=171*density;
  print.getContext("2d").drawImage(waterCanvas,99*density,6*density,print.width,print.height,0,0,print.width,print.height);
}
function paper(x,y,w){
  box(x-2,y-2,w+4,w*.84+9,"#fff2d6");
  water.drawImage(print,x,y,w,w*.84);
  box(x-7,y+w*.63,9,12,"#e68c78");
}
function boothPrint(t){
  develop();
  box(0,0,400,225,"#ad515e");box(0,18,400,9,"#cd726e");box(68,36,264,162,"#d48b78");
  box(92,51,216,15,"#633b4b");box(98,55,204,7,"#302f42");
  const f=ease((t-36.53)/.75);
  water.save();water.beginPath();water.rect(0,60,400,165);water.clip();
  paper(148,64-84*(1-f)+4*ease((t-37.34)/.66),104);water.restore();
}
function dawn(t){
  develop();const move=ease((t-38)/1.58), roll=ease((t-41.45)/.53);
  box(0,0,400,225,"#b9d6e0");box(0,67,400,62,"#d6e2dc");
  for(let j=0;j<22;j++)box(j*19,78-(j*11)%33,17,60,"#98afbf");
  box(0,148,400,77,"#acb7ba");box(0,157,400,3,"#f0d59b");
  water.save();water.translate(roll*413,0);
  box(0,52,408,99,"#637781");box(0,55,408,85,"#dfdfcf");box(0,122,408,11,"#bb796b");
  for(let j=0;j<6;j++){
    const x=5+j*74;box(x,68,62,45,"#465c70");box(x+2,70,58,41,"#91b5c7");
    windowCrowd(water,x+2,70,58,41,j+2);
  }
  box(202,61,64,88,"#39566a");
  const shut=ease((t-40.86)/.52);
  for(const x of [202,266-32*shut]){
    box(x,61,32*shut,87,"#d2d4c8");if(shut>.18)box(x+2,68,28*shut,41,"#90abbc");
  }
  if(shut>.75){box(218,87,12,8,"#b49088");box(223,89,1,2,"#786e74")}
  water.restore();
  box(44,134,91,6,"#777f88");box(50,140,4,16,"#687781");box(123,140,4,16,"#687781");
  const step=ease((t-39.7)/.53);person(173+step*9,169,false,1.12,false,.04*ease((t-40.35)/.44));
  box(348,33,4,124,"#627584");box(340,27,20,20,"#526477");box(342,29,16,16,"#f5e7c5");
  box(349,32,2,7,"#635866");box(350,38,5,2,"#635866");
  paper(148+move*(44+step*9),68+move*79,104-89*move);
}
function chorus(t){
  const lift=ease((t-28)/.7);
  if(lift<1)beachQuest(27.99);
  if(t<31.5)carriage(t);
  else if(t<35)rooftop(t);
  else if(t<36.53){
    booth(Math.min(t,shutterTime));
    if(t>=shutterTime){water.save();water.globalAlpha=.9*(1-ease((t-shutterTime)/.18));box(0,0,400,225,"#fff1cc");water.restore()}
  }else if(t<38)boothPrint(t);
  else dawn(t);
  g.save();g.translate(0,540*(1-lift));g.imageSmoothingEnabled=false;
  g.drawImage(waterCanvas,0,0,960,540);
  if(lift<1){g.fillStyle="#b5edeb";g.fillRect(0,0,960,3)}
  g.restore();
}
