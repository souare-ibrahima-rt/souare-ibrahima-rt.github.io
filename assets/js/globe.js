/* ==========================================================
   Globe 3D en points, dessiné en Canvas 2D (aucune bibliothèque).
   Projection orthographique + arcs en grand cercle + paquets animés.
   L'arc bleu suit le vrai parcours : Sénégal -> Roanne -> Colmar.
   ========================================================== */
(function () {
  const canvas = document.getElementById('globe');
  if (!canvas || !window.GLOBE_DOTS) return;
  const ctx = canvas.getContext('2d');
  const DEG = Math.PI / 180;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Lieux (lat, lon)
  const P = {
    senegal: [14.69, -17.44], roanne: [46.04, 4.07], colmar: [48.08, 7.36],
    paris: [48.86, 2.35], londres: [51.51, -0.13], francfort: [50.11, 8.68],
    newyork: [40.71, -74.0], montreal: [45.5, -73.57], saopaulo: [-23.55, -46.63],
    lagos: [6.52, 3.38], abidjan: [5.36, -4.01], joburg: [-26.2, 28.05],
    dubai: [25.2, 55.27], mumbai: [19.08, 72.88], singapour: [1.35, 103.82],
    tokyo: [35.68, 139.69], sydney: [-33.87, 151.21], marseille: [43.3, 5.37]
  };
  // Arcs du parcours (mis en avant)
  const route = [
    { a: 'senegal', b: 'roanne', main: true, speed: 0.16 },
    { a: 'roanne', b: 'colmar', main: true, speed: 0.35 }
  ];
  // Arcs décoratifs : quelques grandes liaisons intercontinentales
  const links = [
    ['londres', 'newyork'], ['paris', 'montreal'], ['marseille', 'dubai'], ['dubai', 'mumbai'],
    ['mumbai', 'singapour'], ['singapour', 'tokyo'], ['singapour', 'sydney'], ['lagos', 'londres'],
    ['saopaulo', 'lagos'], ['joburg', 'lagos'], ['newyork', 'saopaulo'], ['abidjan', 'marseille'],
    ['francfort', 'dubai'], ['senegal', 'saopaulo']
  ].map(([a, b], i) => ({ a, b, main: false, speed: 0.08 + (i % 5) * 0.025, off: i * 0.37 }));
  const arcs = route.concat(links);
  const labels = [
    { k: 'senegal', t: 'Sénégal' }, { k: 'roanne', t: 'Roanne' }, { k: 'colmar', t: 'Colmar' }
  ];

  // Vecteurs unitaires pré-calculés
  const vec = ([lat, lon]) => [Math.cos(lat * DEG) * Math.sin(lon * DEG), Math.sin(lat * DEG), Math.cos(lat * DEG) * Math.cos(lon * DEG)];
  const D = window.GLOBE_DOTS, N = D.length / 2;
  const dots = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const v = vec([D[2 * i + 1], D[2 * i]]); dots.set(v, i * 3); }
  arcs.forEach(arc => {
    const A = vec(P[arc.a]), B = vec(P[arc.b]);
    const ang = Math.acos(Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2]));
    const steps = Math.max(12, Math.round(ang / DEG / 2));
    const h = arc.main ? 0.06 + ang * 0.22 : 0.04 + ang * 0.16;
    arc.pts = [];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps, sa = Math.sin((1 - t) * ang) / Math.sin(ang), sb = Math.sin(t * ang) / Math.sin(ang);
      const lift = 1 + h * Math.sin(Math.PI * t);
      arc.pts.push([(A[0] * sa + B[0] * sb) * lift, (A[1] * sa + B[1] * sb) * lift, (A[2] * sa + B[2] * sb) * lift]);
    }
  });

  // État de la vue
  let lon0 = 4, lat0 = 24, vLon = 0, W = 0, H = 0, R = 0, cx = 0, cy = 0, dpr = 1;
  let dragging = false, lastX = 0, lastY = 0, visible = true, last = performance.now(), time = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = canvas.width = Math.round(r.width * dpr);
    H = canvas.height = Math.round(r.height * dpr);
    R = Math.min(W, H) * 0.4; cx = W / 2; cy = H / 2;
  }

  // Rotation : longitude autour de l'axe vertical, puis inclinaison
  function project(v, out) {
    const cl = Math.cos(-lon0 * DEG), sl = Math.sin(-lon0 * DEG);
    const x = v[0] * cl + v[2] * sl, z1 = -v[0] * sl + v[2] * cl;
    const ct = Math.cos(lat0 * DEG), st = Math.sin(lat0 * DEG);
    const y = v[1] * ct - z1 * st, z = v[1] * st + z1 * ct;
    out[0] = cx + x * R; out[1] = cy - y * R; out[2] = z;
    out[3] = Math.hypot(x, y); // distance au centre (pour savoir si un point en hauteur dépasse le disque)
    return out;
  }
  const tmp = [0, 0, 0, 0], tmp2 = [0, 0, 0, 0];
  const shown = p => p[2] > 0 || (p[3] > 1.0 && p[2] > -0.3);

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // halo
    const g = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.45);
    g.addColorStop(0, 'rgba(46,180,255,0.10)'); g.addColorStop(1, 'rgba(46,180,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // sphère
    const s = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    s.addColorStop(0, '#15202b'); s.addColorStop(1, '#0c1117');
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = s; ctx.fill();
    ctx.lineWidth = 1 * dpr; ctx.strokeStyle = 'rgba(241,236,227,0.10)'; ctx.stroke();

    // points des continents
    const size = Math.max(1.4, R / 170);
    for (let i = 0; i < N; i++) {
      tmp[0] = dots[i * 3]; tmp[1] = dots[i * 3 + 1]; tmp[2] = dots[i * 3 + 2];
      const v = project(tmp, tmp2);
      if (v[2] <= 0) continue;
      ctx.globalAlpha = 0.3 + 0.7 * v[2];
      ctx.fillStyle = '#cfe2f0';
      ctx.fillRect(v[0] - size / 2, v[1] - size / 2, size, size);
    }
    ctx.globalAlpha = 1;

    // arcs + paquets
    ctx.lineCap = 'round';
    for (const arc of arcs) {
      ctx.beginPath();
      let pen = false;
      for (const p of arc.pts) {
        const v = project(p, tmp);
        if (shown(v)) { pen ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1]); pen = true; } else pen = false;
      }
      ctx.lineWidth = (arc.main ? 2 : 1) * dpr;
      ctx.strokeStyle = arc.main ? 'rgba(46,180,255,0.95)' : 'rgba(150,210,255,0.30)';
      ctx.stroke();
      // paquet qui circule
      const t = ((time * arc.speed + (arc.off || 0)) % 1 + 1) % 1;
      const idx = t * (arc.pts.length - 1), i0 = Math.floor(idx), f = idx - i0;
      const a = arc.pts[i0], b = arc.pts[Math.min(i0 + 1, arc.pts.length - 1)];
      const v = project([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f], tmp);
      if (shown(v)) {
        const r = (arc.main ? 3.2 : 2) * dpr;
        ctx.beginPath(); ctx.arc(v[0], v[1], r * 2.6, 0, Math.PI * 2);
        ctx.fillStyle = arc.main ? 'rgba(46,180,255,0.22)' : 'rgba(150,210,255,0.16)'; ctx.fill();
        ctx.beginPath(); ctx.arc(v[0], v[1], r, 0, Math.PI * 2);
        ctx.fillStyle = arc.main ? '#c4ecff' : '#d6efff'; ctx.fill();
      }
    }

    // villes du parcours
    ctx.font = `${11 * dpr}px "IBM Plex Mono", monospace`;
    labels.forEach((l, i) => {
      const v = project(vec(P[l.k]), tmp);
      if (v[2] <= 0.05) return;
      const pulse = (time * 0.6 + i * 0.33) % 1;
      ctx.beginPath(); ctx.arc(v[0], v[1], (3 + pulse * 10) * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(46,180,255,${0.6 * (1 - pulse)})`; ctx.lineWidth = 1 * dpr; ctx.stroke();
      ctx.beginPath(); ctx.arc(v[0], v[1], 3 * dpr, 0, Math.PI * 2); ctx.fillStyle = '#2eb4ff'; ctx.fill();
      ctx.globalAlpha = Math.min(1, v[2] * 2.5);
      ctx.fillStyle = '#f1ece3';
      // Roanne et Colmar sont proches : on décale les étiquettes
      const dx = l.k === 'roanne' ? -12 * dpr - ctx.measureText(l.t).width : 9 * dpr;
      const dy = l.k === 'roanne' ? 14 * dpr : l.k === 'colmar' ? -6 * dpr : 4 * dpr;
      ctx.fillText(l.t, v[0] + dx, v[1] + dy);
      ctx.globalAlpha = 1;
    });
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (visible) {
      if (!reduce) time += dt;
      if (!dragging) {
        if (!reduce) lon0 += (5 + vLon) * dt; // rotation lente : un tour en ~70 s
        vLon *= 0.95;
      }
      draw();
    }
    requestAnimationFrame(frame);
  }

  // Glisser pour tourner le globe
  canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
    lon0 -= dx * 0.3; lat0 = Math.max(-10, Math.min(60, lat0 + dy * 0.3)); vLon = -dx * 6;
    if (reduce) draw();
  });
  const stop = () => { dragging = false; };
  canvas.addEventListener('pointerup', stop); canvas.addEventListener('pointercancel', stop);

  // Pause quand le globe n'est plus visible (économie de batterie)
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(canvas);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  window.addEventListener('resize', () => { resize(); draw(); });

  resize(); draw();
  requestAnimationFrame(t => { last = t; frame(t); });
})();
