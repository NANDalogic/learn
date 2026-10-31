/* T7. Byte playground (D6) */
(function () {
  "use strict";
  var S = window.Site, el = S.el;
  var W = [128, 64, 32, 16, 8, 4, 2, 1];

  S.byteRow = function (n, cls) { // static row of 8 bits, reused by T8
    return el("span", { class: "byte-row " + (cls || "") }, W.map(function (w, i) {
      var v = (n & w) ? 1 : 0;
      return el("span", { class: "bit is-" + v + (i === 3 ? " nib" : "") }, String(v));
    }));
  };

  S.module("t7", function (root) {
    var n = 65;
    var toggles = el("div", { class: "byte-toggles", role: "group", "aria-label": "Eight bits" });
    var btns = W.map(function (w) {
      var b = el("button", { type: "button", class: "byte-bit" });
      b.addEventListener("click", function () { n ^= w; render(); });
      toggles.appendChild(el("div", { class: "byte-col" }, [el("span", { class: "byte-w" }, String(w)), b]));
      return b;
    });
    var dec = el("dd"), hex = el("dd"), bin = el("dd"), chr = el("dd");
    var out = el("dl", { class: "byte-out", "aria-live": "polite" }, [
      el("dt", null, "Decimal"), dec, el("dt", null, "Hex"), hex, el("dt", null, "Binary"), bin, el("dt", null, "As a character"), chr
    ]);
    var presets = el("div", { class: "btn-row" }, [["\"A\"", 65], ["\"a\"", 97], ["255", 255], ["0", 0]].map(function (p) {
      var b = el("button", { type: "button" }, p[0]);
      b.addEventListener("click", function () { n = p[1]; render(); });
      return b;
    }));
    var sum = el("p", { class: "byte-sum" });

    root.appendChild(toggles);
    root.appendChild(sum);
    root.appendChild(out);
    root.appendChild(el("p", { class: "small muted" }, "Presets:"));
    root.appendChild(presets);

    function render() {
      W.forEach(function (w, i) {
        var v = (n & w) ? 1 : 0;
        btns[i].textContent = String(v);
        btns[i].className = "byte-bit bit is-" + v;
        btns[i].setAttribute("aria-pressed", String(!!v));
        btns[i].setAttribute("aria-label", "Bit worth " + w + ": " + v);
      });
      var parts = W.filter(function (w) { return n & w; });
      sum.textContent = parts.length ? parts.join(" + ") + " = " + n : "No bits on = 0";
      dec.textContent = String(n);
      hex.textContent = "0x" + n.toString(16).toUpperCase().padStart(2, "0");
      bin.textContent = n.toString(2).padStart(8, "0").replace(/^(\d{4})/, "$1 ");
      chr.innerHTML = "";
      if (n >= 32 && n <= 126) {
        chr.append(el("span", { class: "byte-char" }, n === 32 ? "␠ (space)" : String.fromCharCode(n)), " U+" + n.toString(16).toUpperCase().padStart(4, "0"));
      } else if (n < 32 || n === 127) {
        chr.textContent = "A control character (not printable).";
      } else {
        chr.textContent = "Past 127: in UTF-8 this byte is only part of a multi-byte character, so there's no single letter to show.";
      }
    }
    render();
  });
})();
