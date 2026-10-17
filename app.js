/* Direct Taxi Medicals front end: menu, reveal, price filter, sticky header.
   Everything degrades to a working page with JavaScript off. */
(function () {
  "use strict";

  // sticky masthead shadow
  var mast = document.getElementById("masthead");
  if (mast) {
    var onScroll = function () { mast.classList.toggle("is-stuck", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // mobile menu: sheet, accordion, live search
  var burger = document.getElementById("burger");
  var drawer = document.getElementById("drawer");
  var close = document.getElementById("drawer-close");
  var open = function (state) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", state);
    document.body.style.overflow = state ? "hidden" : "";
    if (burger) burger.setAttribute("aria-expanded", String(state));
    if (state) { var q = document.getElementById("drawer-q"); if (q) setTimeout(function () { q.blur(); }, 0); }
  };
  if (burger) burger.addEventListener("click", function () { open(!drawer.classList.contains("is-open")); });
  if (close) close.addEventListener("click", function () { open(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") open(false); });

  if (drawer) {
    var toggles = [].slice.call(drawer.querySelectorAll(".drawer-toggle"));
    toggles.forEach(function (t) {
      t.addEventListener("click", function () {
        var on = t.getAttribute("aria-expanded") === "true";
        toggles.forEach(function (o) { o.setAttribute("aria-expanded", "false"); });
        t.setAttribute("aria-expanded", String(!on));
      });
    });
    if (toggles[0]) toggles[0].setAttribute("aria-expanded", "true");

    var q = document.getElementById("drawer-q");
    var results = document.getElementById("drawer-results");
    var all = [].slice.call(drawer.querySelectorAll(".drawer-panel a[data-name]"));
    if (q && results) {
      q.addEventListener("input", function () {
        var v = q.value.trim().toLowerCase();
        drawer.classList.toggle("is-searching", v.length > 0);
        results.hidden = v.length === 0;
        if (!v) { results.innerHTML = ""; return; }
        var hits = all.filter(function (a) { return a.dataset.name.indexOf(v) > -1; }).slice(0, 14);
        results.innerHTML = hits.length
          ? hits.map(function (a) { return a.outerHTML; }).join("")
          : "<p>No medical matches \u201c" + v.replace(/</g, "&lt;") + "\u201d. Call " + "0330 058 9690" + " and we will point you to the right one.</p>";
      });
    }
  }

  // medicals and prices: tabs, and a search that cuts across every tab
  var pricesRoot = document.getElementById("prices");
  if (pricesRoot) {
    var tabs = [].slice.call(pricesRoot.querySelectorAll(".ptab"));
    var panels = [].slice.call(pricesRoot.querySelectorAll(".pgrid"));
    var cards = [].slice.call(pricesRoot.querySelectorAll(".pcard"));
    var filter = document.getElementById("price-filter");
    var count = document.getElementById("price-count");
    var none = document.getElementById("price-none");
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (o) { o.classList.remove("is-on"); o.setAttribute("aria-selected", "false"); });
        panels.forEach(function (p) { p.classList.remove("is-on"); });
        t.classList.add("is-on"); t.setAttribute("aria-selected", "true");
        panels[Number(t.dataset.tab)].classList.add("is-on");
      });
    });
    // every panel ends on a full row: trim trailing cards to the column count,
    // keeping the "view all" tile last so nothing is unreachable
    function even() {
      panels.forEach(function (p) {
        var all = [].slice.call(p.querySelectorAll(".pcard"));
        var last = p.querySelector(".pcard--all");
        var rest = all.filter(function (c) { return c !== last; });
        rest.forEach(function (c) { c.classList.remove("is-trimmed"); });
        // hidden panels have no computed grid, so read the column count from
        // the same breakpoints the stylesheet uses
        var w = window.innerWidth, cols = w > 1000 ? 3 : w > 620 ? 2 : 1;
        if (pricesRoot.classList.contains("psearching")) return;
        var keep = Math.max(cols - 1, Math.floor((rest.length + 1) / cols) * cols - 1);
        rest.slice(keep).forEach(function (c) { c.classList.add("is-trimmed"); });
      });
    }
    even();
    window.addEventListener("resize", even);
    if (filter) filter.addEventListener("input", function () {
      var q = filter.value.trim().toLowerCase();
      pricesRoot.classList.toggle("psearching", q.length > 0);
      var shown = 0;
      cards.forEach(function (c) { var hit = !q || c.dataset.name.indexOf(q) > -1; c.hidden = q ? !hit : false; if (hit) shown++; });
      panels.forEach(function (p) { p.style.display = q ? (p.querySelector(".pcard:not([hidden])") ? "grid" : "none") : ""; });
      if (count) count.textContent = q ? shown + (shown === 1 ? " match" : " matches") : "";
      if (none) none.hidden = !q || shown > 0;
      even();
    });
  }

  // postcode boxes search the clinic finder on the page, the same as the one
  // lower down; a page without one opens the page that has it, postcode and all
  var runFinder = function (pc) {
    var form = document.getElementById("clinic-search"), input = document.getElementById("clinic-postcode");
    if (!form || !input) { form = document.getElementById("nm-form"); input = document.getElementById("nm-q"); }
    if (!form || !input) return false;
    input.value = pc;
    var box = document.getElementById("clinics") || form;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    box.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    return true;
  };
  var finder = document.getElementById("finder");
  if (finder) {
    finder.addEventListener("submit", function (e) {
      e.preventDefault();
      var pc = ((finder.querySelector("[name=postcode]") || {}).value || "").trim();
      if (!pc) { var f = finder.querySelector("[name=postcode]"); if (f) f.focus(); return; }
      if (runFinder(pc)) return;
      window.location.href = (finder.getAttribute("data-finder") || "/") + "?postcode=" + encodeURIComponent(pc) + "#clinics";
    });
  }
  var asked = new URLSearchParams(window.location.search).get("postcode");
  if (asked) window.addEventListener("load", function () { setTimeout(function () { runFinder(asked.trim()); }, 150); });
})();

