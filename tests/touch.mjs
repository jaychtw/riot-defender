import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import fs from 'node:fs/promises';
const url=process.env.TEST_URL||'http://127.0.0.1:5173';
await fs.mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2,locale:'en-US'});
const page=await context.newPage(),cdp=await context.newCDPSession(page),checks=[],errors=[],metrics=[];
const pass=name=>{checks.push(name);console.log('PASS',name);};
const state=()=>page.evaluate(()=>window.riotDefender.getState());
const gate=async()=>(await state()).gate;
const delta=(a,b)=>(b-a+2940)%1960-980;
const near=(actual,expected,epsilon=7)=>assert.ok(Math.abs(actual-expected)<=epsilon,`${actual} != ${expected}`);
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{
  Math.random=()=>71/4294967296;
  window.__touchPointerId=null;window.__unitRadii=[];
  document.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')window.__touchPointerId=e.pointerId;},true);
  const arc=CanvasRenderingContext2D.prototype.arc;
  CanvasRenderingContext2D.prototype.arc=function(x,y,r,...rest){
    if((r===5||r===10)&&!window.__unitRadii.some(v=>v.radius===r&&v.color===this.fillStyle))window.__unitRadii.push({radius:r,color:this.fillStyle});
    return arc.call(this,x,y,r,...rest);
  };
});
await page.clock.install({time:new Date('2026-10-21T00:00:00Z')});
await page.clock.pauseAt(new Date('2026-10-21T00:00:10Z')); // Explicit advances exclude host/CDP latency from hold durations.
async function point(selector){const b=await page.locator(selector).boundingBox();assert.ok(b);return {x:b.x+b.width/2,y:b.y+b.height/2,id:1,radiusX:3,radiusY:3,force:1};}
let touching=false;
async function down(selector){const p=await point(selector);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});touching=true;return p;}
const up=async()=>{if(touching){await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});touching=false;}};
const cancel=async()=>{if(touching){await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});touching=false;}};
const advance=ms=>page.clock.runFor(ms);
async function fresh(){await cancel();await page.locator('#start').click({force:true});await advance(50);assert.equal((await state()).phase,'playing');}
async function stopped(){const value=await gate();await advance(250);near(await gate(),value,1e-7);assert.equal(await page.locator('.touch-controls .pressed').count(),0);}
try{
 await page.goto(url);await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('.map-label').count(),0);assert.equal(await page.locator('.landmark').innerText(),'');assert.equal(await page.locator('.landmark text,.landmark image,.landmark foreignObject').count(),0);
 await advance(50);assert.ok(await page.evaluate(()=>['#5a94b7','#c26452'].every(color=>window.__unitRadii.some(v=>v.radius===10&&v.color===color))));
 assert.ok(await page.evaluate(()=>window.__unitRadii.some(v=>v.radius===5)));
 pass('Artwork contains no visible text or caption overlay; both dot colors render at double diameter with original contact cores');
 for(const locale of ['en','zh-Hant']){
  await page.locator('#language').selectOption(locale);
  for(const width of [320,360,390,430]){
   await page.setViewportSize({width,height:844});await fresh();
   const arena=await page.locator('.arena-wrap').boundingBox(),row=await page.locator('#touch-controls').boundingBox();
   assert.ok(row.y>=arena.y+arena.height);assert.ok(row.y+row.height<=844);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const rects=[];for(const id of ['#touch-left','#touch-switch','#touch-right']){const b=await page.locator(id).boundingBox();assert.ok(b.width>=44&&b.height>=44);rects.push(b);}
   near(rects[0].y,rects[1].y,1);near(rects[1].y,rects[2].y,1);assert.ok(rects[1].x-rects[0].x-rects[0].width>=10);assert.ok(rects[2].x-rects[1].x-rects[1].width>=10);
   const scale=arena.width/900;metrics.push({locale,width,unitDiameterCss:20*scale,contactDiameterCss:10*scale,visualContactLeadCss:5*scale,touchTarget:{width:rects[0].width,height:rects[0].height}});
   assert.ok(await page.locator('#arena-timer').isVisible());
   if(width===390)await page.screenshot({path:`artifacts/touch-${locale}-mobile-opening.png`});
  }
 }
 pass('Both languages fit 320–430px mobile screens; controls stay below the field, horizontally aligned, separated, and at least 44px');
 await page.setViewportSize({width:390,height:844});await fresh();
 let before=await gate();await down('#touch-left');await advance(400);let after=await gate();near(delta(before,after),-144);await up();await stopped();
 pass('Real touchscreen left hold moves continuously counterclockwise; release immediately stops movement');
 await fresh();before=await gate();await down('#touch-right');await advance(400);after=await gate();near(delta(before,after),144);await up();await stopped();
 pass('Real touchscreen right hold moves continuously clockwise; release immediately stops movement');
 await fresh();const scrollBefore=await page.evaluate(()=>scrollY);const heldPoint=await down('#touch-left');await advance(150);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...heldPoint,x:2,y:2}]});await advance(200);
 assert.equal(await page.evaluate(()=>scrollY),scrollBefore);await up();await stopped();assert.equal(await page.evaluate(()=>getSelection().toString()),'');
 pass('Dragging outside a captured control does not scroll or select text; releasing outside stops movement');
 await fresh();const fieldScroll=await page.evaluate(()=>scrollY);const fieldPoint=await down('.arena-wrap');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...fieldPoint,y:fieldPoint.y-100}]});await advance(100);await up();
 assert.equal(await page.evaluate(()=>scrollY),fieldScroll);pass('Swiping on the active game field does not scroll the page');
 await fresh();await down('#touch-right');await advance(100);await cancel();await stopped();
 pass('Native touch cancellation clears movement');
 await fresh();const captured=await down('#touch-left');await advance(100);
 assert.ok(await page.locator('#touch-left').evaluate(el=>el.hasPointerCapture(window.__touchPointerId)));
 await page.locator('#touch-left').evaluate(el=>el.releasePointerCapture(window.__touchPointerId));
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[captured]});await advance(30);await stopped();await up();
 pass('Lost pointer capture clears movement without waiting for release');
 await fresh();before=await gate();await down('#touch-switch');near(Math.abs(delta(before,await gate())),980,1e-7);await advance(200);await up();await stopped();near(Math.abs(delta(before,await gate())),980,1e-7);
 pass('Switch teleports on touch-down exactly half a perimeter and never repeats on release/click');
 await fresh();before=await gate();await page.locator('#touch-switch').focus();await page.keyboard.press('Space');near(Math.abs(delta(before,await gate())),980,1e-7);await advance(100);near(Math.abs(delta(before,await gate())),980,1e-7);
 pass('Keyboard activation of Switch teleports once without a duplicate native click');
 await fresh();before=await gate();await page.keyboard.down('ArrowRight');await advance(400);await page.keyboard.up('ArrowRight');const keyboardDelta=delta(before,await gate());await stopped();
 await fresh();before=await gate();await down('#touch-right');await advance(400);await up();near(delta(before,await gate()),keyboardDelta);await stopped();
 before=await gate();await page.keyboard.press('Space');near(Math.abs(delta(before,await gate())),980,1e-7);
 pass('Desktop keys and touch buttons use equivalent direction/speed; Space still teleports after pointer release');
 await fresh();await page.locator('#touch-left').focus();before=await gate();await page.keyboard.down('Space');await advance(250);await page.keyboard.up('Space');near(delta(before,await gate()),-90);await stopped();
 await fresh();await page.locator('#touch-right').focus();before=await gate();await page.keyboard.down('Enter');await advance(250);await page.keyboard.up('Enter');near(delta(before,await gate()),90);await stopped();
 pass('Directional buttons also support accessible hold-to-move using Space/Enter');
 await fresh();await down('#touch-right');await advance(100);await page.keyboard.press('KeyP');assert.equal((await state()).paused,true);await up();const pauseGate=await gate();await page.locator('[data-resume]').click({force:true});await advance(250);near(await gate(),pauseGate,1e-7);
 pass('Pausing and resuming during a gesture never leaves movement stuck');
 await fresh();await down('#touch-left');await advance(100);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await state()).paused,true);await up();const blurGate=await gate();await page.locator('[data-resume]').click({force:true});await advance(250);near(await gate(),blurGate,1e-7);
 pass('An interrupted window gesture clears input and pauses safely');
 await fresh();await down('#touch-right');await advance(100);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});try{document.dispatchEvent(new Event('visibilitychange'));}finally{delete document.hidden;}});
 assert.equal((await state()).paused,true);await up();const hiddenGate=await gate();await page.locator('[data-resume]').click({force:true});await advance(250);near(await gate(),hiddenGate,1e-7);
 pass('A background-tab interruption clears input before the game resumes');
 await fresh();await down('#touch-left');await advance(100);await page.setViewportSize({width:430,height:844});await up();await stopped();
 pass('Viewport/orientation changes clear held gestures');
 await fresh();await down('#touch-right');await advance(100);await page.locator('#language').selectOption('en');await up();await stopped();
 pass('Changing language during a gesture clears held input');
 await fresh();await down('#touch-left');await advance(100);await page.locator('#start').click({force:true});await up();await stopped();near(await gate(),1225,1e-7);
 pass('Restart during a gesture resets input and gate position');
 await fresh();const value=await gate();
 await page.locator('#touch-left').dispatchEvent('pointerdown',{pointerId:101,pointerType:'touch',button:0});
 await page.locator('#touch-right').dispatchEvent('pointerdown',{pointerId:102,pointerType:'touch',button:0});
 await advance(150);near(await gate(),value,1e-7);
 await page.locator('#touch-left').dispatchEvent('pointercancel',{pointerId:101,pointerType:'touch',button:0});
 await advance(150);assert.ok(delta(value,await gate())>30);await page.locator('#touch-right').dispatchEvent('pointerup',{pointerId:102,pointerType:'touch',button:0});await stopped();
 pass('Independent pointers cancel opposite directions and release/cancel independently');
 const dev=await page.evaluate(()=>!!window.riotDefender.test);
 if(dev){
  await page.setViewportSize({width:390,height:844});
  for(const locale of ['en','zh-Hant']){
   await page.locator('#language').selectOption(locale);await fresh();
   await page.evaluate(()=>{const g=window.riotDefender.test.game;g.spawning=false;g.units=[];for(const s of [180,740,1580])g.addUnit('blue',s,{offset:5,speed:0,typeState:'waiting'});g.addUnit('blue',1225,{offset:70,speed:0});for(const [s,offset]of [[400,45],[620,5],[1440,5],[1080,60]])g.addUnit('red',s,{offset,speed:0,typeState:offset===5?'pressing':'approach'});});
   await advance(50);await page.screenshot({path:`artifacts/touch-${locale}-mobile-gameplay.png`});
   await page.locator('.game-panel').screenshot({path:`artifacts/touch-${locale}-game-panel.png`});
  }
  await fresh();await down('#touch-left');await page.evaluate(()=>{const g=window.riotDefender.test.game;g.addUnit('red',g.gate,{offset:5,typeState:'pressing',speed:0});});await advance(50);
  assert.equal((await state()).phase,'defeat');await up();assert.equal(await page.locator('#touch-left').isDisabled(),true);await stopped();
  await fresh();await down('#touch-right');await page.evaluate(()=>{window.riotDefender.test.game.remaining=.01;});await advance(50);assert.equal((await state()).phase,'finale');await up();const finaleGate=await gate();await advance(3000);assert.equal((await state()).phase,'victory');near(await gate(),finaleGate,1e-7);assert.equal(await page.locator('#touch-switch').isDisabled(),true);
  pass('Defeat and the victory finale clear gestures, disable controls, and preserve established outcomes');
 }
 await page.setViewportSize({width:844,height:390});await fresh();await page.screenshot({path:'artifacts/touch-landscape.png'});
 const landscapeRow=await page.locator('#touch-controls').boundingBox();assert.ok(landscapeRow.y+landscapeRow.height<=390);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 pass('Landscape touch viewport keeps arena and controls accessible');
 assert.deepEqual(errors,[]);pass('No browser exceptions or console errors');
 await fs.writeFile(`artifacts/touch-results-${dev?'development':'production'}.json`,JSON.stringify({url,checks,metrics,errors,devFixtures:dev},null,2));
}finally{await browser.close();}
