import { ACTIVE_CHAPTER } from './chapters/index.js';
import {getPerimeter,CENTER,wrap} from './perimeter.js';
export {CENTER};
export const CHAPTER=ACTIVE_CHAPTER.rules;
// Compatibility helpers retain the square/Louvre v1.0 public test surface.
const square=getPerimeter('square');
export const P=square.length;
export const mod=(n,p=P)=>wrap(n,p);
export const pointAt=(s,offset=0)=>square.pointAt(s,offset);
export const perimeterOf=(x,y)=>square.project({x,y}).s;
export const distanceToFence=u=>square.distance(u);
export const isOpen=(s,gate,width=CHAPTER.gateWidth)=>square.isOpen(s,gate,width);
export const sweptOpen=(s,start,delta,width=CHAPTER.gateWidth)=>square.sweptOpen(s,start,delta,width);
export const fenceContact=(a,b,r=CHAPTER.radius)=>square.contact(a,b,r);
export function rng(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
export class Game{
 get gate(){return this.u*this.perimeter.length;}
 set gate(s){this.u=this.mod(s)/this.perimeter.length;}
 mod(s){return this.perimeter.normalize(s);}
 pointAt(s,offset=0){return this.perimeter.pointAt(s,offset);}
 perimeterOf(x,y){return this.perimeter.project({x,y}).s;}
 distanceToFence(u){return this.perimeter.distance(u);}
 isOpen(s,gate,width=CHAPTER.gateWidth){return this.perimeter.isOpen(s,gate,width);}
 sweptOpen(s,start,delta,width=CHAPTER.gateWidth){return this.perimeter.sweptOpen(s,start,delta,width);}
 fenceContact(a,b,radius=CHAPTER.radius){return this.perimeter.contact(a,b,radius);}

 constructor({duration=90,intensity='Normal',seed=20261021,spawning=true,perimeter='square'}={}){
  if(![60,90,120].includes(duration)||!['Calm','Normal','Chaos'].includes(intensity))throw new Error('Unsupported preset');
  this.perimeter=getPerimeter(perimeter);
  this.duration=duration;this.intensity=intensity;this.random=rng(seed);this.spawning=spawning;this.remaining=duration;this.elapsed=0;this.phase='playing';this.gate=this.perimeter.initialS;this.units=[];this.beams=[];this.effects=[];this.defenders=0;this.kills=0;this.shotCredit=0;this.blueClock=.2;this.redClock=4;this.nextId=1;this.finaleTime=0;this.breach=null;this.events=[];
 }
 addUnit(type,s,{offset=100,speed,typeState='approach',...rest}={}){
  const p=this.pointAt(s,offset);const u={id:this.nextId++,type,...p,s:this.mod(s),state:typeState,speed:speed??(type==='blue'?CHAPTER.blueSpeed:CHAPTER.redSpeed*(.8+this.random()*.4)),wobble:this.random()*6.28,dir:this.random()<.5?-1:1,age:0,...rest};this.units.push(u);return u;
 }
 teleport(){if(this.phase!=='playing')return;this.gate=this.mod(this.gate+this.perimeter.length/2);this.effects.push({kind:'teleport',...this.pointAt(this.gate),life:.45,maxLife:.45});this.events.push('teleport');this.checkPressing(this.gate,0);}
 lose(u){this.phase='defeat';this.breach={x:u.x,y:u.y,s:u.s,id:u.id};this.events.push('defeat');}
 checkPressing(start,delta){
  for(const u of this.units){
   if(u.type!=='red')continue;
   const contact=this.perimeter.contacts(u,CHAPTER.radius).find(q=>this.sweptOpen(q.s,start,delta));
   if(contact){u.s=contact.s;this.lose(u);return true;}
  }return false;
 }
 fire(){
  let target=null,d=Infinity;
  for(const u of this.units)if(u.type==='red'){const nd=this.distanceToFence(u);if(nd<d){d=nd;target=u;}}
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
  this.gate=this.mod(start+delta);
  if(this.checkPressing(start,delta))return;
  if(this.spawning){
   this.blueClock-=dt;this.redClock-=dt;
   if(this.blueClock<=0){
    if(this.units.length<CHAPTER.cap){
     // First arrivals teach recruitment; subsequent waves spread around the perimeter.
     const s=this.elapsed<2?this.perimeter.initialS+(this.random()-.5)*65:this.random()*this.perimeter.length;
     this.addUnit('blue',s,{offset:90+this.random()*15});
    }this.blueClock+=1.45;
   }
   const mult={Calm:.6,Normal:1,Chaos:1.6}[this.intensity];
   const rate=(.75+4.5*this.elapsed/this.duration+Math.min(10,this.defenders*.45))*mult;
   if(this.redClock<=0){if(this.units.length<CHAPTER.cap)this.addUnit('red',this.random()*this.perimeter.length,{offset:95+this.random()*25});this.redClock+=1/rate;}
  }
  const arrived=[];
  for(const u of this.units){
   u.age+=dt;
   if(u.type==='blue'){
    if(u.state==='waiting'){
     if(this.sweptOpen(u.s,start,delta)){u.state='inside';this.events.push('admit');}else continue;
    }
    const dx=CENTER.x-u.x,dy=CENTER.y-u.y,d=Math.hypot(dx,dy),travel=u.speed*dt;
    if(d<=travel+4&&u.state==='inside'){arrived.push(u);continue;}
    const next={x:u.x+dx/d*travel,y:u.y+dy/d*travel};
    if(u.state==='approach'){
     const hit=this.fenceContact(u,next);
     if(hit){u.s=hit.s;u.x+=(next.x-u.x)*hit.t;u.y+=(next.y-u.y)*hit.t;
      if(this.sweptOpen(hit.s,start+delta*hit.t,delta*(1-hit.t)))u.state='inside';else u.state='waiting';
      continue;
     }
    }
    u.x=next.x;u.y=next.y;
   }else{
    if(u.state==='pressing'){
     // Uninformed fence-following, with individual reversals and occasional retreats.
     const oldS=u.s,ds=u.dir*u.speed*.65*dt;
     if(this.sweptOpen(this.gate,oldS,ds,CHAPTER.gateWidth)){u.s=this.mod(oldS+ds);Object.assign(u,this.pointAt(u.s,CHAPTER.radius));this.lose(u);return;}
     u.s=this.mod(oldS+ds);Object.assign(u,this.pointAt(u.s,CHAPTER.radius));
     if(this.random()<dt*.24)u.dir*=-1;
     if(this.random()<dt*.10){u.state='retreat';u.retreat=1+this.random();}
     continue;
    }
    const dx=CENTER.x-u.x,dy=CENTER.y-u.y,d=Math.hypot(dx,dy);
    const angle=Math.atan2(dy,dx)+Math.sin(u.age*2.3+u.wobble)*.72;
    let step=u.speed*dt;
    if(u.state==='retreat'){step*=-.85;u.retreat-=dt;if(u.retreat<=0)u.state='approach';}
    const next={x:u.x+Math.cos(angle)*step,y:u.y+Math.sin(angle)*step};
    const hit=this.fenceContact(u,next);
    if(hit){u.s=hit.s;u.x+=(next.x-u.x)*hit.t;u.y+=(next.y-u.y)*hit.t;
     // Only the gate arc exposed at or after physical contact can admit a dot.
     if(this.sweptOpen(u.s,start+delta*hit.t,delta*(1-hit.t))){this.lose(u);return;}u.state='pressing';
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
