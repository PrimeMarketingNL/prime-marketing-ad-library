(() => {
  'use strict';
  let initialized = false;

  window.initPrimeGallery = () => {
    if (initialized) return true;
    const creatives = (window.PRIME_CREATIVES || []).filter(item => item.id && item.src && item.type === 'image');
    const libraryCreatives = creatives.filter(item => item.format === '1:1');
    const grid = document.getElementById('square-grid');
    if (!creatives.length || !grid) return false;
    initialized = true;

    const search = document.getElementById('library-search');
    const more = document.getElementById('library-more');
    const status = document.getElementById('library-status');
    const showing = document.getElementById('library-showing');
    const empty = document.getElementById('library-empty');
    const filters = [...document.querySelectorAll('[data-library-filter]')];
    const pageSize = 12;
    let activeFilter = 'all';
    let limit = pageSize;
    let results = [];
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

    function makeCard(creative) {
      const card = document.createElement('article');
      card.className = 'work-card';
      card.dataset.creativeId = creative.id;
      const media = document.createElement('div');
      media.className = 'creative-media';
      media.style.setProperty('--creative-ratio', String(creative.width / creative.height));

      const image = document.createElement('img');
      image.src = creative.src;
      if (creative.thumbnail && creative.thumbWidth < creative.width) {
        image.srcset = creative.thumbnail + ' ' + creative.thumbWidth + 'w, ' + creative.src + ' ' + creative.width + 'w';
        image.sizes = '(max-width: 700px) calc((100vw - 59px) / 2), (max-width: 840px) calc((100vw - 92px) / 3), calc((100vw - 10vw - 66px) / 4)';
      }
      image.alt = creative.alt || creative.client + ' campaign creative';
      image.width = creative.width;
      image.height = creative.height;
      image.loading = 'lazy';
      image.decoding = 'async';
      media.append(image);
      const caption = document.createElement('div');
      caption.className = 'work-caption';
      const copy = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = creative.client;
      const category = document.createElement('p');
      category.textContent = creative.categoryLabel;
      copy.append(title, category);
      const ratio = document.createElement('span');
      ratio.className = 'creative-ratio';
      ratio.textContent = creative.format;
      caption.append(copy, ratio);
      card.append(media, caption);
      return card;
    }

    const matchesFilter = creative => activeFilter === 'all'
      || (activeFilter === 'resources' && creative.category === 'resources');

    const update = (append = false) => {
      const query = normalize(search?.value);
      const terms = query.split(/\s+/).filter(Boolean);
      results = libraryCreatives.filter(creative => {
        const content = normalize([creative.client, creative.title, creative.categoryLabel, creative.format].join(' '));
        return matchesFilter(creative) && terms.every(term => content.includes(term));
      });
      if (!append) {
        grid.replaceChildren();
      }
      const start = append ? grid.children.length : 0;
      const fragment = document.createDocumentFragment();
      results.slice(start, limit).forEach(creative => fragment.append(makeCard(creative)));
      grid.append(fragment);
      const count = Math.min(limit, results.length);
      more.hidden = count >= results.length;
      empty.hidden = results.length > 0;
      status.textContent = results.length + (results.length === 1 ? ' creative' : ' creatives')
        + (query ? ' matching “' + search.value.trim() + '”' : ' in ' + (activeFilter === 'all' ? 'the collection' : filters.find(button => button.dataset.libraryFilter === activeFilter).textContent.trim())) + '.';
      showing.textContent = count ? 'Showing ' + count + ' of ' + results.length : '';
      filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.libraryFilter === activeFilter)));
      window.dispatchEvent(new Event('prime:layout'));
      if (append && grid.children[start]) {
        grid.children[start].tabIndex = -1;
        grid.children[start].focus({ preventScroll: true });
      }
    };

    const setFilter = filter => {
      activeFilter = filter;
      limit = pageSize;
      update();
    };
    filters.forEach(button => button.addEventListener('click', () => setFilter(button.dataset.libraryFilter)));
    search?.addEventListener('input', () => {
      limit = pageSize;
      update();
    });
    more?.addEventListener('click', () => {
      limit += pageSize;
      update(true);
    });
    document.getElementById('library-reset')?.addEventListener('click', () => {
      search.value = '';
      setFilter('all');
      search.focus({ preventScroll: true });
    });
    document.querySelector('[data-filter-count="all"]').textContent = libraryCreatives.length;
    update();

    const portraits = creatives.filter(item => item.format === '4:5');
    const portraitPicks = ['style-9-100526', 'trace-1-101026', '10-usppainpoint-ads'].map(id => portraits.find(item => item.id === id)).filter(Boolean);
    portraits.forEach(item => {
      if (!portraitPicks.includes(item)) portraitPicks.push(item);
    });
    const portraitGrid = document.getElementById('portrait-grid');
    portraitGrid?.replaceChildren(...portraitPicks.map(makeCard));
    // Preserve readable, uncropped artwork in the dedicated portrait carousel.
    portraitGrid?.querySelectorAll('img').forEach(image => {
      image.sizes = '(max-width: 700px) 80vw, (max-width: 840px) 42vw, 30vw';
    });
    document.querySelectorAll('[data-carousel-count]').forEach(element => { element.textContent = portraits.length; });
    const formatCreative = portraitPicks[0];
    const formatArt = document.getElementById('format-art');
    if (formatArt && formatCreative) {
      formatArt.src = formatCreative.src;
      formatArt.alt = formatCreative.alt;
      formatArt.width = formatCreative.width;
      formatArt.height = formatCreative.height;
    }

    const hero = document.getElementById('hero-columns');
    if (hero) {
      const preferred = ['ParkBee', 'Variolytics', 'Protime', 'Acorel', 'Skalar', 'Cuchilla Connect', 'Adaptics', 'FyxCapital', 'Gerstel', 'Trace', 'Harper James', 'BIS | Econocom', 'Capability', 'Bloqhouse', 'Rotaris'];
      const heroPicks = preferred.map(client => libraryCreatives.find(item => item.client === client && item.category !== 'resources')).filter(Boolean);
      libraryCreatives.forEach(item => {
        if (heroPicks.length < 15 && !heroPicks.includes(item)) heroPicks.push(item);
      });
      const columns = Array.from({ length: 3 }, () => []);
      heroPicks.slice(0, 15).forEach((item, index) => columns[index % 3].push(item));
      const fragment = document.createDocumentFragment();
      columns.forEach((items, columnIndex) => {
        const column = document.createElement('div');
        column.className = 'hero-column';
        const track = document.createElement('div');
        track.className = 'hero-column-track';
        for (let copy = 0; copy < 2; copy++) {
          const group = document.createElement('div');
          group.className = 'hero-column-group';
          if (copy) group.setAttribute('aria-hidden', 'true');
          items.forEach((item, index) => {
            const tile = document.createElement('div');
            tile.className = 'hero-tile';
            const image = document.createElement('img');
            image.src = item.thumbnail || item.src;
            image.alt = copy ? '' : item.alt;
            image.width = item.thumbWidth || item.width;
            image.height = Math.round(image.width * item.height / item.width);
            image.decoding = 'async';
            if (!copy && index === 0 && columnIndex !== 1) image.fetchPriority = 'high';
            tile.append(image);
            group.append(tile);
          });
          track.append(group);
        }
        column.append(track);
        fragment.append(column);
      });
      hero.replaceChildren(fragment);
    }
    return true;
  };
})();
