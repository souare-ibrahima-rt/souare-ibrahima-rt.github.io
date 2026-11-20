/* ==========================================================
   Topologie réseau animée (fond de la section Projets).
   Canvas 2D, sans bibliothèque. Nœuds routeurs / switchs / serveurs
   reliés par des liens, avec de petits paquets lumineux qui circulent.
   Discret, en pause hors écran, respecte « réduire les animations ».
   ========================================================== */
(function () {
  const canvas = document.getElementById('topo');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nœuds en coordonnées relatives (0..1). type : r routeur, s switch, h serveur/hôte
  const NODES = [
    { x: 0.10, y: 0.30, t: 'r' }, { x: 0.27, y: 0.62, t: 's' },
    { x: 0.40, y: 0.26, t: 's' }, { x: 0.53, y: 0.70, t: 'h' },
    { x: 0.63, y: 0.38, t: 'r' }, { x: 0.78, y: 0.66, t: 's' },
    { x: 0.86, y: 0.30, t: 'h' }, { x: 0.93, y: 0.55, t: 'h' },
    { x: 0.20, y: 0.84, t: 'h' }, { x: 0.46, y: 0.50, t: 'r' },
  ];
  const LINKS = [[0,1],[0,2],[2,4],[1,9],[9,3],[9,4],[4,5],[4,6],[5,7],[6,7],[1,8],[5,3]];
  // Quelques paquets répartis sur les liens
  const PACKETS = LINKS.map((l, i) => ({ l: i, t: Math.random(), sp: 0.10 + (i % 4) * 0.05, dir: i % 2 ? 1 : -1 }));

  let W = 0, H = 0, dpr = 1, raf = 0, visible = true, last = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = canvas.width = Math.max(1, Math.round(r.width * dpr));
    H = canvas.height = Math.max(1, Math.round(r.height * dpr));
  }
  const px = n => n.x * W, py = n => n.y * H;

  function node(n) {
    const x = px(n), y = py(n), s = 5 * dpr;
    ctx.fillStyle = 'rgba(60,158,221,0.9)';
    ctx.strokeStyle = 'rgba(123,236,242,0.9)';
    ctx.lineWidth = 1.4 * dpr;
    ctx.beginPath();
    if (n.t === 'r') { ctx.arc(x, y, s, 0, Math.PI * 2); }           // routeur : rond
    else if (n.t === 's') { ctx.rect(x - s, y - s, s * 2, s * 2); }  // switch : carré
    else { ctx.rect(x - s, y - s * 1.3, s * 2, s * 2.6); }           // serveur : rectangle
    ctx.fill(); ctx.stroke();
  }

  function draw(dt) {
    ctx.clearRect(0, 0, W, H);
    // liens
    ctx.lineWidth = 1 * dpr;
    ctx.strokeStyle = 'rgba(60,158,221,0.18)';
    for (const [a, b] of LINKS) {
      ctx.beginPath(); ctx.moveTo(px(NODES[a]), py(NODES[a])); ctx.lineTo(px(NODES[b]), py(NODES[b])); ctx.stroke();
    }
    // paquets
    for (const p of PACKETS) {
      if (!reduce) { p.t += p.sp * p.dir * dt; if (p.t > 1) p.t -= 1; if (p.t < 0) p.t += 1; }
      const [a, b] = LINKS[p.l];
      const x = px(NODES[a]) + (px(NODES[b]) - px(NODES[a])) * p.t;
      const y = py(NODES[a]) + (py(NODES[b]) - py(NODES[a])) * p.t;
      const r = 2.4 * dpr;
      ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, Math.PI * 2); ctx.fillStyle = 'rgba(123,236,242,0.14)'; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = '#7cecf2'; ctx.fill();
    }
    NODES.forEach(node);
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (visible) draw(dt);
    raf = requestAnimationFrame(frame);
  }

  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(canvas);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  window.addEventListener('resize', () => { resize(); draw(0); });

  resize(); draw(0);
  if (reduce) return; // dessin statique, pas de boucle
  last = performance.now();
  raf = requestAnimationFrame(frame);
})();
