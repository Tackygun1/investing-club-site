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
    // Even with reduced motion, we still show a STATIC background so you see a change.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const layer = document.createElement("div");
    layer.className = "market-bg";
    layer.setAttribute("aria-hidden", "true");

    const canvas = document.createElement("canvas");
    canvas.className = "market-bg-canvas";
    layer.appendChild(canvas);

    document.body.prepend(layer);

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const cfg = {
      candleW: 9,
      gap: 7,
      speedPxPerFrame: 0.65,
      glow: 10,
      alpha: 0.22,
    };

    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let W = 0,
      H = 0;

    function resize() {
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      W = Math.floor(window.innerWidth);
      H = Math.floor(window.innerHeight);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const step = cfg.candleW + cfg.gap;
    const count = Math.ceil(W / step) + 10;

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
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;

      const lines = 6;
      for (let i = 0; i <= lines; i++) {
        const y = (H * i) / lines;
        ctx.strokeStyle = "rgba(255,255,255,0.07)";
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      for (let x = 0; x < W; x += 140) {
        ctx.strokeStyle = "rgba(255,255,255,0.045)";
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      ctx.restore();
    }

    function frame() {
      // range
      let min = Infinity,
        max = -Infinity;
      for (const c of candles) {
        min = Math.min(min, c.low);
        max = Math.max(max, c.high);
      }
      const pad = (max - min) * 0.18 || max * 0.02;
      min -= pad;
      max += pad;

      function mapY(p) {
        const padTop = 110;
        const padBot = 140;
        const usable = H - padTop - padBot;
        const t = (p - min) / (max - min || 1);
        return padTop + (1 - t) * usable;
      }

      ctx.clearRect(0, 0, W, H);
      drawGrid();

      ctx.save();
      ctx.globalAlpha = cfg.alpha;

      for (let i = 0; i < candles.length; i++) {
        const c = candles[i];
        const up = c.close >= c.open;

        const x = i * step - offset + 40;
        const yO = mapY(c.open);
        const yC = mapY(c.close);
        const yH = mapY(c.high);
        const yL = mapY(c.low);

        const bodyTop = Math.min(yO, yC);
        const bodyH = Math.max(2, Math.abs(yO - yC));
        const bodyW = cfg.candleW;

        const wickColor = up ? "rgba(74,222,128,0.95)" : "rgba(244,63,94,0.95)";
        const bodyFill = up ? "rgba(74,222,128,0.18)" : "rgba(244,63,94,0.16)";

        ctx.shadowBlur = cfg.glow;
        ctx.shadowColor = wickColor;

        ctx.strokeStyle = wickColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + bodyW / 2, yH);
        ctx.lineTo(x + bodyW / 2, yL);
        ctx.stroke();

        ctx.fillStyle = bodyFill;
        ctx.strokeStyle = wickColor;
        roundRect(ctx, x, bodyTop, bodyW, bodyH, 3);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();

      if (reduceMotion) return; // keep static if user prefers reduced motion

      // advance animation
      offset += cfg.speedPxPerFrame;
      if (offset >= step) {
        offset -= step;
        candles.shift();
        const last = candles[candles.length - 1];
        candles.push(nextCandle(last.close));
      }

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
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
