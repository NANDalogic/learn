/* T11. Self-check (D11): matching + 10-question quiz */
(function () {
  "use strict";
  var S = window.Site;

  var LEFT = [
    { id: "nand", label: "NAND gate", answer: "four", why: "Two NMOS in series plus two PMOS in parallel.[R17]" },
    { id: "not", label: "NOT gate", answer: "two", why: "One PMOS plus one NMOS.[R16]" },
    { id: "sram", label: "SRAM cell (1 bit)", answer: "six", why: "Two cross-coupled inverters (4) plus 2 access transistors.[R23]" },
    { id: "euv", label: "EUV", answer: "euvlight", why: "Extreme ultraviolet light, 13.5 nm.[R9]" },
    { id: "u41", label: "U+0041", answer: "a", why: "LATIN CAPITAL LETTER A, decimal 65.[R41]" },
    { id: "byte", label: "One byte", answer: "256", why: "2⁸ = 256 values, 0–255.[R33]" },
    { id: "thermo", label: "Bimetal thermostat", answer: "nologic", why: "The strip is both the sensor and the switch: no transistors, no logic.[R69]" }
  ];
  var RIGHT = [
    { id: "two", label: "2 transistors" },
    { id: "four", label: "4 transistors" },
    { id: "six", label: "6 transistors" },
    { id: "euvlight", label: "13.5 nm light" },
    { id: "a", label: "\"A\"" },
    { id: "256", label: "256 values" },
    { id: "nologic", label: "No logic at all" }
  ];
  var QUIZ = [
    { q: "Are transistors always grouped in 4?", a: ["Yes, every gate uses 4", "No: NAND/NOR are 4, NOT is 2, AND/OR are 6", "No, always 2", "Only in memory chips"], c: 1, why: "NAND and NOR are exactly 4, which is where the idea comes from; NOT is 2 and AND/OR are 6.[R16][R17][R18]" },
    { q: "What does \"2 nm\" measure on a chip?", a: ["The gate length", "The width of a fin", "Nothing directly: it's a generation label", "The wavelength of the light used"], c: 2, why: "Node names are generation labels, not measurements. Intel 18A's gate pitch is 50 nm.[R13][R14][R15]" },
    { q: "How many possible 2-input logic functions are there?", a: ["4", "6", "8", "16"], c: 3, why: "4 rows, each 0 or 1: 2⁴ = 16.[R26]" },
    { q: "Which single gate type can build every other gate?", a: ["NOT", "NAND (or NOR)", "XOR", "AND"], c: 1, why: "Any logic function can be made from NAND alone, and the same goes for NOR.[R20][R25]" },
    { q: "Half adder: what are the sum and carry for 1 + 1?", a: ["Sum 1, carry 0", "Sum 0, carry 1", "Sum 1, carry 1", "Sum 2, carry 0"], c: 1, why: "1 + 1 = 10 in binary: sum 0, carry 1.[R28]" },
    { q: "How does a latch remember a bit?", a: ["A tiny battery", "Feedback: two gates feed their outputs back into each other", "It stores a capacitor charge", "The clock keeps it"], c: 1, why: "The cross-coupled loop has two stable states.[R29]" },
    { q: "Why does DRAM need constant refreshing?", a: ["Its capacitor's charge slowly leaks", "It uses 6 transistors per bit", "The clock resets it", "It doesn't"], c: 0, why: "1 transistor + 1 tiny capacitor per bit; the charge leaks.[R31]" },
    { q: "What does the keyboard actually send to the computer?", a: ["The letter A", "A Unicode code", "A key code: which key is down", "Pixels"], c: 2, why: "It reports which key is down; the operating system applies the layout.[R37][R40]" },
    { q: "True or false: a quantum computer tries every answer at once.", a: ["True", "False: its power comes from interference"], c: 1, why: "Amplitudes of wrong answers are made to cancel; it only works for problems with the right structure.[R75][R79]" },
    { q: "What is quantum computing's main practical impact today?", a: ["Faster web browsing", "Driving the move to post-quantum encryption", "Replacing GPUs for AI", "Breaking RSA today"], c: 1, why: "NIST finalized post-quantum standards in 2024 and plans to disallow RSA after 2035.[R90][R91]" }
  ];

  S.module("t11", function (root) {
    S.selfCheck(root, {
      key: "transistors-selfcheck-v1",
      intro: "Tap an item on the left, then its partner on the right.",
      left: { cls: "is-computer", items: LEFT },
      right: { cls: "is-computer", items: RIGHT },
      quiz: QUIZ
    });
  });
})();
