import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,CHAPTER,CENTER,P,mod,pointAt,perimeterOf,isOpen,sweptOpen,distanceToFence,fenceContact} from '../src/simulation.js';
const L=CHAPTER.side,r=CHAPTER.radius;
const make=opts=>new Game({spawning:false,...opts});
const near=(a,b,eps=1e-6)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);

test('perimeter maps all four sides clockwise and wraps, including negatives',()=>{
 assert.deepEqual(pointAt(0),{x:205,y:135});assert.deepEqual(pointAt(L),{x:695,y:135});assert.deepEqual(pointAt(2*L),{x:695,y:625});assert.deepEqual(pointAt(3*L),{x:205,y:625});assert.deepEqual(pointAt(P),pointAt(0));assert.deepEqual(pointAt(-L),pointAt(3*L));
 for(let s=0;s<P;s+=7)near(perimeterOf(...Object.values(pointAt(s))),s);
});
test('single opening stays exactly 20% of a side around every corner',()=>{
 for(const corner of [0,L,2*L,3*L]){
  assert.ok(isOpen(corner-48,corner));assert.ok(isOpen(corner+48,corner));assert.ok(!isOpen(corner+50,corner));
  let count=0;for(let s=.5;s<P;s++)if(isOpen(s,corner))count++;assert.equal(count,98);
 }
});
test('both arrow directions traverse all sides and corners continuously',()=>{
 const a=make(),b=make();a.gate=P-1;b.gate=1;a.update(.1,{direction:1});b.update(.1,{direction:-1});near(a.gate,35);near(b.gate,P-35);
 for(const corner of [0,L,2*L,3*L]){a.gate=mod(corner-5);a.update(.05,{direction:1});near(a.gate,mod(corner+13));}
});
test('swept gate exposure catches contacts skipped between endpoints',()=>{
 assert.ok(!isOpen(100,0)&&!isOpen(100,200));assert.ok(sweptOpen(100,0,200));assert.ok(sweptOpen(P-20,40,-100));
 const g=make();g.gate=0;g.addUnit('red',100,{offset:r,typeState:'pressing',speed:0});g.update(.6,{direction:1});assert.equal(g.phase,'defeat');
});
test('teleport relocates exactly half perimeter with no intermediate exposure',()=>{
 const g=make();g.gate=0;g.addUnit('red',L,{offset:r,typeState:'pressing',speed:0});g.teleport();near(g.gate,2*L);assert.equal(g.phase,'playing');g.update(.05);assert.equal(g.phase,'playing');
});
test('teleport destination immediately breaches a touching red',()=>{
 const g=make();g.gate=0;g.addUnit('red',2*L+20,{offset:r,typeState:'pressing'});g.teleport();assert.equal(g.phase,'defeat');assert.ok(g.breach);
});
test('geometric contact breaches regardless of movement-state flag',()=>{
 const g=make();g.gate=0;g.addUnit('red',2*L+20,{offset:r,typeState:'retreat'});g.teleport();assert.equal(g.phase,'defeat');
});
test('a touching red breaches immediately with no grace period',()=>{
 const g=make();g.gate=100;g.addUnit('red',100,{offset:r,typeState:'pressing'});g.update(1/120);assert.equal(g.phase,'defeat');near(g.remaining,90-1/120);
});
test('a visibly separated red must traverse space and can be saved by closing',()=>{
 const g=make();g.gate=100;const u=g.addUnit('red',100,{offset:25,speed:24});g.update(.1);assert.equal(g.phase,'playing');assert.ok(distanceToFence(u)>r);g.teleport();g.update(2);assert.equal(g.phase,'playing');assert.ok(distanceToFence(u)>=r-1e-5);
});
test('a separated red eventually physically reaches an open gate',()=>{
 const g=make();g.gate=L/2;g.addUnit('red',L/2,{offset:12,speed:24});g.update(1);assert.equal(g.phase,'defeat');
});
test('red fence following cannot slide through an open gate',()=>{
 const g=make();g.gate=150;g.addUnit('red',99,{offset:r,typeState:'pressing',speed:80,dir:1});g.update(.1);assert.equal(g.phase,'defeat');
});
test('circle-side contact is physical, including all sides and rounded corners',()=>{
 for(const s of [L/2,L*1.5,L*2.5,L*3.5]){const a=pointAt(s,20),b=CENTER;const hit=fenceContact(a,b);assert.ok(hit);near(hit.s,s);}
 assert.equal(fenceContact({x:190,y:120},{x:191,y:121}),null);
 assert.ok(fenceContact({x:195,y:125},{x:220,y:150}));
});
test('blue waits at exact first contact, then resumes straight to center',()=>{
 const g=make();g.gate=0;const u=g.addUnit('blue',2.5*L,{offset:30});g.update(1);assert.equal(u.state,'waiting');near(u.y,CHAPTER.y+L+r);near(u.x,CENTER.x);assert.equal(g.defenders,0);g.gate=2.5*L;g.update(.1);assert.equal(u.state,'inside');assert.equal(g.defenders,0);g.update(3);assert.equal(g.defenders,1);assert.equal(g.units.length,0);
});
test('a blue admitted through the gate remains inside when the opening moves',()=>{
 const g=make();g.gate=2.5*L;const u=g.addUnit('blue',2.5*L,{offset:6});g.update(.05);assert.equal(u.state,'inside');g.teleport();g.update(3);assert.equal(g.defenders,1);
});
test('zero defenders never fire; B defenders deliver exactly B eliminations per second',()=>{
 const g=make();for(let i=0;i<40;i++)g.addUnit('red',i*40,{offset:100,speed:0});g.update(1);assert.equal(g.kills,0);g.defenders=10;g.update(1);assert.equal(g.kills,10);assert.equal(g.units.length,30);assert.ok(g.beams.length>0);
});
test('fire cadence is distributed and idle time cannot bank shots',()=>{
 const g=make();g.defenders=4;g.update(20);g.addUnit('red',30,{offset:90,speed:0});g.update(.24);assert.equal(g.kills,0);g.update(.02);assert.equal(g.kills,1);
});
test('defense prioritizes nearest fence, rather than center or spawn order',()=>{
 const g=make();const far=g.addUnit('red',0,{offset:90,speed:0});const nearUnit=g.addUnit('red',L/2,{offset:12,speed:0});g.defenders=1;g.update(1);assert.ok(g.units.includes(far));assert.ok(!g.units.includes(nearUnit));
});
test('defense can target anywhere in the active playfield without a radius',()=>{
 const g=make();g.defenders=1;g.addUnit('red',L/2,{offset:130,speed:0});g.update(1);assert.equal(g.kills,1);
});
test('at zero controls freeze and finale clears all reds before victory',()=>{
 const g=make();g.remaining=.001;g.gate=100;g.addUnit('red',100,{offset:r,typeState:'pressing'});for(let i=0;i<179;i++)g.addUnit('red',i*10,{offset:90,speed:0});g.update(.01,{direction:1});assert.equal(g.phase,'finale');assert.equal(g.remaining,0);const gate=g.gate;g.teleport();g.update(3,{direction:1});assert.equal(g.phase,'victory');near(g.gate,gate);assert.equal(g.units.filter(u=>u.type==='red').length,0);assert.equal(g.kills,180);
});
test('defeat freezes simulation and a restart is a fresh complete game',()=>{
 const g=make();g.addUnit('red',g.gate,{offset:r,typeState:'pressing'});g.update(.01);const remaining=g.remaining;g.update(10,{direction:1});g.teleport();near(g.remaining,remaining);const fresh=make();assert.equal(fresh.phase,'playing');assert.equal(fresh.defenders,0);assert.equal(fresh.remaining,90);
});
test('seeded scenarios reproduce movement, spawns, and target removal',()=>{
 const a=new Game({seed:123}),b=new Game({seed:123});for(let i=0;i<300;i++){a.update(1/60,{direction:i<100?1:0});b.update(1/60,{direction:i<100?1:0});}assert.deepEqual(a.units,b.units);assert.equal(a.phase,b.phase);assert.equal(a.gate,b.gate);
});
test('fixed substeps make movement and gate speed independent of presentation FPS',()=>{
 const a=make(),b=make();a.addUnit('blue',2.5*L,{offset:70});b.addUnit('blue',2.5*L,{offset:70});for(let i=0;i<60;i++)a.update(1/60,{direction:1});for(let i=0;i<30;i++)b.update(1/30,{direction:1});near(a.gate,b.gate);near(a.units[0].x,b.units[0].x);near(a.units[0].y,b.units[0].y);
});
// A legal controller holds the initial gate to recruit the tutorial wave, then
// picks safe blue contacts. It never removes enemies or changes simulation state.
function autoPilot(g){
 const reds=g.units.filter(u=>u.type==='red'&&distanceToFence(u)<38);
 const safe=s=>!reds.some(u=>isOpen(perimeterOf(u.x,u.y),s,CHAPTER.gateWidth+50));
 const blues=g.units.filter(u=>u.type==='blue'&&u.state!=='inside');
 let target=g.gate;
 if(g.elapsed>6){const candidate=blues.map(u=>perimeterOf(u.x,u.y)).filter(safe).sort((a,b)=>Math.abs(mod(a-g.gate+P/2)-P/2)-Math.abs(mod(b-g.gate+P/2)-P/2))[0];if(candidate!==undefined)target=candidate;}
 if(!safe(g.gate)){const opposite=mod(g.gate+P/2);if(safe(opposite)){g.teleport();return 0;}const safePoint=Array.from({length:40},(_,i)=>i*P/40).find(safe);if(safePoint!==undefined)target=safePoint;}
 const diff=mod(target-g.gate+P/2)-P/2;
 // Never sweep a touching intruder; take a safe half-perimeter jump if useful.
 const direction=Math.abs(diff)<4?0:Math.sign(diff);
 const step=direction*CHAPTER.gateSpeed*.05;
 if(reds.some(u=>distanceToFence(u)<=r+.001&&sweptOpen(u.s,g.gate,step)))return 0;
 return direction;
}
for(const duration of [60,90,120])for(const intensity of ['Calm','Normal','Chaos'])test(`${duration}s / ${intensity}: full seeded watch is winnable, bounded, and finale completes`,()=>{
 const g=new Game({duration,intensity,seed:71});let maxUnits=0;
 for(let i=0;i<(duration+5)*20&&['playing','finale'].includes(g.phase);i++){g.update(.05,{direction:g.phase==='playing'?autoPilot(g):0});maxUnits=Math.max(maxUnits,g.units.length);}
 assert.equal(g.phase,'victory',`breach ${JSON.stringify(g.breach)} at ${g.elapsed.toFixed(2)}, B=${g.defenders}`);assert.ok(g.defenders>0);assert.ok(maxUnits<=CHAPTER.cap);assert.equal(g.units.filter(u=>u.type==='red').length,0);
});
test('invalid presets fail explicitly',()=>{assert.throws(()=>make({duration:30}));assert.throws(()=>make({intensity:'Extreme'}));});
