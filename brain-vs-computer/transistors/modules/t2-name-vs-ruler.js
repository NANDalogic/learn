/* T2. Name vs. ruler (D2) — all measurements from §D2 [R14][R15] */
(function () {
  "use strict";
  var S = window.Site, el = S.el;

  var NODES = {
    "22nm": { label: "\"22 nm\"", name: 22, nameText: "22 nm", real: [["Gate length", 26, "[R14]"], ["Fin width", 8, "[R14]"]] },
    "5nm": { label: "\"5 nm\"", name: 5, nameText: "5 nm", real: [["Contacted gate pitch", 48, "[R14]"], ["Metal pitch", 36, "[R14]"]] },
    "18A": { label: "Intel 18A", name: 1.8, nameText: "1.8 nm-class", real: [["Contacted gate pitch", 50, "[R15]"]] }
  };
  var MAX = 50;

  S.module("t2", function (root) {
    var chart = el("div", { class: "ruler" });
    var seg = S.segmented("Node name", Object.keys(NODES).map(function (k) { return [k, NODES[k].label]; }), "22nm", draw);
    root.appendChild(seg.node);
    root.appendChild(chart);
    root.appendChild(el("p", { class: "ruler-cap" }, [el("b", null, "The name is a generation label, not a measurement."), " Bars are drawn to the same scale."]));

    function row(label, nm, cls, ref) {
      return el("div", { class: "ruler-row " + cls }, [
        el("span", { class: "ruler-label" }, [label + " ", ref ? ref : null]),
        el("span", { class: "ruler-track" }, el("span", { class: "ruler-bar", style: "width:" + (nm / MAX * 100) + "%" })),
        el("span", { class: "ruler-val" }, nm + " nm")
      ]);
    }
    function draw(k) {
      var n = NODES[k];
      chart.innerHTML = "";
      chart.appendChild(row("Name: " + n.nameText, n.name, "is-name"));
      n.real.forEach(function (r) { chart.appendChild(row(r[0], r[1], "is-real", r[2])); });
      chart.appendChild(el("div", { class: "ruler-axis", "aria-hidden": "true" }, [0, 10, 20, 30, 40, 50].map(function (t) {
        return el("span", { style: "left:" + (t / MAX * 100) + "%" }, t + (t === 50 ? " nm" : ""));
      })));
      S.linkFootnotes(chart);
    }
    draw("22nm");
  });
})();
