/* Distances in metres. Positive x is the direction of travel. */
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,f)=>a+(b-a)*f;
const smooth=f=>{f=clamp(f);return f*f*(3-2*f)};
const modulo=(v,n)=>(v%n+n)%n;
const TAU=2*Math.PI, BEAT=60/113, BAR=4*BEAT, END=24*BAR;
function roadState(i,t){
  const p=t+i*1.18, v=9, brake=1.8, release=4.3, rise=2.1;
  let x, speed;
  if(p<0){x=v*p;speed=v;}
  else if(p<brake){x=v*(p-p*p/(2*brake));speed=v*(1-p/brake);}
  else if(p<release){x=v*brake/2;speed=0;}
  else if(p<release+rise){const s=p-release;x=v*(brake/2+s*s/(2*rise));speed=v*s/rise;}
  else {x=v*(brake/2+rise/2+p-release-rise);speed=v;}
  return {x:x+i*6.2,v:speed,light:smooth(p/.14)*(1-smooth((p-release)/.24))};
}
// The ring uses the Intelligent Driver Model, with simultaneous updates for all cars.
const trackLength=230, R=trackLength/TAU, count=22, interval=.05;
const history=[];
{
  let x=Array.from({length:count},(_,i)=>i*trackLength/count), v=Array(count).fill(3.93551408138);
  x[3]+=.6;
  for(let k=0;k<=4400;k++){
    const a=x.map((s,i)=>{
      const j=(i+1)%count, gap=modulo(x[j]-s,trackLength)-4.4;
      const desired=1.7+Math.max(0,v[i]*1.1+v[i]*(v[i]-v[j])/(2*Math.sqrt(.55*2)));
      return .55*(1-(v[i]/13)**4-(desired/gap)**2);
    });
    history.push({x,v,a});
    const next=v.map((val,i)=>Math.max(0,val+a[i]*interval));
    x=x.map((s,i)=>s+(v[i]+next[i])*interval/2);v=next;
  }
}
function ringState(i,t){
  const k=clamp(t/interval,0,history.length-2), n=Math.floor(k), f=k-n;
  const h=history[n],j=history[n+1], s=mix(h.x[i],j.x[i],f), v=mix(h.v[i],j.v[i],f);
  const angle=s/R;
  return {x:R*Math.cos(angle),z:R*Math.sin(angle),yaw:-angle-Math.PI/2,
    v,light:Math.max(smooth((-h.a[i]-.12)/.48),smooth((.9-v)/.85)),s,angle};
}
