/* GSAP + Lenis layer — scroll-linked choreography and interaction polish.

   Loaded after motion.js, which decides whether this layer runs: it adds
   `gsap-on` to <html> only when motion is allowed and GSAP, ScrollTrigger and
   SplitText all loaded from the CDN. Without it (reduced motion, no
   JavaScript, CDN down) the page keeps the plain CSS/IntersectionObserver
   reveals and still renders complete.

   Magnet, TiltedCard, ScrollVelocity and ShinyText are adapted from
   React Bits (reactbits.dev) — © David Haz, MIT + Commons Clause. */

(function () {
  const root = document.documentElement;
  if (!root.classList.contains("gsap-on")) return;

  const { gsap, ScrollTrigger, SplitText } = window;
  const plugins = [ScrollTrigger, SplitText];
  if (window.ScrambleTextPlugin) plugins.push(window.ScrambleTextPlugin);
  gsap.registerPlugin(...plugins);

  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const $ = s => document.querySelector(s);

  /* ===================== Lenis smooth scroll ===================== */
  // One clock for everything: GSAP's ticker drives Lenis, Lenis feeds
  // ScrollTrigger. Anchors honour the CSS scroll-padding-top under the nav.
  let lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, anchors: true, allowNestedScroll: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
  }

  /* ===================== Hero intro ===================== */
  // Built now (hidden), played when motion.js says the boot sheet is gone.
  const heroTitle = document.getElementById("hero-title");
  const heroSplit = heroTitle
    ? SplitText.create(heroTitle, { type: "words", wordsClass: "sw", mask: "words" })
    : null;
  const heroBits = [".hero-text .pill", ".hero-name", ".hero-desc", ".hero-cta", ".hero-spec", ".hero-loc"]
    .map($).filter(Boolean);
  const panelWrap = $(".hero-panel-wrap");

  if (heroSplit) gsap.set(heroSplit.words, { yPercent: 115 });
  gsap.set(heroBits, { autoAlpha: 0, y: 18 });
  if (panelWrap) gsap.set(panelWrap, { autoAlpha: 0, y: 44, scale: 0.97, filter: "blur(10px)" });

  let introPlayed = false;
  window.__akoIntro = () => {
    if (introPlayed) return;
    introPlayed = true;
    const [pill, name, ...rest] = heroBits;
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    if (pill) tl.to(pill, { autoAlpha: 1, y: 0, duration: 0.9 });
    if (name) tl.to(name, { autoAlpha: 1, y: 0, duration: 0.9 }, "<0.06");
    if (heroSplit) tl.to(heroSplit.words, { yPercent: 0, duration: 1.25, stagger: 0.07 }, "<0.04");
    tl.to(rest, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.09 }, "-=0.85");
    if (panelWrap) {
      tl.to(panelWrap, {
        autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.5, clearProps: "filter"
      }, 0.35);
    }
  };

  /* ===================== Hero exit (scrubbed parallax) ===================== */
  // The copy drifts up and the panel lags behind with a slight lean as the
  // hero scrolls away; tied to scroll position, so it reverses on the way up.
  const heroST = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
  gsap.to(".hero-text", { yPercent: -16, ease: "none", scrollTrigger: heroST });
  if (panelWrap) gsap.to(panelWrap, { yPercent: 12, rotationX: 7, ease: "none", scrollTrigger: { ...heroST } });
  gsap.to(".hero-inner", {
    opacity: 0.2, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "35% top", end: "bottom top", scrub: true }
  });

  /* ===================== Section titles ===================== */
  // Words rise out of masks; the number pill scrambles in. The scramble
  // target is read at trigger time so a language switch is never undone.
  const scramble = (el, chars) => {
    if (!el) return null;
    if (!window.ScrambleTextPlugin) return gsap.to(el, { autoAlpha: 1, x: 0, duration: 0.6, ease: "power3.out" });
    return gsap.to(el, {
      autoAlpha: 1, x: 0, duration: 0.9, ease: "none",
      scrambleText: { text: el.textContent, chars, speed: 0.6, revealDelay: 0.15 }
    });
  };

  document.querySelectorAll(".section-title").forEach(h => {
    const label = h.querySelector("[data-i18n]");
    const num = h.querySelector(".mono");
    const split = label ? SplitText.create(label, { type: "words", wordsClass: "tw", mask: "words" }) : null;
    if (split) gsap.set(split.words, { yPercent: 110 });
    if (num) gsap.set(num, { autoAlpha: 0, x: -8 });
    ScrollTrigger.create({
      trigger: h,
      start: "top 88%",
      once: true,
      onEnter: () => {
        scramble(num, "0123456789");
        if (split) gsap.to(split.words, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.06, delay: 0.08 });
      }
    });
  });

  // contact headline + kicker
  const contactTitle = $(".contact-title");
  const contactKicker = $(".contact .mono.accent");
  if (contactTitle) {
    const split = SplitText.create(contactTitle, { type: "words", wordsClass: "tw", mask: "words" });
    gsap.set(split.words, { yPercent: 110 });
    if (contactKicker) gsap.set(contactKicker, { autoAlpha: 0, x: -8 });
    ScrollTrigger.create({
      trigger: ".contact-panel",
      start: "top 80%",
      once: true,
      onEnter: () => {
        scramble(contactKicker, "01");
        gsap.to(split.words, { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.06, delay: 0.1 });
      }
    });
  }

  /* ===================== Content reveals (React Bits BlurText feel) ===================== */
  // Rows and cards come in out of a soft blur, in small staggered batches.
  // Hidden here rather than in CSS: cards the language switch re-renders
  // later arrive visible instead of waiting for a trigger that no longer exists.
  const revealItems = gsap.utils.toArray(
    ".metric, .about-text > p, .about-list li, .stat-card, .t-item, .f-card, .filter-bar, .p-card, .skill-group, .contact-panel"
  );
  gsap.set(revealItems, { autoAlpha: 0, y: 32, filter: "blur(6px)" });
  ScrollTrigger.batch(revealItems, {
    start: "top 90%",
    once: true,
    interval: 0.08,
    batchMax: 8,
    onEnter: batch => gsap.to(batch, {
      autoAlpha: 1, y: 0, filter: "blur(0px)",
      duration: 1, ease: "power3.out", stagger: 0.08, overwrite: true,
      clearProps: "opacity,visibility,transform,filter"
    })
  });

  /* ===================== Experience progress line ===================== */
  const fill = document.getElementById("t-fill");
  if (fill) {
    gsap.fromTo(fill, { scaleY: 0 }, {
      scaleY: 1, ease: "none", transformOrigin: "top center",
      scrollTrigger: { trigger: ".timeline", start: "top 62%", end: "bottom 62%", scrub: 0.6 }
    });
  }

  /* ===================== Nav: hide on the way down, return on the way up ===================== */
  const nav = $(".nav");
  const menu = $(".nav-links");
  if (lenis && nav) {
    lenis.on("scroll", ({ scroll, direction }) => {
      const open = menu && menu.classList.contains("open");
      nav.classList.toggle("nav-hidden", !open && scroll > 240 && direction === 1);
    });
  }

  /* ===================== ScrollVelocity (React Bits) ===================== */
  // Two rows of the stack drifting in opposite directions; scrolling speeds
  // them up, flips them with the scroll direction and leans them with a skew.
  const smootherstep = t => t * t * t * (t * (t * 6 - 15) + 10);
  const wrapX = (min, max, v) => {
    const range = max - min;
    return ((((v - min) % range) + range) % range) + min;
  };

  document.querySelectorAll(".velocity").forEach(band => {
    const steps = Array.from({ length: 9 }, (_, i) => i / 8);
    const mask = `linear-gradient(to right, ${[
      ...steps.map(t => `rgba(0,0,0,${smootherstep(t).toFixed(3)}) ${(t * 12).toFixed(1)}%`),
      ...steps.map(t => `rgba(0,0,0,${smootherstep(1 - t).toFixed(3)}) ${(88 + t * 12).toFixed(1)}%`)
    ].join(", ")})`;
    band.style.webkitMaskImage = mask;
    band.style.maskImage = mask;

    const rows = Array.from(band.querySelectorAll(".v-row")).map(row => {
      const track = row.querySelector(".v-track");
      const copy = track.querySelector(".v-copy");
      return { track, copy, base: parseFloat(row.dataset.speed || "60") * (row.dataset.dir === "-1" ? -1 : 1), x: 0, dir: 1, skew: 0, width: 0 };
    });

    const fillCopies = () => {
      rows.forEach(r => {
        r.track.querySelectorAll(".v-copy[data-clone]").forEach(c => c.remove());
        r.width = r.copy.offsetWidth || 1;
        const need = Math.ceil(band.offsetWidth / r.width) + 1;
        for (let i = 0; i < need; i++) {
          const c = r.copy.cloneNode(true);
          c.dataset.clone = "";
          r.track.appendChild(c);
        }
      });
    };
    fillCopies();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fillCopies);
    let resizeTimer = 0;
    window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(fillCopies, 150); }, { passive: true });

    let visible = false;
    ScrollTrigger.create({ trigger: band, start: "top bottom", end: "bottom top", onToggle: self => { visible = self.isActive; } });

    let smoothV = 0;
    gsap.ticker.add((time, deltaMs) => {
      if (!visible) return;
      const dt = Math.min(deltaMs, 64) / 1000;
      // Lenis reports px per frame; ×60 ≈ px per second
      const raw = lenis ? lenis.velocity * 60 : 0;
      smoothV += (raw - smoothV) * (1 - Math.exp(-dt / 0.12));
      const factor = gsap.utils.mapRange(0, 1000, 0, 4, Math.abs(smoothV));
      rows.forEach(r => {
        if (smoothV < -1) r.dir = -1; else if (smoothV > 1) r.dir = 1;
        const move = r.dir * r.base * dt * (1 + factor);
        r.x = wrapX(-r.width, 0, r.x + move);
        const surge = Math.tanh(Math.abs(smoothV) / 1600);
        const ease = 1 - Math.exp(-dt / 0.11);
        r.skew += (-Math.sign(move) * 7 * surge - r.skew) * ease;
        r.track.style.transform = `translate3d(${r.x.toFixed(2)}px,0,0) skewX(${r.skew.toFixed(2)}deg)`;
      });
    });
  });

  if (!finePointer) return;

  /* ===================== Magnet (React Bits) ===================== */
  // Buttons lean toward a nearby cursor on a spring. Exclusive: only the
  // closest magnet in range moves. The wrapper is measured, the button moves,
  // so the pull never feeds back into its own hit area.
  (function magnets() {
    const PAD = 70, STRENGTH = 3.2, MAX = 16;
    const SPRING = { k: 170, c: 16, m: 1 };
    const smoothstep = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
    const reach = (rect, p) => {
      const dx = p.x - (rect.left + rect.width / 2);
      const dy = p.y - (rect.top + rect.height / 2);
      const outside = Math.hypot(Math.max(0, Math.abs(dx) - rect.width / 2), Math.max(0, Math.abs(dy) - rect.height / 2));
      return { dx, dy, outside };
    };
    const field = { pointer: null, owner: null };
    const entries = [];

    document.querySelectorAll(".hero-cta .btn, .contact-actions .btn, .proj-more .btn").forEach(btn => {
      const wrap = document.createElement("span");
      wrap.className = "magnet";
      btn.before(wrap);
      wrap.appendChild(btn);
      const e = { wrap, inner: btn, x: 0, y: 0, vx: 0, vy: 0, raf: 0, last: 0 };
      e.frame = now => {
        e.raf = 0;
        const dt = e.last ? Math.min((now - e.last) / 1000, 1 / 30) : 1 / 60;
        e.last = now;
        let tx = 0, ty = 0;
        if (field.pointer && field.owner === e) {
          const { dx, dy, outside } = reach(wrap.getBoundingClientRect(), field.pointer);
          const pull = 1 - smoothstep(PAD * 0.5, PAD, outside);
          tx = (dx / STRENGTH) * pull;
          ty = (dy / STRENGTH) * pull;
          const len = Math.hypot(tx, ty);
          if (len > MAX) { tx *= MAX / len; ty *= MAX / len; }
        }
        const steps = Math.ceil(dt / (1 / 120));
        const h = dt / steps;
        for (let i = 0; i < steps; i++) {
          e.vx += ((SPRING.k * (tx - e.x) - SPRING.c * e.vx) / SPRING.m) * h;
          e.vy += ((SPRING.k * (ty - e.y) - SPRING.c * e.vy) / SPRING.m) * h;
          e.x += e.vx * h;
          e.y += e.vy * h;
        }
        const resting = Math.abs(tx - e.x) < 0.05 && Math.abs(ty - e.y) < 0.05 && Math.abs(e.vx) < 0.05 && Math.abs(e.vy) < 0.05;
        if (resting) { e.x = tx; e.y = ty; e.vx = e.vy = 0; }
        btn.style.transform = (e.x || e.y) ? `translate3d(${e.x.toFixed(2)}px,${e.y.toFixed(2)}px,0)` : "";
        if (!resting) e.raf = requestAnimationFrame(e.frame); else e.last = 0;
      };
      e.wake = () => { if (!e.raf) e.raf = requestAnimationFrame(e.frame); };
      entries.push(e);
    });

    const arbitrate = () => {
      let winner = null, nearest = Infinity, closest = Infinity;
      if (field.pointer) {
        for (const e of entries) {
          const near = reach(e.wrap.getBoundingClientRect(), field.pointer);
          if (near.outside > PAD) continue;
          const center = Math.hypot(near.dx, near.dy);
          if (near.outside < nearest || (near.outside === nearest && center < closest)) {
            winner = e; nearest = near.outside; closest = center;
          }
        }
      }
      const prev = field.owner;
      field.owner = winner;
      if (prev && prev !== winner) prev.wake();
      if (winner) winner.wake();
    };
    window.addEventListener("pointermove", ev => {
      if (ev.pointerType === "touch") return;
      field.pointer = { x: ev.clientX, y: ev.clientY };
      arbitrate();
    }, { passive: true });
    window.addEventListener("scroll", arbitrate, { passive: true });
    const leave = () => { field.pointer = null; arbitrate(); };
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
  })();

  /* ===================== TiltedCard (React Bits) ===================== */
  // The hero panel tilts toward the cursor on a damped spring, lifts a touch
  // and catches a moving glare.
  (function tilt() {
    const wrap = panelWrap;
    const card = $(".hero-panel");
    if (!wrap || !card) return;
    const glare = document.createElement("span");
    glare.className = "hp-glare";
    glare.setAttribute("aria-hidden", "true");
    card.appendChild(glare);

    const AMP = 7, SCALE = 1.015, SMOOTH = 0.6, GLARE = 0.35;
    const omega = 20 * Math.pow(0.2, SMOOTH);
    const zeta = 1 - 0.3 * SMOOTH;
    const s = { rx: 0, vrx: 0, ry: 0, vry: 0, lift: 0, vlift: 0 };
    const p = { nx: 0, ny: 0, inside: false };
    let raf = 0, last = 0;

    const step = (key, target, om, ze, dt) => {
      const v = "v" + key;
      const n = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / n;
      for (let i = 0; i < n; i++) {
        s[v] += (om * om * (target - s[key]) - 2 * ze * om * s[v]) * h;
        s[key] += s[v] * h;
      }
      const settled = Math.abs(target - s[key]) < 0.001 && Math.abs(s[v]) < 0.01;
      if (settled) { s[key] = target; s[v] = 0; }
      return !settled;
    };

    const frame = now => {
      raf = 0;
      const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05);
      last = now;
      let busy = step("rx", p.inside ? -p.ny * AMP : 0, omega, zeta, dt);
      busy = step("ry", p.inside ? p.nx * AMP : 0, omega, zeta, dt) || busy;
      busy = step("lift", p.inside ? 1 : 0, omega, Math.max(zeta, 0.85), dt) || busy;
      const scale = 1 + (SCALE - 1) * s.lift;
      card.style.transform = (s.rx || s.ry || s.lift)
        ? `rotateX(${s.rx.toFixed(3)}deg) rotateY(${s.ry.toFixed(3)}deg) scale(${scale.toFixed(4)})`
        : "";
      const reachDeg = Math.max(AMP, 1);
      card.style.setProperty("--gx", `${(50 + (s.ry / reachDeg) * 46).toFixed(2)}%`);
      card.style.setProperty("--gy", `${(50 - (s.rx / reachDeg) * 46).toFixed(2)}%`);
      const energy = Math.min(1, Math.hypot(s.rx, s.ry) / reachDeg);
      card.style.setProperty("--glare", (GLARE * Math.max(s.lift, energy)).toFixed(3));
      if (busy) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    card.addEventListener("pointermove", ev => {
      if (ev.pointerType !== "mouse") return;
      const r = card.getBoundingClientRect();
      p.inside = true;
      p.nx = Math.max(-1, Math.min(1, (ev.clientX - r.left - r.width / 2) / (r.width / 2)));
      p.ny = Math.max(-1, Math.min(1, (ev.clientY - r.top - r.height / 2) / (r.height / 2)));
      wake();
    });
    card.addEventListener("pointerleave", () => { p.inside = false; wake(); });
  })();
})();
