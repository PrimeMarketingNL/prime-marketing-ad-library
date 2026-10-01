'use strict';

document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.initPrimeGallery === 'function') window.initPrimeGallery();
  if (typeof window.initPrimeFormat === 'function') window.initPrimeFormat();

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !motion.matches) {
    document.documentElement.classList.add('motion-ready');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: .06, rootMargin: '0px 0px -15px 0px' });
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
    motion.addEventListener('change', event => {
      if (event.matches) {
        document.documentElement.classList.remove('motion-ready');
        observer.disconnect();
      }
    });
  }

  const bar = document.getElementById('reading-progress');
  let pending = false;
  const renderProgress = () => {
    pending = false;
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    const progress = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
    if (bar) bar.style.transform = `scaleX(${progress})`;
  };
  const requestProgress = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(renderProgress);
  };
  window.addEventListener('scroll', requestProgress, { passive: true });
  window.addEventListener('resize', requestProgress, { passive: true });
  renderProgress();
});
