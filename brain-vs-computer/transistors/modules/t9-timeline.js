/* T9. Timeline of switches (D8): log-scale count of switches per machine/chip */
(function () {
  "use strict";
  var S = window.Site, el = S.el, svg = S.svg;

  var PTS = [
    { y: 1941, n: 2300, t: "relay", name: "Zuse Z3", story: "2,300 relays (electromagnetic switches).[R53]", label: true },
    { y: 1944, n: 3500, t: "relay", name: "Harvard Mark I", story: "3,500 relays.[R53]" },
    { y: 1945.5, n: 17000, t: "tube", name: "ENIAC (1945–46)", story: "More than 17,000 vacuum tubes.[R54]", label: true },
    { y: 1971, n: 2300, t: "transistor", name: "Intel 4004", story: "The first microprocessor, built for a Busicom calculator: 2,300 transistors.[R60]", label: true },
    { y: 1978, n: 29000, t: "transistor", name: "Intel 8086", story: "29,000 transistors.[R61]" },
    { y: 1982, n: 134000, t: "transistor", name: "Intel 80286", story: "134,000 transistors.[R61]" },
    { y: 1985, n: 275000, t: "transistor", name: "Intel 80386", story: "275,000 transistors.[R61]" },
    { y: 1989, n: 1.2e6, t: "transistor", name: "Intel 486", story: "The first x86 chip over 1 million: 1.2 million transistors.[R61]" },
    { y: 1993, n: 3.1e6, t: "transistor", name: "Intel Pentium", story: "3.1 million transistors.[R61]", label: true },
    { y: 2006, n: 1.72e9, t: "transistor", name: "Itanium 2 \"Montecito\"", story: "Intel Itanium 2 \"Montecito\": 1.72 billion transistors.[R62]" },
    { y: 2022, n: 80e9, t: "transistor", name: "NVIDIA H100", story: "80 billion transistors.[R66]", label: true },
    { y: 2024, n: 208e9, t: "transistor", name: "NVIDIA Blackwell", story: "Two dies: 208 billion transistors.[R63]" },
    { y: 2024, n: 4e12, t: "transistor", name: "Cerebras WSE-3", story: "A whole wafer as one chip: 4 trillion transistors.[R65]", label: true },
    { y: 2026, n: 336e9, t: "transistor", name: "NVIDIA Rubin GPU", story: "Announced Jan 2026, two dies: 336 billion transistors.[R64]" }
  ];
  var EVENTS = [
    { y: 1947.9, name: "First transistor (Dec 1947)", story: "Point-contact, germanium. Bardeen and Brattain, Bell Labs. One switch.[R55]" },
    { y: 1954, name: "First silicon transistors (1954)", story: "First silicon transistors.[R96]" },
    { y: 1958, name: "First integrated circuit (1958)", story: "Kilby, TI.[R56]" },
    { y: 1959, name: "Practical silicon IC (1959)", story: "Patent filed: Noyce, Fairchild.[R57]" },
    { y: 1960, name: "MOSFET (1959–60)", story: "Atalla and Kahng, Bell Labs.[R58]" }
  ];
  var TYPES = { relay: "Relay", tube: "Vacuum tube", transistor: "Transistor" };

  S.module("t9", function (root) {
    var W = 340, H = 236, L = 34, R = W - 10, T = 26, B = H - 22;
    var X0 = 1938, X1 = 2028, Y0 = 3, Y1 = 13;
    function xs(y) { return L + (R - L) * (y - X0) / (X1 - X0); }
    function ys(n) { return B - (B - T) * (Math.log10(n) - Y0) / (Y1 - Y0); }

    var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "tl", role: "group", "aria-label": "Timeline: number of switches per machine or chip, log scale from a thousand to ten trillion" });
    [[3, "1K"], [5, "100K"], [7, "10M"], [9, "1B"], [11, "100B"], [13, "10T"]].forEach(function (g) {
      var y = ys(Math.pow(10, g[0]));
      s.appendChild(svg("line", { x1: L, x2: R, y1: y, y2: y, class: "grid" }));
      s.appendChild(svg("text", { x: L - 5, y: y + 3, "text-anchor": "end", class: "axis" }, g[1]));
    });
    s.appendChild(svg("text", { x: 2, y: T - 4, class: "axis" }, "switches (log scale)"));
    [1940, 1960, 1980, 2000, 2020].forEach(function (yr) {
      s.appendChild(svg("text", { x: xs(yr), y: B + 14, "text-anchor": "middle", class: "axis" }, String(yr)));
    });
    s.appendChild(svg("line", { x1: L, x2: R, y1: B, y2: B, class: "axis-line" }));
    var detail = el("div", { class: "tl-detail", "aria-live": "polite" }, el("p", { class: "small muted" }, "Tap a point for its story."));
    var marks = [];
    function mark(node, item) {
      node.setAttribute("tabindex", "0");
      node.setAttribute("role", "button");
      node.setAttribute("aria-label", item.name + (item.n ? ", " + S.fmt(item.n) + " " + (TYPES[item.t] || "").toLowerCase() + "s" : ""));
      node.addEventListener("click", function () { show(item, node); });
      node.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(item, node); } });
      marks.push(node);
    }
    PTS.forEach(function (p) {
      var x = xs(p.y), y = ys(p.n), g = svg("g", { class: "tl-pt t-" + p.t });
      g.appendChild(svg("circle", { cx: x, cy: y, r: 13, class: "hit" }));
      if (p.t === "relay") g.appendChild(svg("rect", { x: x - 4.5, y: y - 4.5, width: 9, height: 9, class: "mk" }));
      else if (p.t === "tube") g.appendChild(svg("path", { d: "M" + x + " " + (y - 6) + " L" + (x + 5.5) + " " + (y + 4) + " L" + (x - 5.5) + " " + (y + 4) + " Z", class: "mk" }));
      else g.appendChild(svg("circle", { cx: x, cy: y, r: 4.5, class: "mk" }));
      if (p.label) g.appendChild(svg("text", { x: x + (p.y > 2010 ? -7 : 7), y: p.name === "Zuse Z3" ? y + 15 : y - 7, "text-anchor": p.y > 2010 ? "end" : "start", class: "tl-lbl" }, p.name.replace("NVIDIA ", "").replace("Intel ", "")));
      s.appendChild(g); mark(g, p);
    });
    var evRow = el("div", { class: "tl-events" }, [el("span", { class: "small muted" }, "Milestones with no count:")]);
    EVENTS.forEach(function (e) {
      var b = el("button", { type: "button", class: "tl-chip" }, e.name);
      b.addEventListener("click", function () { show(e, b); });
      marks.push(b);
      evRow.appendChild(b);
    });

    var legend = el("div", { class: "tl-legend" }, Object.keys(TYPES).map(function (t) {
      return el("span", { class: "tl-key t-" + t }, [el("span", { class: "sw" }), TYPES[t]]);
    }));
    root.append(legend, el("div", { class: "tl-scroll" }, s), evRow, detail);

    function show(item, node) {
      marks.forEach(function (m) { m.classList.remove("sel"); });
      node.classList.add("sel");
      detail.innerHTML = "";
      detail.append(el("h4", null, item.name + (item.n ? " · " + item.y.toString().replace(".5", "") : "")), el("p", null, item.story));
      S.linkFootnotes(detail);
    }
  });
})();
