/* T5. 4-bit ripple-carry adder (D5)
   Seekable: draw(t) builds the whole picture from time t (0–4), so play, scrub and Back/Next
   all land on the same frame. Stage k runs from t = k to k + 1:
     k … k+0.5   bit-k adder has its carry-in and is working (sum, carry out still "?")
     k+0.5       bit-k adder settles
     k+0.5 … k+1 its carry out slides to the next adder (the bit-3 carry slides off the end)
   At whole numbers t = k, adders 0…k−1 are settled; t = 4 shows the answer. */
(function () {
  "use strict";
  var S = window.Site, el = S.el;
  var HALF = 0.5, END = 4;

  function fullAdd(a, b, c) {
    var x1 = a ^ b, s = x1 ^ c, c1 = a & b, c2 = x1 & c, co = c1 | c2;
    return { x1: x1, s: s, c1: c1, c2: c2, co: co };
  }
  function val(arr) { return arr.reduce(function (n, v, i) { return n + (v << i); }, 0); }
  function setBit(node, v, known) {
    node.className = "bit " + (known ? "is-" + v : "unk");
    node.textContent = known ? String(v) : "?";
  }

  S.module("t5", function (root) {
    var st = { A: [0, 1, 0, 1], B: [0, 0, 1, 1], open: 0 }; // bits indexed 0 = least significant
    var tl;

    function compute() {
      var c = 0, res = [];
      for (var i = 0; i < 4; i++) { var r = fullAdd(st.A[i], st.B[i], c); r.cin = c; res.push(r); c = r.co; }
      return res;
    }
    function stage(t) { var r = S.clamp(Math.floor(t + 1e-9), 0, END); return { r: r, f: Math.max(0, t - r) }; }
    function settled(i, s) { return i < s.r || (i === s.r && s.f >= HALF); }

    function bitRow(name, arr) {
      var wrap = el("div", { class: "add-row" }, [el("span", { class: "add-name" }, name)]);
      var dec = el("span", { class: "add-dec" });
      var btns = [3, 2, 1, 0].map(function (i) {
        var b = el("button", { type: "button", class: "bit-btn", "aria-label": name + " bit worth " + (1 << i) });
        b.addEventListener("click", function () { arr[i] ^= 1; sync(); tl.seek(END); });
        wrap.appendChild(b);
        return { i: i, b: b };
      });
      wrap.appendChild(dec);
      function sync() {
        btns.forEach(function (o) { o.b.textContent = String(arr[o.i]); o.b.className = "bit-btn bit is-" + arr[o.i]; o.b.setAttribute("aria-pressed", String(!!arr[o.i])); });
        dec.textContent = "= " + val(arr);
      }
      sync();
      return wrap;
    }

    // ----- build the DOM once; draw(t) only updates it -----
    var track = el("div", { class: "add-track", "aria-hidden": "true" });
    var chip = el("span", { class: "bit add-chip" });
    track.appendChild(chip);
    var chain = el("div", { class: "add-chain" });
    var boxes = [3, 2, 1, 0].map(function (i) {
      var io = document.createTextNode(""), cin = el("span"), sum = el("span"), co = el("span");
      var b = el("button", { type: "button", class: "fa" }, [
        el("span", { class: "fa-title" }, "bit " + i + " (" + (1 << i) + ")"),
        el("span", { class: "fa-io" }, [io, cin]),
        el("span", { class: "fa-io" }, ["sum ", sum]),
        el("span", { class: "fa-io" }, ["carry out ", co])
      ]);
      b.addEventListener("click", function () { st.open = st.open === i ? -1 : i; tl.redraw(); });
      chain.appendChild(b);
      return { i: i, b: b, io: io, cin: cin, sum: sum, co: co };
    });
    var out = el("div", { class: "add-out", "aria-live": "polite" });
    var inside = el("div", { class: "add-inside" });
    var outKey = null, insideKey = null;

    function draw(t) {
      var res = compute(), s = stage(t);

      boxes.forEach(function (o) {
        var i = o.i, r = res[i], done = settled(i, s), active = i === s.r && s.r < END;
        o.b.className = "fa" + (done ? " done" : "") + (active ? " active" : "") + (st.open === i ? " open" : "");
        o.b.setAttribute("aria-expanded", String(st.open === i));
        o.io.nodeValue = st.A[i] + " + " + st.B[i] + " + carry ";
        setBit(o.cin, r.cin, i <= s.r);
        setBit(o.sum, r.s, done);
        setBit(o.co, r.co, done);
      });

      // The carry chip: slides from the adder that just settled to the next one up (on screen: leftward).
      if (s.r < END && s.f > HALF) {
        var p = (s.f - HALF) / (1 - HALF), col = 3 - s.r;          // screen column of the bit-r adder
        var from = (col + 0.5) / 4 * 100, to = s.r < 3 ? (col - 0.5) / 4 * 100 : 0;
        var v = res[s.r].co;
        chip.style.visibility = "visible";
        chip.style.left = (from + (to - from) * p) + "%";
        chip.style.opacity = s.r < 3 ? "1" : String(1 - p * 0.6);
        chip.className = "bit add-chip is-" + v;
        chip.textContent = "carry " + v;
      } else {
        chip.style.visibility = "hidden"; chip.style.left = ""; chip.style.opacity = ""; chip.className = "bit add-chip"; chip.textContent = ""; // fully reset: same t, same frame
      }

      // Result line: rebuilt only when it would actually change.
      var nDone = boxes.filter(function (o) { return settled(o.i, s); }).length;
      var key = s.r >= END ? "F" + st.A + st.B : "R" + nDone;
      if (key !== outKey) {
        outKey = key;
        out.innerHTML = "";
        if (s.r >= END) {
          var sum = val(st.A) + val(st.B), cout = res[3].co;
          var bits = [cout].concat([3, 2, 1, 0].map(function (i) { return res[i].s; }));
          out.append(
            el("span", null, val(st.A) + " + " + val(st.B) + " = "),
            el("b", null, String(sum)), " ",
            el("span", { class: "add-bin" }, bits.map(function (v, k) { return el("span", { class: "bit is-" + v + (k === 0 ? " cout" : "") }, String(v)); })),
            el("span", { class: "add-ovf" + (cout ? " on" : "") }, cout ? " Carry out: the answer is past 15 and needs a fifth bit." : " No carry out: fits in 4 bits."));
        } else {
          out.textContent = nDone < 4 ? "Rippling… " + nDone + " of 4 adders settled." : "All 4 adders settled. The last carry is heading out…";
        }
      }

      // Gate list for the opened adder: also rebuilt only on change.
      var known = st.open >= 0 && settled(st.open, s), cinKnown = st.open >= 0 && st.open <= s.r;
      var iKey = [st.open, known, cinKnown, st.A, st.B].join("|");
      if (iKey !== insideKey) {
        insideKey = iKey;
        inside.innerHTML = "";
        if (st.open >= 0) {
          var r2 = res[st.open], a = st.A[st.open], bb = st.B[st.open], cinTxt = cinKnown ? String(r2.cin) : "?";
          var g = function (label, expr, v) { return el("li", null, [el("code", null, label + " = " + expr), " → ", known ? el("span", { class: "bit is-" + v }, String(v)) : el("span", { class: "bit unk" }, "?")]); };
          inside.append(el("h4", null, "Inside the bit-" + st.open + " adder: 2 XOR, 2 AND, 1 OR"),
            el("ol", { class: "recipe" }, [
              g("x", a + " XOR " + bb, r2.x1),
              g("sum", "x XOR carry-in(" + cinTxt + ")", r2.s),
              g("c1", a + " AND " + bb, r2.c1),
              g("c2", "x AND carry-in(" + cinTxt + ")", r2.c2),
              g("carry out", "c1 OR c2", r2.co)
            ]),
            el("p", { class: "small muted" }, "Two half adders (x, sum and c1, c2) plus an OR gate."));
        }
      }
    }

    function beatLabel(k) {
      return function () {
        var res = compute();
        if (k === 0) return "Step 1 of 5: the bit-0 adder starts with a carry-in of 0.";
        if (k === END) return "Step 5 of 5: all 4 adders settled. The answer is ready.";
        var r = res[k - 1];
        return "Step " + (k + 1) + " of 5: bit " + (k - 1) + " gave sum " + r.s + ", carry " + r.co + ". That carry is now the bit-" + k + " adder's carry-in.";
      };
    }

    root.appendChild(el("div", { class: "add-inputs" }, [el("div", { class: "add-weights", "aria-hidden": "true" }, [el("span"), el("span", null, "8"), el("span", null, "4"), el("span", null, "2"), el("span", null, "1")]), bitRow("A", st.A), bitRow("B", st.B)]));
    root.appendChild(el("p", { class: "small muted" }, "Tap bits to change the numbers (0–15). Each box below is one full adder; tap one to see its gates. Press Play to watch the carry ripple, or drag the slider."));
    root.appendChild(track);
    root.appendChild(chain);
    tl = S.timeline({
      id: "t5", duration: END, start: END, secPerUnit: 1.1, draw: draw,
      beats: [0, 1, 2, 3, 4].map(function (k) { return { t: k, label: beatLabel(k) }; }),
      labels: { play: "▶ Play the ripple", replay: "▶ Play the ripple" }
    });
    root.appendChild(tl.node);
    root.appendChild(out);
    root.appendChild(inside);
  });
})();
