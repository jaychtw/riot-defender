import test from 'node:test';
import assert from 'node:assert/strict';
import {MESSAGES,LOCALES,LOCALE_STORAGE_KEY,resolveLocale,initialLocale,createI18n} from '../src/i18n.js';
import {CHAPTERS,ACTIVE_CHAPTER} from '../src/chapters/index.js';
import {CHAPTER} from '../src/simulation.js';

const tokens = value => [...new Set(value.match(/\{\w+\}/g) ?? [])].sort();
for (const {id} of LOCALES) {
  test(`${id}: all shared messages and interpolation tokens are present`, () => {
    assert.deepEqual(Object.keys(MESSAGES[id]).sort(),Object.keys(MESSAGES.en).sort());
    for (const [key,value] of Object.entries(MESSAGES.en)) {
      assert.ok(MESSAGES[id][key].trim(),`Empty translation: ${id}/${key}`);
      assert.deepEqual(tokens(MESSAGES[id][key]),tokens(value),`Parameter mismatch: ${id}/${key}`);
    }
  });
  for (const chapter of Object.values(CHAPTERS)) test(`${id}: ${chapter.id} supplies complete chapter copy`, () => {
    assert.deepEqual(Object.keys(chapter.messages[id]).sort(),Object.keys(chapter.messages.en).sort());
    for (const [key,value] of Object.entries(chapter.messages.en)) {
      assert.ok(chapter.messages[id][key].trim());
      assert.deepEqual(tokens(chapter.messages[id][key]),tokens(value));
    }
  });
}
test('locale preference wins over browser language and survives a new translator', () => {
  const values=new Map();const storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  const i18n=createI18n({chapter:ACTIVE_CHAPTER,storage});
  assert.equal(i18n.setLocale('zh-TW'),true);
  assert.equal(values.get(LOCALE_STORAGE_KEY),'zh-TW');
  assert.equal(initialLocale(storage,['en-US']),'zh-TW');
  assert.equal(createI18n({locale:initialLocale(storage,['en']),chapter:ACTIVE_CHAPTER}).t('chapter.title'),'羅浮宮保衛戰');
});
test('Traditional Chinese browser aliases resolve without treating Simplified Chinese as Traditional', () => {
  for (const value of ['zh-Hant','zh-Hant-TW','zh-TW','zh-HK','zh-MO']) assert.equal(resolveLocale(value),'zh-TW');
  assert.equal(resolveLocale('zh-CN'),null);assert.equal(resolveLocale('en-GB'),'en');
  assert.equal(initialLocale(undefined,['zh-TW','en']),'zh-TW');
  assert.equal(initialLocale(undefined,['fr-FR']),'en');
  assert.equal(initialLocale({getItem:()=> 'invalid'},['en-US']),'en');
});
test('blocked storage still allows translation and session language switching', () => {
  const storage={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}};
  assert.equal(initialLocale(storage,['zh-TW']),'zh-TW');
  const i18n=createI18n({storage});assert.equal(i18n.setLocale('zh-TW'),true);
  assert.equal(i18n.t('action.start'),'開始守護');
  assert.equal(i18n.setLocale('fr'),false);assert.equal(i18n.locale,'zh-TW');
});
test('chapter translations compose with shared UI and fall back to chapter English', () => {
  const chapter={messages:{en:{'chapter.title':'Example title'},'zh-TW':{}}};
  const i18n=createI18n({locale:'zh-TW',chapter});
  assert.equal(i18n.t('chapter.title'),'Example title');assert.equal(i18n.t('action.start'),'開始守護');
  assert.equal(i18n.t('overlay.summary',{defenders:3,kills:12,seconds:90}),'招募 3 名防衛者・阻擋 12 名入侵者・堅守 90 秒');
  assert.equal(i18n.t('future.unknown'),'future.unknown');
});
test('translated values remain text and are never recursively interpolated', () => {
  const i18n=createI18n();assert.equal(i18n.t('arena.label',{chapter:'{landmark}'}),'{landmark} game');
});
test('five landmark identities share the original simulation rules', () => {
  assert.deepEqual(Object.keys(CHAPTERS),['louvre','forbidden-city','blue-mosque','longshan-temple','st-peters']);
  for(const chapter of Object.values(CHAPTERS)){assert.equal(chapter.rules,CHAPTER);assert.equal(typeof chapter.artwork,'function');}assert.equal(ACTIVE_CHAPTER,CHAPTERS.louvre);
  assert.equal(CHAPTER,ACTIVE_CHAPTER.rules);assert.equal(typeof ACTIVE_CHAPTER.artwork,'function');
  assert.equal(CHAPTER.side,490);assert.equal(CHAPTER.gateWidth,98);
});

test('legacy zh-Hant preference migrates to zh-TW and changing landmarks preserves locale',()=>{const storage={getItem:()=> 'zh-Hant',setItem(){}};const i18n=createI18n({locale:initialLocale(storage,[]),chapter:ACTIVE_CHAPTER});assert.equal(i18n.locale,'zh-TW');i18n.setChapter(CHAPTERS['blue-mosque']);assert.equal(i18n.t('chapter.name'),'藍色清真寺');assert.equal(i18n.locale,'zh-TW');});
