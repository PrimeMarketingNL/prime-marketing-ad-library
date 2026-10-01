/* Prime's format story uses native scrolling. The artwork keeps its own ratio. */
(() => {
  'use strict';

  let instance = null;

  window.initPrimeFormat = () => {
    if (instance) return instance;

    const scene = document.getElementById('format-scene');
    const sticky = document.getElementById('format-sticky');
    const frame = document.getElementById('format-frame');
    const art = document.getElementById('format-art');
    const label = document.getElementById('format-label');
    const caption = document.getElementById('format-caption');
    const gain = document.getElementById('format-gain');
    const status = document.getElementById('format-status');
    const progressBar = document.getElementById('format-progress');
    const buttons = [...document.querySelectorAll('[data-format]')].filter(
      button => ['square', 'portrait'].includes(button.dataset.format)
    );

    if (!scene || !sticky || !frame || !art || !label || !status) return null;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const compactLayout = window.matchMedia('(max-width: 700px)');
    const clamp = value => Math.max(0, Math.min(1, value));
    const smoothStep = value => {
      const t = clamp(value);
      return t * t * (3 - 2 * t);
    };

    let isStatic = false;
    let hasMeasured = false;
    let needsMeasure = true;
    let frameRequest = 0;
    let startY = 0;
    let travel = 1;
    let frameWidth = 0;
    let displayedProgress = 0;
    let staticProgress = 1;
    let comparisonChoice = 'portrait';
    let animation = null;
    let announcedState = '';
    let destroyed = false;

    const announce = state => {
      if (state === announcedState) return;
      announcedState = state;
      status.textContent = state === 'square'
        ? 'Square format: 1:1.'
        : state === 'portrait'
          ? 'Portrait format: 4:5. 25% more canvas at the same width.'
          : 'The frame extends from square to portrait at the same width.';
    };

    const paint = progress => {
      displayedProgress = clamp(progress);
      // Pause on square, extend, pause on portrait, reveal, then hold the artwork.
      const extension = smoothStep((displayedProgress - 0.14) / 0.46);
      const reveal = smoothStep((displayedProgress - 0.72) / 0.18);
      const state = extension <= 0.001 ? 'square'
        : extension >= 0.999 ? 'portrait' : 'expanding';

      frame.style.height = `${80 + extension * 20}%`;
      frame.style.setProperty('--frame-ratio', String(1 / (1 + extension * 0.25)));
      frame.style.setProperty('--label-offset', `${frameWidth * 0.25 * extension}px`);
      scene.style.setProperty('--gain-progress', String(extension));
      scene.dataset.formatState = state;

      art.style.opacity = String(reveal);
      const artVisible = reveal > 0.001;
      art.style.visibility = artVisible ? 'visible' : 'hidden';
      art.setAttribute('aria-hidden', String(!artVisible));
      art.toggleAttribute('inert', !artVisible);
      if (gain) gain.style.opacity = String(extension * (1 - reveal));

      label.textContent = state === 'square' ? '1:1'
        : state === 'portrait' ? '4:5' : '1:1 → 4:5';
      label.style.opacity = String(1 - reveal);
      if (caption) {
        caption.textContent = state === 'square' ? 'The square canvas'
          : state === 'portrait' ? 'The portrait canvas' : 'More room for the idea';
        caption.style.opacity = String(1 - reveal);
      }
      buttons.forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.format === state));
      });
      if (progressBar) progressBar.style.transform = `scaleX(${displayedProgress})`;
      if (state !== 'expanding') comparisonChoice = state;
      announce(state);
    };

    const measure = () => {
      needsMeasure = false;
      // Measure the prospective sticky layout, even when currently in fallback.
      scene.classList.remove('is-static');
      scene.dataset.formatMode = 'scroll';

      const rootStyle = getComputedStyle(document.documentElement);
      const stickyStyle = getComputedStyle(sticky);
      const headerHeight = Math.max(0,
        parseFloat(rootStyle.getPropertyValue('--header-height'))
          || parseFloat(stickyStyle.top) || 0
      );
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const availableHeight = Math.max(0, viewportHeight - headerHeight);
      const stickyHeight = sticky.getBoundingClientRect().height;
      const requiredHeight = Math.max(stickyHeight, sticky.scrollHeight);
      const nextStatic = reducedMotion.matches || requiredHeight > availableHeight + 2;

      if (nextStatic !== isStatic || !hasMeasured) {
        animation = null;
        if (hasMeasured && !isStatic) {
          comparisonChoice = displayedProgress >= 0.37 ? 'portrait' : 'square';
        }
        staticProgress = comparisonChoice === 'portrait' ? 1 : 0;
      }
      isStatic = nextStatic;
      hasMeasured = true;
      if (reducedMotion.matches) {
        animation = null;
        staticProgress = comparisonChoice === 'portrait' ? 1 : 0;
      }
      scene.classList.toggle('is-static', isStatic);
      scene.dataset.formatMode = isStatic ? 'static' : 'scroll';

      frameWidth = frame.getBoundingClientRect().width;
      frame.style.setProperty('--square-size', `${Math.max(0, frameWidth - 2)}px`);
      const sceneRect = scene.getBoundingClientRect();
      startY = sceneRect.top + window.scrollY - headerHeight;
      travel = Math.max(1, sceneRect.height - sticky.getBoundingClientRect().height);
    };

    const render = now => {
      frameRequest = 0;
      if (destroyed) return;
      if (needsMeasure) measure();

      if (!isStatic) {
        paint((window.scrollY - startY) / travel);
        return;
      }

      if (animation) {
        const elapsed = clamp((now - animation.start) / animation.duration);
        const eased = 1 - Math.pow(1 - elapsed, 3);
        staticProgress = animation.from + (animation.to - animation.from) * eased;
        if (elapsed >= 1) animation = null;
      }
      paint(staticProgress);
      if (animation) requestRender();
    };

    const requestRender = (remeasure = false) => {
      if (destroyed) return;
      needsMeasure ||= remeasure;
      if (!frameRequest) frameRequest = requestAnimationFrame(render);
    };

    const compare = event => {
      const choice = event.currentTarget.dataset.format;
      if (needsMeasure) measure();
      comparisonChoice = choice;
      const target = choice === 'portrait' ? 1 : 0;

      if (isStatic) {
        if (reducedMotion.matches) {
          animation = null;
          staticProgress = target;
        } else {
          animation = {
            from: displayedProgress,
            to: target,
            start: performance.now(),
            duration: compactLayout.matches ? 620 : 720
          };
        }
        requestRender();
        return;
      }

      // Move the page to a held endpoint; subsequent user scrolling stays native.
      const heldProgress = choice === 'portrait' ? 0.96 : 0.06;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo({
        top: Math.max(0, Math.min(maxScroll, startY + travel * heldProgress)),
        behavior: 'smooth'
      });
      requestRender();
    };

    const onScroll = () => requestRender();
    const onLayout = () => requestRender(true);
    const onPreference = () => {
      if (animation) {
        comparisonChoice = animation.to ? 'portrait' : 'square';
        staticProgress = animation.to;
      }
      animation = null;
      requestRender(true);
    };
    const onAssetLoad = event => {
      if (event.target instanceof HTMLImageElement) requestRender(true);
    };

    buttons.forEach(button => button.addEventListener('click', compare));
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onLayout, { passive: true });
    window.addEventListener('pageshow', onLayout);
    window.addEventListener('load', onLayout);
    window.addEventListener('prime:layout', onLayout);
    window.visualViewport?.addEventListener('resize', onLayout, { passive: true });
    document.addEventListener('load', onAssetLoad, true);
    reducedMotion.addEventListener('change', onPreference);
    compactLayout.addEventListener('change', onLayout);
    document.fonts?.ready.then(onLayout);

    instance = {
      refresh: onLayout,
      destroy() {
        destroyed = true;
        cancelAnimationFrame(frameRequest);
        buttons.forEach(button => button.removeEventListener('click', compare));
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onLayout);
        window.removeEventListener('pageshow', onLayout);
        window.removeEventListener('load', onLayout);
        window.removeEventListener('prime:layout', onLayout);
        window.visualViewport?.removeEventListener('resize', onLayout);
        document.removeEventListener('load', onAssetLoad, true);
        reducedMotion.removeEventListener('change', onPreference);
        compactLayout.removeEventListener('change', onLayout);
        instance = null;
      }
    };
    requestRender(true);
    return instance;
  };
})();
