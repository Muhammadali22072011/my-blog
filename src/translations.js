import { translations as base } from './translations/index.js'

/*
 * В проекте лежали ДВА словаря:
 *   src/translations.js        — 130 строк, только en
 *   src/translations/index.js  — ~1150 строк, en / ru / uz
 *
 * Все 13 мест импортировали `'../translations'`, а сборщик при таком
 * пути выбирает файл, а не каталог, — то есть выигрывал короткий словарь.
 * Большой файл был мёртвым кодом, а в админке ключи из него отображались
 * как undefined.
 *
 * Теперь модуль один: за основу берётся полный словарь, поверх него
 * ложатся правки ниже. Ничего не потеряно, разночтений больше нет.
 */

const overrides = {
  en: {
    muhammadaliBlog: 'Muhammadali Izzatullaev',
    aboutMeBtn: 'About Me',
    adminPanelButton: 'Admin Panel',
  },
  ru: {
    muhammadaliBlog: 'Muhammadali Izzatullaev',
    aboutMeBtn: 'Об авторе',
    adminPanelButton: 'Админ-панель',
  },
  uz: {
    muhammadaliBlog: 'Muhammadali Izzatullaev',
  },
}

export const translations = Object.fromEntries(
  Object.entries(base).map(([lang, dict]) => [lang, { ...dict, ...(overrides[lang] || {}) }])
)

export default translations
