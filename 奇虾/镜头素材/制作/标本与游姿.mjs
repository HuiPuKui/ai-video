export function additionalShots(ctx,im,{ease,mix,words,segment,item,drawClosingSwimmer}) {
  const ink='#293c32', red='#963e29', ivory='#fff7e6', amber='#ffcea0';
  const sans='"PingFang SC","Microsoft YaHei",sans-serif';
  const serif='Baskerville,Georgia,serif';
  function vignette() {
    const g=ctx.createLinearGradient(0,335,0,648);
    g.addColorStop(0,'#091c1800');g.addColorStop(.51,'#0a1e19c4');g.addColorStop(1,'#071b18f2');
    ctx.fillStyle=g;ctx.fillRect(0,335,1152,313);
  }
  function band(t,start,end){
    return ease(t,start,start+.26)*(1-ease(t,end-.22,end));
  }
  function spines(t) {
    const track=ease(t,.25,5.95);
    const x=mix(-21,-103,track), y=mix(-71,-2,track), w=1290, h=w*im.spines.height/im.spines.width;
    ctx.drawImage(im.spines,x,y,w,h);
    // Resample the same photograph about the lens centre, exactly in register at 1×.
    const cx=mix(305,712,track),cy=mix(272,124,track),r=113;
    ctx.save();ctx.translate(cx,cy);
    ctx.rotate(-.61);ctx.fillStyle='#66543b';ctx.fillRect(r-2,-7,173,14);ctx.restore();
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
    ctx.translate(cx,cy);ctx.scale(1.52,1.52);ctx.drawImage(im.spines,x-cx,y-cy,w,h);ctx.restore();
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.lineWidth=8;ctx.strokeStyle='#483d2e';ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,r-3,0,Math.PI*2);ctx.lineWidth=2;ctx.strokeStyle='#f5dfab';ctx.stroke();
    vignette();
    words('YPM 35138',56,433,23,'#e0ded1',1,'Monaco,monospace',450);
    const first=band(t,.12,3.36);
    words('顺着内弯看，',52,477,44,ivory,first);
    words('尖刺都朝着同一侧。',50,542,49,amber,first);
    const second=ease(t,3.36,3.61);
    words('再看外沿，',52,477,44,ivory,second);
    words('一节一节的分界还在。',50,542,49,amber,second);
  }
  function hypothesis(t) {
    ctx.drawImage(im.paper,0,0,1152,648);
    const slide=ease(t,-.35,1.25);
    ctx.save();ctx.translate(mix(656,502,slide),mix(48,84,slide));ctx.rotate(mix(-.07,.022,slide));
    item(im.curved,0,0,593,394,0,6);
    // The preserved lower arc runs from lower left towards the inner tip.
    segment([[122,243],[147,268],[177,291],[209,313],[243,330],[276,342],[306,344],[333,336],[355,321]],ease(t,.92,2.69),'#ffb38a',3);
    words('USNM PAL 213493–213494',3,421,21,'#455a4d',ease(t,.5,.90),'Monaco,monospace',450);
    ctx.restore();
    words('1979',51,83,83,red,ease(t,.14,.42),serif,550);
    const first=band(t,.51,3.48);
    words('布里格斯提出，',51,247,43,ink,first);
    words('它可能是一条附肢。',49,315,45,red,first);
    const next=ease(t,3.53,3.85);
    words('那它究竟',51,248,44,ink,next);
    words('连在身体哪里？',49,318,49,red,next);
  }
  function ring(x,y,r,p) {
    if(p<=0)return;
    ctx.beginPath();ctx.ellipse(x,y,r,r*.82,-.18,-Math.PI/2,-Math.PI/2+p*2*Math.PI);
    ctx.lineWidth=3.5;ctx.strokeStyle='#b95130';ctx.stroke();
  }
  function eyes(t) {
    ctx.drawImage(im.paper,0,0,1152,648);
    const pull=ease(t,-.16,2.92);
    const x=mix(579,431,pull), y=mix(61,78,pull), w=mix(885,686,pull), h=w*im.anatomy.height/im.anatomy.width;
    ctx.save();ctx.globalCompositeOperation='multiply';ctx.drawImage(im.anatomy,x,y,w,h);ctx.restore();
    ctx.save();
    const r=143,cx=209,cy=231;
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
    // Crop the same head specimen around its two annotated eye spots.
    ctx.drawImage(im.head,34,177,452,452,cx-r,cy-r,r*2,r*2);
    ctx.restore();
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle='#748171';ctx.lineWidth=4;ctx.stroke();
    const p=ease(t,.50,1.40), q=ease(t,1.46,2.31);
    ring(66+(118-34)*286/452,88+(318-177)*286/452,17,p);
    ring(66+(362-34)*286/452,88+(414-177)*286/452,17,q);
    ring(x+w*.276,y+h*.233,w*.029,ease(t,3.26,4.19));
    ring(x+w*.390,y+h*.324,w*.035,ease(t,4.15,5.20));
    words('ROM 51212',118,400,22,'#435849',1,'Monaco,monospace',450);
    words('形态复原  ·  Junnn11',806,42,21,'#4c6052',1,sans,500);
    const a=band(t,.07,3.44), b=ease(t,3.48,3.80);
    words('石头上这两个圆斑，',54,467,43,ink,a);
    words('就是奇虾的眼睛。',53,532,48,red,a);
    words('眼睛长在眼柄上，',54,467,43,ink,b);
    words('从头部两侧伸出去。',53,532,48,red,b);
  }
  // Anchor the body at its centreline. Only the underside receives the full paddle stroke.
  function waveImage(image,x,y,w,h,t,strength) {
    const count=95, slice=image.width/count, target=w/count;
    for(let i=0;i<count;i++){
      const u=(i+.5)/count;
      const joint=Math.min(.78,.20+.54*u);
      const sourceJoint=image.height*joint,body=h*joint;
      const wave=Math.sin(t*3.65-9.8*u);
      const bend=strength*wave*ease(u,.20,.48);
      const flap=bend*(1-ease(u,.74,.96))*2.25;
      const sx=i*slice, dx=x+i*target;
      ctx.drawImage(image,sx,0,slice,sourceJoint,dx,y+bend*.35,target+.15,body+bend*.65);
      ctx.drawImage(image,sx,sourceJoint,slice,image.height-sourceJoint,dx,y+body+bend,target+.15,h-body+flap);
    }
  }
  function flaps(t) {
    ctx.drawImage(im.paper,0,0,1152,648);
    const pull=ease(t,-.16,2.50);
    const x=mix(56,251,pull),y=mix(-174,-4,pull),w=mix(1063,808,pull);
    const h=w*im.restoration.height/im.restoration.width;
    ctx.save();ctx.globalCompositeOperation='multiply';
    waveImage(im.restoration,x,y,w,h,t,5.6*ease(t,2.6,4.05));
    ctx.restore();
    words('侧叶运动示意',57,55,23,'#4a5f51',1,sans,550);
    words('复原图  ·  Wawrow',865,55,21,'#4a5f51',1,sans,500);
    const first=band(t,.1,3.64),second=ease(t,3.69,3.98);
    words('身体两侧展开的薄片，',55,467,43,ink,first);
    words('叫作侧叶。',53,531,49,red,first);
    words('游动时，侧叶依次起伏。',55,467,43,ink,second);
    words('这一波从头后传向尾端。',53,531,48,red,second);
  }
  function swim(t) {
    const u=ease(t,-.5,8.5);
    const w=1390,h=w*im.sea.height/im.sea.width;
    ctx.drawImage(im.sea,-194+125*u,-150,w,h);
    drawClosingSwimmer(t,u);
    for(let i=0;i<26;i++){
      const x=(i*147.13+t*(10+(i%4)*5))%1152,y=43+(i*79.37)%457+2*Math.sin(t+i);
      ctx.fillStyle=i%3===0?'#f4e1b54d':'#d7dfb32b';
      ctx.beginPath();ctx.ellipse(x,y,1.3+i%3,.9,0,0,Math.PI*2);ctx.fill();
    }
    vignette();
    words('寒武纪海底  ·  生态复原',53,49,22,ivory,1,sans,500);
    const a=band(t,.1,3.98),b=ease(t,4.02,4.36);
    words('侧叶推动身体，',53,464,44,ivory,a);
    words('头前的附肢负责捕捉猎物。',51,534,47,amber,a);
    words('如果只剩下那道弯钩，',53,464,44,ivory,b);
    words('你还会把它认成一只虾吗？',51,534,47,amber,b);
  }
  return {spines,hypothesis,eyes,flaps,swim};
}
