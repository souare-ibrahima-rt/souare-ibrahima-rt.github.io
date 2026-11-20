/* Navigation, apparitions au défilement et fenêtres de détail */
(function () {
  // Barre de navigation : fond opaque dès qu'on défile
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  // Menu mobile
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav ul');
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false');
  }));

  // Blocs qui glissent depuis la gauche ou la droite, en alternance, à chaque passage (dans les deux sens)
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduce) {
    const dist = window.innerWidth < 720 ? 40 : 60;
    const els = document.querySelectorAll('.head, .fact, .portrait, .about-text, .route li, .card, .skill, .stack > div, .contact-intro, .ccard, .side-card');
    els.forEach((el, i) => {
      el.style.setProperty('--dx', (i % 2 === 0 ? -dist : dist) + 'px');
      el.classList.add('slide');
    });
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      e.target.classList.toggle('in', e.isIntersecting);
    }), { threshold: 0.15 });
    els.forEach(el => io.observe(el));
  }

  // Fenêtres de détail (projets et compétences)
  document.querySelectorAll('[data-open]').forEach(btn => btn.addEventListener('click', () => {
    const d = document.getElementById(btn.dataset.open);
    if (d && d.showModal) d.showModal();
  }));
  document.querySelectorAll('dialog').forEach(d => {
    d.querySelector('.dlg-close').addEventListener('click', () => d.close());
    // clic en dehors de la fenêtre = fermer
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
  });
})();
