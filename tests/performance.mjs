// Optional headless stress measurement; not a claim about physical-device FPS.
import {chromium} from '@playwright/test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';import fs from 'node:fs/promises';
import {PERIMETER_IDS} from '../src/perimeter.js';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),args:['--no-sandbox']});
const results=[],errors=[],cpuSlowdown=Number(process.env.CPU_SLOWDOWN||4);
assert.ok(Number.isFinite(cpuSlowdown)&&cpuSlowdown>=1&&cpuSlowdown<=20);
try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:5173');await page.evaluate(()=>document.fonts.ready);assert.ok(await page.evaluate(()=>window.riotDefender.test),'Stress fixtures require a development server');
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpuSlowdown});
 for(const perimeter of PERIMETER_IDS){
  await page.locator('#landmark-choice').selectOption('louvre');await page.locator('#perimeter-choice').selectOption(perimeter);
  await page.evaluate(()=>{window.riotDefender.test.create({spawning:false,duration:120});const g=window.riotDefender.test.game,L=g.perimeter.length;g.units=[];for(let i=0;i<180;i++){const s=g.mod(g.gate+110+i*(L-220)/180),blue=i%6===0;g.addUnit(blue?'blue':'red',s,{offset:5,speed:0,typeState:blue?'waiting':'pressing'});}});
  const samples=await page.evaluate(()=>new Promise(resolve=>{const times=[];let last=performance.now(),count=0;function tick(now){if(count++>=20)times.push(now-last);last=now;if(times.length===120)resolve(times);else requestAnimationFrame(tick);}requestAnimationFrame(tick);}));
  const state=await page.evaluate(()=>window.riotDefender.getState());assert.equal(state.phase,'playing');assert.equal(state.units.length,180);
  const sorted=[...samples].sort((a,b)=>a-b),result={perimeter,meanFrameMs:samples.reduce((a,b)=>a+b)/samples.length,p95FrameMs:sorted[Math.floor(sorted.length*.95)],maxFrameMs:sorted.at(-1),samples:samples.length};
  results.push(result);console.log(JSON.stringify(result));assert.ok(result.p95FrameMs<100,'Obvious frame stalls under CPU slowdown');await page.locator('#new-watch').click({force:true});
 }
 assert.deepEqual(errors,[]);await fs.mkdir('artifacts/v1.1',{recursive:true});await fs.writeFile('artifacts/v1.1/performance-'+cpuSlowdown+'x.json',JSON.stringify({device:'Chromium phone emulation, 390x844, DPR 2',cpuSlowdown,units:180,results,errors,limitation:'Cloud host headless measurement; physical iOS/Android hardware is not verified.'},null,2));
}finally{await browser.close();}
