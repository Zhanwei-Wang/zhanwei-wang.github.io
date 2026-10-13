/* Language preference stays in this browser; publication records remain unchanged. */
(() => {
  'use strict';
  const storageKey = 'zhanwei-homepage-language';
  const validLanguage = value => value === 'en' || value === 'zh';
  let savedLanguage;
  try { savedLanguage = localStorage.getItem(storageKey); } catch { /* Storage may be unavailable. */ }
  const requestedLanguage = new URL(location.href).searchParams.get('lang');
  let language = validLanguage(requestedLanguage) ? requestedLanguage : validLanguage(savedLanguage) ? savedLanguage : 'en';
  const originals = new WeakMap();
  const attributes = ['aria-label', 'placeholder', 'alt', 'content', 'title'];
  const interpolate = (text, params) => String(text).replace(/\{(\w+)\}/g, (match, key) => params[key] ?? match);
  const dictionary = () => window.SITE_ZH || {};
  function applyStaticTranslations() {
    const selectors = ['[data-i18n]', ...attributes.map(attribute => `[data-i18n-${attribute}]`)];
    document.querySelectorAll(selectors.join(',')).forEach(element => {
      if (!originals.has(element)) originals.set(element, {
        html: element.innerHTML,
        attributes: Object.fromEntries(attributes.map(attribute => [attribute, element.getAttribute(attribute)]))
      });
      const original = originals.get(element);
      const key = element.getAttribute('data-i18n');
      if (key) element.innerHTML = language === 'zh' && dictionary()[key] != null ? dictionary()[key] : original.html;
      attributes.forEach(attribute => {
        const attributeKey = element.getAttribute(`data-i18n-${attribute}`);
        if (!attributeKey) return;
        const value = language === 'zh' && dictionary()[attributeKey] != null ? dictionary()[attributeKey] : original.attributes[attribute];
        if (value == null) element.removeAttribute(attribute);
        else element.setAttribute(attribute, value);
      });
    });
  }
  function applyLanguage() {
    document.documentElement.lang = language === 'zh' ? 'zh-Hans' : 'en';
    applyStaticTranslations();
    document.querySelectorAll('[data-language]').forEach(button => {
      const active = button.dataset.language === language;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('selected', active);
    });
  }
  window.SiteI18n = {
    get lang() { return language; },
    t(english, chinese, params = {}) { return interpolate(language === 'zh' ? chinese : english, params); },
    summary(paper) { return language === 'zh' ? window.PAPER_ZH?.[paper.id]?.summary || paper.summary || '' : paper.summary || ''; },
    citation(paper) {
      if (language === 'zh' && paper.type === 'preprint') {
        return `已投稿 IEEE，审稿中，${paper.year}。arXiv:${paper.arxiv.split('/abs/')[1]}。`;
      }
      return paper.citation;
    },
    onChange(callback) {
      window.addEventListener('site:languagechange', callback);
      return () => window.removeEventListener('site:languagechange', callback);
    },
    setLanguage(value) {
      if (!validLanguage(value)) return;
      const changed = value !== language;
      language = value;
      try { localStorage.setItem(storageKey, language); } catch { /* The switch still works without persistence. */ }
      const url = new URL(location.href);
      url.searchParams.set('lang', language);
      history.replaceState(null, '', url);
      if (!changed) return;
      applyLanguage();
      window.dispatchEvent(new CustomEvent('site:languagechange', { detail: { language } }));
    }
  };
  document.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', () => window.SiteI18n.setLanguage(button.dataset.language));
  });
  applyLanguage();
})();
