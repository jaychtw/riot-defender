import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import fs from 'node:fs/promises';
import {CHAPTERS} from '../src/chapters/index.js';
import {getPerimeter,PERIMETER_IDS} from '../src/perimeter.js';
const url=process.env.TEST_URL||'http://127.0.0.1:5173';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),args:['--no-sandbox']});
const checks=[],screenshots=[],errors=[];
const pass=name=>{checks.push(name);console.log('PASS',name);};
const near=(a,b,eps=1e-5)=>assert.ok(Math.abs(a-b)<=eps,a+' != '+b);
await fs.mkdir('artifacts/v1.1',{recursive:true});
try{
 for(const device of ['desktop','phone']){
  const phone=device==='phone',width=phone?390:1366,height=phone?844:768;
  const context=await browser.newContext({viewport:{width,height},hasTouch:phone,isMobile:phone,deviceScaleFactor:phone?2:1});
  const page=await context.newPage(),cdp=await context.newCDPSession(page);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{Math.random=()=>71/4294967296;});
  await page.clock.install({time:new Date('2026-10-21T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-21T00:00:10Z'));
  await page.goto(url);await page.evaluate(()=>document.fonts.ready);
  const state=()=>page.evaluate(()=>window.riotDefender.getState());
  const advance=ms=>page.clock.runFor(ms);
  async function touch(selector,type){
   const box=await page.locator(selector).boundingBox();assert.ok(box);
   await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchStart'?[{x:box.x+box.width/2,y:box.y+box.height/2,id:1,radiusX:3,radiusY:3,force:1}]:[]});
  }
  async function hold(direction,ms){
   const selector=direction>0?'#touch-right':'#touch-left',key=direction>0?'ArrowRight':'ArrowLeft';
   if(phone)await touch(selector,'touchStart');else await page.keyboard.down(key);
   await advance(ms);
   if(phone)await touch(selector,'touchEnd');else await page.keyboard.up(key);
  }
  for(const locale of ['en','zh-TW']){
   await page.locator('#language').selectOption(locale);
   for(const chapter of Object.values(CHAPTERS)){
    await page.locator('#landmark-choice').selectOption(chapter.id);
    assert.equal((await state()).perimeter,chapter.recommendedPerimeter);
    assert.equal(await page.locator('#perimeter-choice option:checked').innerText(),(locale==='en'?{square:'Square',rectangle:'Rectangle',octagon:'Octagon',irregular:'Irregular',circle:'Circle'}:{square:'正方形',rectangle:'長方形',octagon:'八邊形',irregular:'不規則形',circle:'圓形'})[chapter.recommendedPerimeter]+(locale==='en'?' · Recommended':' · 推薦'));
    assert.ok((await page.locator('#perimeter-recommendation').innerText()).includes(chapter.messages[locale]['chapter.name']));
    for(const perimeter of PERIMETER_IDS){
     const path=getPerimeter(perimeter);
     await page.locator('#perimeter-choice').selectOption(perimeter);
     assert.equal((await state()).landmark,chapter.id);assert.equal((await state()).perimeter,perimeter);
     const art=page.locator('.landmark');assert.equal(await art.getAttribute('data-landmark'),chapter.id);
     assert.equal(await art.locator('svg').count(),1);assert.equal(await art.locator('text,image,foreignObject').count(),0);assert.equal(await art.innerText(),'');
     assert.equal(await art.locator('svg').getAttribute('aria-label'),chapter.messages[locale]['chapter.artLabel']);
     await page.locator('#setup-start').click({force:true});await advance(50);assert.equal((await state()).phase,'playing');
     assert.equal(await page.locator('#landmark-choice').isDisabled(),true);assert.equal(await page.locator('#perimeter-choice').isDisabled(),true);
     const arena=await page.locator('.arena-wrap').boundingBox(),row=await page.locator('#touch-controls').boundingBox();
     assert.ok(arena.y>=0&&arena.y+arena.height<=height);assert.ok(row.y>=arena.y+arena.height&&row.y+row.height<=height);
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
     for(const selector of ['#touch-left','#touch-switch','#touch-right']){const b=await page.locator(selector).boundingBox();assert.ok(b.width>=43.99&&b.height>=43.99,selector+' target '+JSON.stringify(b));}
     assert.ok(await page.locator('#arena-timer').isVisible());
     let before=(await state()).gate;await hold(1,200);near(path.normalize((await state()).gate-before),72,7);
     before=(await state()).gate;await advance(100);near((await state()).gate,before);
     await hold(-1,200);near(path.normalize(before-(await state()).gate),72,7);
     const u=(await state()).u;
     if(phone){await touch('#touch-switch','touchStart');await touch('#touch-switch','touchEnd');}else await page.keyboard.press('Space');
     near((await state()).u,(u+.5)%1);const stopped=(await state()).gate;await advance(100);near((await state()).gate,stopped);
     if(perimeter===chapter.recommendedPerimeter){
      await advance(3500);
      const visibleUnits=(await state()).units;assert.ok(visibleUnits.some(u=>u.type==='red')&&visibleUnits.some(u=>u.type==='blue'),'Both unit colors must be present for the screenshot');
      const filename='v1.1/'+device+'-'+locale+'-'+chapter.id+'-'+perimeter+'.png';
      await page.locator('.game-panel').screenshot({path:'artifacts/'+filename});screenshots.push({device,locale,landmark:chapter.id,perimeter,file:filename});
      await page.keyboard.press('KeyP');const paused=await state();assert.equal(paused.paused,true);
      const other=locale==='en'?'zh-TW':'en';await page.locator('#language').selectOption(other);
      assert.deepEqual({...await state(),locale},paused);await page.locator('#language').selectOption(locale);assert.deepEqual(await state(),paused);
     }
     await page.locator('#new-watch').click({force:true});
     assert.equal(await page.locator('#landmark-choice').isDisabled(),false);
     pass(device+' / '+locale+' / '+chapter.id+' / '+perimeter+': playable, correct hold/release/Switch, clean art, visible HUD');
    }
   }
  }
  // A non-recommended selection must survive both language switching and reload.
  await page.locator('#landmark-choice').selectOption('st-peters');await page.locator('#perimeter-choice').selectOption('square');
  await page.locator('#durations [data-value="120"]').click();await page.locator('#intensities [data-value="Chaos"]').click();
  await page.locator('#language').selectOption('en');await page.reload();await page.evaluate(()=>document.fonts.ready);
  const saved=await state();assert.equal(saved.landmark,'st-peters');assert.equal(saved.perimeter,'square');assert.equal(saved.duration,120);assert.equal(saved.intensity,'Chaos');assert.equal(saved.locale,'en');
  assert.equal(await page.locator('#durations .selected').innerText(),'120');assert.equal(await page.locator('#intensities .selected').innerText(),'Chaos');
  pass(device+': all four independent settings and language survive reload with a manual perimeter override');
  if(phone){
   for(const locale of ['en','zh-TW'])for(const narrow of [320,360,430]){
    await page.setViewportSize({width:narrow,height:844});await page.locator('#language').selectOption(locale);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    for(const selector of ['#landmark-choice','#perimeter-choice','#setup-start','#durations button','#intensities button'])for(const el of await page.locator(selector).all()){const b=await el.boundingBox();assert.ok(b.width>=43.99&&b.height>=43.99,selector+' target '+JSON.stringify(b));}
    assert.ok(await page.locator('#settings').evaluate(el=>el.scrollWidth<=el.clientWidth));
    if(narrow===320)await page.locator('#settings').screenshot({path:'artifacts/v1.1/setup-320-'+locale+'.png'});
   }
   await page.setViewportSize({width:844,height:390});await page.locator('#landmark-choice').selectOption('longshan-temple');
   await page.locator('#setup-start').click({force:true});await advance(50);
   const row=await page.locator('#touch-controls').boundingBox();assert.ok(row.y+row.height<=390);await page.screenshot({path:'artifacts/v1.1/phone-landscape.png'});
   pass('Phone setup fits 320–430px in both languages; landscape keeps the arena and controls visible');
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);pass('No browser errors across the complete 100-combination device/language matrix');
 const cards=screenshots.map(s=>'<figure><img src="'+s.file.split('/').pop()+'" alt="'+s.landmark+' '+s.perimeter+'"><figcaption>'+s.device+' · '+s.locale+' · '+s.landmark+' / '+s.perimeter+'</figcaption></figure>').join('');
 await fs.writeFile('artifacts/v1.1/gallery.html','<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Riot Defender v1.1 verification gallery</title><style>body{background:#141e20;color:#e3ebd3;font:16px system-ui;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px}figure{margin:0}img{width:100%;border-radius:8px}figcaption{padding:10px 0;font-size:13px}</style><h1>Riot Defender v1.1</h1><p>Five original frontal landmark illustrations, five recommended perimeter pairings. Both languages and device sizes.</p><main>'+cards+'</main></html>');
 await fs.writeFile('artifacts/v1.1/browser-matrix.json',JSON.stringify({url,checks,screenshots,errors},null,2));
}finally{await browser.close();}
