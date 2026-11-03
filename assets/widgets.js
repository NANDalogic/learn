/* learn.nandalogic.com: shared interactive widgets (needs site.js first)
   - Site.module(id, init): lazy-init a module's .module-body
   - Site.timeline(): seekable play/pause/step/scrub controller (draw(t) is a pure function of time)
   - Site.segmented(): radio-style segmented control
   - Site.cmos: evaluate + draw CMOS switch networks
   - Site.selfCheck(): tap-to-match game + quiz with saved progress */
(function () {
  "use strict";
  var S = window.Site, el = S.el, svg = S.svg;

  S.uid = function (p) { S.uid.n = (S.uid.n || 0) + 1; return p + "-" + S.uid.n; };
  S.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------- module registry ---------- */
  S.module = function (id, init) {
    function go() {
      var host = document.getElementById(id);
      if (!host) return;
      S.lazy(host, function () {
        var body = host.querySelector(".module-body");
        body.textContent = "";
        init(body, host);
        S.linkFootnotes(body);
      });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go);
    else go();
  };

  /* ---------- seekable timeline ----------
     The picture is a pure function of time: cfg.draw(t) must show the same frame for the same t,
     however you got there (play, scrub, Back/Next). That's what lets narration drive a module later.
     cfg = { id, duration, start, secPerUnit, beats: [{t, label: string|fn}], draw(t),
             labels: {play, pause, resume, replay},
             loop: true      → playback wraps to 0 instead of stopping (ambient animations)
             stepper: true   → Back/Next always move one whole beat (slideshow-style modules)
             caption: false  → hide the step caption (the module shows its own text) }
     Every timeline registers in Site.timelines[id] (seek, play, pause, time, beats, duration). */
  S.timelines = {};
  S.timeline = function (cfg) {
    var D = cfg.duration, beats = cfg.beats, n = beats.length, spu = cfg.secPerUnit || 1, EPS = 1e-6;
    var L = Object.assign({ play: "▶ Play", pause: "❚❚ Pause", resume: "▶ Resume", replay: "▶ Play again" }, cfg.labels || {});
    var t = S.clamp(cfg.start == null ? 0 : cfg.start, 0, D), clock = t, playing = false, raf = null, last = 0, said = null;

    var back = el("button", { type: "button", class: "player-step", "aria-label": "Back one step" }, "◀ Back");
    var play = el("button", { type: "button", class: "primary player-play" });
    var next = el("button", { type: "button", class: "player-step", "aria-label": "Forward one step" }, "Next ▶");
    var range = el("input", { type: "range", min: "0", max: String(D), step: "0.01", "aria-label": "Playback position" });
    var ticks = el("div", { class: "player-ticks", "aria-hidden": "true" }, beats.map(function (b) { return el("span", { style: "left:" + (b.t / D * 100) + "%" }); }));
    var status = el("p", { class: "player-status", "aria-live": "polite" });
    var node = el("div", { class: "player" }, [el("div", { class: "player-scrub" }, [range, ticks]), el("div", { class: "btn-row player-btns" }, [back, play, next]), cfg.caption === false ? null : status]);

    function beatAt(x) { var i = 0; beats.forEach(function (b, k) { if (b.t <= x + EPS) i = k; }); return i; }
    function render() {
      range.value = String(t);
      cfg.draw(t);
      var i = beatAt(t), b = beats[i], text = typeof b.label === "function" ? b.label() : b.label;
      if (text !== said) { said = text; status.textContent = text; range.setAttribute("aria-valuetext", text); }
      play.textContent = playing ? L.pause : (!cfg.loop && t >= D - EPS ? L.replay : (t <= EPS ? L.play : L.resume));
      play.setAttribute("aria-pressed", String(playing));
      back.disabled = cfg.stepper ? i === 0 : t <= EPS;
      next.disabled = cfg.stepper ? i === n - 1 : t >= D - EPS;
    }
    function seek(x) { t = clock = S.clamp(x, 0, D); render(); }
    function tick(now) {
      clock += S.clamp((now - last) / 1000, 0, 0.1) / spu; last = now; // first frame's timestamp can predate start()
      if (clock >= D && cfg.loop) clock = clock % D;
      // Reduced motion: hold each step, then jump to the next (no in-between frames).
      t = S.reducedMotion() ? beats[beatAt(clock)].t : clock;
      if (clock >= D) { t = clock = D; playing = false; raf = null; }
      else raf = requestAnimationFrame(tick);
      render();
    }
    function start() {
      if (playing) return;
      if (t >= D - EPS) t = clock = 0;
      playing = true; last = performance.now();
      raf = requestAnimationFrame(tick);
      render();
    }
    function pause() { playing = false; if (raf) cancelAnimationFrame(raf); raf = null; render(); }
    function step(dir) {
      pause();
      if (cfg.stepper) { seek(beats[S.clamp(beatAt(t) + dir, 0, n - 1)].t); return; }
      var target = dir > 0 ? D : 0;
      beats.forEach(function (b) {
        if (dir > 0 && b.t > t + EPS && b.t < target) target = b.t;
        if (dir < 0 && b.t < t - EPS && b.t > target) target = b.t;
      });
      seek(target);
    }

    play.addEventListener("click", function () { if (playing) pause(); else start(); });
    back.addEventListener("click", function () { step(-1); });
    next.addEventListener("click", function () { step(1); });
    range.addEventListener("input", function () { if (playing) { playing = false; cancelAnimationFrame(raf); raf = null; } seek(+range.value); });
    S.watchVisible(node, function (v) { if (!v && playing) pause(); });

    var api = { node: node, seek: function (x) { pause(); seek(x); }, play: start, pause: pause, time: function () { return t; }, playing: function () { return playing; }, beats: beats, duration: D, redraw: render };
    if (cfg.id) S.timelines[cfg.id] = api;
    render();
    return api;
  };

  /* ---------- segmented control ---------- */
  S.segmented = function (label, opts, initial, onChange) {
    var cur = initial;
    var node = el("div", { class: "seg", role: "radiogroup", "aria-label": label });
    var btns = opts.map(function (o) {
      var b = el("button", { type: "button", role: "radio" }, o[1]);
      b.addEventListener("click", function () { set(o[0]); });
      b.addEventListener("keydown", function (e) {
        var i = opts.findIndex(function (x) { return x[0] === cur; });
        if (e.key === "ArrowRight" || e.key === "ArrowDown") i = (i + 1) % opts.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") i = (i + opts.length - 1) % opts.length;
        else return;
        e.preventDefault(); set(opts[i][0]); btns[i].focus();
      });
      node.appendChild(b);
      return b;
    });
    function mark() {
      btns.forEach(function (b, i) { var on = opts[i][0] === cur; b.setAttribute("aria-checked", String(on)); b.setAttribute("tabindex", on ? "0" : "-1"); });
    }
    function set(v) { cur = v; mark(); onChange(v); }
    mark();
    return { node: node, set: set, get: function () { return cur; } };
  };

  /* ---------- CMOS switch networks ----------
     A stage: { ins: ["A","B"], pd: "series"|"parallel"|"single", out: "Y", name: "NAND" }
     Pull-down (NMOS, on when input = 1) is described; pull-up (PMOS, on when input = 0) is its mirror. */
  var cmos = {};
  cmos.eval = function (stages, inputs) {
    var sig = Object.assign({}, inputs);
    stages.forEach(function (st) {
      var v = st.ins.map(function (n) { return sig[n]; });
      var pdOn = st.pd === "series" ? v.every(Boolean) : v.some(Boolean);
      sig[st.out] = pdOn ? 0 : 1;
    });
    return sig;
  };
  cmos.count = function (stages) { return stages.reduce(function (n, st) { return n + st.ins.length * 2; }, 0); };
  cmos.draw = function (stages, sig) {
    var SW = 150, H = 300, VDD = 22, GND = 278, NODE = 150, BW = 54, BH = 34;
    var W = SW * stages.length + 20 * (stages.length - 1);
    var root = svg("svg", { class: "cmos-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Transistor diagram: " + stages.map(function (st) { return st.name + " stage, output " + st.out + " = " + sig[st.out]; }).join("; ") });
    stages.forEach(function (st, k) {
      var g = svg("g", { transform: "translate(" + (k * (SW + 20)) + ",0)" });
      var cx = SW / 2;
      var vals = st.ins.map(function (n) { return sig[n]; });
      var pu = st.pd === "single" ? "single" : (st.pd === "series" ? "parallel" : "series");
      var puOn = net(pu, vals.map(function (v) { return !v; }));
      var pdOn = net(st.pd, vals.map(function (v) { return !!v; }));
      g.appendChild(svg("line", { x1: 8, x2: SW - 8, y1: VDD, y2: VDD, class: "rail rail-1" }));
      g.appendChild(svg("line", { x1: 8, x2: SW - 8, y1: GND, y2: GND, class: "rail rail-0" }));
      g.appendChild(svg("text", { x: 8, y: VDD - 7, class: "rail-label" }, "1"));
      g.appendChild(svg("text", { x: 8, y: GND + 16, class: "rail-label" }, "0"));
      g.appendChild(svg("text", { x: SW - 8, y: VDD - 7, "text-anchor": "end", class: "stage-label" }, st.name));
      drawNet(g, pu, st.ins, vals, VDD, NODE - 12, true, puOn);
      drawNet(g, st.pd, st.ins, vals, NODE + 12, GND, false, pdOn);
      var out = sig[st.out];
      g.appendChild(svg("line", { x1: cx, x2: cx, y1: NODE - 12, y2: NODE + 12, class: "wire" + (puOn || pdOn ? " live" : "") }));
      g.appendChild(svg("line", { x1: cx, x2: SW - 4, y1: NODE, y2: NODE, class: "wire" }));
      g.appendChild(svg("circle", { cx: SW - 18, cy: NODE, r: 13, class: "node is-" + out }));
      g.appendChild(svg("text", { x: SW - 18, y: NODE + 5, "text-anchor": "middle", class: "node-text" }, String(out)));
      g.appendChild(svg("text", { x: SW - 18, y: NODE - 19, "text-anchor": "middle", class: "node-name" }, st.out));
      root.appendChild(g);
    });
    return root;

    function net(type, on) { return type === "series" ? on.every(Boolean) : on.some(Boolean); }
    function drawNet(g, type, ins, vals, top, bottom, isUp, conducts) {
      var cx = SW / 2, live = conducts ? " live" : "";
      function box(x, y, i) {
        var on = isUp ? !vals[i] : !!vals[i];
        var grp = svg("g", { class: "tr " + (on ? "on" : "off") });
        grp.appendChild(svg("rect", { x: x - BW / 2, y: y - BH / 2, width: BW, height: BH, rx: 7 }));
        grp.appendChild(svg("text", { x: x, y: y - 2, "text-anchor": "middle", class: "tr-in" }, ins[i] + "=" + vals[i]));
        grp.appendChild(svg("text", { x: x, y: y + 11, "text-anchor": "middle", class: "tr-state" }, on ? "on" : "off"));
        g.appendChild(grp);
      }
      function wire(x1, y1, x2, y2) { g.appendChild(svg("line", { x1: x1, y1: y1, x2: x2, y2: y2, class: "wire" + live })); }
      if (type === "single") {
        var y = (top + bottom) / 2;
        wire(cx, top, cx, y - BH / 2); wire(cx, y + BH / 2, cx, bottom); box(cx, y, 0);
      } else if (type === "series") {
        var span = bottom - top, y1 = top + span * 0.29, y2 = top + span * 0.71;
        wire(cx, top, cx, y1 - BH / 2); wire(cx, y1 + BH / 2, cx, y2 - BH / 2); wire(cx, y2 + BH / 2, cx, bottom);
        box(cx, y1, 0); box(cx, y2, 1);
      } else {
        var ym = (top + bottom) / 2, xl = cx - 36, xr = cx + 36, bt = ym - BH / 2 - 12, bb = ym + BH / 2 + 12;
        wire(cx, top, cx, bt); wire(xl, bt, xr, bt); wire(xl, bt, xl, ym - BH / 2); wire(xr, bt, xr, ym - BH / 2);
        wire(xl, ym + BH / 2, xl, bb); wire(xr, ym + BH / 2, xr, bb); wire(xl, bb, xr, bb); wire(cx, bb, cx, bottom);
        box(xl, ym, 0); box(xr, ym, 1);
      }
    }
  };
  S.cmos = cmos;

  /* ---------- self-check: match + quiz ----------
     cfg = { key, left: {tag, cls, items:[{id,label,answer,why}]}, right: {tag, cls, items:[{id,label}]},
             intro, hint(leftItem, rightItem) -> string|null, quiz:[{q, a:[...], c, why}] } */
  S.selfCheck = function (root, cfg) {
    var saved = S.store.get(cfg.key, null);
    if (!saved || typeof saved !== "object") saved = {};
    saved.match = saved.match || {}; saved.quiz = saved.quiz || {};
    function save() { S.store.set(cfg.key, saved); }

    // matching
    root.appendChild(el("h4", null, "Match the pairs"));
    root.appendChild(el("p", { class: "small muted" }, cfg.intro || "Tap an item on the left, then its partner on the right."));
    var picked = null;
    var lWrap = el("div", { class: "match-col " + (cfg.left.cls || "") }), rWrap = el("div", { class: "match-col " + (cfg.right.cls || "") });
    var feedback = el("p", { class: "match-fb", "aria-live": "polite" });
    var lBtns = {}, rBtns = {};
    cfg.left.items.forEach(function (b) {
      var btn = el("button", { type: "button", class: "match-btn", "aria-pressed": "false" }, b.label);
      btn.addEventListener("click", function () {
        if (saved.match[b.id]) return;
        picked = picked === b.id ? null : b.id;
        sync();
      });
      lBtns[b.id] = btn; lWrap.appendChild(btn);
    });
    cfg.right.items.forEach(function (c) {
      var btn = el("button", { type: "button", class: "match-btn" }, c.label);
      btn.addEventListener("click", function () {
        if (!picked) { feedback.textContent = "First tap an item on the left."; return; }
        var b = cfg.left.items.filter(function (x) { return x.id === picked; })[0];
        feedback.innerHTML = "";
        if (c.id === b.answer) {
          saved.match[b.id] = true; save();
          feedback.append(el("b", null, "✓ " + b.label + " ↔ " + c.label + ". "), b.why || "");
          picked = null;
        } else {
          var hint = (cfg.hint && cfg.hint(b, c)) || ("Not quite: " + b.label + " ↔ " + c.label + " isn't the best pairing. Try another.");
          feedback.append(el("b", null, "✕ "), hint);
        }
        S.linkFootnotes(feedback);
        sync();
      });
      rBtns[c.id] = btn; rWrap.appendChild(btn);
    });
    var matchScore = el("p", { class: "small" });
    var resetMatch = el("button", { type: "button" }, "Reset matching");
    resetMatch.addEventListener("click", function () { saved.match = {}; picked = null; feedback.textContent = ""; save(); sync(); });
    root.appendChild(el("div", { class: "match" }, [lWrap, rWrap]));
    root.appendChild(feedback);
    root.appendChild(el("div", { class: "btn-row" }, [matchScore, resetMatch]));
    function sync() {
      var done = 0, n = cfg.left.items.length;
      cfg.left.items.forEach(function (b) {
        var m = !!saved.match[b.id];
        if (m) done++;
        lBtns[b.id].classList.toggle("matched", m);
        lBtns[b.id].setAttribute("aria-pressed", String(picked === b.id));
        lBtns[b.id].setAttribute("aria-disabled", String(m));
        if (rBtns[b.answer]) rBtns[b.answer].classList.toggle("matched", m);
        lBtns[b.id].textContent = (m ? "✓ " : "") + b.label;
      });
      matchScore.textContent = done + " of " + n + " matched" + (done === n ? ". All done." : "");
    }
    sync();

    // quiz
    root.appendChild(el("h4", null, "Quiz"));
    var scoreEl = el("p", { class: "quiz-score", "aria-live": "polite" });
    var list = el("ol", { class: "quiz" });
    var shows = [];
    cfg.quiz.forEach(function (item, qi) {
      var name = S.uid("q");
      var fb = el("div", { class: "quiz-fb", "aria-live": "polite" });
      var fs = el("fieldset", null, [el("legend", null, item.q)]);
      var radios = item.a.map(function (txt, ai) {
        var id = name + "-" + ai;
        var r = el("input", { type: "radio", name: name, id: id, value: String(ai) });
        r.addEventListener("change", function () { saved.quiz[qi] = ai; save(); show(); });
        fs.appendChild(el("div", { class: "opt" }, [r, el("label", { for: id }, txt)]));
        return r;
      });
      fs.appendChild(fb);
      function show() {
        var pick = saved.quiz[qi];
        radios.forEach(function (r, ai) {
          r.checked = pick === ai;
          var o = r.parentNode;
          o.classList.toggle("right", pick !== undefined && ai === item.c);
          o.classList.toggle("wrong", pick === ai && ai !== item.c);
        });
        fb.innerHTML = "";
        if (pick !== undefined) {
          fb.append(el("b", null, pick === item.c ? "✓ Right. " : "✕ Not quite. "), item.why);
          S.linkFootnotes(fb);
        }
        score();
      }
      list.appendChild(el("li", null, fs));
      shows.push(show);
    });
    var resetQuiz = el("button", { type: "button" }, "Reset quiz");
    resetQuiz.addEventListener("click", function () { saved.quiz = {}; save(); shows.forEach(function (f) { f(); }); });
    root.appendChild(list);
    root.appendChild(el("div", { class: "btn-row" }, [scoreEl, resetQuiz]));
    function score() {
      var answered = 0, right = 0, n = cfg.quiz.length;
      cfg.quiz.forEach(function (q, i) { if (saved.quiz[i] !== undefined) { answered++; if (saved.quiz[i] === q.c) right++; } });
      scoreEl.textContent = "Score: " + right + " / " + n + (answered < n ? " (" + (n - answered) + " left)" : "");
    }
    shows.forEach(function (f) { f(); });
  };
})();
