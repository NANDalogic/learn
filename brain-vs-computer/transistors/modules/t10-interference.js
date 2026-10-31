/* T10. Single-photon interference in a Mach-Zehnder interferometer (D10) [R93]
   Each beam splitter: amplitude 1/√2 per exit. Per path to a detector: ±1/2.
   Both paths open: D1 gets +1/2 − 1/2 = 0, D2 gets +1/2 + 1/2 = 1.
   Upper path blocked: D1 and D2 each get one 1/2 amplitude (probability 1/4), the block absorbs 1/2. */
(function () {
  "use strict";
  var S = window.Site, el = S.el, svg = S.svg;

  S.module("t10", function (root) {
    var st = { blocked: false, d1: 0, d2: 0, lost: 0, busy: false };
    var P = { src: [14, 180], bs1: [70, 180], mUp: [70, 70], mRight: [230, 180], bs2: [230, 70], d1: [300, 70], d2: [230, 12], block: [150, 70] };

    var pic = svg("svg", { viewBox: "0 0 320 210", role: "img", "aria-label": "Mach-Zehnder interferometer: a photon meets a beam splitter, takes two paths around mirrors, recombines at a second beam splitter, and reaches detector D1 or D2" });
    function line(a, b, cls) { pic.appendChild(svg("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: cls })); }
    line(P.src, P.bs1, "beam"); line(P.bs1, P.mUp, "beam up"); line(P.mUp, P.bs2, "beam up up2"); line(P.bs1, P.mRight, "beam");
    line(P.mRight, P.bs2, "beam"); line(P.bs2, P.d1, "beam out"); line(P.bs2, P.d2, "beam out");
    function splitter(p, name, left) {
      pic.appendChild(svg("rect", { x: p[0] - 10, y: p[1] - 10, width: 20, height: 20, class: "bs", transform: "rotate(45 " + p[0] + " " + p[1] + ")" }));
      pic.appendChild(svg("text", { x: p[0] + (left ? -16 : 14), y: p[1] + 22, "text-anchor": left ? "end" : "start", class: "g-label muted-text" }, name));
    }
    function mirror(p) { pic.appendChild(svg("line", { x1: p[0] - 11, y1: p[1] + 11, x2: p[0] + 11, y2: p[1] - 11, class: "mirror" })); }
    splitter(P.bs1, "splitter 1"); splitter(P.bs2, "splitter 2", true); mirror(P.mUp); mirror(P.mRight);
    pic.appendChild(svg("text", { x: P.src[0], y: P.src[1] + 22, class: "g-label muted-text" }, "photon"));
    var blocker = svg("rect", { x: P.block[0] - 6, y: P.block[1] - 14, width: 12, height: 28, rx: 2, class: "blocker" });
    pic.appendChild(blocker);
    var det1 = svg("circle", { cx: P.d1[0], cy: P.d1[1], r: 11, class: "det" });
    var det2 = svg("circle", { cx: P.d2[0], cy: P.d2[1], r: 11, class: "det" });
    pic.appendChild(det1); pic.appendChild(det2);
    pic.appendChild(svg("text", { x: P.d1[0], y: P.d1[1] + 4, "text-anchor": "middle", class: "g-label det-lbl" }, "D1"));
    pic.appendChild(svg("text", { x: P.d2[0], y: P.d2[1] + 4, "text-anchor": "middle", class: "g-label det-lbl" }, "D2"));
    var amp1 = svg("text", { x: 316, y: 100, "text-anchor": "end", class: "g-label amp" });
    var amp2 = svg("text", { x: 262, y: 16, class: "g-label amp" });
    pic.appendChild(amp1); pic.appendChild(amp2);
    var wave = svg("g"); pic.appendChild(wave);

    var blockBtn = el("button", { type: "button", class: "toggle", "aria-pressed": "false" }, "Block the upper path");
    var one = el("button", { type: "button", class: "primary" }, "Send 1 photon");
    var many = el("button", { type: "button" }, "Send 100");
    var reset = el("button", { type: "button" }, "Reset tally");
    var tally = el("div", { class: "tally", "aria-live": "polite" });
    var ampTable = el("div", { class: "amp-table" });

    blockBtn.addEventListener("click", function () { st.blocked = !st.blocked; st.d1 = st.d2 = st.lost = 0; render(); });
    one.addEventListener("click", function () { send(1); });
    many.addEventListener("click", function () { send(100); });
    reset.addEventListener("click", function () { st.d1 = st.d2 = st.lost = 0; render(); });

    root.append(el("div", { class: "btn-row" }, [blockBtn]), pic, el("div", { class: "btn-row" }, [one, many, reset]), tally, ampTable,
      el("p", { class: "qubit-note" }, [el("b", null, "The same rule in qubit terms: "), "one 'H' step → 50/50; two in a row → back to 0 every time."]));

    function probs() { return st.blocked ? { d1: .25, d2: .25, lost: .5 } : { d1: 0, d2: 1, lost: 0 }; }
    function roll() {
      var p = probs(), r = Math.random();
      return r < p.d1 ? "d1" : r < p.d1 + p.d2 ? "d2" : "lost";
    }

    function send(n) {
      if (st.busy) return;
      if (n > 1 || S.reducedMotion()) {
        for (var i = 0; i < n; i++) st[roll()]++;
        flash(null); render(); return;
      }
      st.busy = true; one.disabled = many.disabled = true;
      var res = roll(), t0 = performance.now();
      (function step(t) {
        var p = Math.min(1, (t - t0) / 900);
        wave.innerHTML = "";
        // the photon's amplitude travels along both arms (drawn faint on each)
        if (p < .2) dot(lerp(P.src, P.bs1, p / .2), 1);
        else if (p < .8) {
          var q = (p - .2) / .6;
          dot(q < .5 ? lerp(P.bs1, P.mUp, q * 2) : st.blocked && q > .25 ? null : lerp(P.mUp, P.bs2, (q - .5) * 2), .5);
          dot(q < .5 ? lerp(P.bs1, P.mRight, q * 2) : lerp(P.mRight, P.bs2, (q - .5) * 2), .5);
        }
        if (p < 1) requestAnimationFrame(step);
        else { wave.innerHTML = ""; st[res]++; flash(res); render(); st.busy = false; one.disabled = many.disabled = false; }
      })(t0);
    }
    function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
    function dot(p, o) { if (p) wave.appendChild(svg("circle", { cx: p[0], cy: p[1], r: 6, class: "photon", style: "opacity:" + o })); }
    function flash(res) {
      [det1, det2].forEach(function (d) { d.classList.remove("hit"); });
      if (res === "d1") det1.classList.add("hit");
      if (res === "d2") det2.classList.add("hit");
    }

    function render() {
      blockBtn.setAttribute("aria-pressed", String(st.blocked));
      blockBtn.textContent = st.blocked ? "Unblock the upper path" : "Block the upper path";
      blocker.style.display = st.blocked ? "" : "none";
      amp1.textContent = st.blocked ? "−½ → ¼" : "+½ −½ = 0";
      amp2.textContent = st.blocked ? "+½ → ¼" : "+½ +½ = 1";
      var total = st.d1 + st.d2 + st.lost, got = st.d1 + st.d2;
      function bar(label, n, base, cls) {
        var pct = base ? n / base * 100 : 0;
        return el("div", { class: "tally-row" }, [el("span", null, label), el("span", { class: "tally-track" }, el("span", { class: "tally-bar " + cls, style: "width:" + pct + "%" })), el("span", { class: "tally-n" }, n + (base ? " (" + Math.round(pct) + "%)" : ""))]);
      }
      tally.innerHTML = "";
      tally.append(el("p", { class: "small" }, total + " photon" + (total === 1 ? "" : "s") + " sent" + (st.blocked ? ", " + st.lost + " absorbed by the block. Of the " + got + " that got through:" : ":")),
        bar("D1", st.d1, got, "d1"), bar("D2", st.d2, got, "d2"));
      ampTable.innerHTML = "";
      ampTable.append(el("p", { class: "small" }, st.blocked
        ? "Upper path blocked: only one amplitude reaches each detector, so nothing cancels. Of the photons that get through, each detector fires about half the time."
        : "Both paths open: at D1 the two path amplitudes are +½ and −½ and cancel to 0, so D1 never fires. At D2 they add to 1, so every photon arrives there."));
    }
    render();
  });
})();
