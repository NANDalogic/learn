/* Brain vs. Computer: interactive modules M1–M8.
   All facts come from the page brief; toy scales are labeled in the page. */
(function () {
  "use strict";
  var S, el, svg;

  S = window.Site; el = S.el; svg = S.svg;
  var mods = { m1: ladder, m2: gates, m3: neuron, m4: synapse, m5: speed, m6: memory, m7: slices, m8: selfCheck };
  Object.keys(mods).forEach(function (id) { S.module(id, mods[id]); });

  function uid(p) { return S.uid(p); }
  function clamp(v, a, b) { return S.clamp(v, a, b); }
  function badge(kind, text) { return el("span", { class: "badge " + kind }, text); }

  /* =========================================================
     M1. The ladder
     ========================================================= */
  var RUNGS = [
    { stage: "Matter", brain: "Living cells, water, salts", comp: "Silicon, metal", badges: [], note: "Just different materials." },
    { stage: "What carries charge", brain: "Ions (sodium, potassium) crossing cell walls", comp: "Electrons in wires", badges: [["moderate", "Moderate"]], note: "Both are moving charge, by very different mechanisms." },
    { stage: "Smallest switch", brain: "Ion channel (protein gate)", comp: "Transistor", badges: [["good", "Good"]], note: "Both are gates that open or close based on voltage.", deeper: "How a transistor switches" },
    { stage: "Basic signal", brain: "Spike: all-or-nothing, meaning carried in timing and rate", comp: "Bit: 0 or 1", badges: [["loose", "Loose"]], note: "Spikes carry information in timing; bits in fixed levels." },
    { stage: "Processing unit", brain: "Neuron, which combines thousands of inputs", comp: "Logic gate; in AI, a software \"neuron\" built from many gates", badges: [["weak", "Weak"]], note: "One real neuron ≈ a 5–8 layer artificial network.[R3]", deeper: "How gates are built from transistors" },
    { stage: "Connection", brain: "Synapse: chemical, adjustable strength", comp: "Fixed wire on a chip; adjustable weight in AI", badges: [["good", "Good for AI weights"], ["weak", "Weak for chip wires"]], note: "Good for AI weights, poor for chip wires." },
    { stage: "Memory", brain: "Synapse strengths, in the same place as processing", comp: "Separate RAM/disk; weights in AI", badges: [["loose", "Loose"]], note: "" },
    { stage: "Circuit", brain: "A group of neurons doing one job (e.g., detecting an edge)", comp: "Circuits like adders; in AI, layers that detect features", badges: [["loose", "Loose"]], note: "" },
    { stage: "System", brain: "Brain regions working together", comp: "Chip + software → model", badges: [["loose", "Loose"]], note: "" },
    { stage: "Thought", brain: "A pattern of firing across neurons", comp: "A pattern of numbers (activation vector)", badges: [["loose", "Loose"]], note: "Same idea of \"a pattern that represents something\"; whether it's experienced is unknown." }
  ];

  function ladder(root) {
    var items = [];
    var tools = el("div", { class: "btn-row" }, [
      el("button", { type: "button", onclick: function () { setAll(true); } }, "Open all"),
      el("button", { type: "button", onclick: function () { setAll(false); } }, "Close all")
    ]);
    var head = el("div", { class: "ladder-cols", "aria-hidden": "true" }, [
      el("span"), el("span", { class: "tag is-brain" }, "Brain"), el("span", { class: "tag is-computer" }, "Computer / AI")
    ]);
    var list = el("ol", { class: "ladder" });
    RUNGS.forEach(function (r, i) {
      var pid = uid("rung");
      var btn = el("button", { type: "button", class: "rung-btn", "aria-expanded": "false", "aria-controls": pid }, [
        el("span", { class: "rung-num" }, String(i + 1)),
        el("span", { class: "rung-stage" }, r.stage),
        el("span", { class: "rung-cell is-brain" }, [el("span", { class: "visually-hidden" }, "Brain: "), r.brain]),
        el("span", { class: "rung-cell is-computer" }, [el("span", { class: "visually-hidden" }, "Computer: "), r.comp])
      ]);
      var detail = el("div", { class: "rung-detail", id: pid, hidden: true }, [
        el("p", { class: "rung-badges" }, r.badges.length
          ? r.badges.map(function (b) { return badge(b[0], b[1]); })
          : [el("span", { class: "muted small" }, "No badge: nothing to compare here.")]),
        r.note ? el("p", null, r.note) : null,
        r.deeper ? el("a", { class: "go-deeper", href: "/brain-vs-computer/transistors/" }, [el("b", null, "Go deeper:"), " ", el("span", null, r.deeper)]) : null
      ]);
      btn.addEventListener("click", function () { toggle(i); });
      var li = el("li", { class: "rung" }, [btn, detail]);
      items.push({ li: li, btn: btn, detail: detail });
      list.appendChild(li);
    });
    function toggle(i, force) {
      var it = items[i];
      var open = force !== undefined ? force : it.btn.getAttribute("aria-expanded") !== "true";
      it.btn.setAttribute("aria-expanded", String(open));
      it.detail.hidden = !open;
      it.li.classList.toggle("open", open);
    }
    function setAll(v) { items.forEach(function (_, i) { toggle(i, v); }); }
    root.appendChild(tools);
    root.appendChild(el("p", { class: "ladder-end small muted" }, "↓ From atoms…"));
    root.appendChild(head);
    root.appendChild(list);
    root.appendChild(el("p", { class: "ladder-end small muted" }, "…to thought ↑"));
  }

  /* =========================================================
     M2. Logic gate playground (CMOS switches)
     ========================================================= */
  var GATES = {
    AND: { stages: [{ ins: ["A", "B"], pd: "series", out: "X", name: "NAND" }, { ins: ["X"], pd: "single", out: "Y", name: "NOT" }], rule: "Output is 1 only if both inputs are 1." },
    OR: { stages: [{ ins: ["A", "B"], pd: "parallel", out: "X", name: "NOR" }, { ins: ["X"], pd: "single", out: "Y", name: "NOT" }], rule: "Output is 1 if either input is 1." },
    NOT: { stages: [{ ins: ["A"], pd: "single", out: "Y", name: "NOT" }], rule: "Output is the opposite of the input." },
    NAND: { stages: [{ ins: ["A", "B"], pd: "series", out: "Y", name: "NAND" }], rule: "Output is 0 only if both inputs are 1 (the opposite of AND)." }
  };

  function gates(root) {
    var state = { A: 0, B: 0, gate: "AND" };
    var bA = el("button", { type: "button", class: "input-btn", "aria-pressed": "false" });
    var bB = el("button", { type: "button", class: "input-btn", "aria-pressed": "false" });
    bA.addEventListener("click", function () { state.A ^= 1; render(); });
    bB.addEventListener("click", function () { state.B ^= 1; render(); });

    var seg = el("div", { class: "seg", role: "radiogroup", "aria-label": "Gate" });
    var segBtns = Object.keys(GATES).map(function (g) {
      var b = el("button", { type: "button", role: "radio", "aria-checked": "false", tabindex: "-1" }, g);
      b.addEventListener("click", function () { state.gate = g; render(); });
      b.addEventListener("keydown", function (e) {
        var keys = Object.keys(GATES), i = keys.indexOf(state.gate);
        if (e.key === "ArrowRight" || e.key === "ArrowDown") i = (i + 1) % keys.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") i = (i + keys.length - 1) % keys.length;
        else return;
        e.preventDefault(); state.gate = keys[i]; render(); segBtns[i].focus();
      });
      seg.appendChild(b);
      return b;
    });

    var outLamp = el("div", { class: "lamp", role: "status", "aria-live": "polite" });
    var rule = el("p", { class: "gate-rule" });
    var nandNote = el("p", { class: "nand-note" }, [
      "Every other gate can be built from NAND alone. ",
      el("a", { href: "/brain-vs-computer/transistors/#all-gates" }, "See how →")
    ]);
    var fig = el("div", { class: "cmos" });
    var legend = el("p", { class: "small muted cmos-legend" }, [
      "Each box is one transistor, acting as a switch. Top switches connect the output to 1 and turn on when their input is 0; bottom switches connect it to 0 and turn on when their input is 1. ",
      el("a", { href: "/brain-vs-computer/transistors/" }, "More in the deep-dive.")
    ]);
    var table = el("div", { class: "table-scroll truth" });

    root.appendChild(el("div", { class: "gate-controls" }, [
      el("div", { class: "inputs" }, [bA, bB]),
      seg
    ]));
    root.appendChild(el("div", { class: "gate-out" }, [outLamp, rule]));
    root.appendChild(nandNote);
    root.appendChild(fig);
    root.appendChild(legend);
    root.appendChild(table);

    function evalGate(g, A, B) {
      var sig = S.cmos.eval(GATES[g].stages, { A: A, B: B });
      return { Y: sig.Y, sig: sig };
    }

    function render() {
      var g = GATES[state.gate], one = state.gate === "NOT";
      bA.setAttribute("aria-pressed", String(!!state.A));
      bA.innerHTML = "";
      bA.append("Input A ", el("span", { class: "bit is-" + state.A }, String(state.A)));
      bB.hidden = one;
      bB.setAttribute("aria-pressed", String(!!state.B));
      bB.innerHTML = "";
      bB.append("Input B ", el("span", { class: "bit is-" + state.B }, String(state.B)));
      segBtns.forEach(function (b) {
        var on = b.textContent === state.gate;
        b.setAttribute("aria-checked", String(on));
        b.setAttribute("tabindex", on ? "0" : "-1");
      });
      var r = evalGate(state.gate, state.A, one ? 0 : state.B);
      outLamp.className = "lamp is-" + r.Y;
      outLamp.innerHTML = "";
      outLamp.append(el("span", { class: "lamp-dot", "aria-hidden": "true" }), "Output ", el("span", { class: "bit is-" + r.Y }, String(r.Y)));
      rule.textContent = state.gate + ": " + g.rule;
      nandNote.hidden = state.gate !== "NAND";
      fig.innerHTML = "";
      fig.appendChild(S.cmos.draw(g.stages, r.sig));
      drawTruth();
    }

    function drawTruth() {
      var one = state.gate === "NOT";
      var rows = one ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
      var t = el("table", null, [
        el("caption", { class: "visually-hidden" }, state.gate + " truth table"),
        el("thead", null, el("tr", null, (one ? ["A"] : ["A", "B"]).concat([state.gate]).map(function (h) { return el("th", { scope: "col" }, h); }))),
        el("tbody", null, rows.map(function (rw) {
          var y = evalGate(state.gate, rw[0], one ? 0 : rw[1]).Y;
          var cur = rw[0] === state.A && (one || rw[1] === state.B);
          return el("tr", { class: cur ? "current" : null, "aria-current": cur ? "true" : null }, rw.concat([y]).map(function (v) { return el("td", null, el("span", { class: "bit is-" + v }, String(v))); }));
        }))
      ]);
      table.innerHTML = "";
      table.appendChild(t);
    }

    render();
  }

  /* =========================================================
     M3. Neuron vs. artificial neuron
     ========================================================= */
  function neuron(root) {
    var REST = -70, THRESH = -55, MV_PER = 1.2; // toy scale: one input at full strength nudges 12 mV
    var inputs = [
      { name: "Input 1", exc: true, on: true, w: 6 },
      { name: "Input 2", exc: true, on: true, w: 5 },
      { name: "Input 3", exc: true, on: false, w: 7 },
      { name: "Input 4", exc: false, on: false, w: 6 }
    ];
    var rows = el("div", { class: "n-inputs" });
    inputs.forEach(function (inp, i) {
      var sid = uid("w");
      var onBtn = el("button", { type: "button", class: "toggle", "aria-pressed": String(inp.on) });
      var typeBtn = el("button", { type: "button", class: "type-btn" });
      var range = el("input", { type: "range", id: sid, min: "0", max: "10", step: "1", value: String(inp.w) });
      var wOut = el("output", { for: sid });
      function sync() {
        onBtn.setAttribute("aria-pressed", String(inp.on));
        onBtn.textContent = inp.on ? "Firing" : "Quiet";
        onBtn.setAttribute("aria-label", inp.name + ": " + (inp.on ? "firing" : "quiet"));
        typeBtn.textContent = inp.exc ? "+ excitatory" : "− inhibitory";
        typeBtn.className = "type-btn " + (inp.exc ? "exc" : "inh");
        typeBtn.setAttribute("aria-label", inp.name + " type: " + (inp.exc ? "excitatory" : "inhibitory") + ". Tap to switch.");
        wOut.textContent = String(inp.w);
      }
      onBtn.addEventListener("click", function () { inp.on = !inp.on; sync(); update(); });
      typeBtn.addEventListener("click", function () { inp.exc = !inp.exc; sync(); update(); });
      range.addEventListener("input", function () { inp.w = +range.value; sync(); update(); });
      sync();
      rows.appendChild(el("div", { class: "n-row" }, [
        el("span", { class: "n-name" }, inp.name), onBtn, typeBtn,
        el("label", { class: "n-strength", for: sid }, [el("span", null, "Strength "), wOut]), range
      ]));
    });

    // biological side
    var bio = svg("svg", { viewBox: "0 0 300 170", role: "img", "aria-label": "Neuron voltage gauge and axon" });
    var G = { x: 20, y: 14, w: 34, h: 140, lo: -90, hi: -40 };
    function vy(v) { return G.y + G.h * (1 - (clamp(v, G.lo, G.hi) - G.lo) / (G.hi - G.lo)); }
    bio.appendChild(svg("rect", { x: G.x, y: G.y, width: G.w, height: G.h, rx: 6, class: "gauge-bg" }));
    var fill = svg("rect", { x: G.x, width: G.w, rx: 6, class: "gauge-fill" });
    bio.appendChild(fill);
    bio.appendChild(svg("line", { x1: G.x - 6, x2: G.x + G.w + 6, y1: vy(THRESH), y2: vy(THRESH), class: "thresh" }));
    bio.appendChild(svg("text", { x: G.x + G.w + 9, y: vy(THRESH) + 4, class: "g-label" }, "threshold −55"));
    bio.appendChild(svg("line", { x1: G.x - 4, x2: G.x + G.w + 4, y1: vy(REST), y2: vy(REST), class: "rest" }));
    bio.appendChild(svg("text", { x: G.x + G.w + 9, y: vy(REST) + 4, class: "g-label muted-text" }, "rest −70"));
    // soma + axon
    var axY = 120, axX0 = 150, axX1 = 290;
    bio.appendChild(svg("circle", { cx: 128, cy: axY, r: 20, class: "soma" }));
    bio.appendChild(svg("line", { x1: axX0, x2: axX1, y1: axY, y2: axY, class: "axon" }));
    bio.appendChild(svg("text", { x: 128, y: axY + 36, "text-anchor": "middle", class: "g-label" }, "cell body"));
    bio.appendChild(svg("text", { x: 220, y: axY + 22, "text-anchor": "middle", class: "g-label" }, "axon →"));
    var spikeLayer = svg("g");
    bio.appendChild(spikeLayer);
    var bioRead = el("p", { class: "n-read", "aria-live": "polite" });

    // artificial side
    var art = el("div", { class: "art" });

    root.appendChild(rows);
    root.appendChild(el("div", { class: "split n-sides" }, [
      el("div", { class: "side is-brain" }, [el("span", { class: "tag" }, "Biological neuron"), bio, bioRead]),
      el("div", { class: "side is-computer" }, [el("span", { class: "tag" }, "Artificial neuron"), art])
    ]));
    root.appendChild(el("p", { class: "small muted" }, "Same inputs drive both. Strength 0–10 acts as the synapse strength on the left and as the weight (÷10) on the right."));

    var timer = null, visible = true, rate = 0;
    S.watchVisible(root, function (v) { visible = v; });

    function update() {
      var sum = 0, wsum = 0, terms = [];
      inputs.forEach(function (inp) {
        var sgn = inp.exc ? 1 : -1, x = inp.on ? 1 : 0, w = sgn * inp.w / 10;
        sum += x * sgn * inp.w * MV_PER;
        wsum += x * w;
        terms.push({ x: x, w: w });
      });
      var V = REST + sum;
      var fires = V >= THRESH;
      fill.setAttribute("y", vy(V));
      fill.setAttribute("height", G.y + G.h - vy(V));
      fill.setAttribute("class", "gauge-fill" + (fires ? " fires" : ""));
      var over = V - THRESH;
      rate = fires ? clamp(1 + Math.floor(over / 4), 1, 5) : 0;
      bioRead.textContent = "Voltage " + V.toFixed(0).replace("-", "−") + " mV. " +
        (fires ? "Over threshold: it fires all-or-nothing spikes" + (rate > 2 ? ", faster the further over it goes." : ".") : "Below threshold: no spike.");
      scheduleSpikes();

      // artificial
      var bias = -1.25; // same threshold, in weight units: 15 mV ÷ (1.2 mV × 10)
      var z = wsum + bias, y = Math.max(0, z);
      art.innerHTML = "";
      art.appendChild(el("div", { class: "art-step" }, [
        el("b", null, "1 · Weighted sum"),
        el("code", null, terms.map(function (t) { return t.x + "×" + fmtW(t.w); }).join(" + ") + " = " + fmtW(wsum))
      ]));
      art.appendChild(el("div", { class: "art-step" }, [
        el("b", null, "2 · Minus threshold"),
        el("code", null, fmtW(wsum) + " − 1.25 = " + fmtW(z))
      ]));
      art.appendChild(el("div", { class: "art-step" }, [
        el("b", null, "3 · Activation (ReLU: keep it if positive)"),
        el("code", null, "max(0, " + fmtW(z) + ") = " + y.toFixed(2))
      ]));
      var bar = el("div", { class: "art-bar" }, el("span", { style: "width:" + clamp(y / 1.5 * 100, 0, 100) + "%" }));
      art.appendChild(el("div", { class: "art-step" }, [el("b", null, "Output: " + y.toFixed(2)), bar,
        el("span", { class: "small muted" }, "A number, not a spike. It changes smoothly; there is no timing.")]));
    }
    function fmtW(v) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(2).replace(/\.?0+$/, "") || "0"; }

    function scheduleSpikes() {
      clearInterval(timer); timer = null;
      spikeLayer.innerHTML = "";
      if (!rate) return;
      if (S.reducedMotion()) {
        for (var i = 0; i < rate; i++) spikeLayer.appendChild(svg("circle", { cx: axX0 + 18 + i * 26, cy: axY, r: 6, class: "spike-dot" }));
        return;
      }
      fire();
      timer = setInterval(fire, 1400 / rate);
    }
    function fire() {
      if (!visible) return;
      var dot = svg("circle", { cx: axX0, cy: axY, r: 6, class: "spike-dot" });
      spikeLayer.appendChild(dot);
      var t0 = performance.now();
      (function step(t) {
        var p = (t - t0) / 900;
        if (p >= 1) { dot.remove(); return; }
        dot.setAttribute("cx", axX0 + (axX1 - axX0) * p);
        requestAnimationFrame(step);
      })(t0);
    }
    update();
  }

  /* =========================================================
     M4. Synapse close-up
     ========================================================= */
  function synapse(root) {
    var st = { chem: true, glu: true, dopa: false, strength: 1, busy: false };
    var W = 340, H = 300;
    var pic = svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Synapse: sending terminal above, gap, receiving dendrite below, and the receiving neuron's voltage trace" });
    var wash = svg("rect", { x: 0, y: 0, width: W, height: 196, class: "wash", rx: 12 });
    pic.appendChild(wash);
    // axon + terminal
    pic.appendChild(svg("path", { d: "M150 0 L150 22 Q90 30 80 70 Q78 92 110 96 L230 96 Q262 92 260 70 Q250 30 190 22 L190 0 Z", class: "pre" }));
    pic.appendChild(svg("text", { x: 272, y: 46, class: "g-label" }, "axon"));
    pic.appendChild(svg("text", { x: 272, y: 60, class: "g-label" }, "terminal"));
    var vesicles = svg("g");
    [[120, 70], [150, 58], [182, 72], [212, 62], [140, 84], [200, 85]].forEach(function (p) {
      vesicles.appendChild(svg("circle", { cx: p[0], cy: p[1], r: 7, class: "vesicle" }));
    });
    pic.appendChild(vesicles);
    var gapLabel = svg("text", { x: 272, y: 116, class: "g-label" }, "gap");
    pic.appendChild(gapLabel);
    // post
    pic.appendChild(svg("rect", { x: 60, y: 134, width: 220, height: 50, rx: 18, class: "post" }));
    pic.appendChild(svg("text", { x: 288, y: 156, class: "g-label" }, "next"));
    pic.appendChild(svg("text", { x: 288, y: 170, class: "g-label" }, "neuron"));
    var receptors = svg("g");
    pic.appendChild(receptors);
    var junctions = svg("g", { class: "junctions" });
    [130, 170, 210].forEach(function (x) { junctions.appendChild(svg("rect", { x: x - 7, y: 94, width: 14, height: 42, rx: 3, class: "junction" })); });
    pic.appendChild(junctions);
    var particles = svg("g");
    pic.appendChild(particles);
    var spikeDot = svg("circle", { cx: 170, cy: -10, r: 7, class: "spike-dot" });
    pic.appendChild(spikeDot);
    // trace
    var TY = 250, TX0 = 20, TX1 = W - 20;
    pic.appendChild(svg("line", { x1: TX0, x2: TX1, y1: TY, y2: TY, class: "rest" }));
    pic.appendChild(svg("text", { x: TX0, y: 212, class: "g-label" }, "Next neuron's voltage"));
    pic.appendChild(svg("text", { x: TX1, y: 222, "text-anchor": "end", class: "g-label muted-text" }, "↑ toward firing"));
    pic.appendChild(svg("text", { x: TX1, y: 292, "text-anchor": "end", class: "g-label muted-text" }, "↓ away from firing"));
    pic.appendChild(svg("text", { x: TX0, y: TY - 4, class: "g-label muted-text" }, "rest"));
    var trace = svg("polyline", { class: "trace", points: "" });
    pic.appendChild(trace);

    var steps = el("ol", { class: "syn-steps" }, [
      "A spike arrives at the axon terminal.",
      "The terminal releases neurotransmitters.",
      "They cross the gap and bind to receptors on the next neuron.",
      "Ion channels open and nudge the next neuron's voltage."
    ].map(function (t) { return el("li", null, t); }));
    var stepItems = steps.querySelectorAll("li");

    var fireBtn = el("button", { type: "button", class: "primary" }, "Send a spike");
    var practiceBtn = el("button", { type: "button" }, "Practice ×5");
    var resetBtn = el("button", { type: "button" }, "Reset");
    var segType = S.segmented("Synapse type", [["chem", "Chemical"], ["elec", "Electrical"]], "chem", function (v) { st.chem = v === "chem"; sync(); });
    var segTx = S.segmented("Neurotransmitter", [["glu", "Glutamate (excitatory)"], ["gaba", "GABA (inhibitory)"]], "glu", function (v) { st.glu = v === "glu"; sync(); });
    var dopaBtn = el("button", { type: "button", class: "toggle", "aria-pressed": "false" }, "Dopamine wash");
    dopaBtn.addEventListener("click", function () { st.dopa = !st.dopa; sync(); });
    var status = el("p", { class: "syn-status", "aria-live": "polite" });
    var meter = el("div", { class: "strength-meter" }, el("span"));

    fireBtn.addEventListener("click", function () { fire(); });
    practiceBtn.addEventListener("click", practice);
    resetBtn.addEventListener("click", function () { st.strength = 1; events = []; sync(); drawTrace(); status.textContent = "Reset: synapse back to starting strength."; });

    root.appendChild(el("div", { class: "syn-controls" }, [
      el("div", { class: "ctl" }, [el("span", { class: "ctl-label" }, "Type"), segType.node]),
      el("div", { class: "ctl tx-ctl" }, [el("span", { class: "ctl-label" }, "Transmitter"), segTx.node]),
      el("div", { class: "ctl" }, [el("span", { class: "ctl-label" }, "Region"), dopaBtn])
    ]));
    root.appendChild(el("div", { class: "syn-layout" }, [
      el("div", { class: "syn-pic" }, pic),
      el("div", { class: "syn-side" }, [steps,
        el("div", null, [el("span", { class: "ctl-label" }, "Synapse strength"), meter]),
        el("div", { class: "btn-row" }, [fireBtn, practiceBtn, resetBtn]), status])
    ]));

    var events = []; // {t, amp}
    var raf = null;

    function sync() {
      segTx.node.closest(".ctl").hidden = !st.chem;
      vesicles.style.display = st.chem ? "" : "none";
      junctions.style.display = st.chem ? "none" : "";
      receptors.style.display = st.chem ? "" : "none";
      gapLabel.textContent = st.chem ? "gap" : "gap junction";
      dopaBtn.setAttribute("aria-pressed", String(st.dopa));
      wash.setAttribute("class", "wash" + (st.dopa ? " on" : ""));
      practiceBtn.disabled = !st.chem;
      practiceBtn.title = st.chem ? "" : "Electrical synapses can't be adjusted";
      stepItems[1].textContent = st.chem ? "The terminal releases neurotransmitters." : "(Electrical: no chemical step.)";
      stepItems[2].textContent = st.chem ? "They cross the gap and bind to receptors on the next neuron." : "Charge passes straight through the gap junction.";
      // receptors grow with strength
      receptors.innerHTML = "";
      var n = Math.round(3 + (st.strength - 1) * 5);
      for (var i = 0; i < n; i++) {
        var x = 80 + (180 / (n - 1 || 1)) * i;
        receptors.appendChild(svg("path", { d: "M" + (x - 6) + " 128 L" + (x - 6) + " 136 L" + (x + 6) + " 136 L" + (x + 6) + " 128", class: "receptor" }));
      }
      meter.firstChild.style.width = ((st.strength - 1) / 1.6 * 100) + "%";
      meter.setAttribute("aria-label", "Synapse strength ×" + st.strength.toFixed(1));
      meter.title = "×" + st.strength.toFixed(1);
    }

    function amplitude() {
      var a = st.chem ? (st.glu ? 1 : -0.8) * st.strength : 0.8;
      return a * (st.dopa ? 1.5 : 1);
    }

    function setStep(i) { stepItems.forEach(function (li, k) { li.classList.toggle("active", k === i); li.classList.toggle("done", k < i); }); }

    function fire(cb) {
      if (st.busy) { if (cb) setTimeout(function () { fire(cb); }, 200); return; }
      st.busy = true; fireBtn.disabled = true;
      var amp = amplitude();
      var desc = st.chem ? (st.glu ? "Glutamate pushed the next neuron toward firing." : "GABA pushed the next neuron away from firing.") : "Charge flowed straight across: fast, fixed strength.";
      if (S.reducedMotion()) {
        setStep(4);
        events.push({ t: performance.now() - 300, amp: amp });
        drawTrace();
        done();
        return;
      }
      var t0 = performance.now(), chem = st.chem, released = false, landed = false;
      var arrive = 350, cross = chem ? 650 : 120, land = arrive + cross;
      setStep(0);
      (function step(t) {
        var e = t - t0;
        if (e < arrive) {
          spikeDot.setAttribute("cy", -10 + (60 * e / arrive));
        } else {
          spikeDot.setAttribute("cy", -10);
          if (!released) {
            released = true; setStep(1);
            var xs = chem ? [120, 150, 170, 190, 220] : [130, 170, 210];
            xs.forEach(function (x) { particles.appendChild(svg("circle", { cx: x, cy: 100, r: chem ? 4 : 3, class: chem ? "nt" : "ion" })); });
          }
          var p = clamp((e - arrive) / cross, 0, 1);
          Array.prototype.forEach.call(particles.childNodes, function (c) { c.setAttribute("cy", 100 + 30 * p); });
          if (p > .5 && chem) setStep(2);
          if (p >= 1 && !landed) {
            landed = true; setStep(3);
            particles.innerHTML = "";
            events.push({ t: performance.now(), amp: amp });
            loop();
          }
        }
        if (e < land + 50) requestAnimationFrame(step); else done();
      })(t0);
      function done() { st.busy = false; fireBtn.disabled = false; status.textContent = desc; if (cb) cb(); }
    }

    function practice() {
      if (st.busy || practiceBtn.disabled) return;
      var left = 5;
      practiceBtn.disabled = true;
      (function next() {
        if (!left--) {
          practiceBtn.disabled = !st.chem;
          status.textContent = "Practice made the synapse stronger: more receptors, a bigger response. That's learning.";
          return;
        }
        st.strength = Math.min(2.6, st.strength + 0.2);
        sync();
        if (S.reducedMotion()) { events.push({ t: performance.now() - 300 + left * 10, amp: amplitude() }); drawTrace(); next(); }
        else fire(function () { setTimeout(next, 150); });
      })();
    }

    // trace: sum of decaying bumps over a 4-second window
    var WIN = 4000;
    function shape(dt) { if (dt < 0) return 0; return (Math.exp(-dt / 500) - Math.exp(-dt / 60)) * 1.35; }
    function drawTrace() {
      var now = performance.now(), pts = [];
      for (var i = 0; i <= 120; i++) {
        var t = now - WIN + (WIN * i / 120), v = 0;
        events.forEach(function (ev) { v += ev.amp * shape(t - ev.t); });
        pts.push((TX0 + (TX1 - TX0) * i / 120).toFixed(1) + "," + (TY - clamp(v * 11, -30, 30)).toFixed(1));
      }
      trace.setAttribute("points", pts.join(" "));
      events = events.filter(function (ev) { return now - ev.t < WIN + 500; });
    }
    function loop() {
      if (raf || S.reducedMotion()) { drawTrace(); return; }
      (function tick() {
        drawTrace();
        raf = events.length ? requestAnimationFrame(tick) : null;
      })();
    }

    sync(); setStep(-1); drawTrace();
  }

  /* =========================================================
     M5. Speed, scale and power
     ========================================================= */
  function speed(root) {
    var NERVE = 100, BOARD = 1.5e8, TRACK = 0.15; // m/s, m/s, metres (15 cm)
    var SLOW = 1e9; // slow-motion factor: 1 ns → 1 s

    // --- log-scale speed chart
    root.appendChild(el("h4", null, "Signal speed (log scale)"));
    var cw = 320, ch = 110, L = 8, R = cw - 8;
    function lx(v) { return L + (R - L) * Math.log10(v) / 9; }
    var chart = svg("svg", { viewBox: "0 0 " + cw + " " + ch, role: "img", "aria-label": "Log-scale bars: nerve signal about 100 metres per second; board wiring about 150 million metres per second." });
    [0, 3, 6, 9].forEach(function (p) {
      chart.appendChild(svg("line", { x1: lx(Math.pow(10, p)), x2: lx(Math.pow(10, p)), y1: 8, y2: ch - 22, class: "grid" }));
      chart.appendChild(svg("text", { x: lx(Math.pow(10, p)), y: ch - 6, "text-anchor": p === 0 ? "start" : p === 9 ? "end" : "middle", class: "axis" }, ["1", "1,000", "1 million", "1 billion"][p / 3] + (p === 9 ? " m/s" : "")));
    });
    function hbar(y, v, cls, label) {
      var g = svg("g", { class: "bar " + cls });
      g.appendChild(svg("title", null, label));
      g.appendChild(svg("rect", { x: L, y: y, width: lx(v) - L, height: 18, rx: 4 }));
      g.appendChild(svg("text", { x: L + 4, y: y - 4, class: "bar-label" }, label));
      chart.appendChild(g);
    }
    hbar(24, NERVE, "is-brain", "Fastest nerve signal: ~100 m/s");
    hbar(64, BOARD, "is-computer", "Board wiring: ~150,000,000 m/s");
    root.appendChild(chart);
    root.appendChild(el("p", { class: "small muted" }, "Board-wiring speed from [R12]. Each gridline is 1,000× faster than the last. The chip signal is " + S.fmt(BOARD / NERVE) + "× faster."));

    // --- race
    root.appendChild(el("h4", null, "Race over 15 cm, slowed down a billion times"));
    var raceSvg = svg("svg", { viewBox: "0 0 320 84", role: "img", "aria-label": "Race track, 15 centimetres" });
    function lane(y, cls, name) {
      raceSvg.appendChild(svg("line", { x1: 10, x2: 300, y1: y, y2: y, class: "track" }));
      raceSvg.appendChild(svg("text", { x: 10, y: y - 10, class: "g-label" }, name));
      var d = svg("circle", { cx: 10, cy: y, r: 7, class: "runner " + cls });
      raceSvg.appendChild(d);
      return d;
    }
    raceSvg.appendChild(svg("line", { x1: 300, x2: 300, y1: 10, y2: 80, class: "finish" }));
    var dc = lane(30, "is-computer", "Board wiring");
    var dn = lane(70, "is-brain", "Nerve (100 m/s)");
    var raceBtn = el("button", { type: "button", class: "primary" }, "Start race");
    var raceOut = el("p", { class: "race-out", "aria-live": "polite" }, "1 nanosecond of real time = 1 second here.");
    root.appendChild(raceSvg);
    root.appendChild(el("div", { class: "btn-row" }, [raceBtn]));
    root.appendChild(raceOut);
    var nerveSlowSec = (TRACK / NERVE) * SLOW, chipSlowSec = (TRACK / BOARD) * SLOW;
    var days = nerveSlowSec / 86400;
    raceBtn.addEventListener("click", function () {
      raceBtn.disabled = true;
      var t0 = performance.now(), RUN = 5000;
      function frac(sec, total) { return Math.min(1, sec / total); }
      function set(sec) {
        dc.setAttribute("cx", 10 + 290 * frac(sec, chipSlowSec));
        dn.setAttribute("cx", 10 + 290 * frac(sec, nerveSlowSec));
        var pct = (frac(sec, nerveSlowSec) * 100);
        raceOut.textContent = (sec >= chipSlowSec ? "Chip signal: finished in " + chipSlowSec.toFixed(0) + " s (1 ns real). " : "Running… ") +
          "Nerve signal: " + pct.toPrecision(2) + "% of the way. At this pace it finishes in about " + days.toFixed(0) + " days.";
      }
      if (S.reducedMotion()) { set(RUN / 1000); raceBtn.disabled = false; return; }
      (function step(t) {
        var sec = (t - t0) / 1000;
        set(Math.min(sec, RUN / 1000));
        if (t - t0 < RUN) requestAnimationFrame(step); else raceBtn.disabled = false;
      })(t0);
    });

    // --- parallelism
    root.appendChild(el("h4", null, "Parallelism"));
    var BR = 20, BC = 20, CR = 8, CC = 8;
    var brainDots = [], coreSq = [];
    var bsvg = svg("svg", { viewBox: "0 0 200 200", role: "img", "aria-label": "Grid of 400 dots, a few lighting up at random times" });
    for (var r = 0; r < BR; r++) for (var c = 0; c < BC; c++) {
      var d = svg("circle", { cx: 5 + c * 10, cy: 5 + r * 10, r: 3.2, class: "pdot" });
      bsvg.appendChild(d); brainDots.push(d);
    }
    var csvg = svg("svg", { viewBox: "0 0 200 200", role: "img", "aria-label": "Grid of 64 squares that all light together on each clock tick" });
    for (r = 0; r < CR; r++) for (c = 0; c < CC; c++) {
      var q = svg("rect", { x: 3 + c * 25, y: 3 + r * 25, width: 19, height: 19, rx: 3, class: "pcore" });
      csvg.appendChild(q); coreSq.push(q);
    }
    var clockTxt = el("span", { class: "clock-tick" }, "tick 0");
    var playBtn = el("button", { type: "button", class: "toggle", "aria-pressed": "false" }, "Play");
    root.appendChild(el("div", { class: "split par" }, [
      el("div", { class: "side is-brain" }, [el("span", { class: "tag" }, "Brain"), bsvg,
        el("p", { class: "small" }, ["~86 billion neurons,[R1] no clock. Each dot ≈ " + S.fmt(86e9 / (BR * BC) / 1e6) + " million neurons. Only a sprinkle is strongly active at once (possibly <1%).[R13]"])]),
      el("div", { class: "side is-computer" }, [el("span", { class: "tag" }, "H100 chip"), csvg,
        el("p", { class: "small" }, ["16,896 cores, one clock.[R11] Each square ≈ " + S.fmt(16896 / (CR * CC)) + " cores. ", clockTxt])])
    ]));
    root.appendChild(el("div", { class: "btn-row" }, [playBtn, el("span", { class: "small muted" }, "Animation is slowed far below real speed.")]));

    var playing = false, visible = true, timers = [], tick = 0;
    S.watchVisible(root, function (v) { visible = v; });
    function snapshot() {
      brainDots.forEach(function (d, i) { d.classList.toggle("lit", i % 97 === 13); });
      coreSq.forEach(function (q) { q.classList.add("lit"); });
    }
    function start() {
      timers.push(setInterval(function () {
        if (!visible) return;
        // ~1% lit at any moment: each 100 ms light ~1 random dot for ~400 ms
        var d = brainDots[Math.floor(Math.random() * brainDots.length)];
        d.classList.add("lit");
        setTimeout(function () { d.classList.remove("lit"); }, 400);
      }, 100));
      timers.push(setInterval(function () {
        if (!visible) return;
        tick++; clockTxt.textContent = "tick " + tick;
        coreSq.forEach(function (q) { q.classList.add("lit"); });
        setTimeout(function () { coreSq.forEach(function (q) { q.classList.remove("lit"); }); }, 250);
      }, 700));
    }
    function stop() { timers.forEach(clearInterval); timers = []; }
    playBtn.addEventListener("click", function () {
      playing = !playing;
      playBtn.setAttribute("aria-pressed", String(playing));
      playBtn.textContent = playing ? "Pause" : "Play";
      if (playing) { brainDots.forEach(function (d) { d.classList.remove("lit"); }); coreSq.forEach(function (q) { q.classList.remove("lit"); }); start(); }
      else { stop(); snapshot(); }
    });
    snapshot();

    // --- power
    root.appendChild(el("h4", null, "Power"));
    var psvg = svg("svg", { viewBox: "0 0 320 92", role: "img", "aria-label": "Power: brain about 20 watts, one H100 700 watts" });
    function pbar(y, w, cls, label) {
      var g = svg("g", { class: "bar " + cls });
      g.appendChild(svg("title", null, label));
      g.appendChild(svg("rect", { x: 8, y: y, width: Math.max(3, 304 * w / 700), height: 20, rx: 4 }));
      g.appendChild(svg("text", { x: 8, y: y - 5, class: "bar-label" }, label));
      psvg.appendChild(g);
    }
    pbar(22, 20, "is-brain", "Brain: ~20 W (textbook value)");
    pbar(64, 700, "is-computer", "One H100: 700 W");
    root.appendChild(psvg);
    root.appendChild(el("p", { class: "small muted" }, "One H100 draws " + (700 / 20) + "× the power of a whole brain.[R4][R11]"));
  }

  /* =========================================================
     M6. Two kinds of memory
     ========================================================= */
  var PATTERNS = {
    Heart: ["......", ".##.##", "######", "######", ".####.", "..##.."],
    House: ["..##..", ".####.", "######", "#....#", "#.##.#", "#.##.#"],
    Cross: ["#....#", ".#..#.", "..##..", "..##..", ".#..#.", "#....#"]
  };
  function memory(root) {
    // ----- computer: address lookup
    var MEM = ["cat", "42", "blue", "Paris", "7:15 am", "hello", "3.14", "Ada"];
    var addrId = uid("addr");
    var addr = el("input", { id: addrId, type: "number", inputmode: "numeric", min: "0", value: "2", class: "addr-in" });
    var fetchBtn = el("button", { type: "button", class: "primary" }, "Fetch");
    var res = el("p", { class: "fetch-out", "aria-live": "polite" });
    var cells = MEM.map(function (v, i) { return el("tr", null, [el("td", null, el("code", null, String(i))), el("td", null, v)]); });
    var memTable = el("table", { class: "mem-table" }, [
      el("thead", null, el("tr", null, [el("th", null, "Address"), el("th", null, "Stored")])),
      el("tbody", null, cells)
    ]);
    function doFetch() {
      var raw = addr.value.trim(), a = Number(raw);
      cells.forEach(function (c) { c.classList.remove("hit"); });
      if (raw !== "" && Number.isInteger(a) && a >= 0 && a < MEM.length) {
        cells[a].classList.add("hit");
        res.textContent = "Address " + a + " → \"" + MEM[a] + "\". Exactly the same every time.";
      } else {
        res.textContent = "Address " + (raw || "(blank)") + " → nothing. A wrong address returns nothing at all.";
      }
    }
    fetchBtn.addEventListener("click", doFetch);
    addr.addEventListener("keydown", function (e) { if (e.key === "Enter") doFetch(); });

    // ----- brain-style: Hopfield network
    var N = 36, names = Object.keys(PATTERNS);
    var pats = names.map(function (n) { return PATTERNS[n].join("").split("").map(function (ch) { return ch === "#" ? 1 : -1; }); });
    var Wt = [];
    for (var i = 0; i < N; i++) { Wt.push(new Array(N).fill(0)); }
    pats.forEach(function (p) { for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) if (i !== j) Wt[i][j] += p[i] * p[j] / N; });

    var s = new Array(N).fill(0); // 1 on, -1 off, 0 unknown
    var gridEl = el("div", { class: "hgrid", role: "group", "aria-label": "Network units, 6 by 6. Tap a unit to flip it." });
    var units = [];
    for (i = 0; i < N; i++) {
      (function (k) {
        var b = el("button", { type: "button", class: "hu", "aria-label": "Unit " + (Math.floor(k / 6) + 1) + "," + (k % 6 + 1) });
        b.addEventListener("click", function () { if (running) return; s[k] = s[k] === 1 ? -1 : 1; draw(); hres.textContent = ""; });
        gridEl.appendChild(b); units.push(b);
      })(i);
    }
    var thumbs = el("div", { class: "thumbs" }, names.map(function (n, k) {
      return el("div", { class: "thumb" }, [miniGrid(pats[k]), el("span", null, n)]);
    }));
    var noiseId = uid("noise");
    var noise = el("input", { type: "range", id: noiseId, min: "0", max: "45", step: "5", value: "15" });
    var noiseOut = el("output", { for: noiseId }, "15%");
    noise.addEventListener("input", function () { noiseOut.textContent = noise.value + "%"; });
    var cur = names[0];
    var cueSel = S.segmented("Memory to cue", names.map(function (n) { return [n, n]; }), names[0], function (v) { cur = v; });
    var partialBtn = el("button", { type: "button" }, "Partial cue");
    var noisyBtn = el("button", { type: "button" }, "Noisy cue");
    var recallBtn = el("button", { type: "button", class: "primary" }, "Recall");
    var clearBtn = el("button", { type: "button" }, "Clear");
    var hres = el("p", { class: "hop-out", "aria-live": "polite" });
    var running = false;

    partialBtn.addEventListener("click", function () {
      var p = pats[names.indexOf(cur)];
      s = p.map(function (v, k) { return k < 18 ? v : 0; });
      draw(); hres.textContent = "Top half of " + cur + " shown; the bottom half is unknown (?). Now press Recall.";
    });
    noisyBtn.addEventListener("click", function () {
      var p = pats[names.indexOf(cur)], q = +noise.value / 100;
      s = p.map(function (v) { return Math.random() < q ? -v : v; });
      draw(); hres.textContent = cur + " with " + noise.value + "% of units flipped. Now press Recall.";
    });
    clearBtn.addEventListener("click", function () { s = new Array(N).fill(0); draw(); hres.textContent = ""; });
    recallBtn.addEventListener("click", recall);

    function recall() {
      if (running) return;
      running = true; recallBtn.disabled = true;
      var order = [], sweeps = 0, changed = 0;
      function refill() { order = []; for (var k = 0; k < N; k++) order.push(k); order.sort(function () { return Math.random() - .5; }); }
      refill();
      function stepOne() {
        var k = order.pop();
        var h = 0; for (var j = 0; j < N; j++) h += Wt[k][j] * s[j];
        var v = h >= 0 ? 1 : -1;
        if (v !== s[k]) { s[k] = v; changed++; }
        if (!order.length) {
          sweeps++;
          if (!changed || sweeps >= 10) return true;
          changed = 0; refill();
        }
        return false;
      }
      if (S.reducedMotion()) { while (!stepOne()) {} finish(); return; }
      (function tick() {
        var fin = false;
        for (var n = 0; n < 2 && !fin; n++) fin = stepOne();
        draw();
        if (fin) finish(); else setTimeout(tick, 22);
      })();
    }
    function finish() {
      running = false; recallBtn.disabled = false; draw();
      var match = -1;
      pats.forEach(function (p, k) { if (p.every(function (v, j) { return v === s[j]; })) match = k; });
      if (match === -1) hres.textContent = "Settled on a mixed-up pattern that isn't any stored memory.";
      else if (names[match] === cur) hres.textContent = "Recalled: " + names[match] + ". The network filled in the rest.";
      else hres.textContent = "Recalled: " + names[match] + ", but you cued " + cur + ". The wrong memory came back whole and confident: a false memory.";
    }
    function draw() {
      units.forEach(function (u, k) {
        u.className = "hu " + (s[k] === 1 ? "on" : s[k] === -1 ? "off" : "unk");
        u.setAttribute("aria-pressed", String(s[k] === 1));
      });
    }
    function miniGrid(p) {
      var g = svg("svg", { viewBox: "0 0 36 36", "aria-hidden": "true" });
      p.forEach(function (v, k) { if (v === 1) g.appendChild(svg("rect", { x: (k % 6) * 6 + .5, y: Math.floor(k / 6) * 6 + .5, width: 5, height: 5, rx: 1 })); });
      return g;
    }

    root.appendChild(el("div", { class: "split mem" }, [
      el("div", { class: "side is-computer" }, [
        el("span", { class: "tag" }, "Computer: fetch by address"),
        el("div", { class: "fetch-row" }, [el("label", { for: addrId }, "Address"), addr, fetchBtn]),
        res, el("div", { class: "table-scroll" }, memTable)
      ]),
      el("div", { class: "side is-brain" }, [
        el("span", { class: "tag" }, "Brain-style: complete a pattern"),
        el("p", { class: "small" }, "Stored memories:"), thumbs,
        el("div", { class: "ctl" }, [el("span", { class: "ctl-label" }, "Cue"), cueSel.node]),
        el("div", { class: "noise-row" }, [el("label", { for: noiseId }, "Noise "), noiseOut, noise]),
        el("div", { class: "btn-row" }, [partialBtn, noisyBtn]),
        gridEl,
        el("div", { class: "btn-row" }, [recallBtn, clearBtn]),
        hres,
        el("p", { class: "small muted" }, "Try 40% noise a few times: sometimes the wrong memory comes back.")
      ])
    ]));
    draw(); doFetch();
  }

  /* =========================================================
     M7. Slice-through
     ========================================================= */
  function slices(root) {
    var SLICES = 5300, IMAGES = 225e6, SYN = 150e6, PB = 1.4;
    // invented "cells": tubes (x,y drift with depth) and blobs
    var rnd = mulberry(7), cellsDef = [];
    for (var i = 0; i < 26; i++) cellsDef.push({ x: rnd() * 180 + 10, y: rnd() * 180 + 10, dx: (rnd() - .5) * 120, dy: (rnd() - .5) * 120, r: 3 + rnd() * 5, z0: rnd() * .5, z1: .5 + rnd() * .5 });
    for (i = 0; i < 9; i++) cellsDef.push({ x: rnd() * 160 + 20, y: rnd() * 160 + 20, dx: 0, dy: 0, r: 14 + rnd() * 10, z0: rnd() * .7, z1: 0, blob: true, h: .12 + rnd() * .15 });

    var rid = uid("slice");
    var range = el("input", { type: "range", id: rid, min: "0", max: String(SLICES), step: "1", value: "0" });
    var cube = svg("svg", { viewBox: "0 0 160 150", role: "img", "aria-label": "Tissue cube with a cutting plane" });
    // isometric cube
    cube.appendChild(svg("path", { d: "M30 50 L90 30 L140 50 L80 70 Z", class: "cube-top" }));
    cube.appendChild(svg("path", { d: "M30 50 L80 70 L80 140 L30 120 Z", class: "cube-left" }));
    cube.appendChild(svg("path", { d: "M80 70 L140 50 L140 120 L80 140 Z", class: "cube-right" }));
    var plane = svg("path", { class: "cut-plane" });
    cube.appendChild(plane);
    cube.appendChild(svg("text", { x: 80, y: 18, "text-anchor": "middle", class: "g-label" }, "1 mm³ of cortex"));
    var view = svg("svg", { viewBox: "0 0 200 200", role: "img", "aria-label": "The current slice, seen from above" });
    view.appendChild(svg("rect", { x: 0, y: 0, width: 200, height: 200, rx: 8, class: "slice-bg" }));
    var vg = svg("g");
    view.appendChild(vg);
    var counters = el("dl", { class: "counters" });
    function counter(label) { var dd = el("dd"); counters.append(el("dt", null, label), dd); return dd; }
    var cSl = counter("Slices cut (30 nm each)"), cIm = counter("Images taken (4 nm resolution)"), cSy = counter("Synapses found"), cDa = counter("Data stored");
    var scaleBtn = el("button", { type: "button" }, "Scale up to a whole brain");
    var scaleOut = el("p", { class: "scale-out", "aria-live": "polite" });
    scaleBtn.addEventListener("click", function () {
      scaleOut.innerHTML = "";
      scaleOut.append(el("b", null, "This cube × 1,000,000 ≈ one human brain."),
        " The cube alone held about 57,000 cells and 150 million synapses,[R6] in 1.4 petabytes of images.[R5] And a map still isn't a simulation: it shows what connects to what, not how each connection behaves.[R8]");
      S.linkFootnotes(scaleOut);
    });

    root.appendChild(el("div", { class: "slice-layout" }, [
      el("div", null, [cube, el("p", { class: "small muted center" }, "Drag to cut")]),
      el("div", null, [view, el("p", { class: "small muted center" }, "Current slice (invented cells)")])
    ]));
    root.appendChild(el("label", { for: rid, class: "ctl-label" }, "Slice"));
    root.appendChild(range);
    root.appendChild(counters);
    root.appendChild(el("div", { class: "btn-row" }, [scaleBtn]));
    root.appendChild(scaleOut);

    function update() {
      var n = +range.value, f = n / SLICES;
      // plane moves from front-left face toward back (top face edge)
      var o = f * 50;
      plane.setAttribute("d", "M" + (30 + o) + " " + (50 - o * .4) + " L" + (80 + o) + " " + (70 - o * .4) + " L" + (80 + o) + " " + (140 - o * .4) + " L" + (30 + o) + " " + (120 - o * .4) + " Z");
      vg.innerHTML = "";
      cellsDef.forEach(function (c) {
        var z = f;
        if (c.blob) {
          var dz = Math.abs(z - c.z0); if (dz > c.h) return;
          var rr = c.r * Math.sqrt(1 - Math.pow(dz / c.h, 2));
          vg.appendChild(svg("circle", { cx: c.x, cy: c.y, r: rr, class: "cell-body" }));
        } else {
          if (z < c.z0 || z > c.z1) return;
          vg.appendChild(svg("circle", { cx: c.x + c.dx * (z - .5), cy: c.y + c.dy * (z - .5), r: c.r, class: "cell-tube" }));
        }
      });
      cSl.textContent = S.fmt(n) + " of ~5,300";
      cIm.textContent = S.fmt(IMAGES * f) + " of ~225 million";
      cSy.textContent = S.fmt(SYN * f) + " of ~150 million";
      cDa.textContent = (PB * f * 1000).toFixed(0) + " TB of ~1.4 PB";
    }
    range.addEventListener("input", update);
    update();
  }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* =========================================================
     M8. Self-check: matching + quiz
     ========================================================= */
  var MATCH = {
    brain: [
      { id: "ion", label: "Ion channel", answer: "transistor", why: "Both are gates that open or close based on voltage. The best pairing on the ladder." },
      { id: "syn", label: "Synapse strength", answer: "weight", why: "Both are adjustable connection strengths. A functional analogy, not a physical one." },
      { id: "spike", label: "Spike", answer: "bit", why: "Both are basic signals, but loosely: spikes carry meaning in timing and rate; bits in fixed levels." },
      { id: "neuron", label: "Neuron", answer: "mininet", why: "One real neuron is closer to a small processor, or a 5–8 layer network of its own.[R3]" },
      { id: "pattern", label: "Pattern of firing", answer: "vector", why: "Both are a pattern that represents something: the working definition of a thought." },
      { id: "terminal", label: "Axon terminal", answer: "none", why: "A terminal is just the end of an axon, the neuron's output point. \"Neuron ↔ terminal\" is a common mistake." }
    ],
    comp: [
      { id: "transistor", label: "Transistor" },
      { id: "weight", label: "AI weight" },
      { id: "bit", label: "Bit (0 or 1)" },
      { id: "mininet", label: "A mini neural network" },
      { id: "vector", label: "Activation vector" },
      { id: "none", label: "No real counterpart" }
    ]
  };
  var QUIZ = [
    { q: "Inside a neuron, what carries the electrical charge?", a: ["Electrons in wires", "Ions such as sodium and potassium", "Neurotransmitters", "Dopamine"], c: 1, why: "It's charged atoms (ions), mainly sodium and potassium, flowing through ion channels." },
    { q: "Which pairing does the page rate as the best analogy?", a: ["Neuron ↔ logic gate", "Ion channel ↔ transistor", "Axon terminal ↔ transistor", "Brain region ↔ wire"], c: 1, why: "Both are gates that open or close based on voltage. Neuron ↔ gate is rated weak." },
    { q: "A spike is all-or-nothing. So where is the information?", a: ["In how big the spike is", "In when and how often spikes happen", "In the color of the signal", "In the chemical used"], c: 1, why: "Every spike is the same size; information is in the timing and rate." },
    { q: "A 2021 study mimicked one realistic cortical neuron with a deep network. How deep?", a: ["1 layer", "2 layers", "5–8 layers", "Hundreds of layers"], c: 2, why: "It took 5–8 layers.[R3] That's why \"neuron ≈ logic gate\" is a weak analogy." },
    { q: "What does GABA do at a synapse?", a: ["Pushes the next neuron toward firing", "Pushes the next neuron away from firing", "Stores the memory address", "Speeds up the clock"], c: 1, why: "GABA is inhibitory. Glutamate is excitatory." },
    { q: "Where does the brain store memories?", a: ["In a separate memory area, fetched by address", "In the strengths of synapses, where processing happens", "In the blood", "Only in the cell bodies"], c: 1, why: "Synapse strengths, in the same place as processing. Computers keep memory separate." },
    { q: "Why do false memories happen?", a: ["Memories are played back like a file", "Memories are rebuilt each time they're recalled", "The brain has too little storage", "Neurons fire too fast"], c: 1, why: "Recall reconstructs a pattern from cues, so it can drift or complete the wrong pattern." },
    { q: "Roughly how much power does a brain use, vs. one H100 chip?", a: ["20 W vs. 700 W", "700 W vs. 20 W", "About the same", "2 W vs. 70 W"], c: 0, why: "About 20 W for a brain (textbook value) vs. 700 W for one H100.[R4][R11]" },
    { q: "C. elegans has only 302 neurons, mapped in 1986. Why can't we fully simulate it?", a: ["The map was lost", "A map shows what connects, not how each connection behaves", "302 is too many for computers", "Its neurons don't use electricity"], c: 1, why: "A static wiring map leaves out how connections behave, and it can't learn.[R7][R8]" },
    { q: "Is an AI's activation pattern felt or experienced?", a: ["Yes, definitely", "No, definitely not", "Unknown: it's an open question", "Only on H100 chips"], c: 2, why: "Only brains are known to have experiences. Whether an AI's pattern is felt is open." }
  ];

  function selfCheck(root) {
    S.selfCheck(root, {
      key: "bvc-selfcheck-v1",
      intro: "Tap a brain part, then the computer counterpart it matches best. One has no real counterpart.",
      left: { cls: "is-brain", items: MATCH.brain },
      right: { cls: "is-computer", items: MATCH.comp },
      hint: function (b, c) {
        return b.id === "terminal" && c.id === "transistor"
          ? "Not quite. A terminal is just the end of an axon; the transistor's real partner is the ion channel." : null;
      },
      quiz: QUIZ
    });
  }
})();
