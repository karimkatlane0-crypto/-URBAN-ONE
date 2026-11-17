/* TITANS / SEVA / URBAN ONE — EU language selector foundation.
 * Local-only preference. No cookies, trackers, translation API or external calls.
 * Selecting a locale updates document.lang and Intl locale presentation.
 * Full page-content translation requires reviewed per-page message catalogs.
 */
(() => {
  'use strict';
  const LANGUAGES = [
    ['bg','🇧🇬','Български'],['hr','🇭🇷','Hrvatski'],['cs','🇨🇿','Čeština'],
    ['da','🇩🇰','Dansk'],['nl','🇳🇱','Nederlands'],['en','🇬🇧','English'],
    ['et','🇪🇪','Eesti'],['fi','🇫🇮','Suomi'],['fr','🇫🇷','Français'],
    ['de','🇩🇪','Deutsch'],['el','🇬🇷','Ελληνικά'],['hu','🇭🇺','Magyar'],
    ['ga','🇮🇪','Gaeilge'],['it','🇮🇹','Italiano'],['lv','🇱🇻','Latviešu'],
    ['lt','🇱🇹','Lietuvių'],['mt','🇲🇹','Malti'],['pl','🇵🇱','Polski'],
    ['pt','🇵🇹','Português'],['ro','🇷🇴','Română'],['sk','🇸🇰','Slovenčina'],
    ['sl','🇸🇮','Slovenščina'],['es','🇪🇸','Español'],['sv','🇸🇪','Svenska']
  ];
  const KEY = 'titans.euLocale';
  const supported = new Set(LANGUAGES.map(([code]) => code));
  const browserLocale = (navigator.languages || [navigator.language || 'it'])
    .map(value => String(value).toLowerCase().split('-')[0])
    .find(value => supported.has(value)) || 'it';
  let selected = browserLocale;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && supported.has(saved)) selected = saved;
  } catch (_) { /* Storage may be disabled; browser locale remains available. */ }

  const header = document.querySelector('header');
  if (!header) return;
  const wrap = document.createElement('div');
  wrap.className = 'titans-locale';
  const label = document.createElement('label');
  label.htmlFor = 'titans-locale-select';
  label.textContent = '🌍 Language / Lingua';
  const select = document.createElement('select');
  select.id = 'titans-locale-select';
  select.setAttribute('aria-label', 'Select interface language');
  for (const [code, flag, name] of LANGUAGES) {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = flag + ' ' + name;
    select.append(option);
  }
  const status = document.createElement('p');
  status.className = 'titans-locale-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.textContent = 'Locale selected. Full page translation packs are not yet verified.';
  select.value = selected;
  const apply = code => {
    document.documentElement.lang = code;
    select.value = code;
    try { localStorage.setItem(KEY, code); } catch (_) { /* Non-persistent session is supported. */ }
    status.textContent = 'Locale: ' + code.toUpperCase() +
      '. Date/number formatting can use this locale; full page translation is pending.';
    document.dispatchEvent(new CustomEvent('titans:localechange', { detail: { locale: code } }));
  };
  select.addEventListener('change', () => apply(select.value));
  wrap.append(label, select, status);
  header.append(wrap);
  const style = document.createElement('style');
  style.textContent = `
    .titans-locale{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:8px 0;max-width:100%}
    .titans-locale label{font-size:11px;font-weight:700;margin:0}
    .titans-locale select{width:auto;min-width:190px;max-width:100%;min-height:38px;padding:7px 10px;border:1px solid currentColor;border-radius:5px;background:Canvas;color:CanvasText;font:inherit}
    .titans-locale-status{flex-basis:100%;margin:0;font-size:10px;opacity:.78}
    @media(max-width:640px){.titans-locale{width:100%}.titans-locale select{flex:1;min-width:0}}
  `;
  document.head.append(style);
  apply(selected);
  window.TITANS_LOCALE = Object.freeze({
    languages: LANGUAGES.map(([code, flag, name]) => ({ code, flag, name })),
    get current() { return document.documentElement.lang || 'it'; },
    formatDate(value, options) {
      return new Intl.DateTimeFormat(this.current, options).format(value instanceof Date ? value : new Date(value));
    },
    formatNumber(value, options) { return new Intl.NumberFormat(this.current, options).format(value); }
  });
})();
