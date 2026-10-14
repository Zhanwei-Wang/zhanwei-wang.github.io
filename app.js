(() => {
  'use strict';
  const t = (english, chinese, params = {}) => window.SiteI18n?.t(english, chinese, params) ?? english.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? `{${key}}`);
  const summary = paper => window.SiteI18n?.summary(paper) ?? paper.summary;
  const citation = paper => window.SiteI18n?.citation(paper) ?? paper.citation;
  const figureText = (paper, figure, key, index = 0) => window.SiteI18n?.lang === 'zh' ? figure[`${key}Zh`] || (index === 0 ? window.PAPER_ZH?.[paper.id]?.[key === 'caption' ? 'figureCaption' : 'figureAlt'] : null) || figure[key] : figure[key];
  const papers = window.PUBLICATIONS || [];
  const figures = window.PAPER_FIGURES || {};
  const list = document.getElementById('publication-list');
  const count = document.getElementById('publication-count');
  const search = document.getElementById('publication-search');
  const topic = document.getElementById('publication-topic');
  const tabs = [...document.querySelectorAll('[data-type]')];
  tabs.forEach(tab => { const badge = tab.querySelector('.tab-count'); if (badge) badge.textContent = papers.filter(p => p.type === tab.dataset.type).length; });
  const dialog = document.getElementById('citation-dialog');
  const citationText = document.getElementById('citation-text');
  const copyStatus = document.getElementById('copy-status');
  let selectedType = 'selected';
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const safeURL = value => {try { const u = new URL(value); return u.protocol === 'https:' ? u.href : null; } catch { return null; }};
  const paperLink = (value, label) => {const url = safeURL(value); return url ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${label} ↗</a>` : '';};
  const statusLabel = paper => paper.venue.includes('Letters') ? t('Research letter', '研究短文') : paper.type === 'preprint' ? t('Preprint', '预印本') : paper.status === 'accepted' ? t('Accepted conference paper', '已录用会议论文') : paper.type === 'journal' ? t('Journal article', '期刊论文') : t('Conference paper', '会议论文');
  const figureName = figure => window.SiteI18n?.lang === 'zh' ? figure.figureNameZh || figure.figureName || figure.caption : figure.figureName || figure.caption;
  const figureAsset = figure => /^assets\/papers\/[a-z0-9_-]+\.(?:webp|png|jpe?g)$/i.test(figure?.asset || '') ? figure.asset : null;
  const paperFigures = paper => {
    const primary = figures[paper.id];
    return primary ? [primary, ...(Array.isArray(primary.additionalFigures) ? primary.additionalFigures : [])] : [];
  };
  const paperFigureEntries = paper => paper.presentation === 'list-only' ? [] : paperFigures(paper).map((figure, index) => ({figure, index, asset:figureAsset(figure)})).filter(({figure, asset}) => asset && figure.exactPaper === true);
  function paperFigure(paper, entries = paperFigureEntries(paper)) {
    if (!entries.length) return '';
    const markup = entries.map(({figure, index, asset}) => `<figure class="publication-figure"><a class="paper-figure-link" href="${escapeHTML(asset)}" target="_blank" rel="noopener noreferrer" data-figure-id="${escapeHTML(paper.id)}" data-figure-index="${index}" aria-label="${escapeHTML(t('Enlarge {figure} from {title}', '放大论文《{title}》中的{figure}', {figure:figureName(figure),title:paper.title}))}"><img src="${escapeHTML(asset)}" width="${figure.width}" height="${figure.height}" alt="${escapeHTML(figureText(paper, figure, 'alt', index))}" loading="lazy" decoding="async"></a><figcaption class="publication-figure-caption">${escapeHTML(figureName(figure))}</figcaption></figure>`).join('');
    return entries.length > 1 ? `<div class="publication-figure-stack">${markup}</div>` : markup;
  }

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const visible = papers.filter(p => (selectedType === 'all' || (selectedType === 'selected' ? p.featured : p.type === selectedType)) && (topic.value === 'all' || p.topics.includes(topic.value)) && `${p.title} ${p.authors} ${p.citation} ${p.summary || ''} ${summary(p) || ''} ${window.PAPER_ZH?.[p.id]?.summary || ''} ${citation(p)} ${p.year}`.toLocaleLowerCase().includes(query));
    const featuredOrder = ['p7','p1','j1','j3','j2','j4'];
    visible.sort((a,b) => selectedType === 'selected' ? featuredOrder.indexOf(a.id) - featuredOrder.indexOf(b.id) : b.year - a.year);
    count.textContent = selectedType === 'selected' ? t(`{count} ${visible.length === 1 ? 'publication' : 'publications'} selected`, '精选 {count} 篇论文', {count:visible.length}) : t(`{count} ${visible.length === 1 ? 'publication' : 'publications'}`, '共 {count} 篇论文', {count:visible.length});
    tabs.forEach(t => {const active = t.dataset.type === selectedType; t.classList.toggle('selected',active); t.setAttribute('aria-pressed',String(active));});
    if (!visible.length) {
      list.innerHTML = `<div class="empty-publications"><p>${t('No publications match these filters.', '未找到符合筛选条件的论文。')}</p><button type="button" id="reset-filters">${t('Reset filters', '重置筛选')}</button></div>`;
      document.getElementById('reset-filters').addEventListener('click',()=>{search.value='';topic.value='all';selectedType='all';render();});
      return;
    }
    list.innerHTML = visible.map(p => {
      const title = safeURL(p.url) ? `<a href="${escapeHTML(safeURL(p.url))}" target="_blank" rel="noopener noreferrer">${escapeHTML(p.title)}</a>` : escapeHTML(p.title);
      const authors = escapeHTML(p.authors).replace(/Zhanwei Wang/g,'<strong>Zhanwei Wang</strong>');
      const entries = paperFigureEntries(p);
      const figure = paperFigure(p, entries);
      const year = `<span class="publication-year">${p.year}</span>`;
      return `<article class="publication-card ${figure ? 'has-figure' : ''} ${entries.length > 1 ? 'has-multiple-figures' : ''}" data-paper-id="${escapeHTML(p.id)}">${figure || year}<div class="publication-copy">${figure ? year : ''}<h3 class="publication-title">${title}</h3><p class="publication-authors">${authors}</p><p class="publication-venue">${escapeHTML(citation(p))}</p>${selectedType === 'selected' && p.summary ? `<p class="paper-summary">${escapeHTML(summary(p))}</p>` : ''}<div class="publication-bottom"><span class="paper-badge ${p.type === 'preprint' ? 'preprint' : ''}">${statusLabel(p)}</span>${p.doi ? paperLink(p.url,t('Publisher','出版页面')) : ''}${p.arxiv ? paperLink(p.arxiv,'arXiv') : ''}<button type="button" class="bib-button" data-cite="${escapeHTML(p.id)}" aria-label="${escapeHTML(t('BibTeX citation for {title}', '论文《{title}》的 BibTeX 引用', {title:p.title}))}">BibTeX</button></div></div></article>`;
    }).join('');
  }

  tabs.forEach(t => t.addEventListener('click',()=>{selectedType=t.dataset.type;render();}));
  search.addEventListener('input',render);
  topic.addEventListener('change',render);
  document.querySelectorAll('[data-show]').forEach(a => a.addEventListener('click',()=>{selectedType=a.dataset.show;search.value='';topic.value='all';render();}));

  function bibtex(p) {
    const tex = value => String(value).replace(/[&%$#_]/g, char => '\\' + char);
    const authors = p.authors.replace(/\*/g,'').replace(/, and /g,', ').split(', ').join(' and ');
    const kind = p.type === 'conference' ? 'inproceedings' : 'article';
    const fields = {title:`{${tex(p.title)}}`,author:tex(authors),year:p.year};
    if (p.type === 'preprint') {
      fields.journal = 'arXiv preprint';
      fields.eprint = p.arxiv?.split('/abs/')[1];
      fields.archivePrefix = 'arXiv';
    } else {
      fields[p.type === 'conference' ? 'booktitle' : 'journal'] = tex(p.venue);
      const volume=p.citation.match(/vol\.\s*(\d+)/),number=p.citation.match(/no\.\s*(\d+)/),pages=p.citation.match(/pp\.\s*(\d+)[–-](\d+)/);
      if(volume) fields.volume=volume[1];
      if(number) fields.number=number[1];
      if(pages) fields.pages=`${pages[1]}--${pages[2]}`;
      if(p.doi) fields.doi=p.doi;
      if(p.status === 'accepted') fields.note='Accepted';
    }
    if (p.url) fields.url=p.url;
    const key=`Wang${p.year}${p.id.toUpperCase()}`;
    return `@${kind}{${key},\n${Object.entries(fields).filter(([,v])=>v!=null).map(([k,v])=>`  ${k} = {${v}}`).join(',\n')}\n}`;
  }
  list.addEventListener('click',event=>{
    const button=event.target.closest('[data-cite]');
    if(!button) return;
    const paper=papers.find(p=>p.id===button.dataset.cite);
    if(!paper) return;
    document.getElementById('citation-paper-title').textContent=paper.title;
    citationText.value=bibtex(paper);
    copyStatus.textContent='';
    dialog.showModal();
  });
  document.getElementById('close-citation').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});
  document.getElementById('copy-citation').addEventListener('click',async()=>{
    try { await navigator.clipboard.writeText(citationText.value); copyStatus.textContent=t('Citation copied.', '引用已复制。'); }
    catch { citationText.focus();citationText.select();copyStatus.textContent=t('Citation selected. Press Ctrl+C or ⌘C to copy.', '引用已选中，按 Ctrl+C 或 ⌘C 复制。'); }
  });

  const figureDialog = document.getElementById('figure-dialog');
  const fullFigure = document.getElementById('figure-full-image');
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-figure-id]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const paper = papers.find(p => p.id === link.dataset.figureId);
    const rawIndex = link.dataset.figureIndex ?? '0';
    const figureIndex = /^\d+$/.test(rawIndex) ? Number(rawIndex) : NaN;
    const figure = paper && Number.isSafeInteger(figureIndex) ? paperFigures(paper)[figureIndex] : null;
    const asset = figureAsset(figure);
    if (!figureDialog || !paper || !asset || figure.exactPaper !== true) return;
    event.preventDefault();
    document.getElementById('figure-dialog-title').textContent = paper.title;
    fullFigure.src = asset;
    fullFigure.alt = figureText(paper, figure, 'alt', figureIndex);
    fullFigure.width = figure.width;
    fullFigure.height = figure.height;
    document.getElementById('figure-original-link').href = asset;
    document.getElementById('figure-full-caption').textContent = figureName(figure);
    const source = document.getElementById('figure-source-link');
    const sourceURL = safeURL(figure.sourceUrl);
    source.hidden = !sourceURL;
    if (sourceURL) source.href = sourceURL;
    figureDialog.showModal();
  });
  document.getElementById('close-figure').addEventListener('click', () => figureDialog.close());
  figureDialog.addEventListener('click', event => {
    if (event.target !== figureDialog) return;
    const box = figureDialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) figureDialog.close();
  });

  const sections = [...document.querySelectorAll('.section-anchor')];
  const navLinks = [...document.querySelectorAll('.site-header nav a')];
  let framePending=false;
  function updateNavigation(){
    let current=sections[0]?.id;
    sections.forEach(section=>{if(section.getBoundingClientRect().top<=155) current=section.id;});
    navLinks.forEach(link=>{const active=link.hash===`#${current}`;link.classList.toggle('active',active);if(active) link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
    framePending=false;
  }
  window.addEventListener('scroll',()=>{if(!framePending){framePending=true;requestAnimationFrame(updateNavigation);}},{passive:true});
  window.SiteI18n?.onChange(() => {
    if (dialog.open) dialog.close();
    if (figureDialog.open) figureDialog.close();
    copyStatus.textContent = '';
    render();
  });
  render();
  updateNavigation();
})();
