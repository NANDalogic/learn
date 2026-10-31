/* T4. Truth-table explorer (D4): all 16 two-input functions, each with a NAND-only build.
   Pattern = outputs for rows (A,B) = 00, 01, 10, 11.
   The builds were derived for this page; each is re-checked against its truth table below. */
(function () {
  "use strict";
  var S = window.Site, el = S.el, svg = S.svg;

  var ROWS = [[0, 0], [0, 1], [1, 0], [1, 1]];
  var F = [
    { p: "0000", name: "always 0", words: "Output is always 0.", build: [["n1", "A", "A"], ["n2", "A", "n1"], ["n3", "n2", "n2"]] },
    { p: "0001", name: "AND", common: true, words: "1 only if both inputs are 1.", build: [["n1", "A", "B"], ["n2", "n1", "n1"]] },
    { p: "0010", name: "A AND NOT B", words: "1 only when A is 1 and B is 0.", build: [["n1", "A", "B"], ["n2", "A", "n1"], ["n3", "n2", "n2"]] },
    { p: "0011", name: "just A", words: "Copies A and ignores B.", wire: "A" },
    { p: "0100", name: "B AND NOT A", words: "1 only when B is 1 and A is 0.", build: [["n1", "A", "B"], ["n2", "B", "n1"], ["n3", "n2", "n2"]] },
    { p: "0101", name: "just B", words: "Copies B and ignores A.", wire: "B" },
    { p: "0110", name: "XOR", common: true, words: "1 if the inputs differ.", build: [["n1", "A", "B"], ["n2", "A", "n1"], ["n3", "B", "n1"], ["n4", "n2", "n3"]] },
    { p: "0111", name: "OR", common: true, words: "1 if either input is 1.", build: [["n1", "A", "A"], ["n2", "B", "B"], ["n3", "n1", "n2"]] },
    { p: "1000", name: "NOR", common: true, words: "The opposite of OR: 1 only if both are 0.", build: [["n1", "A", "A"], ["n2", "B", "B"], ["n3", "n1", "n2"], ["n4", "n3", "n3"]] },
    { p: "1001", name: "XNOR", common: true, words: "1 if the inputs are the same.", build: [["n1", "A", "B"], ["n2", "A", "n1"], ["n3", "B", "n1"], ["n4", "n2", "n3"], ["n5", "n4", "n4"]] },
    { p: "1010", name: "NOT B", words: "The opposite of B; ignores A.", build: [["n1", "B", "B"]] },
    { p: "1011", name: "A OR NOT B", words: "0 only when A is 0 and B is 1.", build: [["n1", "A", "B"], ["n2", "B", "n1"]] },
    { p: "1100", name: "NOT A", words: "The opposite of A; ignores B.", build: [["n1", "A", "A"]] },
    { p: "1101", name: "NOT A OR B", words: "0 only when A is 1 and B is 0.", build: [["n1", "A", "B"], ["n2", "A", "n1"]] },
    { p: "1110", name: "NAND", common: true, words: "The opposite of AND: 0 only if both are 1.", build: [["n1", "A", "B"]] },
    { p: "1111", name: "always 1", words: "Output is always 1.", build: [["n1", "A", "A"], ["n2", "A", "n1"]] }
  ];

  function run(f, a, b) {
    if (f.wire) return f.wire === "A" ? a : b;
    var s = { A: a, B: b };
    f.build.forEach(function (g) { s[g[0]] = 1 - (s[g[1]] & s[g[2]]); });
    return s[f.build[f.build.length - 1][0]];
  }
  function verify(f) { return ROWS.map(function (r) { return run(f, r[0], r[1]); }).join("") === f.p; }

  S.module("t4", function (root) {
    var bad = F.filter(function (f) { return !verify(f); });
    if (bad.length) root.appendChild(el("p", { class: "todo" }, "Build check failed for: " + bad.map(function (f) { return f.p; }).join(", ")));

    var grid = el("div", { class: "fn-grid", role: "listbox", "aria-label": "The 16 two-input functions" });
    var detail = el("div", { class: "fn-detail", "aria-live": "polite" });
    var btns = F.map(function (f, i) {
      var b = el("button", { type: "button", class: "fn-btn" + (f.common ? " common" : ""), role: "option", "aria-selected": "false" }, [
        el("span", { class: "fn-pattern" }, f.p), el("span", { class: "fn-name" }, f.name)
      ]);
      b.addEventListener("click", function () { select(i); });
      b.addEventListener("keydown", function (e) {
        var d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 4, ArrowUp: -4 }[e.key];
        if (d === undefined) return;
        e.preventDefault();
        var j = (i + d + 16) % 16; select(j); btns[j].focus();
      });
      grid.appendChild(b);
      return b;
    });
    root.appendChild(el("p", { class: "small muted" }, "Each tile shows its outputs for the rows 00, 01, 10, 11. Named gates are outlined."));
    root.appendChild(grid);
    root.appendChild(detail);

    function select(i) {
      btns.forEach(function (b, k) { b.setAttribute("aria-selected", String(k === i)); b.tabIndex = k === i ? 0 : -1; });
      var f = F[i];
      detail.innerHTML = "";
      detail.appendChild(el("h4", null, [f.name, " ", el("span", { class: "fn-pattern" }, "(" + f.p + ")")]));
      detail.appendChild(el("p", null, f.words));
      detail.appendChild(el("div", { class: "table-scroll truth" }, el("table", null, [
        el("thead", null, el("tr", null, ["A", "B", "Out"].map(function (h) { return el("th", { scope: "col" }, h); }))),
        el("tbody", null, ROWS.map(function (r, k) {
          var y = +f.p[k];
          return el("tr", null, [r[0], r[1], y].map(function (v) { return el("td", null, el("span", { class: "bit is-" + v }, String(v))); }));
        }))
      ])));
      var n = f.wire ? 0 : f.build.length;
      detail.appendChild(el("h4", null, "Built from NAND only: " + n + " NAND gate" + (n === 1 ? "" : "s")));
      if (f.wire) {
        detail.appendChild(el("p", null, "No gate needed: it's a plain wire from " + f.wire + "."));
      } else {
        detail.appendChild(diagram(f));
        detail.appendChild(el("ol", { class: "recipe" }, f.build.map(function (g) {
          return el("li", null, el("code", null, g[0] + " = " + g[1] + " NAND " + g[2]));
        })));
      }
      detail.appendChild(el("p", { class: "small muted" }, verify(f) ? "✓ Checked: this build gives the same outputs as the truth table for all 4 rows." : "✕ This build does not match its truth table."));
    }
    select(1);
  });

  /* layered NAND diagram */
  function diagram(f) {
    var depth = { A: 0, B: 0 }, cols = {}, pos = {};
    f.build.forEach(function (g) {
      var d = 1 + Math.max(depth[g[1]], depth[g[2]]);
      depth[g[0]] = d;
      (cols[d] = cols[d] || []).push(g[0]);
    });
    var maxD = Math.max.apply(null, Object.keys(cols).map(Number));
    var maxRows = Math.max.apply(null, Object.keys(cols).map(function (k) { return cols[k].length; }));
    var COLW = 92, ROWH = 62, H = Math.max(2, maxRows) * ROWH + 20, W = 40 + maxD * COLW + 60;
    pos.A = { x: 26, y: H / 2 - 22 }; pos.B = { x: 26, y: H / 2 + 22 };
    Object.keys(cols).forEach(function (d) {
      var list = cols[d];
      list.forEach(function (name, i) { pos[name] = { x: 40 + d * COLW - 20, y: (H / (list.length + 1)) * (i + 1) }; });
    });
    var root = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "nand-diagram", role: "img", "aria-label": "NAND-only circuit for " + f.name + " with " + f.build.length + " gates" });
    var usesB = f.build.some(function (g) { return g[1] === "B" || g[2] === "B"; });
    var usesA = f.build.some(function (g) { return g[1] === "A" || g[2] === "A"; });
    if (usesA) { root.appendChild(svg("text", { x: 8, y: pos.A.y + 4, class: "g-label nd-in" }, "A")); }
    if (usesB) { root.appendChild(svg("text", { x: 8, y: pos.B.y + 4, class: "g-label nd-in" }, "B")); }
    f.build.forEach(function (g) {
      var p = pos[g[0]];
      [g[1], g[2]].forEach(function (src, k) {
        var s = pos[src], sx = src === "A" || src === "B" ? s.x : s.x + 24, ty = p.y + (k ? 8 : -8);
        var mx = (sx + p.x - 22) / 2;
        root.appendChild(svg("path", { d: "M" + sx + " " + s.y + " C" + mx + " " + s.y + " " + mx + " " + ty + " " + (p.x - 22) + " " + ty, class: "nd-wire" }));
      });
      root.appendChild(svg("path", { d: "M" + (p.x - 22) + " " + (p.y - 16) + " h22 a16 16 0 0 1 0 32 h-22 Z", class: "nd-gate" }));
      root.appendChild(svg("circle", { cx: p.x + 20, cy: p.y, r: 4, class: "nd-bubble" }));
      root.appendChild(svg("text", { x: p.x - 6, y: p.y - 21, "text-anchor": "middle", class: "g-label" }, g[0]));
    });
    var last = pos[f.build[f.build.length - 1][0]];
    root.appendChild(svg("line", { x1: last.x + 24, x2: last.x + 44, y1: last.y, y2: last.y, class: "nd-wire" }));
    root.appendChild(svg("text", { x: last.x + 47, y: last.y + 4, class: "g-label" }, "Out"));
    return root;
  }
})();
