(() => {
  'use strict';

  let initialized = false;

  // Cards remain ordinary links to the artwork until the native viewer is ready.
  window.initPrimeGallery = function initPrimeGallery() {
    if (initialized) return true;

    const creatives = Array.isArray(window.PRIME_CREATIVES)
      ? window.PRIME_CREATIVES.filter((item) => item && item.id && item.src)
      : [];
    if (!creatives.length) return false;

    const byId = new Map(creatives.map((item, index) => [item.id, index]));
    const squares = creatives.filter((item) => item.format === '1:1');
    const portraits = creatives.filter((item) => item.format === '4:5');

    function renderGallery(id, items, featured) {
      const grid = document.getElementById(id);
      if (!grid) return;
      const fragment = document.createDocumentFragment();

      items.forEach((creative, index) => {
        const card = document.createElement('article');
        card.className = 'work-card reveal';
        if (featured && index === 0) card.classList.add('feature');
        if (featured && index === 1) card.classList.add('secondary');

        const link = document.createElement('a');
        link.className = 'creative-link';
        link.href = creative.src;
        link.dataset.creative = creative.id;
        link.setAttribute('aria-label', `View ${creative.title || 'creative study'}`);

        const image = document.createElement('img');
        image.src = creative.src;
        image.alt = creative.alt || creative.title || 'Creative study';
        image.width = 600;
        image.height = creative.format === '4:5' ? 750 : 600;
        image.loading = 'lazy';
        image.decoding = 'async';
        link.append(image);

        if (creative.sample) {
          const badge = document.createElement('span');
          badge.className = 'sample-badge';
          badge.textContent = 'Sample study';
          link.append(badge);
        }
        const openCue = document.createElement('span');
        openCue.className = 'open-cue';
        openCue.textContent = 'View creative ↗';
        openCue.setAttribute('aria-hidden', 'true');
        link.append(openCue);

        const caption = document.createElement('div');
        caption.className = 'work-caption';
        const copy = document.createElement('div');
        const title = document.createElement('h3');
        title.textContent = creative.title || 'Creative study';
        const category = document.createElement('p');
        category.textContent = creative.categoryLabel || creative.category || 'Design study';
        copy.append(title, category);
        const ratio = document.createElement('span');
        ratio.className = 'creative-ratio';
        ratio.textContent = creative.format;
        caption.append(copy, ratio);
        card.append(link, caption);
        fragment.append(card);
      });

      grid.replaceChildren(fragment);
    }

    renderGallery('square-grid', squares, true);
    renderGallery('portrait-grid', portraits, false);
    document.querySelectorAll('[data-square-count]').forEach((element) => {
      element.textContent = String(squares.length).padStart(2, '0');
    });
    document.querySelectorAll('[data-portrait-count]').forEach((element) => {
      element.textContent = String(portraits.length).padStart(2, '0');
    });

    const formatArt = document.getElementById('format-art');
    const formatLink = document.getElementById('format-art-link');
    const formatId = formatArt?.closest('[data-format-creative]')?.dataset.formatCreative
      || formatLink?.dataset.formatCreative;
    const formatCreative = byId.has(formatId) ? creatives[byId.get(formatId)] : portraits[0];
    if (formatCreative) {
      if (formatArt) {
        formatArt.src = formatCreative.src;
        formatArt.alt = formatCreative.alt || formatCreative.title || 'Portrait design study';
      }
      if (formatLink) {
        formatLink.dataset.creative = formatCreative.id;
        formatLink.href = formatCreative.src;
        formatLink.setAttribute('aria-label', `View ${formatCreative.title || 'portrait design study'}`);
      }
    }

    // Keep hero and other non-gallery links aligned with the same manifest.
    document.querySelectorAll('[data-creative]').forEach((trigger) => {
      const index = byId.get(trigger.dataset.creative);
      if (index === undefined) return;
      const creative = creatives[index];
      if (trigger instanceof HTMLAnchorElement) trigger.href = creative.src;
      const image = trigger.querySelector('img');
      if (image) {
        image.src = creative.src;
        image.alt = creative.alt || creative.title || 'Creative study';
      }
    });

    const viewer = document.getElementById('creative-viewer');
    if (!viewer || typeof viewer.showModal !== 'function') return false;

    const elements = {
      image: document.getElementById('viewer-image'),
      title: document.getElementById('viewer-title'),
      description: document.getElementById('viewer-description'),
      format: document.getElementById('viewer-format'),
      category: document.getElementById('viewer-category'),
      counter: document.getElementById('viewer-counter'),
      thumbs: document.getElementById('viewer-thumbs'),
      close: document.getElementById('viewer-close'),
      previous: document.getElementById('viewer-prev'),
      next: document.getElementById('viewer-next'),
    };
    if (Object.values(elements).some((element) => !element)) return false;

    initialized = true;
    const thumbnails = [];
    let currentIndex = 0;
    let previousFocus = null;
    let touchStart = null;

    elements.counter.setAttribute('aria-live', 'polite');
    elements.counter.setAttribute('aria-atomic', 'true');
    elements.image.style.objectFit = 'contain';
    elements.image.draggable = false;

    const fragment = document.createDocumentFragment();
    creatives.forEach((creative, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'viewer-thumb';
      button.setAttribute('aria-label', `View ${creative.title || 'sample creative'}`);
      button.style.minWidth = '44px';
      button.style.minHeight = '44px';

      const image = document.createElement('img');
      image.src = creative.src;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      image.draggable = false;
      button.append(image);
      button.addEventListener('click', () => showCreative(index));
      thumbnails.push(button);
      fragment.append(button);
    });
    elements.thumbs.replaceChildren(fragment);

    function showCreative(index) {
      currentIndex = (index + creatives.length) % creatives.length;
      const creative = creatives[currentIndex];
      const formatName = creative.format === '4:5' ? 'Portrait' : 'Square';

      elements.image.src = creative.src;
      elements.image.alt = creative.alt || `${creative.title || 'Sample creative'} design study`;
      elements.title.textContent = creative.title || 'Design study';
      const description = creative.description || (creative.sample ? 'An original layout exploration for this portfolio prototype.' : '');
      elements.description.textContent = `${creative.sample ? 'Sample creative · Design study. ' : ''}${description}`;
      elements.format.textContent = `${creative.format || '1:1'} · ${formatName}`;
      elements.category.textContent = creative.categoryLabel || creative.category || 'Design study';
      elements.counter.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(creatives.length).padStart(2, '0')}`;

      thumbnails.forEach((thumbnail, thumbnailIndex) => {
        thumbnail.setAttribute('aria-current', String(thumbnailIndex === currentIndex));
      });
    }

    function openCreative(index, trigger) {
      if (viewer.open) {
        showCreative(index);
        return true;
      }

      showCreative(index);
      // If a browser refuses the dialog, leave the original asset link usable.
      try {
        viewer.showModal();
      } catch {
        return false;
      }
      previousFocus = trigger || document.activeElement;
      document.body.classList.add('viewer-open');
      elements.close.focus({ preventScroll: true });
      const scrollArea = viewer.querySelector('.viewer-main');
      if (scrollArea) scrollArea.scrollTop = 0;
      return true;
    }

    document.querySelectorAll('[data-creative]').forEach((trigger) => {
      if (!byId.has(trigger.dataset.creative)) return;
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.setAttribute('aria-controls', 'creative-viewer');
    });

    document.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const trigger = event.target instanceof Element ? event.target.closest('[data-creative]') : null;
      if (!trigger || viewer.contains(trigger)) return;
      const index = byId.get(trigger.dataset.creative);
      if (index === undefined) return;
      if (openCreative(index, trigger)) event.preventDefault();
    });

    elements.close.addEventListener('click', () => viewer.close());
    elements.previous.addEventListener('click', () => showCreative(currentIndex - 1));
    elements.next.addEventListener('click', () => showCreative(currentIndex + 1));

    viewer.addEventListener('close', () => {
      document.body.classList.remove('viewer-open');
      touchStart = null;
      const focusTarget = previousFocus;
      previousFocus = null;
      if (focusTarget instanceof HTMLElement && focusTarget.isConnected) {
        focusTarget.focus({ preventScroll: true });
      }
    });

    // Escape uses the dialog's native cancel/close behavior and focus trap.
    viewer.addEventListener('keydown', (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (target instanceof Element && target.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        showCreative(currentIndex + (event.key === 'ArrowLeft' ? -1 : 1));
      }
    });

    viewer.addEventListener('click', (event) => {
      if (event.target === viewer) viewer.close();
    });

    const media = elements.image.closest('[data-viewer-media], .viewer-media') || elements.image.parentElement;
    media.addEventListener('touchstart', (event) => {
      touchStart = event.touches.length === 1
        ? { x: event.touches[0].clientX, y: event.touches[0].clientY, id: event.touches[0].identifier }
        : null;
    }, { passive: true });

    media.addEventListener('touchend', (event) => {
      const start = touchStart;
      touchStart = null;
      if (!start || !viewer.open) return;
      const touch = Array.from(event.changedTouches).find((item) => item.identifier === start.id);
      if (!touch) return;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        showCreative(currentIndex + (dx < 0 ? 1 : -1));
      }
    }, { passive: true });

    media.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
    return true;
  };
})();
