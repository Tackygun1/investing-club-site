(function () {
  function init() {
    // --- Mobile nav toggle (your original logic) ---
    const header = document.querySelector("header");
    const toggle = document.querySelector(".nav-toggle");

    if (header && toggle) {
      toggle.addEventListener("click", () => header.classList.toggle("nav-open"));

      const navLinks = header.querySelectorAll(".nav-links a");
      navLinks.forEach((link) => {
        link.addEventListener("click", () => header.classList.remove("nav-open"));
      });
    }

    // --- Visual upgrades ---
    initRevealAnimations();
    initCursorGlow();
    initMarketBackgroundCandles();

    console.log("IC site upgrades loaded ✅"); // open DevTools -> Console to confirm
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function initRevealAnimations() {
    const els = [
      ...document.querySelectorAll(".section-header"),
      ...document.querySelectorAll(".card"),
      ...document.querySelectorAll(".hero-card"),
      ...document.querySelectorAll(".steps"),
      ...document.querySelectorAll(".leaderboard"),
    ];

    els.forEach((el) => el.classList.add("reveal"));

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) e.target.classList.add("is-visible");
        }
      },
      { threshold: 0.12 }
    );

    els.forEach((el) => io.observe(el));
  }

  function initCursorGlow() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let raf = 0;
    window.addEventListener("mousemove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
        document.documentElement.style.setProperty("--my", `${e.clientY}px`);
      });
    });
  }

  function initMarketBackgroundCandles() {
  // Always show a background, but run animation efficiently.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 720px)").matches;

  const layer = document.createElement("div");
  layer.className = "market-bg";
  layer.setAttribute("aria-hidden", "true");

  const canvas = document.createElement("canvas");
  canvas.className = "market-bg-canvas";
  layer.appendChild(canvas);
  document.body.prepend(layer);

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  // PERFORMANCE CONFIG
  const cfg = {
    candleW: isMobile ? 7 : 8,
    gap: isMobile ? 8 : 7,
    speedPxPerSec: isMobile ? 22 : 32,     // slower = less busy
    glow: 0,                               // shadowBlur is expensive — keep 0
    alpha: isMobile ? 0.12 : 0.16,         // lower opacity = easier to read + lighter render
    fps: isMobile ? 18 : 24,               // cap FPS (biggest CPU win)
    scale: isMobile ? 0.7 : 0.8            // render at lower internal resolution
  };

  let W = 0, H = 0, drawW = 0, drawH = 0;

  function resize() {
    W = Math.floor(window.innerWidth);
    H = Math.floor(window.innerHeight);

    drawW = Math.max(320, Math.floor(W * cfg.scale));
    drawH = Math.max(320, Math.floor(H * cfg.scale));

    canvas.width = drawW;
    canvas.height = drawH;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    // map drawing coords to the downscaled canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  const step = cfg.candleW + cfg.gap;
  const count = Math.ceil(drawW / step) + 10;

  let price = 100 + Math.random() * 30;
  let candles = Array.from({ length: count }, () => nextCandle(price));
  price = candles[candles.length - 1].close;

  let offset = 0;

  function nextCandle(prevClose) {
    const vol = 0.012 + Math.random() * 0.01;
    const drift = 0.00005;
    const shock = (Math.random() - 0.5) * 2 * vol;
    const ret = drift + shock;

    const open = prevClose;
    const close = Math.max(1, prevClose * (1 + ret));
    const wick = Math.max(0.002, Math.abs(ret) * 0.7 + Math.random() * vol);
    const high = Math.max(open, close) * (1 + wick * (0.4 + Math.random() * 0.6));
    const low = Math.min(open, close) * (1 - wick * (0.4 + Math.random() * 0.6));
    return { open, high, low, close };
  }

  function drawGrid() {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;

    const lines = 6;
    for (let i = 0; i <= lines; i++) {
      const y = (drawH * i) / lines;
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(drawW, y);
      ctx.stroke();
    }

    for (let x = 0; x < drawW; x += 140) {
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, drawH);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFrame() {
    let min = Infinity, max = -Infinity;
    for (const c of candles) {
      min = Math.min(min, c.low);
      max = Math.max(max, c.high);
    }
    const pad = (max - min) * 0.18 || max * 0.02;
    min -= pad;
    max += pad;

    const padTop = 70;
    const padBot = 90;
    const usable = drawH - padTop - padBot;

    function mapY(p) {
      const t = (p - min) / (max - min || 1);
      return padTop + (1 - t) * usable;
    }

    ctx.clearRect(0, 0, drawW, drawH);
    drawGrid();

    ctx.save();
    ctx.globalAlpha = cfg.alpha;

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const up = c.close >= c.open;

      const x = i * step - offset + 30;
      const yO = mapY(c.open);
      const yC = mapY(c.close);
      const yH = mapY(c.high);
      const yL = mapY(c.low);

      const bodyTop = Math.min(yO, yC);
      const bodyH = Math.max(2, Math.abs(yO - yC));
      const bodyW = cfg.candleW;

      const wickColor = up ? "rgba(74,222,128,0.9)" : "rgba(244,63,94,0.9)";
      const bodyFill  = up ? "rgba(74,222,128,0.16)" : "rgba(244,63,94,0.14)";

      // NO SHADOWS (big perf win)
      ctx.strokeStyle = wickColor;
      ctx.fillStyle = bodyFill;

      // wick
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + bodyW / 2, yH);
      ctx.lineTo(x + bodyW / 2, yL);
      ctx.stroke();

      // body (fast rect, no rounded corners)
      ctx.fillRect(x, bodyTop, bodyW, bodyH);
      ctx.strokeRect(x + 0.5, bodyTop + 0.5, bodyW - 1, bodyH - 1);
    }

    ctx.restore();
  }

  // Pause animation when tab is hidden
  let paused = false;
  document.addEventListener("visibilitychange", () => {
    paused = document.hidden;
  });

  // FPS throttle
  const frameMs = 1000 / cfg.fps;
  let lastTime = 0;

  function loop(t) {
    if (reduceMotion) {
      drawFrame(); // static one-time-ish (but safe if called repeatedly)
      return;
    }
    if (!paused && t - lastTime >= frameMs) {
      const dt = Math.min(50, t - lastTime);
      lastTime = t;

      // advance using dt (smooth even at lower FPS)
      offset += (cfg.speedPxPerSec * dt) / 1000;

      if (offset >= step) {
        while (offset >= step) offset -= step;
        candles.shift();
        const last = candles[candles.length - 1];
        candles.push(nextCandle(last.close));
      }

      drawFrame();
    }
    requestAnimationFrame(loop);
  }

  // draw once immediately so you SEE it right away
  drawFrame();
  requestAnimationFrame(loop);
}


  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }
})();
