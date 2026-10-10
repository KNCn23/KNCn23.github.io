/* Motion layer — boot sequence, smooth wheel scrolling, crosshair cursor,
   count-up figures, line-drawn reveals and live project diagrams.
   No dependencies. Everything here is decoration: with JavaScript off or
   "reduce motion" on, the page renders complete and still. */

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
    ["render datasheet", "▮"]
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
      // the hero starts rising while the sheet lifts away
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
  // Each word rises out of its own mask. Built with DOM nodes so the
  // translated string is never parsed as HTML.
  function splitHeadline() {
    const el = document.getElementById("hero-title");
    if (!el) return;
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach((w, i) => {
      const mask = document.createElement("span");
      const inner = document.createElement("span");
      mask.className = "w";
      inner.style.setProperty("--i", i);
      inner.textContent = w;
      mask.appendChild(inner);
      el.appendChild(mask);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
  }

  function heroIn() {
    root.classList.add("hero-in");
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

  /* ===================== Crosshair cursor ===================== */
  // Oscilloscope-style cursor: two hairlines and a live X/Y readout in page
  // coordinates. Lines turn to the signal colour over anything clickable.
  function crosshair() {
    const wrap = document.createElement("div");
    wrap.className = "xhair";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = '<div class="xh-v"></div><div class="xh-h"></div><div class="xh-read"></div>';
    document.body.appendChild(wrap);
    root.classList.add("has-xhair");

    const v = wrap.children[0];
    const h = wrap.children[1];
    const read = wrap.children[2];
    let x = -100, y = -100, queued = false;

    const pad = n => String(Math.max(0, Math.round(n))).padStart(4, "0");

    function draw() {
      queued = false;
      v.style.transform = `translate3d(${x}px,0,0)`;
      h.style.transform = `translate3d(0,${y}px,0)`;
      const flipX = x > window.innerWidth - 150;
      const flipY = y > window.innerHeight - 40;
      read.style.transform = `translate3d(${flipX ? x - 132 : x + 14}px,${flipY ? y - 28 : y + 14}px,0)`;
      read.textContent = `X ${pad(x)}  Y ${pad(y + window.scrollY)}`;
    }
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(draw); } };

    window.addEventListener("pointermove", e => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      wrap.classList.add("is-on");
      wrap.classList.toggle("on-link", !!e.target.closest("a, button"));
      queue();
    }, { passive: true });
    window.addEventListener("scroll", queue, { passive: true });
    document.addEventListener("pointerleave", () => wrap.classList.remove("is-on"));
    window.addEventListener("blur", () => wrap.classList.remove("is-on"));
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
  if (finePointer) crosshair();
  if (!motionOn) return;

  indexStaggers();
  splitHeadline();
  setupCounts();
  setupLiveDiagrams();
  if (finePointer) smoothWheel();

  // a language switch rewrites the headline as plain text; split it again
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
