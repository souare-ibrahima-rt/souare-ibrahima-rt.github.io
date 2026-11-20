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

  // Apparition douce, une seule fois par élément
  const els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
  } else els.forEach(el => el.classList.add('in'));

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
