import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import fs from 'node:fs/promises';
import {CHAPTER,P,mod,perimeterOf,isOpen,sweptOpen,distanceToFence} from '../src/simulation.js';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),args:['--no-sandbox']});
const locale=process.env.TEST_LOCALE||'en';
assert.ok(['en','zh-Hant'].includes(locale));
const page=await browser.newPage({viewport:{width:1440,height:1120}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
function choose(g){
 const reds=g.units.filter(u=>u.type==='red'&&distanceToFence(u)<38);
 const safe=s=>!reds.some(u=>isOpen(perimeterOf(u.x,u.y),s,CHAPTER.gateWidth+50));
 let target=g.gate;
 if(90-g.remaining>6){const candidate=g.units.filter(u=>u.type==='blue'&&u.state!=='inside').map(u=>perimeterOf(u.x,u.y)).filter(safe).sort((a,b)=>Math.abs(mod(a-g.gate+P/2)-P/2)-Math.abs(mod(b-g.gate+P/2)-P/2))[0];if(candidate!==undefined)target=candidate;}
 if(!safe(g.gate)){if(safe(mod(g.gate+P/2)))return {teleport:true,direction:0};const s=Array.from({length:40},(_,i)=>i*P/40).find(safe);if(s!==undefined)target=s;}
 const diff=mod(target-g.gate+P/2)-P/2;let direction=Math.abs(diff)<4?0:Math.sign(diff);
 if(reds.some(u=>distanceToFence(u)<=CHAPTER.radius+.001&&sweptOpen(u.s,g.gate,direction*CHAPTER.gateSpeed*.05)))direction=0;
 return {teleport:false,direction};
}
try{
 await page.addInitScript(()=>{Math.random=()=>71/4294967296;});
 await page.clock.install({time:new Date('2026-10-21T00:00:00Z')});
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:4173');await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.evaluate(()=>!!window.riotDefender.test),false,'Run this acceptance test against the production build.');
 await page.locator('#language').selectOption(locale);
 await page.locator('#start').click();let held=0,maxUnits=0,captured=false,state;
 for(let i=0;i<2000;i++){
  state=await page.evaluate(()=>window.riotDefender.getState());maxUnits=Math.max(maxUnits,state.units.length);
  if(state.phase==='defeat')throw new Error(`Default watch defeated at ${90-state.remaining}s`);
  if(state.phase==='victory')break;
  const action=state.phase==='playing'?choose(state):{teleport:false,direction:0};
  if(action.direction!==held){if(held)await page.keyboard.up(held===1?'ArrowRight':'ArrowLeft');if(action.direction)await page.keyboard.down(action.direction===1?'ArrowRight':'ArrowLeft');held=action.direction;}
  if(action.teleport)await page.keyboard.press('Space');
  await page.clock.runFor(50);
  if(!captured&&state.remaining<45){await page.screenshot({path:`artifacts/production-${locale}-midwatch.png`,fullPage:true});captured=true;}
 }
 assert.equal(state.phase,'victory');assert.equal(state.remaining,0);assert.equal(state.units.filter(u=>u.type==='red').length,0);assert.ok(state.defenders>0);assert.deepEqual(errors,[]);
 await page.screenshot({path:`artifacts/production-${locale}-victory.png`,fullPage:true});
 const result={locale,preset:'90s / Normal',seed:71,controls:'Real ArrowLeft/ArrowRight/Space key events',clock:'90 virtual seconds + automatic finale',phase:state.phase,defenders:state.defenders,kills:state.kills,maxUnits,errors};
 await fs.writeFile(`artifacts/production-${locale}-full-watch.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
