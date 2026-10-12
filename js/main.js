'use strict';

(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = false;
  const buttonState = () => {
    const paused = userPaused || reduced.matches;
    document.documentElement.classList.toggle('motion-paused', paused);
    const button = document.getElementById('motion-toggle');
    if (button) {
      button.setAttribute('aria-pressed', String(paused));
      button.disabled = reduced.matches;
      button.querySelector('.motion-label').textContent = reduced.matches ? 'Animation off' : paused ? 'Resume animation' : 'Pause animation';
      button.querySelector('.motion-icon').textContent = paused ? '▶' : 'Ⅱ';
    }
    window.dispatchEvent(new Event('prime:motion'));
  };
  window.PrimeMotion = { isPaused: () => userPaused || reduced.matches || document.hidden };
  reduced.addEventListener('change', buttonState);

  document.addEventListener('DOMContentLoaded', () => {
    buttonState();
    document.getElementById('motion-toggle')?.addEventListener('click', () => {
      userPaused = !userPaused;
      buttonState();
    });
    window.initPrimeGallery?.();
    window.initPrimeFormat?.();
    window.initPrimeCarousel?.();

    if ('IntersectionObserver' in window) {
      const heroObserver = new IntersectionObserver(entries => {
        document.documentElement.classList.toggle('hero-out-of-view', !entries[0].isIntersecting);
      }, { threshold: 0 });
      const hero = document.getElementById('hero-showcase');
      if (hero) heroObserver.observe(hero);
      if (!reduced.matches) {
        document.documentElement.classList.add('motion-ready');
        const observer = new IntersectionObserver(entries => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }, { threshold: .06 });
        document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
        reduced.addEventListener('change', event => {
          if (event.matches) {
            document.documentElement.classList.remove('motion-ready');
            observer.disconnect();
          }
        });
      }
    }
    document.addEventListener('visibilitychange', () => {
      document.documentElement.classList.toggle('page-hidden', document.hidden);
      document.documentElement.classList.toggle('hero-out-of-view', document.hidden
        || document.getElementById('hero-showcase')?.getBoundingClientRect().bottom < 0);
    });
  });
})();
