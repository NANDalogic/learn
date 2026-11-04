/* learn.nandalogic.com: shared behavior
   - [R#] tags → footnote links with a reference popover
   - section nav highlight + reading progress
   - light/dark toggle
   - lazy module init, reduced-motion helper, safe localStorage, DOM/SVG helpers */
(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var motionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

  var Site = {
    reducedMotion: function () { return !!(motionQuery && motionQuery.matches); },

    store: {
      get: function (key, fallback) {
        try {
          var v = window.localStorage.getItem(key);
          return v === null ? fallback : JSON.parse(v);
        } catch (e) { return fallback; }
      },
      set: function (key, value) {
        try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable: ignore */ }
      },
      remove: function (key) {
        try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ }
      }
    },

    /* el("div", {class: "x", onclick: fn}, [children...]) */
    el: function (tag, attrs, children) { return build(document.createElement(tag), attrs, children); },
    svg: function (tag, attrs, children) { return build(document.createElementNS(SVG_NS, tag), attrs, children); },

    /* Run init(el) once, when el first comes near the viewport. */
    lazy: function (el, init) {
      if (!el) return;
      var started = false;
      function go() {
        if (started) return;
        started = true;
        try { init(el); } catch (e) {
          el.insertAdjacentHTML("beforeend", '<p class="noscript">This interactive part failed to load.</p>');
          if (window.console) console.error(e);
        }
      }
      if (!("IntersectionObserver" in window)) { go(); return; }
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); go(); }
      }, { rootMargin: "300px 0px" });
      io.observe(el);
    },

    /* Is el on screen? Used to pause animations that scroll away. */
    watchVisible: function (el, cb) {
      if (!("IntersectionObserver" in window)) { cb(true); return; }
      new IntersectionObserver(function (entries) { cb(entries[0].isIntersecting); }).observe(el);
    },

    fmt: function (n) { return Math.round(n).toLocaleString("en-US"); }
  };

  function build(node, attrs, children) {
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k.slice(0, 2) === "on" && typeof v === "function") node.addEventListener(k.slice(2), v);
        else if (k === "text") node.textContent = v;
        else if (k === "html") node.innerHTML = v;
        else node.setAttribute(k, v === true ? "" : v);
      });
    }
    if (children !== undefined && children !== null) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c === null || c === undefined || c === false) return;
        node.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
      });
    }
    return node;
  }

  /* ---------- theme ---------- */
  var MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  var SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  function initTheme() {
    var root = document.documentElement;
    var saved = Site.store.get("theme", null);
    if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
    var btn = document.querySelector(".theme-toggle");
    if (!btn) return;
    function current() {
      var t = root.getAttribute("data-theme");
      if (t) return t;
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    function label() {
      var next = current() === "dark" ? "light" : "dark";
      btn.setAttribute("aria-label", "Switch to " + next + " mode");
      btn.innerHTML = current() === "dark" ? SUN : MOON;
    }
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      Site.store.set("theme", next);
      label();
    });
    label();
  }

  /* ---------- footnotes ---------- */
  var REF_RE = /\[R(\d+)\]/g;

  function linkFootnotes(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!REF_RE.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        REF_RE.lastIndex = 0;
        var p = n.parentElement;
        if (!p || p.closest("script, style, code, svg, .references, a, button")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var text = node.nodeValue, frag = document.createDocumentFragment(), last = 0, m;
      REF_RE.lastIndex = 0;
      while ((m = REF_RE.exec(text))) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        var id = "ref-R" + m[1];
        if (document.getElementById(id)) {
          frag.appendChild(Site.el("a", { class: "fn", href: "#" + id, "data-ref": id, "aria-label": "Reference " + m[1] }, "R" + m[1]));
        } else {
          frag.appendChild(Site.el("span", { class: "todo" }, "R" + m[1] + "?"));
        }
        last = m.index + m[0].length;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  var pop = null, popOpener = null;
  function closePop(restoreFocus) {
    if (!pop) return;
    pop.remove(); pop = null;
    if (restoreFocus && popOpener) popOpener.focus();
    popOpener = null;
  }
  function openPop(link) {
    closePop(false);
    var ref = document.getElementById(link.getAttribute("data-ref"));
    if (!ref) return;
    var body = ref.cloneNode(true);
    body.removeAttribute("id");
    var p = Site.el("p");
    while (body.firstChild) p.appendChild(body.firstChild);
    var close = Site.el("button", { type: "button", onclick: function () { closePop(true); } }, "Close");
    var go = Site.el("a", { class: "btn", href: "#" + ref.id, onclick: function () { closePop(false); } }, "All references");
    pop = Site.el("div", { class: "fn-pop", role: "dialog", "aria-label": "Reference " + link.textContent }, [p, Site.el("div", { class: "fn-pop-actions" }, [go, close])]);
    document.body.appendChild(pop);
    var r = link.getBoundingClientRect();
    var w = pop.offsetWidth;
    var left = Math.max(12, Math.min(window.scrollX + r.left - w / 2, window.scrollX + document.documentElement.clientWidth - w - 12));
    pop.style.left = left + "px";
    pop.style.top = (window.scrollY + r.bottom + 8) + "px";
    popOpener = link;
    close.focus();
  }
  function initFootnotes() {
    var main = document.querySelector("main");
    if (!main) return;
    linkFootnotes(main);
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a.fn");
      if (a) { e.preventDefault(); openPop(a); return; }
      if (pop && !pop.contains(e.target)) closePop(false);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePop(true); });
  }
  Site.linkFootnotes = linkFootnotes;

  /* ---------- section nav + progress ---------- */
  function initNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".section-nav a[href^='#']"));
    var bar = document.querySelector(".progress span");
    if (bar) {
      var tick = false;
      var update = function () {
        tick = false;
        var h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0) + "%";
      };
      window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(update); } }, { passive: true });
      update();
    }
    if (!links.length || !("IntersectionObserver" in window)) return;
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      var firstId = null;
      links.some(function (a) { var id = a.getAttribute("href").slice(1); if (visible[id]) { firstId = id; return true; } return false; });
      if (!firstId) return;
      links.forEach(function (a) { a.removeAttribute("aria-current"); });
      var cur = byId[firstId];
      cur.setAttribute("aria-current", "true");
      var nav = cur.closest(".section-nav");
      if (nav) {
        var nr = nav.getBoundingClientRect(), cr = cur.getBoundingClientRect();
        if (cr.left < nr.left || cr.right > nr.right) nav.scrollLeft += cr.left - nr.left - nr.width / 2 + cr.width / 2;
      }
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  window.Site = Site;
  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initFootnotes();
    initNav();
  });
})();
