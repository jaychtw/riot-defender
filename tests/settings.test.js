import test from 'node:test';
import assert from 'node:assert/strict';
import {CHAPTERS} from '../src/chapters/index.js';
import {PERIMETER_IDS} from '../src/perimeter.js';
import {loadSettings,saveSettings,normalizeSettings,SETTINGS_STORAGE_KEY} from '../src/settings.js';
test('all 25 landmark/perimeter selections persist independently with duration/intensity',()=>{
 const values=new Map(),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
 for(const landmark of Object.keys(CHAPTERS))for(const perimeter of PERIMETER_IDS){const selection={landmark,perimeter,duration:120,intensity:'Chaos'};saveSettings(storage,selection);assert.deepEqual(loadSettings(storage),selection);}
 assert.ok(values.has(SETTINGS_STORAGE_KEY));
});
test('missing shape gets the recommendation, explicit override survives, invalid storage is safe',()=>{
 for(const chapter of Object.values(CHAPTERS)){assert.equal(normalizeSettings({landmark:chapter.id}).perimeter,chapter.recommendedPerimeter);assert.equal(normalizeSettings({landmark:chapter.id,perimeter:'circle'}).perimeter,'circle');}
 for(const value of ['bad json','null','[]','"bad"','{"landmark":"constructor","duration":-4}']){const settings=loadSettings({getItem:()=>value});assert.equal(settings.landmark,'louvre');assert.equal(settings.duration,90);}
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};assert.equal(loadSettings(blocked).perimeter,'square');assert.doesNotThrow(()=>saveSettings(blocked,{}));
});
