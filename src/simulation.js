export const CHAPTER = Object.freeze({id:'louvre', title:'Louvre Defender', duration:90, intensity:'Normal', x:205,y:135,side:490,gateWidth:98,gateSpeed:360,blueSpeed:120,redSpeed:24,radius:5,cap:180});
export const P=CHAPTER.side*4;
export const CENTER={x:450,y:380};
export const mod=(n,p=P)=>(n%p+p)%p;
export function pointAt(s,offset=0){
 const {x,y,side:L}=CHAPTER;s=mod(s);
 if(s<L)return {x:x+s,y:y-offset};
 if(s<2*L)return {x:x+L+offset,y:y+s-L};
 if(s<3*L)return {x:x+3*L-s,y:y+L+offset};
 return {x:x-offset,y:y+4*L-s};
}
export function perimeterOf(x,y){
 const a=CHAPTER.x,b=CHAPTER.y,L=CHAPTER.side;
 const choices=[{d:Math.abs(y-b),s:Math.max(0,Math.min(L,x-a))},{d:Math.abs(x-a-L),s:L+Math.max(0,Math.min(L,y-b))},{d:Math.abs(y-b-L),s:3*L-Math.max(0,Math.min(L,x-a))},{d:Math.abs(x-a),s:4*L-Math.max(0,Math.min(L,y-b))}];
 return mod(choices.sort((a,b)=>a.d-b.d)[0].s);
}
export function distanceToFence(u){const q=pointAt(perimeterOf(u.x,u.y));return Math.hypot(u.x-q.x,u.y-q.y);}
export function isOpen(s,gate,width=CHAPTER.gateWidth){return Math.abs(mod(s-gate+P/2)-P/2)<=width/2+1e-8;}
export function sweptOpen(s,start,delta,width=CHAPTER.gateWidth){
 if(delta<0){start+=delta;delta=-delta;}
 return delta>=P-width || mod(s-(start-width/2))<=delta+width+1e-8;
}
// A circle's first contact with a fence side along its actual movement segment.
// Endpoint ranges include radius at corners: no corner tunneling or invisible square hitbox.
export function fenceContact(a,b,r=CHAPTER.radius){
 const {x,y,side:L}=CHAPTER;const dx=b.x-a.x,dy=b.y-a.y, hits=[];
 const add=(t,side)=>{if(t<0||t>1)return;const px=a.x+dx*t,py=a.y+dy*t;
  if((side%2===0&&px>=x&&px<=x+L)||(side%2===1&&py>=y&&py<=y+L))hits.push({t,s:perimeterOf(px,py)});
 };
 if(dy>0&&a.y<=y-r)add((y-r-a.y)/dy,0);
 if(dx<0&&a.x>=x+L+r)add((x+L+r-a.x)/dx,1);
 if(dy<0&&a.y>=y+L+r)add((y+L+r-a.y)/dy,2);
 if(dx>0&&a.x<=x-r)add((x-r-a.x)/dx,3);
 // Rounded corner contacts use segment-circle intersection, not an expanded AABB.
 for(const [cx,cy,s] of [[x,y,0],[x+L,y,L],[x+L,y+L,2*L],[x,y+L,3*L]]){
  const ax=a.x-cx,ay=a.y-cy,A=dx*dx+dy*dy,B=2*(ax*dx+ay*dy),C=ax*ax+ay*ay-r*r,D=B*B-4*A*C;
  if(A>0&&D>=0){const t=(-B-Math.sqrt(D))/(2*A);if(t>=0&&t<=1){const px=a.x+t*dx,py=a.y+t*dy;
   const outsideX=cx===x?px<=x:px>=x+L,outsideY=cy===y?py<=y:py>=y+L;
   if(outsideX&&outsideY)hits.push({t,s});
  }}
 }
 return hits.sort((a,b)=>a.t-b.t)[0]??null;
}
export function rng(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
export class Game{
 constructor({duration=90,intensity='Normal',seed=20261021,spawning=true}={}){
  if(![60,90,120].includes(duration)||!['Calm','Normal','Chaos'].includes(intensity))throw new Error('Unsupported v1.0 preset');
  this.duration=duration;this.intensity=intensity;this.random=rng(seed);this.spawning=spawning;this.remaining=duration;this.elapsed=0;this.phase='playing';this.gate=2.5*CHAPTER.side;this.units=[];this.beams=[];this.effects=[];this.defenders=0;this.kills=0;this.shotCredit=0;this.blueClock=.2;this.redClock=4;this.nextId=1;this.finaleTime=0;this.breach=null;this.events=[];
 }
 addUnit(type,s,{offset=100,speed,typeState='approach',...rest}={}){
  const p=pointAt(s,offset);const u={id:this.nextId++,type,...p,s:mod(s),state:typeState,speed:speed??(type==='blue'?CHAPTER.blueSpeed:CHAPTER.redSpeed*(.8+this.random()*.4)),wobble:this.random()*6.28,dir:this.random()<.5?-1:1,age:0,...rest};this.units.push(u);return u;
 }
 teleport(){if(this.phase!=='playing')return;this.gate=mod(this.gate+P/2);this.effects.push({kind:'teleport',...pointAt(this.gate),life:.45,maxLife:.45});this.events.push('teleport');this.checkPressing(this.gate,0);}
 lose(u){this.phase='defeat';this.breach={x:u.x,y:u.y,s:u.s,id:u.id};this.events.push('defeat');}
 checkPressing(start,delta){for(const u of this.units){if(u.type!=='red'||distanceToFence(u)>CHAPTER.radius+1e-6)continue;u.s=perimeterOf(u.x,u.y);if(sweptOpen(u.s,start,delta)){this.lose(u);return true;}}return false;}
 fire(){
  let target=null,d=Infinity;
  for(const u of this.units)if(u.type==='red'){const nd=distanceToFence(u);if(nd<d){d=nd;target=u;}}
  if(!target)return false;
  this.units.splice(this.units.indexOf(target),1);this.kills++;
  this.beams.push({x:target.x,y:target.y,life:.12,maxLife:.12});this.effects.push({x:target.x,y:target.y,life:.35,maxLife:.35,kind:'hit'});this.events.push('shot');return true;
 }
 update(dt,{direction=0}={}){
  if(!Number.isFinite(dt)||dt<0)throw new Error('Invalid timestep');
  // Public update accepts elapsed time; fixed substeps make all gate exposure explicit.
  let rest=dt;while(rest>1e-9){const step=Math.min(rest,1/120);this.step(step,direction);rest-=step;if(this.phase==='defeat'||this.phase==='victory')break;}
 }
 step(dt,direction){
  if(this.phase==='defeat'||this.phase==='victory')return;
  this.events=[];
  this.beams=this.beams.filter(b=>(b.life-=dt)>0);this.effects=this.effects.filter(e=>(e.life-=dt)>0);
  if(this.phase==='finale'){
   this.finaleTime+=dt;this.shotCredit+=dt*90;
   while(this.shotCredit>=1-1e-9){this.fire();this.shotCredit--;}
   if(this.finaleTime>=2.8){while(this.fire());this.phase='victory';this.events.push('victory');}return;
  }
  // Countdown is authoritative: nothing at or after zero can cause a defeat.
  if(this.remaining<=dt+1e-9){this.remaining=0;this.phase='finale';this.shotCredit=0;this.events.push('finale');return;}
  this.remaining-=dt;this.elapsed+=dt;
  const start=this.gate,delta=Math.sign(direction)*CHAPTER.gateSpeed*dt;
  this.gate=mod(start+delta);
  if(this.checkPressing(start,delta))return;
  if(this.spawning){
   this.blueClock-=dt;this.redClock-=dt;
   if(this.blueClock<=0){
    if(this.units.length<CHAPTER.cap){
     // First arrivals teach recruitment; subsequent waves spread around the perimeter.
     const s=this.elapsed<2?2.5*CHAPTER.side+(this.random()-.5)*65:this.random()*P;
     this.addUnit('blue',s,{offset:90+this.random()*15});
    }this.blueClock+=1.45;
   }
   const mult={Calm:.6,Normal:1,Chaos:1.6}[this.intensity];
   const rate=(.75+4.5*this.elapsed/this.duration+Math.min(10,this.defenders*.45))*mult;
   if(this.redClock<=0){if(this.units.length<CHAPTER.cap)this.addUnit('red',this.random()*P,{offset:95+this.random()*25});this.redClock+=1/rate;}
  }
  const arrived=[];
  for(const u of this.units){
   u.age+=dt;
   if(u.type==='blue'){
    if(u.state==='waiting'){
     if(isOpen(u.s,this.gate)){u.state='inside';this.events.push('admit');}else continue;
    }
    const dx=CENTER.x-u.x,dy=CENTER.y-u.y,d=Math.hypot(dx,dy),travel=u.speed*dt;
    if(d<=travel+4&&u.state==='inside'){arrived.push(u);continue;}
    const next={x:u.x+dx/d*travel,y:u.y+dy/d*travel};
    if(u.state==='approach'){
     const hit=fenceContact(u,next);
     if(hit){u.s=hit.s;u.x+=(next.x-u.x)*hit.t;u.y+=(next.y-u.y)*hit.t;
      if(isOpen(hit.s,this.gate))u.state='inside';else u.state='waiting';
      continue;
     }
    }
    u.x=next.x;u.y=next.y;
   }else{
    if(u.state==='pressing'){
     // Uninformed fence-following, with individual reversals and occasional retreats.
     const oldS=u.s,ds=u.dir*u.speed*.65*dt;
     if(sweptOpen(this.gate,oldS,ds,CHAPTER.gateWidth)){u.s=mod(oldS+ds);Object.assign(u,pointAt(u.s,CHAPTER.radius));this.lose(u);return;}
     u.s=mod(oldS+ds);Object.assign(u,pointAt(u.s,CHAPTER.radius));
     if(this.random()<dt*.24)u.dir*=-1;
     if(this.random()<dt*.10){u.state='retreat';u.retreat=1+this.random();}
     continue;
    }
    const dx=CENTER.x-u.x,dy=CENTER.y-u.y,d=Math.hypot(dx,dy);
    const angle=Math.atan2(dy,dx)+Math.sin(u.age*2.3+u.wobble)*.72;
    let step=u.speed*dt;
    if(u.state==='retreat'){step*=-.85;u.retreat-=dt;if(u.retreat<=0)u.state='approach';}
    const next={x:u.x+Math.cos(angle)*step,y:u.y+Math.sin(angle)*step};
    const hit=fenceContact(u,next);
    if(hit){u.s=hit.s;u.x+=(next.x-u.x)*hit.t;u.y+=(next.y-u.y)*hit.t;
     if(isOpen(u.s,this.gate)){this.lose(u);return;}u.state='pressing';
    }else{u.x=next.x;u.y=next.y;}
   }
  }
  for(const u of arrived){this.units.splice(this.units.indexOf(u),1);this.defenders++;this.effects.push({...CENTER,life:.6,maxLife:.6,kind:'recruit'});this.events.push('recruit');}
  if(this.defenders>0){
   if(this.units.some(u=>u.type==='red')){this.shotCredit+=dt*this.defenders;while(this.shotCredit>=1-1e-9){if(!this.fire()){this.shotCredit=0;break;}this.shotCredit--;}}
   else this.shotCredit=0;
  }else this.shotCredit=0;
 }
}
