/* ==========================================================
   Topologie réseau animée (fond de la section Projets).
   Disposition : un serveur central relié à Internet (globe) au-dessus
   et à plusieurs postes clients répartis en arc autour de lui.
   De petits paquets lumineux circulent le long des liens.
   Canvas 2D, sans bibliothèque, en pause hors écran, et désactivé
   si le visiteur a choisi « réduire les animations ».
   ========================================================== */
(function () {
  const canvas = document.getElementById('topo');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nœuds en coordonnées relatives (0..1). type : net (globe/Internet), srv (serveur), pc (poste client)
  const NODES = [
    { x: 0.50, y: 0.12, t: 'net' }, // Internet / globe, au-dessus
    { x: 0.50, y: 0.44, t: 'srv' }, // serveur central
    { x: 0.16, y: 0.70, t: 'pc' }, { x: 0.30, y: 0.78, t: 'pc' },
    { x: 0.43, y: 0.73, t: 'pc' }, { x: 0.57, y: 0.73, t: 'pc' },
    { x: 0.70, y: 0.78, t: 'pc' }, { x: 0.84, y: 0.70, t: 'pc' },
    { x: 0.22, y: 0.42, t: 'pc' }, { x: 0.78, y: 0.42, t: 'pc' },
  ];
  const SRV = 1, NET = 0;
  // Internet -> serveur, puis serveur -> chaque poste client
  const LINKS = [[NET, SRV]];
  for (let i = 2; i < NODES.length; i++) LINKS.push([SRV, i]);
  const PACKETS = LINKS.map((l, i) => ({ l: i, t: Math.random(), sp: 0.16 + (i % 5) * 0.04, dir: i % 2 ? 1 : -1 }));

  let W = 0, H = 0, dpr = 1, visible = true, last = 0, spin = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = canvas.width = Math.max(1, Math.round(r.width * dpr));
    H = canvas.height = Math.max(1, Math.round(r.height * dpr));
  }
  const px = n => NODES[n].x * W, py = n => NODES[n].y * H;
  const U = () => Math.max(7, Math.min(W, H * 1.6) / 95) * dpr; // échelle des glyphes

  function stroke(c, w) { ctx.strokeStyle = c; ctx.lineWidth = w * dpr; }

  function drawGlobe(x, y, u) {
    const r = u * 1.5;
    ctx.save(); ctx.translate(x, y);
    stroke('rgba(123,236,242,0.85)', 1.3);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    const e = (Math.cos(spin) * 0.5 + 0.5) * r; // ellipse « méridien » qui tourne
    ctx.beginPath(); ctx.ellipse(0, 0, e, r, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
    ctx.restore();
  }
  function drawServer(x, y, u) {
    const w = u * 1.6, h = u * 2.2;
    ctx.fillStyle = 'rgba(26,121,205,0.22)'; stroke('rgba(60,158,221,0.95)', 1.4);
    ctx.beginPath(); ctx.rect(x - w, y - h, w * 2, h * 2); ctx.fill(); ctx.stroke();
    stroke('rgba(123,236,242,0.9)', 1.2);
    for (let i = -1; i <= 1; i++) {
      const yy = y + i * (h * 0.62);
      ctx.beginPath(); ctx.moveTo(x - w * 0.6, yy); ctx.lineTo(x + w * 0.6, yy); ctx.stroke();
    }
  }
  function drawPC(x, y, u) {
    const w = u * 1.25, h = u * 0.85;
    ctx.fillStyle = 'rgba(26,121,205,0.18)'; stroke('rgba(60,158,221,0.9)', 1.2);
    ctx.beginPath(); ctx.rect(x - w, y - h, w * 2, h * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + h + u * 0.5);
    ctx.moveTo(x - w * 0.6, y + h + u * 0.5); ctx.lineTo(x + w * 0.6, y + h + u * 0.5); ctx.stroke();
  }

  function draw(dt) {
    ctx.clearRect(0, 0, W, H);
    const u = U();
    // liens
    stroke('rgba(60,158,221,0.20)', 1);
    for (const [a, b] of LINKS) { ctx.beginPath(); ctx.moveTo(px(a), py(a)); ctx.lineTo(px(b), py(b)); ctx.stroke(); }
    // paquets lumineux
    if (!reduce) spin += dt * 0.6;
    for (const p of PACKETS) {
      if (!reduce) { p.t += p.sp * p.dir * dt; if (p.t > 1) p.t -= 1; if (p.t < 0) p.t += 1; }
      const [a, b] = LINKS[p.l];
      const x = px(a) + (px(b) - px(a)) * p.t, y = py(a) + (py(b) - py(a)) * p.t;
      const r = 2.3 * dpr;
      ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, Math.PI * 2); ctx.fillStyle = 'rgba(123,236,242,0.14)'; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = '#7cecf2'; ctx.fill();
    }
    // nœuds
    for (let i = 0; i < NODES.length; i++) {
      const n = NODES[i], x = px(i), y = py(i);
      if (n.t === 'net') drawGlobe(x, y, u);
      else if (n.t === 'srv') drawServer(x, y, u);
      else drawPC(x, y, u);
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (visible) draw(dt);
    requestAnimationFrame(frame);
  }

  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(canvas);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  window.addEventListener('resize', () => { resize(); draw(0); });

  resize(); draw(0);
  if (reduce) return;
  last = performance.now();
  requestAnimationFrame(frame);
})();
