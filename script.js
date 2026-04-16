/* ══════════════════════════════════════════════════════
   BRICKS ON TOP — script.js
   - sticky nav
   - mobile burger
   - scroll-reveal (IntersectionObserver)
   - animated count-ups
   - portfolio rendering + filter tabs
   - investors timeline
   - voices / testimonials
   ══════════════════════════════════════════════════════ */

(() => {
  "use strict";

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const prefersReduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── year in footer ───────────────────────────────── */
  const yr = $("#year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ── sticky nav background on scroll ──────────────── */
  const nav = $("#nav");
  let navScrolled = false;
  let navTicking = false;
  const applyNav = () => {
    const next = scrollY > 24;
    if (next !== navScrolled) {
      navScrolled = next;
      nav.classList.toggle("is-scrolled", next);
    }
    navTicking = false;
  };
  const onScroll = () => {
    if (navTicking) return;
    navTicking = true;
    requestAnimationFrame(applyNav);
  };
  addEventListener("scroll", onScroll, { passive: true });
  applyNav();

  /* ── mobile burger ────────────────────────────────── */
  const burger = $(".burger");
  const links  = $("#nav-links");
  if (burger && links) {
    burger.addEventListener("click", () => {
      const open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      links.classList.toggle("is-open", !open);
    });
    links.addEventListener("click", e => {
      if (e.target.tagName === "A") {
        burger.setAttribute("aria-expanded", "false");
        links.classList.remove("is-open");
      }
    });
  }

  /* ── active section in nav ────────────────────────── */
  const sections = $$("main section[id]");
  const navLinks = $$(".nav__links a");
  if (sections.length && "IntersectionObserver" in window) {
    const navObs = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          const id = en.target.id;
          navLinks.forEach(a => a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`));
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(s => navObs.observe(s));
  }

  /* ── scroll reveal ────────────────────────────────── */
  if ("IntersectionObserver" in window && !prefersReduce) {
    const rev = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          rev.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

    const revealables = [
      ".section__head", ".thesis__grid article", ".numbers__grid li",
      ".process__list li", ".voices__grid li", ".faq__list details",
      ".hero__copy", ".hero__panel", ".enquire__card", ".card", ".timeline li"
    ];
    revealables.forEach(sel => $$(sel).forEach(el => {
      el.classList.add("reveal");
      rev.observe(el);
    }));
  }

  /* ── animated count-ups ───────────────────────────── */
  const countEls = $$(".num");
  if ("IntersectionObserver" in window) {
    const countObs = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          animateCount(en.target);
          countObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.4 });
    countEls.forEach(el => countObs.observe(el));
  } else {
    countEls.forEach(animateCount);
  }

  function animateCount(el) {
    const target   = parseFloat(el.dataset.count || "0");
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix   = el.dataset.suffix ?? "";
    const prefix   = el.dataset.prefix ?? (el.textContent.trim().startsWith("₹") ? "₹" : "");
    const dur      = prefersReduce ? 0 : 1400;
    const start    = performance.now();

    const fmt = (n) => {
      const v = decimals ? n.toFixed(decimals) : Math.round(n).toLocaleString("en-IN");
      return `${prefix}${v}${suffix}`;
    };

    if (!dur) { el.textContent = fmt(target); return; }

    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = fmt(target * easeOut(p));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ══════════════════════════════════════════════════
     DATA LOADING
     ══════════════════════════════════════════════════ */
  Promise.all([
    fetch("data/projects.json").then(r => r.json()).catch(() => ({ projects: [], testimonials: [] })),
    fetch("data/investors.json").then(r => r.json()).catch(() => null)
  ]).then(([proj, inv]) => {
    renderPortfolio(proj.projects || []);
    renderVoices(proj.testimonials || []);
    if (inv) renderTimeline(inv);
  });

  /* ── portfolio ────────────────────────────────────── */
  const grid = $("#portfolio-grid");
  const tabs = $$(".tab");
  let allProjects = [];
  let currentFilter = "current";

  function renderPortfolio(projects) {
    allProjects = projects;
    paint();
  }

  function paint() {
    if (!grid) return;
    const list = allProjects.filter(p =>
      currentFilter === "all" ? true : p.status === currentFilter
    );
    grid.innerHTML = list.map(card).join("");

    /* re-register reveal for new cards */
    if ("IntersectionObserver" in window && !prefersReduce) {
      const rev = new IntersectionObserver((entries) => {
        entries.forEach(en => {
          if (en.isIntersecting) {
            en.target.classList.add("is-visible");
            rev.unobserve(en.target);
          }
        });
      }, { threshold: 0.12 });
      $$(".card", grid).forEach(c => { c.classList.add("reveal"); rev.observe(c); });
    }
  }

  /* build local image paths from `images` (count) + `default-image` (1-based index) */
  function projectImages(p) {
    const n = typeof p.images === "number" ? p.images
             : Array.isArray(p.images) ? p.images.length : 0;
    const arr = [];
    for (let i = 1; i <= n; i++) {
      arr.push(`assets/images/${p.id}/${i}.jpg`);
    }
    return arr;
  }
  function projectCover(p) {
    const arr = projectImages(p);
    if (!arr.length) return "";
    const idx = Math.max(1, Math.min(arr.length, parseInt(p["default-image"] || 1, 10))) - 1;
    return arr[idx];
  }

  function card(p) {
    const cover = projectCover(p);
    const badge = p.status === "current" ? "Live · Open" : "Exited";
    const badgeCls = p.status === "current" ? "card__badge--current" : "";
    return `
      <article class="card" data-id="${esc(p.id)}" tabindex="0" role="button"
               aria-label="View ${esc(p.name)} details">
        <div class="card__cover">
          <img src="${esc(cover)}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="800" height="600" />
          <span class="card__badge ${badgeCls}">${badge}</span>
        </div>
        <div class="card__body">
          <span class="card__type">${esc(p.type || "")}</span>
          <h3 class="card__name">${esc(p.name || "")}</h3>
          <p class="card__loc">${esc(p.location || "")}</p>
          <dl class="card__row">
            <div><dt>Ticket</dt><dd class="card__price">${esc(p.price || "—")}</dd></div>
            <div><dt>${p.status === "current" ? "Exit window" : "Held"}</dt><dd>${esc(p.possession || "—")}</dd></div>
            <div><dt>Size</dt><dd>${esc(p.area || "—")}</dd></div>
          </dl>
          <span class="card__rera">Partner developer · ${esc(p.developer || "Confidential")}</span>
          <span class="card__more">View details <span aria-hidden="true">→</span></span>
        </div>
      </article>
    `;
  }

  tabs.forEach(t => t.addEventListener("click", () => {
    tabs.forEach(x => { x.classList.remove("is-active"); x.setAttribute("aria-selected","false"); });
    t.classList.add("is-active");
    t.setAttribute("aria-selected","true");
    currentFilter = t.dataset.filter;
    paint();
  }));

  /* ── card click → open detail modal ──────────────── */
  if (grid) {
    grid.addEventListener("click", e => {
      const c = e.target.closest(".card");
      if (c) openProject(c.dataset.id);
    });
    grid.addEventListener("keydown", e => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const c = e.target.closest(".card");
      if (c) { e.preventDefault(); openProject(c.dataset.id); }
    });
  }

  /* ══════════════════════════════════════════════════
     PROJECT DETAIL MODAL + SLIDER
     ══════════════════════════════════════════════════ */
  const modal     = $("#project-modal");
  const modalBody = $("#modal-body");
  let lastFocus   = null;
  let slider      = null;

  function openProject(id) {
    const p = allProjects.find(x => x.id === id);
    if (!p || !modal) return;
    lastFocus = document.activeElement;
    modalBody.innerHTML = renderDetail(p);
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add("is-open"));
    document.body.style.overflow = "hidden";
    initSlider(projectImages(p));
    $(".modal__panel", modal).focus({ preventScroll: true });
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.classList.remove("is-open");
    setTimeout(() => {
      modal.hidden = true;
      modalBody.innerHTML = "";
      document.body.style.overflow = "";
      if (slider) { slider.destroy(); slider = null; }
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }, 220);
  }

  if (modal) {
    modal.addEventListener("click", e => {
      if (e.target.closest("[data-close]")) closeModal();
    });
    document.addEventListener("keydown", e => {
      if (modal.hidden) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft"  && slider) slider.go(slider.i - 1);
      if (e.key === "ArrowRight" && slider) slider.go(slider.i + 1);
    });
  }

  function renderDetail(p) {
    const status = p.status === "current"
      ? `<span class="modal__status modal__status--live">Live · Cohort open</span>`
      : `<span class="modal__status">Exited</span>`;

    /* Build slider images via for-loop. Default image first; rest in order. */
    const all = projectImages(p);
    const defIdx = Math.max(1, Math.min(all.length || 1, parseInt(p["default-image"] || 1, 10))) - 1;
    const ordered = all.length
      ? [all[defIdx], ...all.filter((_, i) => i !== defIdx)]
      : [""];

    let images = "";
    for (let i = 0; i < ordered.length; i++) {
      images += `
        <div class="slider__slide" data-i="${i}" ${i === 0 ? "" : 'aria-hidden="true"'}>
          <img src="${esc(ordered[i])}" alt="${esc(p.name)} — image ${i + 1}"
               loading="${i === 0 ? "eager" : "lazy"}" decoding="async"
               width="1600" height="1200" />
        </div>`;
    }

    let dots = "";
    for (let i = 0; i < ordered.length; i++) {
      dots += `<button type="button" class="slider__dot${i === 0 ? " is-active" : ""}"
                       data-go="${i}" aria-label="Image ${i + 1}"></button>`;
    }

    const facts = [
      ["Developer",   p.developer],
      ["Location",    p.location],
      ["Type",        p.type],
      ["Ticket size", p.price],
      ["Total units", p.units],
      ["Project size", p.area],
      [p.status === "current" ? "Exit window" : "Held",  p.possession],
      ["RERA",        p.rera]
    ].filter(([,v]) => v).map(([k,v]) => `
      <div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>
    `).join("");

    const highlights = (p.highlights || []).map(h => `<li>${esc(h)}</li>`).join("");
    const specs = p.specs ? Object.entries(p.specs).map(([k,v]) => `
      <div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>
    `).join("") : "";

    return `
      <div class="detail">
        <div class="detail__media">
          <div class="slider" id="slider">
            <div class="slider__track">${images}</div>
            ${ordered.length > 1 ? `
              <button class="slider__nav slider__nav--prev" type="button" aria-label="Previous image">
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <button class="slider__nav slider__nav--next" type="button" aria-label="Next image">
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <div class="slider__dots" role="tablist">${dots}</div>
              <span class="slider__count mono"><span id="slider-i">1</span> / ${ordered.length}</span>
            ` : ""}
          </div>
        </div>

        <div class="detail__copy">
          <header class="detail__head">
            ${status}
            <span class="detail__type mono">${esc(p.type || "")}</span>
            <h2 id="modal-title" class="detail__title">${esc(p.name)}</h2>
            ${p.tagline ? `<p class="detail__tag">${esc(p.tagline)}</p>` : ""}
            ${p.location ? `<p class="detail__loc">${esc(p.location)}</p>` : ""}
          </header>

          ${p.description ? `<p class="detail__desc">${esc(p.description)}</p>` : ""}

          <dl class="detail__facts">${facts}</dl>

          ${highlights ? `
            <section class="detail__block">
              <h3>Highlights</h3>
              <ul class="detail__list">${highlights}</ul>
            </section>
          ` : ""}

          ${specs ? `
            <section class="detail__block">
              <h3>Specifications</h3>
              <dl class="detail__facts">${specs}</dl>
            </section>
          ` : ""}

          <div class="detail__ctas">
            <a class="cta cta--primary" href="#enquire" data-close>Request the memo</a>
            <a class="cta cta--ghost" href="https://wa.me/918040002826?text=${
              encodeURIComponent("Hi, I'd like the memo for " + p.name + ".")
            }" target="_blank" rel="noopener">Ask on WhatsApp</a>
          </div>
        </div>
      </div>
    `;
  }

  /* ── slider implementation ───────────────────────── */
  function initSlider(images) {
    if (!images || images.length < 1) return;
    const root  = $("#slider");
    if (!root) return;
    const track = $(".slider__track", root);
    const slides = $$(".slider__slide", root);
    const dots   = $$(".slider__dot", root);
    const counter = $("#slider-i");
    const total  = slides.length;
    let i = 0;
    let touchX = null;

    function go(n) {
      i = (n + total) % total;
      track.style.transform = `translateX(-${i * 100}%)`;
      slides.forEach((s, k) => s.toggleAttribute("aria-hidden", k !== i));
      dots.forEach((d, k) => d.classList.toggle("is-active", k === i));
      if (counter) counter.textContent = String(i + 1);
      slider.i = i;
    }

    const prev = $(".slider__nav--prev", root);
    const next = $(".slider__nav--next", root);
    if (prev) prev.addEventListener("click", () => go(i - 1));
    if (next) next.addEventListener("click", () => go(i + 1));
    dots.forEach(d => d.addEventListener("click", () => go(parseInt(d.dataset.go, 10))));

    /* touch swipe */
    const onTouchStart = e => { touchX = e.touches[0].clientX; };
    const onTouchEnd   = e => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
      touchX = null;
    };
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchend",   onTouchEnd,   { passive: true });

    slider = {
      i,
      go,
      destroy() {
        root.removeEventListener("touchstart", onTouchStart);
        root.removeEventListener("touchend",   onTouchEnd);
      }
    };
  }

  /* ── investor timeline ────────────────────────────── */
  function renderTimeline(inv) {
    const ol = $("#timeline");
    const foot = $("#returns-foot");
    const lede = $("#returns-lede");
    if (!ol || !inv) return;

    if (inv.lede && lede) lede.textContent = inv.lede;
    if (inv.footer && foot) foot.textContent = inv.footer;

    ol.innerHTML = (inv.milestones || []).map(m => `
      <li>
        <span class="timeline__date">${esc(m.date)}</span>
        <span class="timeline__count">
          <span class="num" data-count="${m.count}" data-suffix="">${m.count}</span>
        </span>
        <span class="timeline__label">${esc(m.label || "")}</span>
        <span class="timeline__note">${esc(m.note || "")}</span>
      </li>
    `).join("");

    if ("IntersectionObserver" in window) {
      const tObs = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (en.isIntersecting) {
            en.target.classList.add("is-visible");
            const n = en.target.querySelector(".num");
            if (n) animateCount(n);
            tObs.unobserve(en.target);
          }
        });
      }, { threshold: 0.4 });
      $$("#timeline li").forEach(li => tObs.observe(li));
    }
  }

  /* ── voices ───────────────────────────────────────── */
  function renderVoices(list) {
    const ul = $("#voices-grid");
    if (!ul) return;
    ul.innerHTML = list.map(t => `
      <li>
        <blockquote>${esc(t.quote || "")}</blockquote>
        <cite>
          <strong>${esc(t.name || "")}</strong>
          <span>${esc(t.project || "")}</span>
        </cite>
      </li>
    `).join("");
  }

  /* ── helpers ──────────────────────────────────────── */
  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[m]));
  }
})();
