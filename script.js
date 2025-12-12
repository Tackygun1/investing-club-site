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
    injectAmbientBackdrop();

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
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (reduceMotion || !hasFinePointer) return;

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

  function injectAmbientBackdrop() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;

    const layer = document.createElement("div");
    layer.className = "market-bg";
    layer.setAttribute("aria-hidden", "true");

    // Keep the layer static on touch/low-motion devices to avoid jank
    if (reduceMotion || isTouch) {
      layer.classList.add("market-bg-static");
    } else {
      layer.classList.add("market-bg-animate");
    }

    document.body.prepend(layer);
  }
})();
