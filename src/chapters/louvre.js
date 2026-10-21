import { louvreSVG } from '../landmark.js';

// A chapter owns its identity, artwork, rules, and localized landmark copy.
// Shared menus, controls, and lifecycle messages belong to src/locales instead.
export const LOUVRE_CHAPTER = Object.freeze({
  id: 'louvre',
  number: 1,
  recommendedPerimeter: 'square',
  coordinates: '48.8606° N · 2.3376° E',
  artwork: louvreSVG,
  rules: Object.freeze({id:'louvre', title:'Louvre Defender', duration:90, intensity:'Normal', x:205,y:135,side:490,gateWidth:98,gateSpeed:360,blueSpeed:120,redSpeed:24,radius:5,cap:180}),
  messages: Object.freeze({
    en: Object.freeze({
      'chapter.title': 'Louvre Defender',
      'chapter.name': 'Louvre',
      'chapter.location': 'PARIS, FRANCE',
      'chapter.landmark': 'the Louvre',
      'chapter.sectorName': 'LOUVRE',
      'chapter.mapLabel': 'MUSÉE DU LOUVRE',
      'chapter.established': 'PARIS · EST. 1793',
      'chapter.artLabel': 'Original frontal illustration of the Louvre palace and glass pyramid',
    }),
    'zh-TW': Object.freeze({
      'chapter.title': '羅浮宮保衛戰',
      'chapter.name': '羅浮宮',
      'chapter.location': '法國・巴黎',
      'chapter.landmark': '羅浮宮',
      'chapter.sectorName': '羅浮宮',
      'chapter.mapLabel': '羅浮宮博物館',
      'chapter.established': '巴黎・創立於 1793 年',
      'chapter.artLabel': '羅浮宮宮殿與玻璃金字塔的原創正立面插畫',
    }),
  }),
});
