// Limiar landing page: language, GitHub stats, interactive app replica, scroll reveal.
(() => {
  "use strict";

  const STORAGE_KEY = "limiar.lang";
  const dict = window.LIMIAR_I18N || {};
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ───────── i18n ─────────
  const storage = {
    get() { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } },
    set(v) { try { localStorage.setItem(STORAGE_KEY, v); } catch { /* private mode */ } },
  };

  function initialLang() {
    const saved = storage.get();
    if (saved && dict[saved]) return saved;
    return (navigator.language || "en").toLowerCase().startsWith("pt") ? "pt-BR" : "en";
  }

  let lang = initialLang();
  const t = (key, vars = {}) =>
    (dict[lang]?.[key] ?? dict.en?.[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    const toggle = document.querySelector("[data-lang-toggle]");
    if (toggle) {
      toggle.textContent = lang === "en" ? "PT" : "EN";
      toggle.setAttribute("aria-label", t("lang.switch"));
    }
    renderVersion();
    replica?.render();
  }

  document.querySelector("[data-lang-toggle]")?.addEventListener("click", () => {
    lang = lang === "en" ? "pt-BR" : "en";
    storage.set(lang);
    applyLang();
  });

  // ───────── GitHub stats (stars, latest release) ─────────
  let release = null;
  const formatStars = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

  function renderVersion() {
    const el = document.querySelector("[data-version]");
    if (el) el.textContent = release?.version ? t("meta.version", { v: release.version }) : t("meta.free");
  }

  async function loadGitHub() {
    try {
      const res = await fetch("/api/github", { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (Number.isFinite(data.stars) && data.stars > 0) {
        const text = formatStars(data.stars);
        document.querySelectorAll("[data-stars]").forEach((el) => { el.textContent = text; el.hidden = false; });
        document.querySelectorAll("[data-stars-inline]").forEach((el) => { el.textContent = `★ ${text}`; el.hidden = false; });
      }
      if (data.version) {
        release = data;
        renderVersion();
        if (data.dmgUrl) document.querySelectorAll("[data-download]").forEach((a) => { a.href = data.dmgUrl; });
      }
    } catch {
      // Offline or API limit: links still point to GitHub releases; counts stay hidden.
    }
  }

  // ───────── Interactive replica ─────────
  const replica = (() => {
    const stage = document.querySelector("[data-stage]");
    const range = document.querySelector("[data-range]");
    if (!stage || !range) return null;

    const MIN = 20, MAX = 100, LIMIT_MIN = 50;
    const state = { soc: 80, limit: 80, resume: 75, charging: false };
    const $ = (sel) => stage.querySelector(sel);
    const el = {
      pct: $("[data-pct]"), status: $("[data-status]"), dot: $("[data-dot]"), led: $("[data-led]"),
      level: $("[data-level]"), band: $("[data-band]"), limitLabel: $("[data-limit-label]"),
      resumeLabel: $("[data-resume-label]"), mbFill: $("[data-mb-fill]"), mbNum: $("[data-mb-num]"),
      mbBattery: $("[data-mb-battery]"),
      thumbs: { limit: $('[data-thumb="limit"]'), resume: $('[data-thumb="resume"]') },
    };
    const pos = (v) => `${((v - MIN) / (MAX - MIN)) * 100}%`;
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

    function render() {
      const green = "var(--led-green)", orange = "var(--led-orange)";
      const color = state.charging ? orange : green;
      el.pct.textContent = state.soc;
      el.status.textContent = state.charging
        ? t("replica.charging", { n: state.limit })
        : t("replica.paused", { n: state.resume });
      el.dot.style.background = color;
      el.led.style.setProperty("--led", color);
      el.mbBattery.style.setProperty("--fill", color);
      el.mbFill.style.width = `calc(${state.soc}% - 3px)`;
      el.mbNum.textContent = state.soc;
      el.level.style.width = pos(Math.max(MIN, state.soc));
      el.band.style.left = pos(state.resume);
      el.band.style.width = `calc(${pos(state.limit)} - ${pos(state.resume)})`;
      el.limitLabel.textContent = state.limit;
      el.resumeLabel.textContent = state.resume;
      for (const [name, thumb] of Object.entries(el.thumbs)) {
        const value = state[name];
        thumb.style.left = pos(value);
        thumb.setAttribute("aria-valuenow", value);
        thumb.setAttribute("aria-valuetext", `${value}%`);
      }
      el.thumbs.resume.setAttribute("aria-valuemax", state.limit - 1);
      el.thumbs.limit.setAttribute("aria-valuemin", Math.max(LIMIT_MIN, state.resume + 1));
    }

    function set(name, value) {
      if (name === "limit") state.limit = clamp(value, Math.max(LIMIT_MIN, state.resume + 1), MAX);
      else state.resume = clamp(value, MIN, state.limit - 1);
      // Same rule as the app: at/above the limit → hold; at/below resume → charge.
      if (state.soc >= state.limit) state.charging = false;
      else if (state.soc <= state.resume) state.charging = true;
      render();
    }

    // Pointer dragging (one listener set per drag, removed on release).
    function startDrag(name, event) {
      event.preventDefault();
      const thumb = el.thumbs[name];
      thumb.setPointerCapture(event.pointerId);
      const rect = range.getBoundingClientRect();
      const move = (e) => {
        const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
        set(name, Math.round(MIN + ratio * (MAX - MIN)));
      };
      const end = () => {
        thumb.removeEventListener("pointermove", move);
        thumb.removeEventListener("pointerup", end);
        thumb.removeEventListener("pointercancel", end);
      };
      thumb.addEventListener("pointermove", move);
      thumb.addEventListener("pointerup", end);
      thumb.addEventListener("pointercancel", end);
      move(event);
    }

    for (const [name, thumb] of Object.entries(el.thumbs)) {
      thumb.addEventListener("pointerdown", (e) => startDrag(name, e));
      thumb.addEventListener("keydown", (e) => {
        const step = e.shiftKey ? 5 : 1;
        const map = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: 10, PageDown: -10 };
        if (e.key in map) { e.preventDefault(); set(name, state[name] + map[e.key]); }
        if (e.key === "Home") { e.preventDefault(); set(name, MIN); }
        if (e.key === "End") { e.preventDefault(); set(name, MAX); }
      });
    }

    // Simulated battery: charge to the limit (orange), hold and drift down (green), repeat.
    let timer = null;
    function tick() {
      if (state.charging) {
        state.soc = Math.min(100, state.soc + 1);
        if (state.soc >= state.limit) state.charging = false;
      } else {
        state.soc = Math.max(MIN, state.soc - 1);
        if (state.soc <= state.resume) state.charging = true;
      }
      render();
    }
    const play = () => { if (!timer && !reduceMotion) timer = window.setInterval(tick, 700); };
    const pause = () => { window.clearInterval(timer); timer = null; };

    // Only animate while visible and the tab is in the foreground.
    let onScreen = false;
    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      onScreen && !document.hidden ? play() : pause();
    }, { threshold: 0.2 });
    visibility.observe(stage);
    document.addEventListener("visibilitychange", () => (document.hidden || !onScreen ? pause() : play()));

    render();
    return { render };
  })();

  // ───────── Threshold line ─────────
  // The lime line continues the one drawn inside the app icon (41% from the icon's top).
  const ICON_LINE = 0.41;
  function alignThreshold() {
    const hero = document.querySelector(".hero");
    const icon = document.querySelector(".hero__icon");
    const line = document.querySelector(".threshold");
    if (!hero || !icon || !line) return;
    const y = icon.offsetTop + icon.offsetHeight * ICON_LINE;
    line.style.setProperty("--threshold-y", `${y}px`);
  }
  window.addEventListener("resize", alignThreshold, { passive: true });
  if (document.querySelector(".hero__icon")?.complete) alignThreshold();
  else document.querySelector(".hero__icon")?.addEventListener("load", alignThreshold, { once: true });
  alignThreshold();

  // ───────── Scroll reveal ─────────
  const revealables = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach((n) => n.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target); // one-shot: nothing left to observe afterwards
        }
      }
    }, { rootMargin: "0px 0px -10% 0px" });
    revealables.forEach((n) => io.observe(n));
  }

  applyLang();
  loadGitHub();
})();
