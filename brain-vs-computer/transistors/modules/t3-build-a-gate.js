/* T3. Build-a-gate (D3): CMOS pull-up / pull-down networks */
(function () {
  "use strict";
  var S = window.Site, el = S.el;

  var BASE = {
    NOT: { ins: ["A"], pd: "single", name: "NOT" },
    NAND: { ins: ["A", "B"], pd: "series", name: "NAND" },
    NOR: { ins: ["A", "B"], pd: "parallel", name: "NOR" }
  };

  S.module("t3", function (root) {
    var st = { A: 0, B: 0, gate: "NAND", second: false };
    var bA = el("button", { type: "button", class: "input-btn" });
    var bB = el("button", { type: "button", class: "input-btn" });
    bA.addEventListener("click", function () { st.A ^= 1; render(); });
    bB.addEventListener("click", function () { st.B ^= 1; render(); });
    var seg = S.segmented("Gate", [["NOT", "NOT"], ["NAND", "NAND"], ["NOR", "NOR"]], "NAND", function (v) { st.gate = v; render(); });
    var addNot = el("button", { type: "button", class: "toggle", "aria-pressed": "false" }, "Add a NOT stage");
    addNot.addEventListener("click", function () { st.second = !st.second; render(); });
    var lamp = el("div", { class: "lamp", role: "status", "aria-live": "polite" });
    var count = el("p", { class: "t3-count" });
    var fig = el("div", { class: "cmos" });

    root.appendChild(el("div", { class: "gate-controls" }, [el("div", { class: "inputs" }, [bA, bB]), seg.node]));
    root.appendChild(el("div", { class: "btn-row" }, [addNot]));
    root.appendChild(el("div", { class: "gate-out" }, [lamp, count]));
    root.appendChild(fig);
    root.appendChild(el("p", { class: "small muted cmos-legend" },
      "Top half: PMOS pull-up network, on when its input is 0, connects the output to 1. Bottom half: NMOS pull-down network, on when its input is 1, connects the output to 0. Blue wires show the path that is conducting."));

    function stages() {
      var one = BASE[st.gate], useSecond = st.second && st.gate !== "NOT";
      var first = { ins: one.ins, pd: one.pd, name: one.name, out: useSecond ? "X" : "Y" };
      return useSecond ? [first, { ins: ["X"], pd: "single", name: "NOT", out: "Y" }] : [first];
    }
    function render() {
      var stg = stages(), one = st.gate === "NOT";
      var sig = S.cmos.eval(stg, { A: st.A, B: one ? 0 : st.B });
      var finalName = stg.length === 2 ? (st.gate === "NAND" ? "AND" : "OR") : st.gate;
      setBtn(bA, "A", st.A); setBtn(bB, "B", st.B);
      bB.hidden = one;
      addNot.disabled = one;
      addNot.setAttribute("aria-pressed", String(st.second && !one));
      addNot.textContent = st.second && !one ? "Remove the NOT stage" : "Add a NOT stage" + (one ? "" : " (makes " + (st.gate === "NAND" ? "AND" : "OR") + ")");
      lamp.className = "lamp is-" + sig.Y;
      lamp.innerHTML = "";
      lamp.append(el("span", { class: "lamp-dot", "aria-hidden": "true" }), finalName + " output ", el("span", { class: "bit is-" + sig.Y }, String(sig.Y)));
      count.innerHTML = "";
      count.append("Transistors: ", el("b", null, String(S.cmos.count(stg))), stg.length === 2 ? " (" + st.gate + " 4 + NOT 2)" : "");
      fig.innerHTML = "";
      fig.appendChild(S.cmos.draw(stg, sig));
    }
    function setBtn(b, n, v) {
      b.setAttribute("aria-pressed", String(!!v));
      b.innerHTML = "";
      b.append("Input " + n + " ", el("span", { class: "bit is-" + v }, String(v)));
    }
    render();
  });
})();
