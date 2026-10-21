import {CHAPTERS} from './chapters/index.js';
import {PERIMETER_IDS} from './perimeter.js';
export const SETTINGS_STORAGE_KEY='riot-defender.settings.v1.1';
export function normalizeSettings(value={}){
 const landmark=Object.hasOwn(CHAPTERS,value?.landmark)?value.landmark:'louvre';
 return {landmark,perimeter:PERIMETER_IDS.includes(value?.perimeter)?value.perimeter:CHAPTERS[landmark].recommendedPerimeter,duration:[60,90,120].includes(value?.duration)?value.duration:90,intensity:['Calm','Normal','Chaos'].includes(value?.intensity)?value.intensity:'Normal'};
}
export function loadSettings(storage){
 try{return normalizeSettings(JSON.parse(storage?.getItem(SETTINGS_STORAGE_KEY)??'{}'));}catch{return normalizeSettings();}
}
export function saveSettings(storage,value){
 try{storage?.setItem(SETTINGS_STORAGE_KEY,JSON.stringify(normalizeSettings(value)));}catch{/* Gameplay works when storage is blocked. */}
}
