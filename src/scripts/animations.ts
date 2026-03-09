const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  const style = document.createElement('style');
  style.textContent = `
    [data-animate] {
      opacity: 0;
      transition: opacity 0.8s ease, transform 0.8s ease;
    }
    [data-animate="fade-up"] { transform: translateY(30px); }
    [data-animate="slide-left"] { transform: translateX(-40px); }
    [data-animate="slide-right"] { transform: translateX(40px); }
    [data-animate].is-visible {
      opacity: 1;
      transform: translate(0);
    }
  `;
  document.head.appendChild(style);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
  );

  document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
}

// Count-up animation for stats
document.querySelectorAll<HTMLElement>('[data-count-to]').forEach((el) => {
  const target = parseInt(el.dataset.countTo || '0', 10);

  if (prefersReducedMotion) {
    el.textContent = target.toLocaleString();
    return;
  }

  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        countObserver.unobserve(entry.target);

        const duration = 2000;
        const start = performance.now();

        function update(now: number) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(eased * target).toLocaleString();
          if (progress < 1) requestAnimationFrame(update);
        }

        requestAnimationFrame(update);
      });
    },
    { threshold: 0.5 },
  );

  countObserver.observe(el);
});
