'use strict';

(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const syncMotion = () => {
    document.documentElement.classList.toggle('motion-paused', reduced.matches);
    window.dispatchEvent(new Event('prime:motion'));
  };
  window.PrimeMotion = { isPaused: () => reduced.matches || document.hidden };
  reduced.addEventListener('change', syncMotion);

  document.addEventListener('DOMContentLoaded', () => {
    syncMotion();
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
