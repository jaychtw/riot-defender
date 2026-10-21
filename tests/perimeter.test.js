import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {getPerimeter,PERIMETER_IDS,CENTER} from '../src/perimeter.js';
import {Game,CHAPTER} from '../src/simulation.js';
const near=(a,b,eps=1e-6)=>assert.ok(Math.abs(a-b)<=eps,a+' != '+b);
const delta=(a,b,L)=>(b-a+L*1.5)%L-L/2;
const make=(shape,options={})=>new Game({perimeter:shape,spawning:false,...options});

for(const shape of PERIMETER_IDS){
 const path=getPerimeter(shape),L=path.length;
 test(shape+': closed arc, true nearest projection, safe outside offsets and artwork bounds',()=>{
  assert.deepEqual(path.pointAt(0),path.pointAt(L));assert.deepEqual(path.pointAt(-L/4),path.pointAt(L*.75));
  for(let s=.25;s<L;s+=2.5){
   const q=path.pointAt(s),p=path.project(q);near(p.distance,0);near(delta(s,p.s,L),0);
   for(const r of [5,20,120]){const outside=path.pointAt(s,r);assert.ok(!path.contains(outside),shape+' offset must stay outside');assert.ok(path.distance(outside)>=r-1e-6);}
  }
  const {x,y,width,height}=path.artBox;
  for(let ix=0;ix<=10;ix++)for(let iy=0;iy<=10;iy++)assert.ok(path.contains({x:x+width*ix/10,y:y+height*iy/10}),'Art must fit entirely inside the fence');
 });
 test(shape+': single constant-width gate spans vertices and wraps without holes',()=>{
  for(const gate of [0,L-.1,...path.edges.map(e=>e.start),L*.37]){
   let count=0;for(let s=.5;s<L;s++)if(path.isOpen(s,gate))count++;
   assert.ok(Math.abs(count-98)<=1);assert.ok(path.isOpen(gate-48,gate)&&path.isOpen(gate+48,gate));assert.ok(!path.isOpen(gate+50,gate));
   let arcLength=0;const coordinates=[];const ctx={moveTo:(x,y)=>coordinates.push([x,y]),lineTo:(x,y)=>coordinates.push([x,y]),arc:(x,y,r,a,b)=>{arcLength=r*(b-a);}};
   path.trace(ctx,gate-49,gate+49);assert.ok(coordinates.every(p=>p.every(Number.isFinite)));
   const traced=path.radius?arcLength:coordinates.slice(1).reduce((length,p,i)=>length+Math.hypot(p[0]-coordinates[i][0],p[1]-coordinates[i][1]),0);near(traced,98);
  }
 });
 test(shape+': physical gate speed and normalized half-length Switch; only destination exposed',()=>{
  const g=make(shape);g.gate=0;g.update(.1,{direction:1});near(g.gate,36);near(g.u,g.gate/L);
  g.gate=0;g.addUnit('red',L*.25,{offset:5,speed:0,typeState:'pressing'});g.teleport();near(g.u,.5);assert.equal(g.phase,'playing');const flash=g.effects.find(e=>e.kind==='teleport'),destinationPoint=path.pointAt(g.gate);near(flash.x,destinationPoint.x);near(flash.y,destinationPoint.y);g.update(.05);assert.equal(g.phase,'playing');
  const destination=make(shape);destination.gate=0;destination.addUnit('red',L*.5,{offset:5,speed:0});destination.teleport();assert.equal(destination.phase,'defeat');
 });
 test(shape+': touching reds are immediate; separated reds can be avoided',()=>{
  for(const s of [L*.08,L*.27,L*.51,L*.79,...path.edges.map(e=>e.start+.01)]){
   const g=make(shape);const u=g.addUnit('red',s,{offset:5,speed:0});g.gate=path.project(u).s;g.update(1/120);assert.equal(g.phase,'defeat','Touching red at '+s);
  }
  const g=make(shape),s=path.initialS;g.gate=s;const u=g.addUnit('red',s,{offset:25,speed:24});g.update(.1);assert.equal(g.phase,'playing');assert.ok(path.distance(u)>5);g.teleport();g.update(2);assert.equal(g.phase,'playing');assert.ok(!path.contains(u));
 });
 test(shape+': gate exposure is evaluated when the dot actually reaches the fence within a step',()=>{
  const dt=1/120,s=path.initialS;
  // Gate is initially open, then closes halfway through this single update.
  for(const [offset,expected]of [[5.04,'defeat'],[5.18,'playing']]){
   const g=make(shape);g.gate=path.normalize(s+47.5);g.addUnit('red',s,{offset,speed:24,wobble:-dt*2.3});g.update(dt,{direction:1});assert.equal(g.phase,expected);
  }
  const g=make(shape);g.gate=path.normalize(s+47.5);const blue=g.addUnit('blue',s,{offset:5.1,speed:120});g.update(dt,{direction:1});assert.equal(blue.state,'inside');
  const waiting=make(shape);waiting.gate=path.normalize(s+48.5);const u=waiting.addUnit('blue',s,{offset:5,typeState:'waiting'});waiting.update(dt,{direction:1});assert.equal(u.state,'inside');
 });
 test(shape+': continuous collisions prevent tunneling along sides and at vertices',()=>{
  for(let s=.5;s<L;s+=31){
   const a=path.pointAt(s,80),hit=path.contact(a,CENTER,5);assert.ok(hit,'A straight exterior approach must hit the actual fence');
   const p={x:a.x+(CENTER.x-a.x)*hit.t,y:a.y+(CENTER.y-a.y)*hit.t};near(path.distance(p),5);assert.ok(!path.contains(p));
  }
  if(path.vertices)for(const vertex of path.vertices){const v={x:vertex.x-CENTER.x,y:vertex.y-CENTER.y},d=Math.hypot(v.x,v.y);const a={x:vertex.x+v.x/d*50,y:vertex.y+v.y/d*50};assert.ok(path.contact(a,CENTER,5));}
 });
 test(shape+': blues wait at their true contact point, then enter without teleporting',()=>{
  for(const s of [L*.12,L*.36,L*.63,L*.87]){
   const g=make(shape),u=g.addUnit('blue',s,{offset:40});const predicted=path.contact(u,CENTER,5);assert.ok(predicted);g.gate=g.mod(predicted.s+L/2);
   g.update(2);assert.equal(u.state,'waiting');const before={x:u.x,y:u.y};near(path.distance(u),5);g.update(.3);near(u.x,before.x);near(u.y,before.y);
   g.gate=u.s;g.update(.01);assert.equal(u.state,'inside');assert.ok(Math.hypot(u.x-before.x,u.y-before.y)<=1.21);g.teleport();g.update(5);assert.equal(g.defenders,1);
  }
 });
 test(shape+': shortest actual fence distance controls targeting; N defenders produce N shots',()=>{
  const g=make(shape);const far=g.addUnit('red',L*.12,{offset:80,speed:0});const close=g.addUnit('red',L*.67,{offset:12,speed:0});g.fire();assert.ok(g.units.includes(far));assert.ok(!g.units.includes(close));
  for(let i=0;i<30;i++)g.addUnit('red',i*L/30,{offset:80,speed:0});g.defenders=7;g.update(1);assert.equal(g.kills,8);
  for(let i=0;i<20;i++){const p=path.pointAt(i*L/20,15);let brute=Infinity;for(let j=0;j<4000;j++){const q=path.pointAt(j*L/4000);brute=Math.min(brute,Math.hypot(p.x-q.x,p.y-q.y));}assert.ok(path.distance(p)<=brute+1e-6);assert.ok(brute-path.distance(p)<.05);}
 });
 test(shape+': timer zero locks controls, clears threats and cannot become a late defeat',()=>{
  const g=make(shape);g.remaining=.001;g.addUnit('red',g.gate,{offset:5,typeState:'pressing'});for(let i=0;i<30;i++)g.addUnit('red',i*L/30,{offset:70,speed:0});
  const before=g.gate;g.update(.01,{direction:1});assert.equal(g.phase,'finale');g.teleport();g.update(3,{direction:-1});assert.equal(g.phase,'victory');near(g.gate,before);assert.equal(g.units.filter(u=>u.type==='red').length,0);
 });
 test(shape+': fence followers remain outside through an entire circuit including re-entrant corners',()=>{
  const g=make(shape),u=g.addUnit('red',0,{offset:5,speed:80,typeState:'pressing',dir:1});g.random=()=>1;
  for(let i=0;i<1000;i++){g.gate=path.normalize(u.s+L/2);g.update(.05);assert.equal(g.phase,'playing');assert.ok(!path.contains(u));near(path.distance(u),5);}
 });
 test(shape+': fixed stepping gives the same movement across frame rates',()=>{
  const a=make(shape),b=make(shape);a.addUnit('blue',L*.12,{offset:90});b.addUnit('blue',L*.12,{offset:90});
  for(let i=0;i<60;i++)a.update(1/60,{direction:1});for(let i=0;i<30;i++)b.update(1/30,{direction:1});near(a.gate,b.gate);near(a.units[0].x,b.units[0].x);near(a.units[0].y,b.units[0].y);
 });
}
test('v1.0 seeded square/Louvre snapshots preserve recruitment, spawn pressure and firing cadence',()=>{
 const snapshots=JSON.parse(fs.readFileSync(new URL('./fixtures/v1.0-baseline.json',import.meta.url)));
 for(const baseline of snapshots){
  const g=new Game({seed:baseline.seed});for(let i=0;i<720;i++)g.update(1/60);
  for(const key of ['phase','defenders','kills'])assert.equal(g[key],baseline[key]);near(g.remaining,baseline.remaining);near(g.gate,baseline.gate);assert.equal(g.units.length,baseline.units.length);
  const blue=g.units.filter(u=>u.type==='blue'),oldBlue=baseline.units.filter(u=>u.type==='blue');assert.equal(blue.length,oldBlue.length);
  // Correct Euclidean projection intentionally changes which corner-adjacent red
  // is eliminated. Blue movement/recruitment and aggregate defense remain baseline.
  for(let i=0;i<blue.length;i++)for(const [key,value]of Object.entries(oldBlue[i])){const actual=blue[i][key];if(typeof value==='number')near(actual,value);else assert.equal(actual,value);}
 }
 assert.equal(CHAPTER.radius,5);assert.equal(CHAPTER.gateWidth,98);assert.equal(CHAPTER.gateSpeed,360);
});

test('square corner-adjacent threats use the closest segment, correcting v1.0 projection',()=>{const p=getPerimeter('square').project({x:599,y:723});near(p.distance,98);near(p.x,599);near(p.y,625);});

test('invalid perimeter presets fail explicitly',()=>{for(const id of ['bad','constructor','__proto__'])assert.throws(()=>getPerimeter(id),/Unsupported perimeter/);});
