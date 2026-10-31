/* T6. SR latch from two cross-coupled NOR gates (D5) */
(function () {
  "use strict";
  var S = window.Site, el = S.el, svg = S.svg;

  S.module("t6", function (root) {
    var st = { S: 0, R: 0, Q: 0, Qn: 1 };

    function settle() {
      for (var k = 0; k < 6; k++) {
        var q = (st.R | st.Qn) ? 0 : 1;
        var qn = (st.S | q) ? 0 : 1;
        if (q === st.Q && qn === st.Qn) break;
        st.Q = q; st.Qn = qn;
      }
    }

    var sBtn = el("button", { type: "button", class: "toggle latch-btn" });
    var rBtn = el("button", { type: "button", class: "toggle latch-btn" });
    sBtn.addEventListener("click", function () { st.S ^= 1; settle(); render(); });
    rBtn.addEventListener("click", function () { st.R ^= 1; settle(); render(); });
    var pic = svg("svg", { viewBox: "0 0 320 200", role: "img" });
    var msg = el("p", { class: "latch-msg", "aria-live": "polite" });
    var qOut = el("div", { class: "lamp" });

    root.appendChild(el("p", { class: "small muted" }, "Turn Set on, then off again. Q stays 1: the latch remembers. Reset clears it."));
    root.appendChild(el("div", { class: "btn-row" }, [sBtn, rBtn]));
    root.appendChild(pic);
    root.appendChild(el("div", { class: "gate-out" }, [qOut]));
    root.appendChild(msg);

    function nor(g, x, y, label) {
      // OR body + output bubble, inputs at y-10 and y+10, output at x+64
      g.appendChild(svg("path", { d: "M" + x + " " + (y - 22) + " Q" + (x + 14) + " " + y + " " + x + " " + (y + 22) + " Q" + (x + 40) + " " + (y + 22) + " " + (x + 54) + " " + y + " Q" + (x + 40) + " " + (y - 22) + " " + x + " " + (y - 22) + " Z", class: "nd-gate" }));
      g.appendChild(svg("circle", { cx: x + 59, cy: y, r: 5, class: "nd-bubble" }));
      g.appendChild(svg("text", { x: x + 24, y: y + 4, "text-anchor": "middle", class: "g-label" }, label));
    }
    function wire(d, v) { return svg("path", { d: d, class: "lw is-" + v }); }

    function render() {
      pic.innerHTML = "";
      var g = svg("g");
      // gate 1 (top): inputs R, Qn → Q ; gate 2 (bottom): inputs S, Q → Qn
      var x = 130, y1 = 55, y2 = 145;
      g.appendChild(wire("M40 " + (y1 - 10) + " H" + (x + 6), st.R));
      g.appendChild(wire("M40 " + (y2 + 10) + " H" + (x + 6), st.S));
      // outputs
      g.appendChild(wire("M" + (x + 64) + " " + y1 + " H272", st.Q));
      g.appendChild(wire("M" + (x + 64) + " " + y2 + " H272", st.Qn));
      // feedback: Q → gate2 upper input ; Qn → gate1 lower input
      g.appendChild(wire("M230 " + y1 + " V" + (y1 + 30) + " L100 " + (y2 - 30) + " V" + (y2 - 10) + " H" + (x + 6), st.Q));
      g.appendChild(wire("M250 " + y2 + " V" + (y2 - 22) + " L100 " + (y1 + 22) + " V" + (y1 + 10) + " H" + (x + 6), st.Qn));
      nor(g, x, y1, "NOR"); nor(g, x, y2, "NOR");
      [[30, y1 - 18, "Reset " + st.R], [30, y2 + 26, "Set " + st.S], [277, y1 + 4, "Q " + st.Q], [277, y2 + 4, "Q̄ " + st.Qn]].forEach(function (t) {
        g.appendChild(svg("text", { x: t[0], y: t[1], class: "g-label latch-lbl" }, t[2]));
      });
      pic.appendChild(g);
      pic.setAttribute("aria-label", "Two cross-coupled NOR gates. Set " + st.S + ", Reset " + st.R + ", Q " + st.Q + ", Q-bar " + st.Qn);

      sBtn.setAttribute("aria-pressed", String(!!st.S)); sBtn.textContent = "Set: " + (st.S ? "on" : "off");
      rBtn.setAttribute("aria-pressed", String(!!st.R)); rBtn.textContent = "Reset: " + (st.R ? "on" : "off");
      qOut.className = "lamp is-" + st.Q;
      qOut.innerHTML = "";
      qOut.append(el("span", { class: "lamp-dot", "aria-hidden": "true" }), "Stored bit Q ", el("span", { class: "bit is-" + st.Q }, String(st.Q)));
      msg.className = "latch-msg" + (st.S && st.R ? " warn" : "");
      msg.textContent = st.S && st.R ? "⚠ Forbidden state: Set and Reset at once. Both outputs are forced to 0, so Q and Q̄ no longer disagree."
        : st.S ? "Set is on: Q becomes 1."
        : st.R ? "Reset is on: Q becomes 0."
        : "Both off: the feedback loop holds Q at " + st.Q + ".";
    }
    settle(); render();
  });
})();
