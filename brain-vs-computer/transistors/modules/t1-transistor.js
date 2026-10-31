/* T1. Transistor cross-section (D1) */
(function () {
  "use strict";
  var S = window.Site, el = S.el, svg = S.svg;

  S.module("t1", function (root) {
    var TH = 4; // threshold on a unitless 0–10 slider
    var st = { v: 0, shape: "planar" };

    var sid = S.uid("vg");
    var range = el("input", { type: "range", id: sid, min: "0", max: "10", step: "1", value: "0" });
    var vOut = el("output", { for: sid }, "0");
    var readout = el("p", { class: "t1-read", "aria-live": "polite" });

    // side view
    var side = svg("svg", { viewBox: "0 0 340 215", role: "img", "aria-label": "Side view of a MOSFET: source, drain, channel, gate on its oxide" });
    side.appendChild(svg("rect", { x: 14, y: 100, width: 312, height: 100, rx: 8, class: "t1-body" }));
    side.appendChild(svg("text", { x: 170, y: 190, "text-anchor": "middle", class: "g-label muted-text" }, "silicon body"));
    side.appendChild(svg("rect", { x: 26, y: 100, width: 86, height: 44, rx: 10, class: "t1-sd" }));
    side.appendChild(svg("rect", { x: 228, y: 100, width: 86, height: 44, rx: 10, class: "t1-sd" }));
    side.appendChild(svg("text", { x: 69, y: 127, "text-anchor": "middle", class: "g-label" }, "source"));
    side.appendChild(svg("text", { x: 271, y: 127, "text-anchor": "middle", class: "g-label" }, "drain"));
    var channel = svg("rect", { x: 112, y: 100, width: 116, height: 0, class: "t1-channel" });
    side.appendChild(channel);
    side.appendChild(svg("rect", { x: 108, y: 90, width: 124, height: 10, class: "t1-oxide" }));
    side.appendChild(svg("rect", { x: 116, y: 56, width: 108, height: 34, rx: 4, class: "t1-gate" }));
    side.appendChild(svg("text", { x: 170, y: 78, "text-anchor": "middle", class: "g-label t1-gate-text" }, "gate"));
    side.appendChild(svg("text", { x: 238, y: 96, class: "g-label muted-text" }, "oxide"));
    side.appendChild(svg("line", { x1: 170, x2: 170, y1: 20, y2: 56, class: "t1-lead" }));
    side.appendChild(svg("line", { x1: 69, x2: 69, y1: 40, y2: 100, class: "t1-lead" }));
    side.appendChild(svg("line", { x1: 271, x2: 271, y1: 40, y2: 100, class: "t1-lead" }));
    var vLabel = svg("text", { x: 178, y: 30, class: "g-label" }, "gate voltage");
    side.appendChild(vLabel);
    var chLabel = svg("text", { x: 170, y: 160, "text-anchor": "middle", class: "g-label" }, "no channel");
    side.appendChild(chLabel);
    var dots = svg("g");
    side.appendChild(dots);

    // cross-section of the shape
    var segShape = S.segmented("Transistor shape", [["planar", "Planar"], ["finfet", "FinFET"], ["gaa", "Gate-all-around"]], "planar", function (v) { st.shape = v; drawShape(); });
    var shapeSvg = svg("svg", { viewBox: "0 0 200 150", role: "img" });
    var shapeCap = el("p", { class: "small center" });

    root.appendChild(el("div", { class: "t1-ctl" }, [
      el("label", { for: sid, class: "ctl-label" }, ["Gate voltage ", vOut, " (no units)"]), range
    ]));
    root.appendChild(side);
    root.appendChild(readout);
    root.appendChild(el("h4", null, "Shapes: looking along the channel"));
    root.appendChild(segShape.node);
    root.appendChild(el("div", { class: "t1-shape" }, [shapeSvg, shapeCap]));

    var timer = null, visible = true;
    S.watchVisible(root, function (v) { visible = v; });

    function update() {
      st.v = +range.value;
      vOut.textContent = String(st.v);
      var on = st.v >= TH;
      var thick = on ? 4 + (st.v - TH) * 1.2 : 0;
      channel.setAttribute("height", thick);
      chLabel.textContent = on ? "channel formed: current flows" : st.v > 0 ? "below threshold: no channel yet" : "no channel";
      readout.innerHTML = "";
      readout.append(el("span", { class: "bit is-" + (on ? 1 : 0) }, on ? "ON" : "OFF"), " ",
        on ? "Enough gate voltage: a layer of charge bridges source and drain." : "Not enough gate voltage: no path from source to drain.");
      flow(on);
      drawShape();
    }

    function flow(on) {
      clearInterval(timer); timer = null;
      dots.innerHTML = "";
      if (!on) return;
      if (S.reducedMotion()) {
        [130, 160, 190, 215].forEach(function (x) { dots.appendChild(svg("circle", { cx: x, cy: 103, r: 3, class: "t1-dot" })); });
        dots.appendChild(svg("text", { x: 170, y: 120, "text-anchor": "middle", class: "g-label" }, "→ current →"));
        return;
      }
      timer = setInterval(function () {
        if (!visible) return;
        var d = svg("circle", { cx: 69, cy: 112, r: 3, class: "t1-dot" });
        dots.appendChild(d);
        var t0 = performance.now();
        (function step(t) {
          var p = (t - t0) / 1400;
          if (p >= 1 || !d.isConnected) { d.remove(); return; }
          var x = 69 + 202 * p, y = (x > 112 && x < 228) ? 103 : 112;
          d.setAttribute("cx", x); d.setAttribute("cy", y);
          requestAnimationFrame(step);
        })(t0);
      }, Math.max(120, 520 - st.v * 40));
    }

    function drawShape() {
      shapeSvg.innerHTML = "";
      var on = st.v >= TH, chCls = "t1-ch-x" + (on ? " on" : "");
      shapeSvg.appendChild(svg("rect", { x: 10, y: 110, width: 180, height: 34, rx: 4, class: "t1-body" }));
      var sides;
      if (st.shape === "planar") {
        shapeSvg.appendChild(svg("rect", { x: 50, y: 104, width: 100, height: 10, class: chCls }));
        shapeSvg.appendChild(svg("rect", { x: 50, y: 78, width: 100, height: 22, rx: 3, class: "t1-gate" }));
        sides = 1;
      } else if (st.shape === "finfet") {
        shapeSvg.appendChild(svg("path", { d: "M70 110 V40 H130 V110 H116 V54 H84 V110 Z", class: "t1-gate" }));
        shapeSvg.appendChild(svg("rect", { x: 88, y: 58, width: 24, height: 52, class: chCls }));
        sides = 3;
      } else {
        shapeSvg.appendChild(svg("rect", { x: 56, y: 22, width: 88, height: 86, rx: 6, class: "t1-gate" }));
        [32, 58, 84].forEach(function (y) { shapeSvg.appendChild(svg("rect", { x: 70, y: y, width: 60, height: 12, rx: 2, class: chCls })); });
        sides = 4;
      }
      shapeSvg.appendChild(svg("text", { x: 100, y: 14, "text-anchor": "middle", class: "g-label" }, "gray = gate · inner shape = channel"));
      shapeSvg.setAttribute("aria-label", segLabel() + " cross-section: the gate touches the channel on " + sides + (sides === 1 ? " side" : " sides"));
      shapeCap.textContent = segLabel() + ": the gate touches the channel on " + sides + (sides === 1 ? " side." : " sides.") +
        (st.shape === "gaa" ? " Each ribbon is wrapped all the way around." : "");
    }
    function segLabel() { return { planar: "Planar", finfet: "FinFET", gaa: "Gate-all-around" }[st.shape]; }

    range.addEventListener("input", update);
    update();
  });
})();
