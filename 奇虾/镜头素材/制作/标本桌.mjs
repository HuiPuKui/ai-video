import cuts from './全片时间.json';
import {additionalShots} from './标本与游姿.mjs';
// Draw in a 1152 × 648 camera view. Annotation paths are in specimen coordinates.
export const archiveStart = 440 / 24;
export const filmDuration = cuts.end;
const mix = (a,b,p) => a+(b-a)*p;
function ease(t,a,b) {
  const p=Math.max(0,Math.min(1,(t-a)/(b-a)));
  return p*p*(3-2*p);
}
const ivory='#f7f0dd', apricot='#ffd29f', ink='#283a30', brick='#943e28';
const serif='"Songti SC","Noto Serif CJK SC","STSong",serif';
const sans='"PingFang SC","Microsoft YaHei",sans-serif';

export async function prepareArchive(ctx,drawClosingSwimmer) {
  const images={};
  await Promise.all([...document.querySelectorAll('[data-archive]')].map(async tag=>{
    const image=new Image();
    image.src='data:image/webp;base64,'+tag.textContent;
    await image.decode();
    images[tag.dataset.archive]=image;
  }));
  function words(text,x,y,size,color,opacity=1,face=serif,weight=650) {
    if(opacity<=0)return;
    ctx.save();
    ctx.globalAlpha*=opacity; ctx.fillStyle=color; ctx.textBaseline='top';
    ctx.font=weight+' '+size+'px '+face;
    ctx.fillText(text,x,y); ctx.restore();
  }
  function segment(points,fraction,color,width) {
    const lengths=points.slice(1).map(([x,y],i)=>Math.hypot(x-points[i][0],y-points[i][1]));
    let left=lengths.reduce((a,b)=>a+b,0)*fraction, tip=points[0];
    ctx.beginPath();ctx.moveTo(...tip);
    for(let i=0;i<lengths.length;i++){
      const u=Math.min(1,left/lengths[i]);
      tip=[mix(points[i][0],points[i+1][0],u),mix(points[i][1],points[i+1][1],u)];
      ctx.lineTo(...tip);
      left-=lengths[i];
      if(left<=0)break;
    }
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';
    if(fraction>0)ctx.stroke();
    return tip;
  }
  function pencil(x,y,angle,width,lift=0) {
    const height=width*images.pencil.height/images.pencil.width;
    ctx.save();ctx.translate(x,y-lift);ctx.rotate(angle);
    ctx.shadowColor='#20190966';ctx.shadowBlur=2+lift*.17;
    ctx.shadowOffsetX=1+lift*.10;ctx.shadowOffsetY=3+lift*.23;
    ctx.drawImage(images.pencil,-width*8/680,-height/2,width,height);
    ctx.restore();
  }
  function item(image,x,y,w,h,angle=0,frame=0) {
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    ctx.shadowColor='#0a130e70';ctx.shadowBlur=10;ctx.shadowOffsetY=7;
    if(frame){
      ctx.fillStyle='#f3e9d4';ctx.fillRect(-frame,-frame,w+frame*2,h+frame*2);
      ctx.shadowColor='transparent';
    }
    ctx.drawImage(image,0,0,w,h);ctx.restore();
  }
  function label(title,id,t) {
    const a=ease(t,0,.4);
    words(title,52,60,25,'#e5e9da',a,sans,500);
    ctx.save();ctx.globalAlpha=a;segment([[53,105],[130,105]],1,'#b5c0af',1.6);ctx.restore();
    words(id,53,568,22,'#dbe2d1',a,'Monaco,monospace',400);
  }
  function isolated(t) {
    ctx.drawImage(images.green,0,0,1152,648);
    const back=ease(t,.08,2.70), reveal=ease(t,.67,1.16);
    ctx.save();
    ctx.translate(mix(725,802,back),mix(312,320,back));
    ctx.rotate(mix(.40,.16,back));
    const w=mix(1820,792,back), h=w*images.slab.height/images.slab.width;
    item(images.slab,-w*.50,-h*.49,w,h);
    // Follow three successive teeth while the camera backs away from the rock.
    const probe=ease(t,.38,1.85), withdraw=ease(t,2.14,2.85);
    if(t<2.85){
      const px=w*mix(-.13,.12,probe),py=h*(.065+.032*Math.sin(probe*8));
      pencil(px+490*withdraw,py+280*withdraw,.38,700,5+16*withdraw);
    }
    ctx.restore();
    const fade=ctx.createLinearGradient(0,0,490,0);
    fade.addColorStop(0,'rgba(23,41,32,.94)');fade.addColorStop(.62,'rgba(23,41,32,.77)');
    fade.addColorStop(1,'rgba(23,41,32,0)');
    ctx.fillStyle=fade;ctx.fillRect(0,0,490,648);
    label('孤立标本','USNM 207255',t-.4);
    words('一节接一节，',49,216,53,ivory,reveal);
    words('虾头在哪儿？',47,296,63,apricot,ease(t,1.55,1.82));
  }
  function plateShot(t) {
    const sweep=ease(t,-.065,.66);
    if(sweep<1){
      isolated(22.5-archiveStart);
      const leading=mix(-160,1280,sweep);
      ctx.save();
      ctx.shadowColor='#0b120d88';ctx.shadowOffsetX=11;ctx.shadowBlur=14;
      ctx.beginPath();ctx.moveTo(-200,-30);ctx.lineTo(leading+96,-30);
      ctx.bezierCurveTo(leading+59,150,leading+14,445,leading-24,690);
      ctx.lineTo(-200,690);ctx.closePath();ctx.fillStyle='#d6cbb3';ctx.fill();
      ctx.shadowColor='transparent';ctx.clip();
      ctx.drawImage(images.paper,-(1-sweep)*34,-4,1188,656);
      const edgeLight=ctx.createLinearGradient(leading-68,0,leading+68,7);
      edgeLight.addColorStop(0,'#fceec300');edgeLight.addColorStop(.67,'#ffedc37a');edgeLight.addColorStop(1,'#74634340');
      ctx.fillStyle=edgeLight;ctx.fillRect(leading-68,0,140,648);ctx.restore();
    }else ctx.drawImage(images.paper,0,0,1152,648);
    // The right edge of the print rolls down while its left edge stays on the desk.
    const open=ease(t,-.10,.82), push=ease(t,.88,2.34), relax=ease(t,3.26,4.37);
    const scale=.88+.22*push-.17*relax;
    ctx.save();
    ctx.translate(39-161*push+138*relax,101-142*push+95*relax);
    ctx.rotate(-.026+.015*push);
    ctx.scale(scale,scale);
    const edge=mix(36,778,open), curl=61*(1-open);
    ctx.save();ctx.beginPath();ctx.rect(-10,-10,edge+11,522);ctx.clip();
    ctx.fillStyle='#f0e6d1';ctx.fillRect(-9,-9,768,518);
    ctx.drawImage(images.plate,0,0,750,500);
    ctx.restore();
    if(open<1){
      const g=ctx.createLinearGradient(edge-curl,0,edge+curl,0);
      g.addColorStop(0,'#74624700');g.addColorStop(.43,'#795e396e');
      g.addColorStop(.61,'#f9e9bd');g.addColorStop(.81,'#cfbd91');g.addColorStop(1,'#6b583800');
      ctx.fillStyle=g;ctx.fillRect(edge-curl,-9,2*curl,518);
    }
    const p=ease(t,1.90,2.65);
    const tip=segment([[146,457],[195,456],[245,457],[301,456],[365,457]],p,brick,4);
    const down=ease(t,1.34,1.90),up=ease(t,2.66,3.30);
    if(t>=1.34 && t<=3.30) pencil(tip[0]+125*(1-down)+350*up,tip[1]+150*(1-down)+260*up,.32,646,12*(1-down)+12*up);
    ctx.restore();
    words('1892',758,92,76,brick,ease(t,.45,.72),'Baskerville,Georgia,serif',500);
    words('J. F. Whiteaves',762,186,28,ink,ease(t,.49,.76),'Baskerville,Georgia,serif',400);
    segment([[764,242],[1057,242]],ease(t,.55,.85),'#869681',1.5);
    words('图注里写的是',758,298,48,ink,ease(t,.86,1.16));
    words('“腹节”。',751,381,66,brick,ease(t,2.42,2.72));
  }
  const leftEdge=[[174,246],[175,218],[177,191],[179,156],[182,120],[189,88],[200,62],[215,43],[232,32]];
  const rightEdge=[[352,343],[364,315],[376,290],[389,264],[401,238],[412,219],[419,201]];
  function trace(points,t,start,end,angle) {
    const progress=ease(t,start,end);
    segment(points,progress,'#673520',6.2);
    const tip=segment(points,progress,'#ffae83',3.8);
    const approach=ease(t,start-.30,start),lift=ease(t,end,end+.36);
    if(t<start-.30 || t>end+.36)return null;
    const matrix=ctx.getTransform();
    return ()=>{
      ctx.save();ctx.setTransform(matrix);ctx.globalAlpha=approach*(1-lift);
      pencil(tip[0]+22*(1-approach)+45*lift,tip[1]-21*(1-approach)-25*lift,angle,460,9*(1-approach)+9*lift);
      ctx.restore();
    };
  }
  function uncover(t) {
    const progress=ease(t,1.50,2.62);
    if(progress>=1)return;
    const front=275+322*progress;
    ctx.save();ctx.beginPath();ctx.moveTo(580,-20);
    for(let y=-20;y<=450;y+=5)ctx.lineTo(front-.075*y+3*Math.sin(y*.046)+2*Math.sin(y*.12),y);
    ctx.lineTo(580,450);ctx.closePath();ctx.clip();
    ctx.globalAlpha=.94;ctx.drawImage(images.vellum,front-42,-21,560,485);
    const fold=ctx.createLinearGradient(front-31,0,front+51,0);
    fold.addColorStop(0,'#60533833');fold.addColorStop(.42,'#f4e9cc99');fold.addColorStop(1,'#c7b79500');
    ctx.fillStyle=fold;ctx.fillRect(front-42,-20,140,480);ctx.restore();
  }
  function headShot(t) {
    ctx.drawImage(images.green,0,0,1152,648);
    label('头部标本','ROM 51212',t);
    words('看头前，',49,210,55,ivory,ease(t,.15,.42));
    words('两边各有一条。',47,290,50,apricot,ease(t,2.65,2.97));
    const drift=ease(t,0,2.76);
    ctx.save();ctx.translate(mix(459,445,drift),mix(64,58,drift));ctx.rotate(mix(.012,-.005,drift));
    ctx.fillStyle='#dfd7bf';ctx.shadowColor='#111c1475';ctx.shadowBlur=11;ctx.shadowOffsetY=8;
    ctx.fillRect(-7,-7,674,537);ctx.shadowColor='transparent';
    ctx.beginPath();ctx.rect(0,0,660,523);ctx.clip();
    const zoom=mix(1.44,1.28,drift);
    ctx.scale(zoom,zoom);ctx.translate(-mix(46,28,drift),-3);
    ctx.drawImage(images.head,0,0,703,729);
    const leftPencil=trace(leftEdge,t,.58,1.65,-.64);
    uncover(t);
    const rightPencil=trace(rightEdge,t,2.58,3.72,-.52);
    ctx.restore();
    if(leftPencil)leftPencil();
    if(rightPencil)rightPencil();
  }
  function complete(t) {
    ctx.drawImage(images.paper,0,0,1152,648);
    // Keep the head in view as the camera pulls back to the entire second specimen.
    const pull=ease(t,-.16,2.66), w=mix(1760,688,pull), h=w*691/1177;
    const x=mix(206,47,pull), y=mix(-407,107,pull);
    ctx.save();ctx.translate(x,y);ctx.rotate(mix(-.079,0,pull));
    item(images.whole,0,0,w,h,0,6);
    const leader=ease(t,2.60,3.31);
    segment([[w*.151,h*1.07],[w*.151,h*.958],[w*.125,h*.885]],leader,'#ffba8e',3);
    ctx.restore();
    words('全身标本   ROM 51214',52,557,22,'#46584b',ease(t,1.94,2.46),sans,500);
    const compare=ease(t,2.14,3.12);
    if(compare>0){
      ctx.save();ctx.translate(mix(1230,930,compare),mix(24,135,compare)-23*Math.sin(Math.PI*compare));
      ctx.rotate(mix(-.28,.092,compare));item(images.slab,-125,-83,250,166);
      ctx.restore();
      words('同类孤立标本',806,250,21,'#4c6052',ease(t,2.90,3.22),sans,500);
    }
    segment([[772,305],[1098,305]],ease(t,2.38,2.94),'#8f9b89',1.5);
    words('当年的“虾身”，',766,346,46,ink,ease(t,2.08,2.48));
    words('原来是一条',770,425,48,ink,ease(t,2.76,3.12));
    words('前附肢。',766,493,65,brick,ease(t,3.12,3.50));
  }
  const extra=additionalShots(ctx,images,{ease,mix,words,segment,item,drawClosingSwimmer});
  return function archiveShot(seconds) {
    ctx.save();ctx.scale(ctx.canvas.width/1152,ctx.canvas.height/648);
    if(seconds<cuts.plate)isolated(seconds-archiveStart);
    else if(seconds<cuts.spines)plateShot(seconds-cuts.plate);
    else if(seconds<cuts.hypothesis)extra.spines(seconds-cuts.spines);
    else if(seconds<cuts.head)extra.hypothesis(seconds-cuts.hypothesis);
    else if(seconds<cuts.whole)headShot(seconds-cuts.head);
    else if(seconds<cuts.eyes)complete(seconds-cuts.whole);
    else if(seconds<cuts.flaps)extra.eyes(seconds-cuts.eyes);
    else if(seconds<cuts.swim)extra.flaps(seconds-cuts.flaps);
    else extra.swim(seconds-cuts.swim);
    ctx.restore();
  };
}
