import test from 'node:test';import assert from 'node:assert/strict';
import {Game,CHAPTER} from '../src/simulation.js';import {PERIMETER_IDS} from '../src/perimeter.js';import {chooseControl} from './arena-controller.js';
for(const perimeter of PERIMETER_IDS)for(const duration of [60,90,120])for(const intensity of ['Calm','Normal','Chaos'])test(perimeter+' / '+duration+' / '+intensity+': legal seeded full survival',()=>{
 const g=new Game({perimeter,duration,intensity,seed:71});let maxUnits=0;
 for(let i=0;i<(duration+5)*20&&['playing','finale'].includes(g.phase);i++){
  const input=chooseControl(g,g.perimeter);if(input.teleport)g.teleport();g.update(.05,{direction:input.direction});maxUnits=Math.max(maxUnits,g.units.length);
 }
 assert.equal(g.phase,'victory',perimeter+' '+intensity+' breach at '+g.elapsed+' B='+g.defenders);assert.ok(g.defenders>0);assert.ok(maxUnits<=CHAPTER.cap);assert.equal(g.units.filter(u=>u.type==='red').length,0);
});
