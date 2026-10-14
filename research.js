/* Research explorer. Uses the verified publication records in publications.js. */
(() => {
  'use strict';
  const t = (english, chinese, params = {}) => window.SiteI18n?.t(english, chinese, params) ?? english.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? `{${key}}`);
  const summary = paper => window.SiteI18n?.summary(paper) ?? paper.summary;
  const citation = paper => window.SiteI18n?.citation(paper) ?? paper.citation;
  const figureText = (paper, figure, key, index = 0) => window.SiteI18n?.lang === 'zh' ? figure[`${key}Zh`] || (index === 0 ? window.PAPER_ZH?.[paper.id]?.[key === 'caption' ? 'figureCaption' : 'figureAlt'] : null) || figure[key] : figure[key];
  const section = document.getElementById('research');
  if (!section || !Array.isArray(window.PUBLICATIONS)) return;
  const themes = {
    space: { number: '01', label: 'Space AI', labelZh: '太空人工智能', headingZh: '让智能走向太空', descriptionZh: '卫星网络中的分布式基础模型推理', subtitle: 'Foundation Models in Space Networks', subtitleZh: '太空网络中的基础模型', heading: 'Bringing intelligence into orbit', description: 'Distributed foundation-model inference across satellite networks', papers: ['p7', 'p1', 'p3', 'p5', 'j6'] },
    edge: { number: '02', label: 'Edge Inference', labelZh: '边缘推理', headingZh: '可靠的边缘推理', descriptionZh: '协同设计感知、通信与计算，在无线边缘实现低时延感知、分类与生成式 AI 推理。', subtitle: 'Distributed LLM Inference and Sensing', subtitleZh: '分布式大语言模型推理与感知', heading: 'Reliable inference at the edge', description: 'Joint sensing, communication, and computation for low-latency perception, classification, and generative AI inference at the wireless edge.', papers: ['j2', 'j3', 'j1', 'p2', 'p4', 'p6', 'j7', 'j11', 'j6', 'p1', 'p3', 'p5', 'p7'] },
    learning: { number: '03', label: 'Edge Learning', labelZh: '边缘学习', headingZh: '无线设备协同学习', descriptionZh: '面向无线设备的联邦与分布式训练，联合优化模型更新、通信效率与学习收敛。', subtitle: 'Distributed AI model training', subtitleZh: '分布式 AI 模型训练', heading: 'Learning across wireless devices', description: 'Federated and distributed training across wireless devices, jointly optimizing model updates, communication efficiency, and learning convergence.', papers: ['j4', 'j5', 'j6', 'j11'] },
    quantum: { number: '04', label: 'Quantum Receivers', labelZh: '量子接收机', headingZh: '探索原子尺度的无线技术', descriptionZh: '面向多频段通信与高灵敏度无线感知的里德堡原子接收机。', subtitle: 'Wireless at the atomic scale', subtitleZh: '原子尺度的无线技术', heading: 'Exploring wireless at the atomic scale', description: 'Rydberg atomic receivers for multi-band communication and sensitive wireless sensing.', papers: ['j8', 'j10'] }
  };
  const titleSummaries = {
    c4: 'A spectrum-efficient method for protecting over-the-air federated learning against interference.',
    c5: 'Investigates mobile carrying as a way to improve satellite-network capacity.',
    c7: 'Adaptive batch-size control for low-latency federated learning with heterogeneous devices.',
    c10: 'A quantum self-heterodyne sensing approach for Rydberg atomic receivers.'
  };
  const figures = window.PAPER_FIGURES || {};
  const paperFigure = id => {
    const figure = figures[id];
    return figure && figureAsset(figure) && figure.exactPaper === true ? figure : null;
  };
  const figureAsset = figure => /^assets\/papers\/[a-z0-9_-]+\.(?:webp|png|jpe?g)$/i.test(figure?.asset || '') ? figure.asset : null;
  const figureName = figure => window.SiteI18n?.lang === 'zh' ? figure.figureNameZh || figure.figureName || figure.caption : figure.figureName || figure.caption;
  const paperFigures = paper => {
    const primary = figures[paper.id];
    if (!primary || paper.presentation === 'list-only') return [];
    return [primary, ...(Array.isArray(primary.additionalFigures) ? primary.additionalFigures : [])]
      .map((figure, index) => ({figure, index, asset:figureAsset(figure)}))
      .filter(({figure, asset}) => asset && figure.exactPaper === true);
  };
  const statuses = { published: ['Published', '已发表'], accepted: ['Accepted', '已录用'], 'under-review': ['Under review', '审稿中'], 'major-revision': ['Major revision', '大修中'] };
  const typeLabels = { journal: ['Journal article', '期刊论文'], preprint: ['Preprint', '预印本'], conference: ['Conference paper', '会议论文'] };
  const paperIndex = new Map(window.PUBLICATIONS.map(paper => [paper.id, paper]));
  const topicButtons = [...section.querySelectorAll('[data-research-topic]')];
  const rail = section.querySelector('#research-paper-rail');
  let currentTheme = 'space';
  let selectedPaper = 'p7';
  const setText = (id, value) => { section.querySelector(`#${id}`).textContent = value; };
  const shortVenue = paper => {
    if (paper.type === 'preprint') return 'arXiv';
    return paper.venue.replace('IEEE Transactions on Wireless Communications', 'IEEE TWC').replace('IEEE Transactions on Communications', 'IEEE TCOM').replace('IEEE Transactions on Signal Processing', 'IEEE TSP').replace('IEEE Communications Surveys & Tutorials', 'IEEE COMST').replace('IEEE Transactions on Cognitive Communications and Networking', 'IEEE TCCN');
  };
  function setAuthors(value) {
    const target = section.querySelector('#project-authors');
    const parts = value.split(/(Zhanwei Wang\*?)/g);
    target.replaceChildren(...parts.map(part => {
      if (/^Zhanwei Wang\*?$/.test(part)) {
        const strong = document.createElement('strong');
        strong.textContent = part;
        return strong;
      }
      return document.createTextNode(part);
    }));
  }
  function renderProjectFigures(paper) {
    const project = section.querySelector('#research-project');
    let panel = section.querySelector('#project-figure');
    // Accept the original primary-figure fallback as well as the new stack container.
    if (panel.tagName === 'FIGURE') {
      const stack = document.createElement('div');
      stack.id = panel.id;
      stack.className = 'project-figure-stack';
      panel.replaceWith(stack);
      panel = stack;
    }
    panel.classList.add('project-figure-stack');
    const entries = paperFigures(paper);
    panel.hidden = entries.length === 0;
    project.classList.toggle('has-paper-figure', entries.length > 0);
    project.classList.toggle('has-multiple-figures', entries.length > 1);
    panel.replaceChildren(...entries.map(({figure, index, asset}) => {
      const frame = document.createElement('figure');
      frame.className = 'project-figure';
      const link = document.createElement('a');
      const image = document.createElement('img');
      const caption = document.createElement('figcaption');
      if (index === 0) {
        link.id = 'project-figure-link';
        image.id = 'project-figure-image';
        caption.id = 'project-figure-caption';
      }
      link.href = asset;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.dataset.figureId = paper.id;
      link.dataset.figureIndex = String(index);
      link.setAttribute('aria-label', t('Open {figure} from {title} at full size', '查看论文《{title}》中的完整{figure}', {figure:figureName(figure),title:paper.title}));
      image.src = asset;
      image.alt = figureText(paper, figure, 'alt', index) || t('{title}: figure from the paper.', '论文《{title}》中的图示。', {title:paper.title});
      image.width = figure.width || 600;
      image.height = figure.height || 300;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.addEventListener('error', () => {
        frame.remove();
        project.classList.toggle('has-multiple-figures', panel.querySelectorAll('figure').length > 1);
        if (!panel.querySelector('figure')) {
          panel.hidden = true;
          project.classList.remove('has-paper-figure');
        }
      }, {once:true});
      link.append(image);
      const sourceURL = figure.sourceUrl && /^https:\/\//.test(figure.sourceUrl) ? figure.sourceUrl : null;
      const captionLabel = document.createElement(sourceURL ? 'a' : 'span');
      captionLabel.textContent = figureName(figure);
      if (sourceURL) {
        captionLabel.href = sourceURL;
        captionLabel.target = '_blank';
        captionLabel.rel = 'noopener noreferrer';
      }
      caption.append(captionLabel);
      frame.append(link, caption);
      return frame;
    }));
  }
  function showPaper(id, announce = true) {
    const paper = paperIndex.get(id);
    if (!paper) return;
    selectedPaper = id;
    setText('project-kind', t(...(typeLabels[paper.type] || ['Research paper', '研究论文'])));
    setText('project-year', String(paper.year));
    setText('project-status', paper.type === 'preprint' ? 'arXiv' : t(...(statuses[paper.status] || [paper.status, paper.status])));
    setText('project-title', paper.title);
    setText('project-summary', summary(paper) || titleSummaries[id] || paper.title);
    setAuthors(paper.authors);
    setText('project-citation', citation(paper));
    const links = section.querySelector('#project-links');
    links.replaceChildren();
    const sources = [];
    if (paper.arxiv) sources.push(['arXiv', paper.arxiv]);
    if (paper.url && paper.url !== paper.arxiv) sources.push([paper.type === 'preprint' ? t('Read paper', '阅读论文') : t('Publisher', '出版页面'), paper.url]);
    sources.forEach(([label, url]) => {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.append(document.createTextNode(label + ' '));
      const arrow = document.createElement('span');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↗';
      link.append(arrow);
      links.append(link);
    });
    renderProjectFigures(paper);
    [...rail.querySelectorAll('button')].forEach(button => button.setAttribute('aria-pressed', String(button.dataset.paperId === id)));
    if (announce) setText('research-status-live', t('{theme}. Selected paper: {title}.', '{theme}。已选择论文：{title}。', {theme:t(themes[currentTheme].label,themes[currentTheme].labelZh),title:paper.title}));
  }
  function showTheme(key, announce = true, preferredPaper = null) {
    const theme = themes[key];
    if (!theme) return;
    currentTheme = key;
    topicButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.researchTopic === key));
      const buttonTheme = themes[button.dataset.researchTopic];
      button.querySelector('.map-topic-title').textContent = t(buttonTheme.label, buttonTheme.labelZh);
      button.querySelector('.map-topic-subtitle').textContent = t(buttonTheme.subtitle, buttonTheme.subtitleZh);
    });
    section.querySelector('.map-topic-buttons').setAttribute('aria-label', t('Research directions', '研究方向'));
    rail.setAttribute('aria-label', t('Related papers', '相关论文'));
    section.querySelectorAll('[data-map-topic]').forEach(node => node.classList.toggle('is-active', node.dataset.mapTopic === key));
    setText('research-direction-label', `${theme.number} / ${t(theme.label,theme.labelZh).toUpperCase()}`);
    setText('research-direction-heading', t(theme.heading, theme.headingZh));
    setText('research-direction-summary', t(theme.description, theme.descriptionZh));
    const papers = theme.papers.map(id => paperIndex.get(id)).filter(Boolean);
    setText('research-paper-count', t('{count} papers', '{count} 篇论文', {count:papers.length}));
    rail.replaceChildren(...papers.map(paper => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'research-paper-button';
      button.dataset.paperId = paper.id;
      button.setAttribute('aria-controls', 'research-project');
      button.setAttribute('aria-pressed', 'false');
      const figure = paperFigure(paper.id);
      if (figure) {
        const thumbnail = document.createElement('span');
        thumbnail.className = 'research-paper-thumbnail';
        const image = document.createElement('img');
        image.src = figureAsset(figure);
        image.alt = figureText(paper, figure, 'alt') || t('{title}: figure from the paper.', '论文《{title}》中的图示。', {title:paper.title});
        image.width = figure.width || 600;
        image.height = figure.height || 300;
        image.loading = 'lazy';
        image.decoding = 'async';
        image.addEventListener('error', () => thumbnail.remove(), { once: true });
        thumbnail.append(image);
        button.append(thumbnail);
      }
      const label = document.createElement('span');
      label.className = 'research-paper-label';
      label.textContent = paper.title;
      const meta = document.createElement('span');
      meta.className = 'research-paper-meta';
      meta.textContent = `${paper.year} · ${shortVenue(paper)}`;
      button.append(label, meta);
      button.addEventListener('click', () => showPaper(paper.id));
      return button;
    }));
    rail.scrollLeft = 0;
    const initialPaper = papers.find(paper => paper.id === preferredPaper) || papers[0];
    if (initialPaper) showPaper(initialPaper.id, false);
    if (announce) setText('research-status-live', t('{theme}: {count} related papers. Showing {title}.', '{theme}：共有 {count} 篇相关论文，正在展示 {title}。', {theme:t(theme.label,theme.labelZh),count:papers.length,title:initialPaper?.title || t('research details','研究详情')}));
  }
  function handleButtonArrow(event, buttons, select) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const position = buttons.indexOf(event.target);
    if (position < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (position + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus({ preventScroll: true });
    select(buttons[next]);
  }
  topicButtons.forEach(button => button.addEventListener('click', () => showTheme(button.dataset.researchTopic)));
  section.querySelector('.map-topic-buttons').addEventListener('keydown', event => handleButtonArrow(event, topicButtons, button => showTheme(button.dataset.researchTopic)));
  rail.addEventListener('keydown', event => handleButtonArrow(event, [...rail.querySelectorAll('button')], button => {
    showPaper(button.dataset.paperId);
    const relativeLeft = button.offsetLeft - rail.offsetLeft;
    if (relativeLeft < rail.scrollLeft) rail.scrollLeft = relativeLeft;
    else if (relativeLeft + button.offsetWidth > rail.scrollLeft + rail.clientWidth) rail.scrollLeft = relativeLeft + button.offsetWidth - rail.clientWidth;
  }));
  window.SiteI18n?.onChange(() => {
    const railPosition = rail.scrollLeft;
    const keepPaper = selectedPaper;
    showTheme(currentTheme, false, keepPaper);
    rail.scrollLeft = railPosition;
    setText('research-status-live', t('Research language changed to English.', '研究内容已切换为中文。'));
  });
  showTheme('space', false);
})();
