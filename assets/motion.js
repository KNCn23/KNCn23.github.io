/* Motion layer — boot sequence, cinematic light ribbons behind the hero,
   smooth wheel scrolling, cursor-following card glow, count-up figures and
   live project diagrams. No dependencies. Everything here is decoration:
   with JavaScript off or "reduce motion" on, the page renders complete and
   still (the ribbons are drawn once, as a still frame). */

(function () {
  const root = document.documentElement;
  const motionOn = root.classList.contains("motion");
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ===================== Boot sequence ===================== */
  const BOOT_LOG = [
    ["power-on self test", "OK"],
    ["clock tree · caches", "OK"],
    ["mount /projects", "38"],
    ["link github.com/KNCn23", "UP"],
    ["render portfolio", "▮"]
  ];

  function runBoot(done) {
    const boot = document.getElementById("boot");
    const log = document.getElementById("boot-log");
    if (!boot || !log) return done();

    let finished = false;
    const timers = [];
    const finish = () => {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      try { sessionStorage.setItem("ako-boot", "1"); } catch (e) { /* private mode */ }
      boot.classList.add("is-leaving");
      setTimeout(done, 260);
      setTimeout(() => root.classList.remove("booting"), 900);
      removeEventListener("keydown", finish);
      boot.removeEventListener("click", finish);
    };

    BOOT_LOG.forEach(([label, status], i) => {
      timers.push(setTimeout(() => {
        const li = document.createElement("li");
        const k = document.createElement("span");
        const v = document.createElement("b");
        k.textContent = "> " + label + " ";
        v.textContent = status;
        li.append(k, v);
        log.appendChild(li);
      }, 140 + i * 170));
    });
    timers.push(setTimeout(finish, 140 + BOOT_LOG.length * 170 + 380));

    addEventListener("keydown", finish);
    boot.addEventListener("click", finish);
  }

  /* ===================== Hero headline ===================== */
  // Each word rises out of its own mask. Words inside <em> keep their italic
  // serif accent. Built from text content so the string is never parsed as HTML.
  function splitHeadline() {
    const el = document.getElementById("hero-title");
    if (!el) return;
    const frag = document.createDocumentFragment();
    let i = 0;
    const addWords = (text, em) => {
      text.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          if (frag.lastChild) frag.appendChild(document.createTextNode(" "));
          return;
        }
        const mask = document.createElement("span");
        const inner = document.createElement(em ? "em" : "span");
        mask.className = "w";
        inner.style.setProperty("--i", i++);
        inner.textContent = part;
        mask.appendChild(inner);
        frag.appendChild(mask);
      });
    };
    Array.from(el.childNodes).forEach(n => {
      if (n.nodeType === Node.TEXT_NODE) addWords(n.textContent, false);
      else if (n.nodeType === Node.ELEMENT_NODE) addWords(n.textContent, n.tagName === "EM");
    });
    el.replaceChildren(frag);
  }

  function heroIn() {
    root.classList.add("hero-in");
  }

  /* ===================== Light ribbons ===================== */
  // A bundle of luminous strands on a fixed layer behind the whole page.
  // In the hero it is sharp: it sweeps lower-left to upper-right and pinches
  // into a bright knot right of centre. Scrolling down, the bundle stays with
  // the viewer but drifts out of focus — strands widen, soften and spread into
  // an aurora-like glow that keeps wandering and turning as you read. Being
  // soft rather than sharp is what keeps the text readable over it.
  function ribbons(animate) {
    const cv = document.getElementById("ribbons");
    if (!cv || !cv.getContext) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const small = window.matchMedia("(max-width: 860px)").matches;
    const N = small ? 26 : 44;
    const STEPS_SHARP = small ? 48 : 72;
    const STEPS_SOFT = small ? 28 : 40;
    // seeded so the still frame (reduced motion) is the same on every visit
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const strands = Array.from({ length: N }, (_, i) => ({
      k: i / (N - 1),
      phase: rand() * Math.PI * 2,
      freq: 2.2 + rand() * 2.4,
      amp: 0.018 + rand() * 0.05,
      speed: 0.12 + rand() * 0.22,
      width: 0.5 + rand() * 1.1,
      tone: rand()
    }));

    const clamp01 = x => Math.max(0, Math.min(1, x));
    const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
    const scrollUnits = () => window.scrollY / Math.max(1, window.innerHeight);
    // 0 = sharp hero bundle, 1 = fully defocused glow
    const focusLoss = sc => smooth(0.06, 0.8, sc);

    // Two render resolutions: full while sharp, half once soft — a blurred
    // glow needs no detail, and the browser's upscale adds to the softness.
    const sharpScale = Math.min(small ? 1 : 1.6, window.devicePixelRatio || 1);
    const softScale = small ? 0.5 : 0.55;
    let scale = 0, w = 0, h = 0;
    function size(next) {
      scale = next || scale || sharpScale;
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = Math.max(1, Math.round(w * scale));
      cv.height = Math.max(1, Math.round(h * scale));
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
    }
    function pickScale(b) {
      // hysteresis so the switch never flickers around the threshold
      if (scale === sharpScale && b > 0.42) size(softScale);
      else if (scale === softScale && b < 0.32) size(sharpScale);
    }

    // past the hero the strands ease back a little behind the text column
    let lastMid = -1;
    function setMask(b) {
      const mid = 1 - 0.4 * b;
      if (Math.abs(mid - lastMid) > 0.005) {
        cv.style.setProperty("--mid", mid.toFixed(3));
        lastMid = mid;
      }
    }

    const baseX = small ? 0.66 : 0.6;
    const baseY = small ? 0.42 : 0.52;

    // t: seconds; sc: scroll in viewport heights (drives the wandering);
    // b: focus loss 0..1
    function draw(t, sc, b) {
      const kx = baseX - 0.3 * b + 0.1 * Math.sin(sc * 0.7) * b;
      const ky = baseY - 0.06 * b + 0.12 * Math.sin(sc * 0.9 + 1) * b;
      const slope = 0.55 * (1 - b) + b * 0.9 * Math.sin(sc * 0.45 + 0.6);
      const roll = sc * 0.9;
      const widen = 1 + 1.1 * b;
      const steps = b > 0.42 ? STEPS_SOFT : STEPS_SHARP;

      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = 1 - 0.38 * b;
      ctx.globalCompositeOperation = "lighter";

      const R = Math.max(w, h) * (0.36 + 0.22 * b);
      const g = ctx.createRadialGradient(w * kx, h * ky, 0, w * kx, h * ky, R);
      g.addColorStop(0, "rgba(200,241,53,0.16)");
      g.addColorStop(0.35, "rgba(160,220,60,0.05)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      for (const st of strands) {
        const side = st.k - 0.5;
        ctx.beginPath();
        for (let j = 0; j <= steps; j++) {
          const u = -0.08 + (j / steps) * 1.16;
          const d = Math.abs(u - kx);
          const base = ky + (kx - u) * slope + Math.sin((u - kx) * 2.4) * 0.06;
          const spread = side * (0.03 + Math.pow(d, 1.35) * 1.15) * widen;
          const wave = Math.sin(u * st.freq * Math.PI + t * st.speed + st.phase + roll) * st.amp * (0.25 + d * 2.2);
          const x = u * w;
          const y = (base + spread + wave) * h;
          if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        const core = 1 - Math.abs(side) * 2; // 1 at the middle of the bundle
        const a = (0.08 + core * 0.32) * (1 - 0.8 * b);
        // out of focus, part of the bundle drifts toward teal, as in the reference
        const r = 150 + st.tone * 80 - 70 * b * st.tone;
        const gr = 220 + st.tone * 30;
        const bl = 40 + st.tone * 70 + 90 * b * st.tone;
        ctx.strokeStyle = `rgba(${r | 0},${gr | 0},${bl | 0},${a.toFixed(3)})`;
        ctx.lineWidth = st.width * (1 + 18 * b);
        ctx.lineCap = "round";
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }

    size(sharpScale);

    if (!animate) {
      // Reduced motion: nothing moves. Scrolling only trades the sharp
      // bundle for the soft glow (a focus change, redrawn on demand).
      const still = () => {
        const b = focusLoss(scrollUnits());
        pickScale(b);
        draw(8, 0, b);
        setMask(b);
      };
      still();
      cv.classList.add("is-on");
      let queued = false;
      window.addEventListener("scroll", () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; still(); });
      }, { passive: true });
      let resizeTimer = 0;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { size(); still(); }, 120);
      }, { passive: true });
      return;
    }

    window.addEventListener("resize", () => size(), { passive: true });

    // scroll position is eased, so a flick of the wheel turns into a glide
    let target = scrollUnits();
    let current = target;
    window.addEventListener("scroll", () => { target = scrollUnits(); }, { passive: true });

    let raf = 0;
    let last = performance.now();
    const t0 = last;
    const loop = now => {
      const dt = Math.min(64, now - last);
      last = now;
      current += (target - current) * (1 - Math.pow(1 - 0.07, dt / 16.67));
      const b = focusLoss(current);
      pickScale(b);
      draw((now - t0) / 1000, current, b);
      setMask(b);
      raf = requestAnimationFrame(loop);
    };
    const run = () => { if (!raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : run()));

    const b0 = focusLoss(current);
    pickScale(b0);
    draw(0, current, b0);
    setMask(b0);
    cv.classList.add("is-on");
    run();
  }

  /* ===================== Smooth wheel scrolling ===================== */
  // Lenis-style: the wheel sets a target, a frame loop eases toward it.
  // Keyboard, scrollbar and touch scrolling stay native.
  function smoothWheel() {
    let target = window.scrollY;
    let current = window.scrollY;
    let running = false;
    let last = 0;

    const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
    const clamp = y => Math.max(0, Math.min(maxY(), y));

    // let nested scrollers (e.g. an open mobile menu) keep their own wheel
    function nestedCanScroll(el, dy) {
      for (; el && el !== document.body && el !== root; el = el.parentElement) {
        const oy = getComputedStyle(el).overflowY;
        if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight) {
          if (dy < 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight) return true;
        }
      }
      return false;
    }

    function start() {
      if (running) return;
      running = true;
      last = performance.now();
      root.style.scrollBehavior = "auto"; // our loop does the easing
      requestAnimationFrame(tick);
    }

    function tick(now) {
      const dt = Math.min(64, now - last);
      last = now;
      const k = 1 - Math.pow(1 - 0.11, dt / 16.67); // frame-rate independent
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.4) {
        current = target;
        running = false;
      }
      window.scrollTo(0, current);
      if (running) requestAnimationFrame(tick);
      else root.style.scrollBehavior = "";
    }

    window.addEventListener("wheel", e => {
      if (e.ctrlKey || e.defaultPrevented) return;          // pinch-zoom
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;   // horizontal gestures
      if (nestedCanScroll(e.target, e.deltaY)) return;
      e.preventDefault();
      if (!running) target = current = window.scrollY;
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1;
      target = clamp(target + e.deltaY * unit);
      start();
    }, { passive: false });

    // anything that moved the page without us (keys, scrollbar) resets the target
    window.addEventListener("scroll", () => {
      if (!running) target = current = window.scrollY;
    }, { passive: true });

    // in-page links glide with the same easing instead of fighting the loop
    document.addEventListener("click", e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const id = a.getAttribute("href").slice(1);
      const dest = id ? document.getElementById(id) : null;
      if (!dest && id !== "top") return;
      e.preventDefault();
      const navH = parseFloat(getComputedStyle(root).getPropertyValue("--nav-h")) || 64;
      if (!running) target = current = window.scrollY;
      target = clamp(id === "top" || !dest ? 0 : dest.getBoundingClientRect().top + window.scrollY - navH - 16);
      history.pushState(null, "", "#" + id);
      start();
    });
  }

  /* ===================== Card glow ===================== */
  // Cards light up under the cursor: the pointer position feeds a radial
  // gradient in CSS (--mx / --my).
  function cardGlow() {
    document.addEventListener("pointermove", e => {
      if (e.pointerType !== "mouse") return;
      const card = e.target.closest(".f-card, .skill-group, .stat-card, .hero-panel, .contact-panel");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  }

  /* ===================== Count-up figures ===================== */
  // The target is re-read every frame: the live GitHub fetch may update
  // the repo count while the animation is still running.
  function countUp(el) {
    const dec = parseInt(el.dataset.dec || "0", 10);
    const from = parseFloat(el.dataset.from || "0");
    const dur = 1500;
    const t0 = performance.now();
    const ease = t => 1 - Math.pow(2, -10 * t); // expo out
    function frame(now) {
      const t = Math.min(1, (now - t0) / dur);
      const to = parseFloat(el.dataset.to);
      const val = from + (to - from) * (t === 1 ? 1 : ease(t));
      el.textContent = val.toFixed(dec);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function setupCounts() {
    const counts = document.querySelectorAll(".count[data-to]");
    if (!("IntersectionObserver" in window)) return;
    // start from the opening value so the first visible frame is the count, not the result
    counts.forEach(el => { el.textContent = parseFloat(el.dataset.from || "0").toFixed(parseInt(el.dataset.dec || "0", 10)); });
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        obs.unobserve(e.target);
        countUp(e.target);
      });
    }, { threshold: 0.6 });
    counts.forEach(el => obs.observe(el));
  }

  /* ===================== Live project diagrams ===================== */
  // Diagram loops only run while their card is on screen. Cards are
  // re-rendered on language change, so new ones are picked up as they appear.
  function setupLiveDiagrams() {
    const grid = document.getElementById("featured-grid");
    if (!grid || !("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => e.target.classList.toggle("is-live", e.isIntersecting));
    }, { threshold: 0.25 });
    const watch = () => grid.querySelectorAll(".f-card").forEach(c => obs.observe(c));
    watch();
    new MutationObserver(watch).observe(grid, { childList: true });
  }

  /* ===================== Stagger indices for static lists ===================== */
  function indexStaggers() {
    [".timeline .t-item", ".stats-cards .stat-card", ".skills-grid .skill-group", ".about-list li"]
      .forEach(sel => document.querySelectorAll(sel).forEach((el, i) => el.style.setProperty("--i", i)));
  }

  /* ===================== Start ===================== */
  ribbons(motionOn);
  if (finePointer) cardGlow();

  if (!motionOn) {
    // the hero graph's pulses are SMIL; hold them still as well
    document.querySelectorAll("svg.hero-graph").forEach(svg => svg.pauseAnimations && svg.pauseAnimations());
    return;
  }

  indexStaggers();
  splitHeadline();
  setupCounts();
  setupLiveDiagrams();
  if (finePointer) smoothWheel();

  // a language switch rewrites the headline; split it again
  const title = document.getElementById("hero-title");
  if (title) {
    new MutationObserver(() => {
      if (!title.querySelector(".w")) splitHeadline();
    }).observe(title, { childList: true });
  }

  if (root.classList.contains("booting")) runBoot(heroIn);
  else requestAnimationFrame(heroIn);

  // safety net: never leave the headline hidden
  setTimeout(heroIn, 4000);
})();