/* show the rest of the reviews */
(function () {
  var btn = document.getElementById("more-reviews");
  var wall = document.getElementById("reviewwall");
  if (!btn || !wall) return;
  btn.addEventListener("click", function () {
    var open = wall.classList.toggle("is-open");
    btn.textContent = open ? "Show fewer reviews" : "Show all " + btn.dataset.total + " reviews";
  });
})();

/* long reviews get a More control, the way Google truncates them */
(function () {
  var cards = [].slice.call(document.querySelectorAll(".gr-card"));
  cards.forEach(function (card) {
    var p = card.querySelector("p");
    if (!p || p.scrollHeight <= p.clientHeight + 4) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gr-more";
    btn.textContent = "More";
    btn.addEventListener("click", function () {
      var open = card.classList.toggle("is-open");
      btn.textContent = open ? "Less" : "More";
    });
    card.appendChild(btn);
  });
})();

/* the header gets out of the way while you read, and comes back the moment
   you scroll up to look for it */
(function () {
  var mast = document.getElementById("masthead");
  if (!mast) return;
  var last = window.scrollY, hidden = false, ticking = false;
  function tick() {
    var y = window.scrollY;
    var down = y > last + 4, up = y < last - 4;
    var menuOpen = !!mast.querySelector(".navitem:hover, .navitem:focus-within");
    if (down && y > 160 && !hidden && !menuOpen) { mast.classList.add("is-hidden"); hidden = true; }
    else if ((up || y < 80) && hidden) { mast.classList.remove("is-hidden"); hidden = false; }
    last = y; ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(tick); }
  }, { passive: true });
})();

/* the dock appears once the hero's own buttons have scrolled away, and steps
   aside again while the closing band or footer is on screen, because those
   already carry Book and Call */
(function () {
  var dock = document.getElementById("dock");
  if (!dock || !("IntersectionObserver" in window)) return;
  var hero = document.querySelector(".hero .hero-cta") || document.querySelector(".hero");
  var ends = [].slice.call(document.querySelectorAll(".closer, .foot"));
  var heroSeen = !!hero, endSeen = 0;

  function update() {
    var show = !heroSeen && endSeen === 0;
    dock.classList.toggle("is-shown", show);
    dock.classList.toggle("is-hidden", !show);
  }

  if (hero) {
    new IntersectionObserver(function (entries) {
      heroSeen = entries[0].isIntersecting || entries[0].boundingClientRect.top > 0;
      update();
    }, { threshold: 0 }).observe(hero);
  } else {
    heroSeen = false;
  }
  if (ends.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { endSeen += e.isIntersecting ? 1 : -1; });
      endSeen = Math.max(0, endSeen);
      update();
    }, { threshold: 0.1 });
    ends.forEach(function (el) { io.observe(el); });
  }
  update();
})();

