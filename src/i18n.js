import en from './locales/en.js';
import zhHant from './locales/zh-Hant.js';

export const LOCALES = Object.freeze([
  Object.freeze({id:'en', label:'English'}),
  Object.freeze({id:'zh-TW', label:'繁體中文'}),
]);
export const MESSAGES = Object.freeze({en, 'zh-TW':zhHant});
export const LOCALE_STORAGE_KEY = 'riot-defender.locale';

export function resolveLocale(value) {
  if (typeof value !== 'string') return null;
  if (/^en(?:-|$)/i.test(value)) return 'en';
  if (/^zh-(?:Hant|TW|HK|MO)(?:-|$)/i.test(value)) return 'zh-TW';
  return null;
}

export function initialLocale(storage, languages = []) {
  try {
    const saved = resolveLocale(storage?.getItem(LOCALE_STORAGE_KEY));
    if (saved) return saved;
  } catch { /* Storage can be unavailable in private or restricted contexts. */ }
  for (const language of languages) {
    const supported = resolveLocale(language);
    if (supported) return supported;
  }
  return 'en';
}

export function createI18n({locale = 'en', chapter, storage} = {}) {
  let current = resolveLocale(locale) ?? 'en';
  return {
    get locale() { return current; },
    setChapter(value) { chapter=value; },
    setLocale(value) {
      const resolved=resolveLocale(value);
      if (!resolved) return false;
      current = resolved;
      try { storage?.setItem(LOCALE_STORAGE_KEY, current); } catch { /* Session switching still works. */ }
      return true;
    },
    t(key, params = {}) {
      const localized = chapter?.messages?.[current];
      const fallback = chapter?.messages?.en;
      const template = localized?.[key] ?? MESSAGES[current][key] ?? fallback?.[key] ?? en[key] ?? key;
      return template.replace(/\{(\w+)\}/g, (token, name) => Object.hasOwn(params, name) ? String(params[name]) : token);
    },
  };
}
