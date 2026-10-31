/* T5. 4-bit ripple-carry adder (D5) */
(function () {
  "use strict";
  var S = window.Site, el = S.el;

  function fullAdd(a, b, c) {
    var x1 = a ^ b, s = x1 ^ c, c1 = a & b, c2 = x1 & c, co = c1 | c2;
    return { x1: x1, s: s, c1: c1, c2: c2, co: co };
  }

  S.module("t5", function (root) {
    var st = { A: [0, 1, 0, 1], B: [0, 0, 1, 1], resolved: 4, open: 0, running: false }; // bits indexed 0 = least significant

    function bitRow(name, arr) {
      var wrap = el("div", { class: "add-row" }, [el("span", { class: "add-name" }, name)]);
      var dec = el("span", { class: "add-dec" });
      var btns = [3, 2, 1, 0].map(function (i) {
        var b = el("button", { type: "button", class: "bit-btn", "aria-label": name + " bit worth " + (1 << i) });
        b.addEventListener("click", function () { arr[i] ^= 1; st.resolved = 4; render(); });
        wrap.appendChild(b);
        return { i: i, b: b };
      });
      wrap.appendChild(dec);
      return { node: wrap, sync: function () {
        btns.forEach(function (o) { o.b.textContent = String(arr[o.i]); o.b.className = "bit-btn bit is-" + arr[o.i]; o.b.setAttribute("aria-pressed", String(!!arr[o.i])); });
        dec.textContent = "= " + val(arr);
      } };
    }
    function val(arr) { return arr.reduce(function (n, v, i) { return n + (v << i); }, 0); }

    var rA = bitRow("A", st.A), rB = bitRow("B", st.B);
    var chain = el("div", { class: "add-chain" });
    var out = el("div", { class: "add-out", "aria-live": "polite" });
    var inside = el("div", { class: "add-inside" });
    var rippleBtn = el("button", { type: "button", class: "primary" }, "Watch the carry ripple");
    var stepBtn = el("button", { type: "button" }, "Step");
    rippleBtn.addEventListener("click", ripple);
    stepBtn.addEventListener("click", function () {
      if (st.resolved >= 4) st.resolved = 0; else st.resolved++;
      render();
    });

    root.appendChild(el("div", { class: "add-inputs" }, [el("div", { class: "add-weights", "aria-hidden": "true" }, [el("span"), el("span", null, "8"), el("span", null, "4"), el("span", null, "2"), el("span", null, "1")]), rA.node, rB.node]));
    root.appendChild(el("p", { class: "small muted" }, "Tap bits to change the numbers (0–15). Each box below is one full adder; tap one to see its gates."));
    root.appendChild(chain);
    root.appendChild(el("div", { class: "btn-row" }, [rippleBtn, stepBtn]));
    root.appendChild(out);
    root.appendChild(inside);

    function compute() {
      var c = 0, res = [];
      for (var i = 0; i < 4; i++) { var r = fullAdd(st.A[i], st.B[i], c); r.cin = c; res.push(r); c = r.co; }
      return res;
    }

    function render() {
      rA.sync(); rB.sync();
      var res = compute();
      chain.innerHTML = "";
      [3, 2, 1, 0].forEach(function (i) {
        var r = res[i], done = i < st.resolved, active = i === st.resolved - 1;
        var b = el("button", { type: "button", class: "fa" + (done ? " done" : "") + (active ? " active" : "") + (st.open === i ? " open" : ""), "aria-expanded": String(st.open === i) }, [
          el("span", { class: "fa-title" }, "bit " + i + " (" + (1 << i) + ")"),
          el("span", { class: "fa-io" }, [st.A[i] + " + " + st.B[i] + " + carry ", el("span", { class: "bit is-" + (i <= st.resolved ? r.cin : 0) + (i > st.resolved ? " unk" : "") }, i <= st.resolved ? String(r.cin) : "?")]),
          el("span", { class: "fa-io" }, ["sum ", done ? el("span", { class: "bit is-" + r.s }, String(r.s)) : el("span", { class: "bit unk" }, "?")]),
          el("span", { class: "fa-io" }, ["carry out ", done ? el("span", { class: "bit is-" + r.co }, String(r.co)) : el("span", { class: "bit unk" }, "?")])
        ]);
        b.addEventListener("click", function () { st.open = st.open === i ? -1 : i; render(); });
        chain.appendChild(b);
      });
      var all = st.resolved >= 4;
      var sum = val(st.A) + val(st.B), cout = res[3].co;
      out.innerHTML = "";
      if (all) {
        var bits = [cout].concat([3, 2, 1, 0].map(function (i) { return res[i].s; }));
        out.append(
          el("span", null, val(st.A) + " + " + val(st.B) + " = "),
          el("b", null, String(sum)), " ",
          el("span", { class: "add-bin" }, bits.map(function (v, k) { return el("span", { class: "bit is-" + v + (k === 0 ? " cout" : "") }, String(v)); })),
          el("span", { class: "add-ovf" + (cout ? " on" : "") }, cout ? " Carry out: the answer is past 15 and needs a fifth bit." : " No carry out: fits in 4 bits."));
      } else {
        out.textContent = "Rippling… " + st.resolved + " of 4 adders settled.";
      }
      inside.innerHTML = "";
      if (st.open >= 0) {
        var r2 = res[st.open], a = st.A[st.open], bb = st.B[st.open];
        var known = st.open < st.resolved;
        function g(label, expr, v) { return el("li", null, [el("code", null, label + " = " + expr), " → ", known ? el("span", { class: "bit is-" + v }, String(v)) : el("span", { class: "bit unk" }, "?")]); }
        inside.append(el("h4", null, "Inside the bit-" + st.open + " adder: 2 XOR, 2 AND, 1 OR"),
          el("ol", { class: "recipe" }, [
            g("x", a + " XOR " + bb, r2.x1),
            g("sum", "x XOR carry-in(" + r2.cin + ")", r2.s),
            g("c1", a + " AND " + bb, r2.c1),
            g("c2", "x AND carry-in(" + r2.cin + ")", r2.c2),
            g("carry out", "c1 OR c2", r2.co)
          ]),
          el("p", { class: "small muted" }, "Two half adders (x, sum and c1, c2) plus an OR gate."));
      }
    }

    function ripple() {
      if (st.running) return;
      st.resolved = 0; render();
      if (S.reducedMotion()) { return; } // step manually with "Step"
      st.running = true; rippleBtn.disabled = true;
      (function next() {
        st.resolved++; render();
        if (st.resolved < 4) setTimeout(next, 700);
        else { st.running = false; rippleBtn.disabled = false; }
      })();
    }
    render();
  });
})();
