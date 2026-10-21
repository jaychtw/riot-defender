import { LOUVRE_CHAPTER } from './louvre.js';
import {forbiddenCitySVG,blueMosqueSVG,longshanTempleSVG,stPetersSVG} from '../artworks.js';

function landmark(id,number,recommendedPerimeter,coordinates,artwork,en,zh){
 const messages=(copy)=>Object.freeze(Object.fromEntries(['title','location','landmark','sectorName','mapLabel','established','artLabel','name'].map((key,i)=>['chapter.'+key,copy[i]])));
 return Object.freeze({id,number,recommendedPerimeter,coordinates,artwork,rules:LOUVRE_CHAPTER.rules,messages:Object.freeze({en:messages(en),'zh-TW':messages(zh)})});
}
// Identity and artwork are data. Every landmark uses the same simulation rules.
export const CHAPTERS=Object.freeze({
 louvre:LOUVRE_CHAPTER,
 'forbidden-city':landmark('forbidden-city',2,'rectangle','39.9163° N · 116.3972° E',forbiddenCitySVG,
  ['Forbidden City Defender','BEIJING, CHINA','the Forbidden City','FORBIDDEN CITY','FORBIDDEN CITY','BEIJING · EST. 1420','Original frontal illustration of the Forbidden City with golden roofs and imperial gates','Forbidden City'],
  ['紫禁城保衛戰','中國・北京','紫禁城','紫禁城','紫禁城','北京・始建於 1420 年','紫禁城金色屋頂與宮門的原創正立面插畫','紫禁城']),
 'blue-mosque':landmark('blue-mosque',3,'octagon','41.0054° N · 28.9768° E',blueMosqueSVG,
  ['Blue Mosque Defender','ISTANBUL, TÜRKİYE','the Blue Mosque','BLUE MOSQUE','SULTAN AHMED MOSQUE','ISTANBUL · EST. 1616','Original frontal illustration of the Blue Mosque with cascading domes and six minarets','Blue Mosque'],
  ['藍色清真寺保衛戰','土耳其・伊斯坦堡','藍色清真寺','藍色清真寺','蘇丹艾哈邁德清真寺','伊斯坦堡・建於 1616 年','藍色清真寺層疊圓頂與六座宣禮塔的原創正立面插畫','藍色清真寺']),
 'longshan-temple':landmark('longshan-temple',4,'irregular','25.0372° N · 121.4999° E',longshanTempleSVG,
  ['Longshan Temple Defender','TAIPEI, TAIWAN','Longshan Temple','LONGSHAN TEMPLE','LONGSHAN TEMPLE','TAIPEI · EST. 1738','Original frontal illustration of Longshan Temple with sweeping tiled roofs and carved details','Longshan Temple'],
  ['龍山寺保衛戰','臺灣・臺北','龍山寺','龍山寺','艋舺龍山寺','臺北・創建於 1738 年','龍山寺翹脊屋頂與雕刻細節的原創正立面插畫','龍山寺']),
 'st-peters':landmark('st-peters',5,'circle','41.9022° N · 12.4539° E',stPetersSVG,
  ['St. Peter’s Basilica Defender','VATICAN CITY','St. Peter’s Basilica','ST. PETER’S BASILICA','ST. PETER’S BASILICA','VATICAN CITY · EST. 1626','Original frontal illustration of St. Peter’s Basilica with central dome and colonnade motifs','St. Peter’s Basilica'],
  ['聖伯多祿大殿保衛戰','梵蒂岡','聖伯多祿大殿','聖伯多祿大殿','聖伯多祿大殿','梵蒂岡・建於 1626 年','聖伯多祿大殿中央圓頂與柱廊的原創正立面插畫','聖伯多祿大殿']),
});
export const ACTIVE_CHAPTER=CHAPTERS.louvre;
