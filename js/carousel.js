(() => {
  'use strict';
  let initialized = false;

  window.initPrimeCarousel = () => {
    if (initialized) return true;
    const carousel = document.getElementById('portrait-carousel');
    const viewport = document.getElementById('portrait-viewport');
    const track = document.getElementById('portrait-grid');
    const originals = track ? [...track.children] : [];
    if (!carousel || !viewport || !originals.length) return false;
    initialized = true;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const previous = document.getElementById('portrait-prev');
    const next = document.getElementById('portrait-next');
    const speed = 24; // Pixels per second: enough time to read each creative.
    let period = 0;
    let focused = carousel.contains(document.activeElement);
    let pointerDown = false;
    let inView = false;
    let manualUntil = 0;
    let manualTimer = 0;
    let autoFrame = 0;
    let navigationFrame = 0;
    let resizeFrame = 0;
    let lastTime = 0;
    let position = 0;
    let writtenLeft = 0;

    originals.forEach((card, index) => {
      card.dataset.carouselOriginal = 'true';
      card.setAttribute('role', 'group');
      card.setAttribute('aria-roledescription', 'slide');
      card.setAttribute('aria-label', (index + 1) + ' of ' + originals.length);
    });

    const makeClones = () => originals.map(card => {
      const clone = card.cloneNode(true);
      delete clone.dataset.carouselOriginal;
      clone.dataset.carouselClone = 'true';
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('inert', '');
      clone.removeAttribute('id');
      clone.removeAttribute('role');
      clone.removeAttribute('aria-roledescription');
      clone.removeAttribute('aria-label');
      clone.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
      return clone;
    });
    const before = makeClones();
    track.prepend(...before);
    track.append(...makeClones());

    const motionPaused = () => reduced.matches
      || document.documentElement.classList.contains('motion-paused')
      || Boolean(window.PrimeMotion?.isPaused());
    const canFlow = () => period > 0 && inView && !document.hidden && !motionPaused()
      && !focused && !pointerDown
      && performance.now() >= manualUntil;

    // Three identical sets allow wrapping either direction without a visible jump.
    const wrap = value => period ? period + ((value - period) % period + period) % period : value;
    const setPosition = value => {
      position = wrap(value);
      viewport.scrollLeft = position;
      writtenLeft = viewport.scrollLeft;
    };
    const stopAutomatic = () => {
      cancelAnimationFrame(autoFrame);
      autoFrame = 0;
      lastTime = 0;
      position = viewport.scrollLeft;
    };
    const stopNavigation = () => {
      cancelAnimationFrame(navigationFrame);
      navigationFrame = 0;
      position = viewport.scrollLeft;
    };
    const tick = time => {
      autoFrame = 0;
      if (!canFlow()) {
        sync();
        return;
      }
      if (Math.abs(viewport.scrollLeft - writtenLeft) > 1) position = viewport.scrollLeft;
      if (lastTime) setPosition(position + speed * Math.min(time - lastTime, 64) / 1000);
      lastTime = time;
      autoFrame = requestAnimationFrame(tick);
    };
    function sync() {
      const flowing = canFlow();
      carousel.dataset.carouselState = flowing ? 'flowing' : 'paused';
      if (flowing && !autoFrame) {
        position = viewport.scrollLeft;
        lastTime = 0;
        autoFrame = requestAnimationFrame(tick);
      } else if (!flowing) {
        stopAutomatic();
      }
      if (document.hidden || !inView) stopNavigation();
    }

    const pauseAfterInteraction = () => {
      stopNavigation();
      manualUntil = performance.now() + 4000;
      clearTimeout(manualTimer);
      manualTimer = setTimeout(sync, 4050);
      sync();
    };

    function measure() {
      const oldPeriod = period;
      const offset = oldPeriod ? (wrap(viewport.scrollLeft) - oldPeriod) / oldPeriod : 0;
      stopAutomatic();
      stopNavigation();
      period = originals[0].getBoundingClientRect().left - before[0].getBoundingClientRect().left;
      setPosition(period * (1 + offset));
      sync();
    }
    const stepSize = () => originals.length > 1
      ? originals[1].getBoundingClientRect().left - originals[0].getBoundingClientRect().left
      : originals[0].getBoundingClientRect().width;

    function move(direction) {
      pauseAfterInteraction();
      const from = viewport.scrollLeft;
      const distance = direction * stepSize();
      if (motionPaused()) {
        setPosition(from + distance);
        return;
      }
      const start = performance.now();
      const animate = time => {
        const progress = Math.min((time - start) / 420, 1);
        setPosition(from + distance * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) navigationFrame = requestAnimationFrame(animate);
        else navigationFrame = 0;
      };
      navigationFrame = requestAnimationFrame(animate);
    }

    previous?.addEventListener('click', () => move(-1));
    next?.addEventListener('click', () => move(1));
    viewport.addEventListener('scroll', () => {
      const left = viewport.scrollLeft;
      if (period && (left < period - 1 || left >= period * 2 + 1)) setPosition(left);
      else if ((!autoFrame && !navigationFrame) || Math.abs(left - writtenLeft) > 1) position = left;
    }, { passive: true });
    viewport.addEventListener('wheel', pauseAfterInteraction, { passive: true });
    viewport.addEventListener('pointerdown', () => {
      pointerDown = true;
      pauseAfterInteraction();
    }, { passive: true });
    const releasePointer = () => {
      if (!pointerDown) return;
      pointerDown = false;
      pauseAfterInteraction();
    };
    window.addEventListener('pointerup', releasePointer, { passive: true });
    window.addEventListener('pointercancel', releasePointer, { passive: true });
    carousel.addEventListener('focusin', () => {
      focused = true;
      sync();
    });
    carousel.addEventListener('focusout', () => {
      // Wait for focus to settle before deciding whether it left the controls.
      queueMicrotask(() => {
        focused = carousel.contains(document.activeElement);
        sync();
      });
    });
    viewport.addEventListener('keydown', event => {
      if (event.target !== viewport) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        move(event.key === 'ArrowLeft' ? -1 : 1);
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        pauseAfterInteraction();
        setPosition(period + (event.key === 'End' ? originals.length - 1 : 0) * stepSize());
      }
    });
    window.addEventListener('prime:motion', sync);
    reduced.addEventListener('change', () => {
      if (reduced.matches) stopNavigation();
      sync();
    });
    document.addEventListener('visibilitychange', sync);

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        inView = entries[0].isIntersecting;
        sync();
      }, { threshold: 0 });
      observer.observe(viewport);
    } else {
      inView = true;
    }
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(measure);
      });
      observer.observe(viewport);
    } else {
      window.addEventListener('resize', measure);
    }
    measure();
    return true;
  };
})();
