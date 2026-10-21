import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import fs from 'node:fs/promises';
const url=process.env.TEST_URL||'http://127.0.0.1:5173';
await fs.mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),headless:true,args:['--no-sandbox']});
const context=await browser.newContext({locale:'en-US',viewport:{width:1440,height:1120}});
const page=await context.newPage();const errors=[],checks=[];
const pass=name=>{checks.push(name);console.log('PASS',name);};
context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
page.on('pageerror',e=>errors.push(e.message));
page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
await page.addInitScript(()=>{
  const original=CanvasRenderingContext2D.prototype.fillText;
  window.__canvasLabels=[];
  CanvasRenderingContext2D.prototype.fillText=function(text,...args){
    if(!window.__canvasLabels.includes(String(text)))window.__canvasLabels.push(String(text));
    return original.call(this,text,...args);
  };
});
const state=()=>page.evaluate(()=>window.riotDefender.getState());
const switchTo=locale=>page.locator('#language').selectOption(locale);
async function fits(width,height,name){
  await page.setViewportSize({width,height});await page.evaluate(()=>document.fonts.ready);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name}: horizontal overflow`);
  await page.screenshot({path:`artifacts/${name}.png`,fullPage:true});
}
try{
  await page.goto(url);assert.equal(await page.locator('html').getAttribute('lang'),'en');
  await switchTo('zh-TW');await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('html').getAttribute('lang'),'zh-TW');
  assert.match(await page.title(),/羅浮宮保衛戰/);assert.match(await page.locator('#start').innerText(),/開始守護/);
  assert.equal(await page.locator('#intensities [data-value="Normal"]').innerText(),'一般');
  assert.equal(await page.locator('#help').getAttribute('aria-label'),'閱讀完整遊戲說明');
  assert.match(await page.locator('#arena').getAttribute('aria-label'),/空白鍵/);
  assert.match(await page.locator('.landmark svg').getAttribute('aria-label'),/正立面/);
  assert.ok(await page.evaluate(()=>window.__canvasLabels.includes('入 口')));
  pass('Traditional Chinese updates UI, metadata, ARIA labels, and Canvas text');
  await fits(1440,1120,'zh-TW-opening');await fits(390,844,'zh-TW-mobile');await fits(320,740,'zh-TW-small');
  await page.setViewportSize({width:1440,height:1120});
  await page.locator('#durations [data-value="120"]').click();await page.locator('#intensities [data-value="Chaos"]').click();
  await switchTo('en');assert.equal((await state()).duration,120);assert.equal((await state()).intensity,'Chaos');
  await switchTo('zh-TW');assert.match(await page.locator('#button-note').innerText(),/120 秒.*混亂/);
  await page.reload();assert.equal(await page.locator('#language').inputValue(),'zh-TW');pass('Language persists across reloads; switching preserves selected gameplay settings');
  await page.locator('#start').click();await page.waitForTimeout(3900);assert.ok((await state()).defenders>=1);
  await page.keyboard.press('KeyP');const paused=await state();assert.equal(paused.paused,true);
  await switchTo('en');let changed=await state();assert.deepEqual({...changed,locale:paused.locale},paused);assert.match(await page.locator('#game-overlay').innerText(),/Your watch is paused/);
  await switchTo('zh-TW');assert.deepEqual(await state(),paused);assert.match(await page.locator('#game-overlay').innerText(),/守護任務已暫停/);
  await page.screenshot({path:'artifacts/zh-TW-paused.png',fullPage:true});pass('Switching languages preserves the complete paused simulation and translates its overlay');
  await page.locator('#help').click();assert.match(await page.locator('#help-dialog').innerText(),/藍色防衛者/);assert.match(await page.locator('#help-dialog').innerText(),/中途不會暴露其他位置/);
  await page.screenshot({path:'artifacts/zh-TW-help.png',fullPage:true});await page.locator('.dialog-done').click();
  await page.locator('#sound').click();assert.equal(await page.locator('#sound').getAttribute('aria-label'),'關閉音效');await page.locator('#sound').click();
  pass('Chinese instructions, sound controls, and accessibility labels work');
  await page.locator('[data-resume]').click();const gate=(await state()).gate;
  await page.locator('#language').focus();await page.keyboard.press('ArrowRight');await page.waitForTimeout(120);assert.equal((await state()).gate,gate);
  await switchTo('en');assert.equal((await state()).phase,'playing');assert.equal((await state()).paused,false);
  await switchTo('zh-TW');assert.ok((await state()).defenders>=paused.defenders);pass('Active-language switching retains progress and language keys do not move the gate');
  const dev=await page.evaluate(()=>!!window.riotDefender.test);
  if(dev){
    await page.evaluate(()=>{window.riotDefender.test.create({spawning:false});const g=window.riotDefender.test.game;g.addUnit('red',g.gate,{offset:5,typeState:'pressing',speed:0});});
    await page.waitForFunction(()=>window.riotDefender.getState().phase==='defeat');assert.match(await page.locator('#game-overlay').innerText(),/守護失敗/);
    assert.equal(await page.locator('#breach-indicator span').innerText(),'防線突破處');
    await switchTo('en');assert.match(await page.locator('#game-overlay').innerText(),/Defeat/);assert.equal((await state()).phase,'defeat');
    await switchTo('zh-TW');await page.screenshot({path:'artifacts/zh-TW-defeat.png',fullPage:true});await page.locator('[data-restart]').click();assert.equal((await state()).phase,'playing');
    pass('Defeat, breach marker, language switching, and retry are localized');
    await page.evaluate(()=>{window.riotDefender.test.create({spawning:false});const g=window.riotDefender.test.game;g.remaining=.02;g.defenders=3;for(let i=0;i<30;i++)g.addUnit('red',i*60,{offset:40,speed:0});});
    await page.waitForFunction(()=>window.riotDefender.getState().phase==='finale');await page.waitForTimeout(100);
    assert.ok(await page.evaluate(()=>window.__canvasLabels.includes('援 軍 即 將 抵 達')));
    await page.screenshot({path:'artifacts/zh-TW-finale.png',fullPage:true});const finalGate=(await state()).gate;
    await switchTo('en');assert.equal((await state()).gate,finalGate);await switchTo('zh-TW');
    await page.waitForFunction(()=>window.riotDefender.getState().phase==='victory');assert.match(await page.locator('#game-overlay').innerText(),/勝利！/);
    assert.match(await page.locator('#game-overlay').innerText(),/招募 3 名防衛者/);await page.screenshot({path:'artifacts/zh-TW-victory.png',fullPage:true});
    await switchTo('en');assert.match(await page.locator('#game-overlay').innerText(),/Victory/);await switchTo('zh-TW');
    await page.locator('[data-restart]').click();assert.equal((await state()).phase,'playing');assert.equal((await state()).locale,'zh-TW');
    pass('Finale Canvas text, victory summary, frozen controls, and replay work in both languages');
  }
  const traditional=await browser.newContext({locale:'zh-TW'});const traditionalPage=await traditional.newPage();
  await traditionalPage.goto(url);assert.equal(await traditionalPage.locator('#language').inputValue(),'zh-TW');
  await traditionalPage.locator('#language').selectOption('en');await traditionalPage.reload();assert.equal(await traditionalPage.locator('#language').inputValue(),'en');
  await traditional.close();pass('Traditional Chinese browser preference is detected; explicit language selection takes priority');
  const restricted=await browser.newContext();const restrictedPage=await restricted.newPage();
  await restrictedPage.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}}));
  await restrictedPage.goto(url);await restrictedPage.locator('#language').selectOption('zh-TW');assert.match(await restrictedPage.locator('#start').innerText(),/開始守護/);
  await restricted.close();pass('Blocked localStorage does not prevent starting or switching languages');
  assert.deepEqual(errors,[]);pass('No browser exceptions or console errors');
  await fs.writeFile(`artifacts/localization-results-${dev?'development':'production'}.json`,JSON.stringify({url,checks,errors},null,2));
}finally{await browser.close();}
