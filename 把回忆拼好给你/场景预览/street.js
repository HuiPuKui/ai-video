const canvas = document.querySelector("canvas");
const density=Number(canvas.dataset.density)||1;
canvas.width = 400*density;
canvas.height = 225*density;
const ctx = canvas.getContext("2d");
ctx.scale(.5*density,.5*density);
const looks = [
  ["晨光大道","#79cdff","#fff3c4","#c2e7ff","#94bcea","#ffcc86","#45658c","#fa795d"],
  ["黄昏商街","#ffaabc","#fff0ae","#ffcebb","#d697ad","#ffc08a","#805981","#ef576b"],
  ["林荫街道","#87d9ff","#fff2bb","#bee9f7","#91bbdb","#ffe098","#4b7292","#f89151"],
  ["高架桥下","#93d7ff","#ffedc7","#c7e7fc","#a0bada","#f9cfa9","#516c94","#ee8866"],
  ["午夜霓虹","#414b90","#ffcfac","#9098d2","#6c75b7","#ca91b0","#4d477e","#ff85b3"]
];
let active = 0, start = performance.now();
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function polygon(points,c){
  ctx.fillStyle=c;ctx.beginPath();
  points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
}
function ellipse(x,y,rx,ry,c){
  ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
}
function lettering(text,x,y,size,c){
  ctx.fillStyle=c;ctx.font='bold '+size+'px "PingFang SC",sans-serif';ctx.fillText(text,x,y);
}
function skyline(distance,speed,base,unit,t,c){
  const offset=t*speed;
  for(let j=-1;j<Math.ceil(800/unit)+2;j++){
    const x=j*unit-offset, h=28+Math.abs(Math.sin(j*12.63+distance))*distance;
    rect(x,base-h,unit-4,h,c);rect(x+6,base-h-5,unit*.6,6,c);
    if(j%3===0)rect(x+10,base-h-18,2,15,c);
    ctx.globalAlpha=.32;
    for(let row=0;row<h-12;row+=10)for(let col=6;col<unit-9;col+=10)
      rect(x+col,base-h+7+row,4,3,looks[active][2]);
    ctx.globalAlpha=1;
  }
}
const shops=["书 局","花 房","映 画 馆","咖 啡","唱 片 行"];
function storefront(x,y,w,h,k,p){
  const [,,,,,wall,ink,accent]=p, trim=k%2?p[2]:wall, glass=active===4?"#f2c49e":"#abe8ff";
  rect(x,y,w,h,wall);rect(x+w-9,y,9,h,ink);rect(x-3,y-4,w+5,5,trim);
  for(let wy=y+11;wy<236;wy+=27){
    for(let wx=x+10;wx<x+w-20;wx+=29){
      rect(wx,wy,19,18,ink);rect(wx+2,wy+2,6,13,glass);rect(wx+10,wy+2,7,13,glass);
      rect(wx-2,wy+17,23,3,trim);
    }
  }
  rect(x+4,251,w-17,28,ink);
  lettering(shops[k],x+12,272,17,p[2]);
  rect(x+6,284,w-20,35,ink);
  for(let wx=x+10;wx<x+w-32;wx+=22){
    rect(wx,287,19,28,glass);
    polygon([[wx,287],[wx+10,287],[wx,302]],"#ffffff40");
    rect(wx+2,309,5,6,accent);rect(wx+9,312,7,3,wall);
  }
  for(let n=0;n<10;n++){
    const stripe=(w-10)/10,l=x+n*stripe;
    polygon([[l+3,278],[l+3+stripe,278],[l+stripe,284],[l,284]],n%2?accent:p[2]);
    rect(l,284,Math.ceil(stripe),3,n%2?accent:p[2]);
  }
  rect(x,319,w,4,ink);
}
function tree(x,y,s,p){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  rect(-3,-43,7,45,p[6]);
  polygon([[-26,-48],[-24,-61],[-12,-64],[-5,-75],[11,-71],[14,-63],[25,-60],[29,-45],[20,-34],[-16,-34]],active===4?"#52889b":"#65b881");
  polygon([[-25,-49],[-23,-61],[-10,-64],[-5,-72],[9,-69],[4,-54],[-11,-45]],active===4?"#79adac":"#a4db78");
  ctx.restore();
}
function clawd(x,y,s,pink,t,gray=false,red=false,reach=0,slump=0,armAngle=-.98*reach+.9*slump){
  const phase=(Math.floor(t*8)+(pink?1:0))%4;
  const step=[0,1,0,-1][phase];
  ctx.save();ctx.setTransform(s*density,0,0,s*density,Math.round(x/2)*density,Math.round(y/2)*density);
  const body=gray?"#ababaf":pink?"#ffaec8":red?"#e76d5e":"#f09771", shade=gray?"#929298":pink?"#df809f":red?"#c45650":"#ce705d",ink=gray?"#66666d":"#493e49";
  rect(-14,0,28,2,"#ad9a8c");ctx.translate(0,-(phase%2));
  [-12,-7,6,11].forEach((v,i)=>{
    const dx=step*(i%2?1:-1),h=5-Math.max(0,dx);
    rect(v+dx,-5,3,h,ink);rect(v+dx+1,-5,1,h-1,shade);
  });
  ctx.translate(-slump,2*slump);ctx.rotate(.12*slump);
  rect(-16,-22,32,18,ink);rect(-15,-21,30,15,body);
  rect(-15,-7,30,2,shade);rect(-14,-20,27,1,gray?"#c9c9cd":pink?"#ffd2bf":"#edac89");
  rect(-19,-15+3*slump,4,5,ink);rect(-18,-14+3*slump,3,3,shade);
  ctx.save();ctx.translate(15,-13);ctx.rotate(armAngle);
  rect(0,-2,4+7*reach,5,ink);rect(0,-1,3+7*reach,3,body);ctx.restore();
  rect(-5,-17+4*slump,2,5-2*slump,ink);rect(9,-17+4*slump,2,5-2*slump,ink);
  if(pink){rect(5,-24,9,3,ink);rect(6,-24,7,2,"#ff78a5");rect(7,-24,2,1,"#ffe7d8")}
  ctx.restore();
}
function street(t,sunPulse=0){
  const p=looks[active],night=active===4;
  rect(0,0,800,450,p[1]);
  const sun=night?"#ffdfb6":"#fff3ce";
  ctx.save();ctx.translate(584,76);ctx.scale(1+.24*sunPulse,1+.24*sunPulse);
  for(let row=-6;row<=6;row++){
    const half=4*Math.round(Math.sqrt(42-row*row));
    rect(-half,row*4-2,half*2,4,sun);
  }
  ctx.restore();
  for(let k=0;k<8;k++)rect(k*146-60-t,42+(k*23)%67,52+(k%3)*17,2,"#fff5de66");
  skyline(80,1.8,220,36,t,p[3]);skyline(109,4,260,55,t,p[4]);
  const streetOffset=t*16;
  for(let k=-1;k<8;k++){
    const index=(k+5)%5,x=k*143-streetOffset;
    const y=[169,202,138,186,156][index];
    storefront(x,y,138,323-y,index,p);
    if(index===2){
      rect(x+104,y-4,22,92,p[6]);rect(x+106,y-4,18,88,p[7]);
      ["映","画","館"].forEach((ch,j)=>lettering(ch,x+108,y+18+j*23,14,p[2]));
    }
  }
  if(active===3){
    rect(0,110,800,11,p[6]);rect(0,105,800,5,p[4]);
    for(let x=-t*19;x<840;x+=229){
      polygon([[x-14,121],[x+26,121],[x+12,142],[x+12,322],[x,322],[x,142]],p[4]);
    }
  }
  rect(0,323,800,54,night?"#c7a7c4":"#ffe1aa");
  for(let x=-t*20-30;x<840;x+=72)polygon([[x,325],[x+1,325],[x-17,377],[x-19,377]],"#78685e45");
  rect(0,346,800,1,"#95897b55");rect(0,377,800,6,p[5]);rect(0,383,800,67,p[6]);
  for(let x=-t*26-55;x<860;x+=108)rect(x,414,52,3,"#e3dabc99");
  for(let x=42-t*16;x<860;x+=active===2?105:375)tree(x,324,active===2?1.28:.87,p);
}
function lamps(t){
  const p=looks[active];
  for(let x=103-t*30;x<900;x+=580){
    rect(x,179,5,203,p[6]);rect(x-3,367,11,16,p[6]);
    rect(x-2,175,38,5,p[6]);rect(x+23,178,16,5,p[7]);rect(x+25,183,12,2,p[2]);
  }
}
function paint(now){
  const t=((now-start)/1000)%3.5;
  street(t);
  clawd(298+t*5,357,1,false,t);clawd(398+t*4.5,364,1,true,t);
  lamps(t);requestAnimationFrame(paint);
}
const nav=document.querySelector("nav");
function select(i){
  active=i;start=performance.now();document.querySelector("#name").textContent=looks[i][0];
  [...nav.children].forEach((button,n)=>button.setAttribute("aria-pressed",String(n===i)));
}
if(nav){looks.forEach(([name],i)=>{
  const button=document.createElement("button");button.innerHTML="<span>0"+(i+1)+"</span>"+name;
  button.onclick=()=>select(i);nav.append(button);
});
select(0);requestAnimationFrame(paint);}
