/* T8. Keypress-to-pixel pipeline (D7). Step text is read from the page's own
   "All 12 steps as text" list, so the wording lives in one place. */
(function () {
  "use strict";
  var S = window.Site, el = S.el, svg = S.svg;

  // capital A outline (outer contour + counter), in a 100×100 box
  var OUTER = [[4, 100], [40, 0], [60, 0], [96, 100], [76, 100], [67, 74], [33, 74], [24, 100]];
  var INNER = [[39, 56], [61, 56], [50, 24]];
  function inPoly(x, y, poly) {
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var a = poly[i], b = poly[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }
  function inside(x, y) { return inPoly(x, y, OUTER) && !inPoly(x, y, INNER); }
  function raster(n, aa) {
    var cells = [], step = 100 / n, ss = aa ? 4 : 1;
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      var hit = 0;
      for (var i = 0; i < ss; i++) for (var j = 0; j < ss; j++) {
        var x = c * step + (aa ? (j + .5) * step / ss : step / 2), y = r * step + (aa ? (i + .5) * step / ss : step / 2);
        if (inside(x, y)) hit++;
      }
      cells.push(hit / (ss * ss));
    }
    return cells;
  }

  var G = [
    function () { // 1 key matrix
      var s = svg("svg", { viewBox: "0 0 220 130", role: "img", "aria-label": "Key grid: pressing A connects one row wire to one column wire" });
      grid(s, -1);
      s.appendChild(svg("circle", { cx: 50, cy: 60, r: 9, class: "k-press" }));
      s.appendChild(svg("text", { x: 50, y: 64, "text-anchor": "middle", class: "g-label k-key" }, "A"));
      return s;
    },
    function () { // 2 scan: at(sec) energizes column floor(sec / 0.6) mod 4
      var s = svg("svg", { viewBox: "0 0 220 130", role: "img", "aria-label": "The keyboard energizes one column at a time and reads the rows" });
      var col = svg("g"); s.appendChild(col);
      grid(s, 0);
      var shown = -1;
      function at(sec) {
        var k = Math.floor(sec / 0.6 + 1e-9) % 4;
        if (k === shown) return;
        shown = k;
        col.innerHTML = "";
        col.appendChild(svg("rect", { x: 40 + k * 40, y: 14, width: 20, height: 106, rx: 4, class: "k-col" }));
        if (k === 0) col.appendChild(svg("circle", { cx: 50, cy: 60, r: 9, class: "k-press" }));
      }
      at(0);
      s.appendChild(svg("text", { x: 110, y: 10, "text-anchor": "middle", class: "g-label muted-text" }, "columns energized one at a time"));
      return { node: s, at: at };
    },
    function () { // 3 code not letter
      return el("div", { class: "k-boxes" }, [
        el("div", { class: "k-box yes" }, [el("b", null, "✓ Sends"), el("span", null, "\"the key at usage 0x04 is down\"")]),
        el("div", { class: "k-box no" }, [el("b", null, "✕ Doesn't send"), el("span", null, "\"the letter A\"")])
      ]);
    },
    function () { // 4 USB report
      var bytes = [["Shift on", "modifiers", true], ["00", "reserved"], ["04", "key 1", true], ["00", "key 2"], ["00", "key 3"], ["00", "key 4"], ["00", "key 5"], ["00", "key 6"]];
      return el("div", { class: "usb" }, bytes.map(function (b, i) {
        return el("div", { class: "usb-byte" + (b[2] ? " hot" : "") }, [el("span", { class: "usb-val" }, b[0]), el("span", { class: "usb-lbl" }, "byte " + (i + 1) + " · " + b[1])]);
      }));
    },
    function () { // 5 layout
      return el("div", { class: "k-flow" }, [el("span", { class: "k-chip" }, "key 0x04 + Shift"), el("span", { class: "k-arrow" }, "→"), el("span", { class: "k-chip" }, "keyboard layout"), el("span", { class: "k-arrow" }, "→"), el("span", { class: "k-chip big" }, "A")]);
    },
    function () { // 6 character code
      return el("div", { class: "k-code" }, [
        el("div", null, [el("b", null, "U+0041"), " LATIN CAPITAL LETTER A"]),
        el("div", null, ["= 65 = ", S.byteRow ? S.byteRow(65) : "0100 0001"]),
        el("div", { class: "small muted" }, "UTF-8: stored as that one byte, 0x41.")
      ]);
    },
    function () { // 7 app receives
      return el("div", { class: "k-flow" }, [el("span", { class: "k-chip mono" }, "WM_CHAR 'A'"), el("span", { class: "k-arrow" }, "→"), el("span", { class: "k-field" }, ["Hello ", el("b", null, "A"), el("span", { class: "k-caret" }, "|")])]);
    },
    function () { // 8 glyph outline
      var s = svg("svg", { viewBox: "-10 -10 220 120", role: "img", "aria-label": "The glyph for A as an outline, with its points marked" });
      s.appendChild(svg("text", { x: 120, y: 30, class: "g-label" }, "cmap:"));
      s.appendChild(svg("text", { x: 120, y: 46, class: "g-label" }, "U+0041 → glyph"));
      s.appendChild(svg("path", { d: path(OUTER) + path(INNER), class: "glyph", "fill-rule": "evenodd" }));
      OUTER.concat(INNER).forEach(function (p) { s.appendChild(svg("circle", { cx: p[0], cy: p[1], r: 2.6, class: "glyph-pt" })); });
      return s;
    },
    function () { // 9 rasterize
      var wrap = el("div", { class: "k-raster" });
      var aa = true;
      var holder = el("div");
      var btn = el("button", { type: "button", class: "toggle", "aria-pressed": "true" }, "Anti-aliasing on");
      btn.addEventListener("click", function () { aa = !aa; btn.setAttribute("aria-pressed", String(aa)); btn.textContent = "Anti-aliasing " + (aa ? "on" : "off"); draw(); });
      function draw() { holder.innerHTML = ""; holder.appendChild(pixels(raster(14, aa), 14)); }
      draw();
      wrap.append(holder, btn);
      return wrap;
    },
    function () { // 10 framebuffer
      var n = 14, cells = raster(n, true), rows = [];
      for (var r = 3; r < 9; r++) {
        var row = [];
        for (var c = 2; c < 10; c++) row.push(Math.round(cells[r * n + c] * 255));
        rows.push(row);
      }
      return el("div", { class: "fb" }, [
        el("p", { class: "small muted" }, "A corner of the grid, as numbers (0 = dark, 255 = full brightness):"),
        el("div", { class: "fb-grid" }, rows.map(function (row) {
          return el("div", { class: "fb-row" }, row.map(function (v) { return el("span", { style: "--v:" + (v / 255) }, String(v)); }));
        }))
      ]);
    },
    function () { // 11 refresh: at(sec) moves the scan line
      var s = svg("svg", { viewBox: "0 0 220 120", role: "img", "aria-label": "A screen being redrawn top to bottom from the framebuffer" });
      s.appendChild(svg("rect", { x: 40, y: 10, width: 140, height: 90, rx: 6, class: "scr" }));
      s.appendChild(svg("text", { x: 110, y: 64, "text-anchor": "middle", class: "scr-a" }, "A"));
      var line = svg("rect", { x: 40, y: 10, width: 140, height: 4, class: "scan" });
      s.appendChild(line);
      s.appendChild(svg("text", { x: 110, y: 116, "text-anchor": "middle", class: "g-label" }, "redrawn 60 or 120 times a second"));
      return { node: s, at: function (sec) { line.setAttribute("y", 10 + (sec / 1.5 % 1) * 86); } }; // one sweep per 1.5 s, slowed far down
    },
    function () { // 12 light
      var s = svg("svg", { viewBox: "0 0 260 130", role: "img", "aria-label": "One pixel made of red, green and blue subpixels; LCD uses a backlight and one transistor per pixel, OLED pixels make their own light with at least two transistors" });
      [["#e5484d", 0], ["#30a46c", 1], ["#3e63dd", 2]].forEach(function (c) { s.appendChild(svg("rect", { x: 14 + c[1] * 16, y: 20, width: 13, height: 46, rx: 2, fill: c[0] })); });
      s.appendChild(svg("text", { x: 38, y: 82, "text-anchor": "middle", class: "g-label" }, "one pixel"));
      s.appendChild(svg("text", { x: 38, y: 96, "text-anchor": "middle", class: "g-label muted-text" }, "R G B"));
      s.appendChild(svg("text", { x: 90, y: 30, class: "g-label" }, [svg("tspan", { "font-weight": "700" }, "LCD:"), " backlight shines through;"]));
      s.appendChild(svg("text", { x: 90, y: 44, class: "g-label" }, "1 transistor per pixel sets"));
      s.appendChild(svg("text", { x: 90, y: 58, class: "g-label" }, "how much light gets through"));
      s.appendChild(svg("text", { x: 90, y: 84, class: "g-label" }, [svg("tspan", { "font-weight": "700" }, "OLED:"), " each pixel makes"]));
      s.appendChild(svg("text", { x: 90, y: 98, class: "g-label" }, "its own light, with at least"));
      s.appendChild(svg("text", { x: 90, y: 112, class: "g-label" }, "2 transistors; black = fully off"));
      return s;
    }
  ];

  function grid(s, hotCol) {
    for (var r = 0; r < 3; r++) s.appendChild(svg("line", { x1: 20, x2: 200, y1: 30 + r * 30, y2: 30 + r * 30, class: "k-wire" }));
    for (var c = 0; c < 4; c++) s.appendChild(svg("line", { x1: 50 + c * 40, x2: 50 + c * 40, y1: 16, y2: 116, class: "k-wire" + (c === hotCol ? " hot" : "") }));
    s.appendChild(svg("text", { x: 8, y: 34, class: "g-label muted-text" }, "rows"));
    s.appendChild(svg("text", { x: 200, y: 126, "text-anchor": "end", class: "g-label muted-text" }, "columns"));
  }
  function path(pts) { return "M" + pts.map(function (p) { return p[0] + " " + p[1]; }).join(" L") + " Z "; }
  function pixels(cells, n) {
    var s = svg("svg", { viewBox: "0 0 " + n * 10 + " " + n * 10, class: "pix", role: "img", "aria-label": "The letter A as a grid of pixels" });
    cells.forEach(function (v, i) {
      s.appendChild(svg("rect", { x: (i % n) * 10 + .5, y: Math.floor(i / n) * 10 + .5, width: 9, height: 9, style: "fill-opacity:" + (0.06 + v * 0.94), class: "px" }));
    });
    return s;
  }

  S.module("t8", function (root) {
    var items = Array.prototype.slice.call(document.querySelectorAll("#keypress .steps-text li"));
    var N = G.length, SPU = 6, cur = -1, anim = null, tl; // SPU: seconds per step when playing
    var dots = el("div", { class: "k-dots", role: "tablist", "aria-label": "Steps" });
    var dotBtns = G.map(function (_, k) {
      var b = el("button", { type: "button", role: "tab", class: "k-dot", "aria-label": "Step " + (k + 1) }, String(k + 1));
      b.addEventListener("click", function () { tl.seek(k); });
      dots.appendChild(b);
      return b;
    });
    var stage = el("div", { class: "k-stage", role: "tabpanel", "aria-live": "polite" });

    // draw(t): step = floor(t); time inside the step drives the scan (2) and refresh (11) graphics.
    function draw(t) {
      var k = S.clamp(Math.floor(t + 1e-9), 0, N - 1);
      if (k !== cur) {
        cur = k;
        dotBtns.forEach(function (b, n) { b.setAttribute("aria-selected", String(n === k)); b.classList.toggle("seen", n < k); });
        stage.innerHTML = "";
        var g = G[k]();
        anim = g.at ? g : null;
        var text = items[k] ? items[k].cloneNode(true) : el("span", null, "");
        var p = el("p", { class: "k-text" }, [el("span", { class: "k-num" }, (k + 1) + " / " + N + " ")]);
        while (text.firstChild) p.appendChild(text.firstChild);
        stage.appendChild(el("div", { class: "k-graphic" }, anim ? g.node : g));
        stage.appendChild(p);
      }
      if (anim) anim.at(Math.max(0, t - k) * SPU);
    }
    tl = S.timeline({
      id: "t8", duration: N, start: 0, secPerUnit: SPU, draw: draw, stepper: true, caption: false,
      beats: G.map(function (_, k) { return { t: k, label: function () { return "Step " + (k + 1) + " of " + N + ". " + (items[k] ? items[k].textContent.trim() : ""); } }; }),
      labels: { play: "▶ Play all 12 steps", replay: "▶ Play again" }
    });
    root.append(dots, stage, tl.node);
  });
})();
