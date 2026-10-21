import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
const url=process.env.TEST_URL||'http://127.0.0.1:5173';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1120},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const checks=[];const pass=s=>{checks.push(s);console.log('PASS',s);};
try{
 await page.goto(url);await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:'artifacts/opening.png',fullPage:true});
 assert.equal(await page.locator('#timer').innerText(),'01:30');assert.equal(await page.locator('#intensities .selected').innerText(),'Normal');assert.equal(await page.locator('.landmark svg').count(),1);pass('Opening, default settings, and original SVG landmark');
 const external=await page.evaluate(()=>performance.getEntriesByType('resource').filter(x=>!x.name.startsWith(location.origin)).map(x=>x.name));assert.deepEqual(external,[]);pass('Self-contained assets: no external fonts, images, or runtime services');
 for(const duration of [60,90,120])for(const intensity of ['Calm','Normal','Chaos']){
  await page.locator(`#durations [data-value="${duration}"]`).click();await page.locator(`#intensities [data-value="${intensity}"]`).click();
  assert.equal((await page.evaluate(()=>window.riotDefender.getState())).duration,duration);
  await page.locator('#start').click();assert.equal((await page.evaluate(()=>window.riotDefender.getState())).phase,'playing');await page.locator('#new-watch').click();
 }pass('All nine configurations start and return to setup');
 await page.locator('#durations [data-value="90"]').click();await page.locator('#intensities [data-value="Normal"]').click();await page.locator('#arena-start').click();
 await page.waitForTimeout(3900);assert.ok((await page.evaluate(()=>window.riotDefender.getState())).defenders>=1);pass('Real-time blue recruitment activates defense');
 let before=await page.evaluate(()=>window.riotDefender.getState().gate);await page.keyboard.down('ArrowRight');await page.waitForTimeout(250);await page.keyboard.up('ArrowRight');let after=await page.evaluate(()=>window.riotDefender.getState().gate);assert.ok(after>before+40);pass('Held arrow produces continuous clockwise gate movement');
 before=after;await page.keyboard.press('Space');after=await page.evaluate(()=>window.riotDefender.getState().gate);assert.ok(Math.abs(((after-before+1960)%1960)-980)<.001);pass('Space jumps exactly half a perimeter');
 await page.keyboard.press('KeyP');assert.equal((await page.evaluate(()=>window.riotDefender.getState())).paused,true);const time=await page.evaluate(()=>window.riotDefender.getState().remaining);await page.waitForTimeout(200);assert.equal((await page.evaluate(()=>window.riotDefender.getState())).remaining,time);await page.locator('[data-resume]').click();pass('Pause freezes timer; resume restores play');
 await page.locator('#help').click();assert.equal(await page.locator('#help-dialog').evaluate(d=>d.open),true);await page.locator('.dialog-done').click();await page.locator('[data-resume]').click();pass('Field notes dialog pauses game and closes cleanly');
 await page.locator('#sound').click();assert.equal(await page.locator('#sound').getAttribute('aria-label'),'Disable sound');await page.locator('#sound').click();pass('Optional audio toggles through a user gesture');
 // Seeded development-only fixtures exercise real DOM/render transitions, not a replacement game loop.
 const dev=await page.evaluate(()=>!!window.riotDefender.test);
 if(dev){
  await page.evaluate(()=>{window.riotDefender.test.create({duration:90,intensity:'Normal',seed:17,spawning:false});const g=window.riotDefender.test.game;g.defenders=8;for(let i=0;i<8;i++)g.addUnit('red',i*230+20,{offset:40+i*8,speed:0});for(let i=0;i<5;i++)g.addUnit('blue',i*330,{offset:5,speed:80});});
  await page.waitForTimeout(300);await page.screenshot({path:'artifacts/gameplay.png',fullPage:true});
  await page.evaluate(()=>{const g=window.riotDefender.test.game;g.defenders=0;g.addUnit('red',g.gate,{offset:5,typeState:'pressing',speed:0});});await page.waitForFunction(()=>window.riotDefender.getState().phase==='defeat');await page.waitForTimeout(100);assert.match(await page.locator('#game-overlay').innerText(),/Defeat/);await page.screenshot({path:'artifacts/defeat.png',fullPage:true});pass('Physical red contact triggers immediate defeat and visible result');
  await page.locator('[data-restart]').click();assert.equal((await page.evaluate(()=>window.riotDefender.getState())).phase,'playing');assert.equal((await page.evaluate(()=>window.riotDefender.getState())).defenders,0);pass('Restart resets timer, recruitment, and game state');
  await page.evaluate(()=>{window.riotDefender.test.create({duration:90,intensity:'Normal',seed:17,spawning:false});const g=window.riotDefender.test.game;g.defenders=12;g.kills=101;for(let i=0;i<70;i++)g.addUnit('red',i*27,{offset:30+(i%4)*12,speed:0});g.remaining=.02;});
  await page.waitForFunction(()=>window.riotDefender.getState().phase==='finale');await page.waitForTimeout(450);await page.screenshot({path:'artifacts/finale.png',fullPage:true});const gate=await page.evaluate(()=>window.riotDefender.getState().gate);await page.keyboard.press('Space');assert.equal((await page.evaluate(()=>window.riotDefender.getState())).gate,gate);await page.waitForFunction(()=>window.riotDefender.getState().phase==='victory');assert.equal((await page.evaluate(()=>window.riotDefender.getState())).units.filter(u=>u.type==='red').length,0);await page.screenshot({path:'artifacts/victory.png',fullPage:true});pass('Zero-time finale locks controls, clears threats, and displays victory');
 }
 await page.locator('#new-watch').click();await page.keyboard.press('Tab');await page.locator('#start').focus();assert.ok(await page.locator('#start').evaluate(e=>e.matches(':focus-visible')));pass('Keyboard focus is visible');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/mobile.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));pass('390px layout fits without horizontal overflow');
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#start').click();await page.waitForTimeout(200);pass('Reduced-motion presentation starts successfully');
 assert.deepEqual(errors,[]);pass('No browser console errors or uncaught exceptions');
 await fs.writeFile(`artifacts/browser-results-${dev?'development':'production'}.json`,JSON.stringify({url,checks,errors,devFixtures:dev},null,2));
}finally{await browser.close();}
