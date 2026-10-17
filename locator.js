/* Clinic finder. Leaflet and markercluster are self hosted and load only when
   the map scrolls into view. Tiles are OpenStreetMap, muted in CSS so the map
   reads as ours, the pins are ours, and a pin opens a detail card. */
(function () {
  "use strict";
  var root = document.getElementById("locator");
  if (!root) return;

  var listEl = document.getElementById("clinic-list");
  var statusEl = document.getElementById("clinic-status");
  var card = document.getElementById("clinic-card");
  var items = [].slice.call(listEl.querySelectorAll(".clinic"));
  var clinics = items.map(function (li, i) {
    return { i: i, el: li, lat: +li.dataset.lat, lng: +li.dataset.lng, town: li.dataset.town,
             addr: li.dataset.addr, services: (li.dataset.services || "").split("|").filter(Boolean),
             book: li.dataset.book, dir: li.dataset.dir };
  });

  var map = null, markers = [], cluster = null, loaded = false, active = null;
  var icon = function (n) { return L.divIcon({ className: "pin", html: "<span><i>" + (n || "") + "</i></span>", iconSize: [26, 26], iconAnchor: [4, 24] }); };
  var UK = [[49.9, -8.2], [58.7, 1.8]];

  function css(href) { var l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); }
  function js(src, cb) { var s = document.createElement("script"); s.src = src; s.onload = cb; document.head.appendChild(s); }
  // callers that arrive while the scripts are still downloading wait for them
  var waiting = [], ready = false;
  function load(cb) {
    if (ready) return cb();
    waiting.push(cb);
    if (loaded) return;
    loaded = true;
    css("/assets/vendor/leaflet/leaflet.css");
    css("/assets/vendor/leaflet/markercluster.css");
    js("/assets/vendor/leaflet/leaflet.js", function () {
      js("/assets/vendor/leaflet/markercluster.js", function () {
        ready = true;
        waiting.splice(0).forEach(function (f) { f(); });
      });
    });
  }

  function build() {
    map = L.map("clinic-map", { zoomSnap: 0.25, scrollWheelZoom: false, zoomControl: true, attributionControl: true });
    // OpenStreetMap tiles, no key to expire, muted to the brand palette in CSS
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    map.fitBounds(UK, { padding: [10, 10] });

    cluster = L.markerClusterGroup({
      showCoverageOnHover: false, maxClusterRadius: 46, spiderfyOnMaxZoom: true, disableClusteringAtZoom: 11,
      iconCreateFunction: function (c) {
        var n = c.getChildCount();
        return L.divIcon({ className: "cluster" + (n > 20 ? " big" : ""), html: "<span>" + n + "</span>", iconSize: n > 20 ? [50, 50] : [40, 40] });
      },
    });
    clinics.forEach(function (c) {
      var m = L.marker([c.lat, c.lng], { icon: icon(""), title: c.town, keyboard: true });
      m.on("click", function () { select(c, true); });
      markers.push(m); cluster.addLayer(m);
    });
    map.addLayer(cluster);
  }

  function showCard(c) {
    if (!card) return;
    card.querySelector(".clinic-card-town").textContent = c.town;
    card.querySelector(".clinic-card-addr").textContent = c.addr;
    var d = card.querySelector(".clinic-card-dist");
    if (c.miles != null) { d.textContent = (c.miles < 10 ? c.miles.toFixed(1) : Math.round(c.miles)) + " miles from you"; d.hidden = false; } else { d.hidden = true; }
    card.querySelector(".clinic-card-tags").innerHTML = c.services.map(function (s) { return "<em>" + s + "</em>"; }).join("");
    card.querySelector("[data-role=book]").href = c.book;
    card.querySelector("[data-role=dir]").href = c.dir;
    card.hidden = false;
    requestAnimationFrame(function () { card.classList.add("is-in"); });
  }
  function hideCard() {
    if (!card) return;
    card.classList.remove("is-in");
    setTimeout(function () { if (!card.classList.contains("is-in")) card.hidden = true; }, 300);
  }

  function select(c, fly) {
    if (active) { active.el.classList.remove("is-active"); var old = markers[active.i]; if (old && old._icon) old._icon.classList.remove("is-active"); }
    active = c;
    c.el.classList.add("is-active");
    c.el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    if (map) {
      var go = function () {
        var m = markers[c.i];
        if (m && m._icon) m._icon.classList.add("is-active");
      };
      var target = map.project([c.lat, c.lng], 13).subtract([0, -150]);  // pin sits low, the window hangs above it in full view
      var centre = map.unproject(target, 13);
      if (fly !== false) { map.flyTo(centre, 13, { duration: 0.7 }); map.once("moveend", function () { cluster.zoomToShowLayer(markers[c.i], go); }); }
      else { map.setView(centre, Math.max(map.getZoom(), 13)); cluster.zoomToShowLayer(markers[c.i], go); }
    }
    showCard(c);
  }

  items.forEach(function (li, i) {
    li.querySelector(".clinic-btn").addEventListener("click", function () {
      load(function () { if (!map) build(); select(clinics[i], true); });
    });
  });
  if (card) {
    document.getElementById("clinic-card-x").addEventListener("click", function () {
      hideCard();
      if (active) { active.el.classList.remove("is-active"); var m = markers[active.i]; if (m && m._icon) m._icon.classList.remove("is-active"); active = null; }
    });
  }
  var reset = document.getElementById("map-reset");
  if (reset) reset.addEventListener("click", function () { load(function () { if (!map) build(); map.flyToBounds(UK, { padding: [10, 10], duration: 0.8 }); hideCard(); }); });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect(); load(function () { if (!map) build(); });
    }, { rootMargin: "200px" });
    io.observe(document.getElementById("clinic-map"));
  } else { load(function () { if (!map) build(); }); }

  function distance(a, b, c, d) {
    var R = 3958.8, p = Math.PI / 180, dLat = (c - a) * p, dLng = (d - b) * p;
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a * p) * Math.cos(c * p) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }
  function moreBtnRef() { return document.getElementById("clinic-more"); }

  function order(lat, lng, label) {
    clinics.forEach(function (c) { c.miles = distance(lat, lng, c.lat, c.lng); });
    var sorted = clinics.slice().sort(function (a, b) { return a.miles - b.miles; });
    sorted.forEach(function (c) {
      var d = c.el.querySelector(".clinic-dist");
      d.textContent = c.miles < 10 ? c.miles.toFixed(1) + " miles" : Math.round(c.miles) + " miles";
      d.hidden = false; listEl.appendChild(c.el);
    });
    listEl.classList.add("is-full");
    if (moreBtnRef()) moreBtnRef().textContent = "Show fewer clinics";
    sorted.forEach(function (c, n) {
      var num = c.el.querySelector(".clinic-num"); if (num) num.textContent = n + 1;
      if (markers[c.i]) markers[c.i].setIcon(icon(n < 10 ? n + 1 : ""));
    });
    statusEl.textContent = "Nearest clinics to " + label + ". Closest is " + sorted[0].town + ", " +
      (sorted[0].miles < 10 ? sorted[0].miles.toFixed(1) : Math.round(sorted[0].miles)) + " miles away.";
    load(function () {
      if (!map) build();
      map.flyTo([lat, lng], 9, { duration: 0.7 });
      map.once("moveend", function () { select(sorted[0], false); });
    });
  }

  document.getElementById("clinic-search").addEventListener("submit", function (e) {
    e.preventDefault();
    var q = document.getElementById("clinic-postcode").value.trim();
    if (!q) return;
    statusEl.textContent = "Looking up " + q + "…";
    fetch("https://api.postcodes.io/postcodes/" + encodeURIComponent(q.replace(/\s+/g, "")))
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) { order(d.result.latitude, d.result.longitude, d.result.admin_district || q.toUpperCase()); })
      .catch(function () {
        fetch("https://api.postcodes.io/places?q=" + encodeURIComponent(q) + "&limit=1")
          .then(function (r) { return r.json(); })
          .then(function (d) { var p = d.result && d.result[0]; if (!p) { statusEl.textContent = "No match for " + q + ". Try a full postcode."; return; } order(p.latitude, p.longitude, p.name_1); })
          .catch(function () { statusEl.textContent = "Could not look that up. Try a full postcode."; });
      });
  });

  var tabList = document.getElementById("tab-list"), tabMap = document.getElementById("tab-map");
  if (tabList && tabMap) {
    var setTab = function (showMap) {
      root.classList.toggle("show-map", showMap);
      tabMap.classList.toggle("is-on", showMap); tabList.classList.toggle("is-on", !showMap);
      tabMap.setAttribute("aria-selected", String(showMap)); tabList.setAttribute("aria-selected", String(!showMap));
      if (showMap) load(function () { if (!map) build(); setTimeout(function () { map.invalidateSize(); }, 60); });
    };
    tabList.addEventListener("click", function () { setTab(false); });
    tabMap.addEventListener("click", function () { setTab(true); if (active) showCard(active); });
  }
  var moreBtn = document.getElementById("clinic-more");
  if (moreBtn) moreBtn.addEventListener("click", function () {
    var full = listEl.classList.toggle("is-full");
    moreBtn.textContent = full ? "Show fewer clinics" : "Show more clinics";
  });
  document.getElementById("clinic-locate").addEventListener("click", function () {
    if (!navigator.geolocation) { statusEl.textContent = "This browser will not share a location."; return; }
    if (!window.isSecureContext) {
      // browsers only ask for a location over https; the live site is https,
      // this local demo is not, so say so rather than pretend it was refused
      statusEl.textContent = "Location sharing needs a secure (https) connection. Enter a postcode for now.";
      return;
    }
    statusEl.textContent = "Finding you…";
    navigator.geolocation.getCurrentPosition(
      function (pos) { order(pos.coords.latitude, pos.coords.longitude, "your location"); },
      function () { statusEl.textContent = "Location was declined. Enter a postcode instead."; }, { timeout: 8000 });
  });
})();

/* small clinic map on local pages: one pin, loads when scrolled into view */
(function () {
  var box = document.querySelector(".localmap-map");
  if (!box) return;
  function css(href) { var l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); }
  function build() {
    css("/assets/vendor/leaflet/leaflet.css");
    var s = document.createElement("script"); s.src = "/assets/vendor/leaflet/leaflet.js";
    s.onload = function () {
      var lat = +box.dataset.lat, lng = +box.dataset.lng;
      var m = L.map(box, { scrollWheelZoom: false, zoomControl: true }).setView([lat, lng], 14);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(m);
      L.marker([lat, lng], { icon: L.divIcon({ className: "pin is-active", html: "<span><i></i></span>", iconSize: [26, 26], iconAnchor: [4, 24] }), title: box.dataset.town }).addTo(m);
    };
    document.head.appendChild(s);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { io.disconnect(); build(); } }, { rootMargin: "200px" });
    io.observe(box);
  } else build();
})();