/* one FAQ open at a time, everywhere. Browsers with the exclusive accordion
   (details name=) do this natively; this covers the rest. */
(function () {
  var groups = [].slice.call(document.querySelectorAll(".faq"));
  groups.forEach(function (g) {
    var items = [].slice.call(g.querySelectorAll("details"));
    items.forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (!d.open) return;
        items.forEach(function (o) { if (o !== d && o.open) o.open = false; });
        var r = d.getBoundingClientRect();
        if (r.top < 90) window.scrollBy({ top: r.top - 100, behavior: "smooth" });
      });
    });
  });
})();

/* review sliders: arrows page the track, the counter follows the scroll,
   and desktop can drag the track like a phone */
(function () {
  [].slice.call(document.querySelectorAll("[data-rslider]")).forEach(function (root) {
    var track = root.querySelector(".rslider-track");
    var cards = [].slice.call(track.children);
    var count = root.querySelector(".rslider-count");
    var btns = [].slice.call(root.querySelectorAll(".rslider-btn"));
    if (!cards.length) return;
    function step() { return cards[0].getBoundingClientRect().width + 18; }
    function update() {
      var i = Math.round(track.scrollLeft / step());
      if (count) count.textContent = (Math.min(i + 1, cards.length)) + " / " + cards.length;
      btns[0].disabled = track.scrollLeft <= 2;
      btns[1].disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    }
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var per = Math.max(1, Math.floor(track.clientWidth / step()));
        track.scrollBy({ left: Number(b.dataset.dir) * per * step(), behavior: "smooth" });
      });
    });
    var drag = null;
    track.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") return; drag = { x: e.clientX, left: track.scrollLeft }; track.classList.add("is-dragging"); track.setPointerCapture(e.pointerId); });
    track.addEventListener("pointermove", function (e) { if (!drag) return; track.scrollLeft = drag.left - (e.clientX - drag.x); });
    ["pointerup", "pointercancel"].forEach(function (ev) { track.addEventListener(ev, function () { if (!drag) return; drag = null; track.classList.remove("is-dragging"); update(); }); });
    track.addEventListener("scroll", function () { requestAnimationFrame(update); }, { passive: true });
    window.addEventListener("resize", update);
    update();
  });
})();

/* the google reviews dialog */
(function () {
  var dlg = document.getElementById("gdialog");
  if (!dlg || typeof dlg.showModal !== "function") return;
  [].slice.call(document.querySelectorAll("[data-gdialog]")).forEach(function (b) {
    b.addEventListener("click", function () { dlg.showModal(); dlg.querySelector(".gdialog-list").scrollTop = 0; });
  });
  [].slice.call(dlg.querySelectorAll("[data-gdialog-close]")).forEach(function (b) { b.addEventListener("click", function () { dlg.close(); }); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
})();
(function () {
  var o = document.getElementById("smap-open"), c = document.getElementById("smap-close");
  if (!o || !c) return;
  o.addEventListener("click", function () { document.querySelectorAll(".smap").forEach(function (d) { d.open = true; }); });
  c.addEventListener("click", function () { document.querySelectorAll(".smap").forEach(function (d) { d.open = false; }); });
})();

/* "Areas we cover" and any other [data-tabs] block: one panel at a time.
   Its own block: it once sat inside the site map block and returned early
   on every other page. */
(function () {
  [].slice.call(document.querySelectorAll("[data-tabs]")).forEach(function (box) {
    var tabs = [].slice.call(box.querySelectorAll("[role=tab]"));
    var panels = [].slice.call(box.querySelectorAll("[role=tabpanel]"));
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) { var on = x === t; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
        panels.forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-panel") === t.getAttribute("data-tab")); });
      });
    });
  });
})();
