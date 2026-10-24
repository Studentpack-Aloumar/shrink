// Run: node test/run.js  — checks the RINEX core inside index.html on synthetic RINEX 2 and 3 files.
const fs = require("fs"), path = require("path"), vm = require("vm"), assert = require("assert");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const src = html.match(/<script id="core">([\s\S]*?)<\/script>/)[1];
const mod = { exports: {} }; vm.runInNewContext(src, { module: mod });
const { RinexShrinker, outName } = mod.exports;

const H = (c, l) => c.padEnd(60).slice(0, 60) + l.padEnd(20);
function shrink(text) { const p = new RinexShrinker(); text.split("\n").forEach(l => p.line(l)); const r = p.finish(); return { p, out: r.header + r.body.join("") }; }

// RINEX 3: 2 s data, GPS + GLONASS + Galileo, 2 minutes
let v3 = [H("     3.05           OBSERVATION DATA    M: MIXED", "RINEX VERSION / TYPE"), H("ABC1", "MARKER NAME"),
  H("                    TRM57971.00     NONE", "ANT # / TYPE"), H("        1.5000        0.0000        0.0000", "ANTENNA: DELTA H/E/N"),
  H("G    4 C1C L1C C2W L2W", "SYS / # / OBS TYPES"), H("R    2 C1C L1C", "SYS / # / OBS TYPES"), H("E    2 C1C L1C", "SYS / # / OBS TYPES"),
  H("     2.000", "INTERVAL"), H("  2026    10    22     8     0    0.0000000     GPS", "TIME OF FIRST OBS"),
  H(" 15 R03  5", "GLONASS SLOT / FRQ #"), H("", "END OF HEADER")];
for (let s = 0; s < 120; s += 2) {
  v3.push(`> 2026 10 22 08 ${String(Math.floor(s / 60)).padStart(2, "0")} ${(s % 60).toFixed(7).padStart(10)}  0  3`);
  v3.push("G01  20000000.000   100000000.000 7  20000001.000    80000000.000 7", "R03  21000000.000   110000000.000 7", "E11  22000000.000   120000000.000 7");
}
let { p, out } = shrink(v3.join("\n") + "\n");
assert.strictEqual(p.error, null);
assert.strictEqual(p.epochsIn, 60); assert.strictEqual(p.epochsOut, 4);
assert(!/^R03|^E11/m.test(out), "non-GPS satellites removed");
assert(!/GLONASS SLOT|^R    2/m.test(out), "non-GPS header lines removed");
assert(/^    30\.000 +INTERVAL/m.test(out), "interval set to 30 s");
assert(/G: GPS +RINEX VERSION/.test(out));
assert.strictEqual(p.info.height, 1.5);
assert(/> 2026 10 22 08 00 30\.0000000  0  1/.test(out), "epoch satellite count rewritten");
assert.strictEqual(outName(p.info.marker, p.first, new Set()), "ABC12950.26O");

// RINEX 2: 15 s data, 7 obs types (2 lines per satellite), 15 satellites (2 sat-list lines), one event epoch
v3 = null;
let v2 = [H("     2.11           OBSERVATION DATA    M (MIXED)", "RINEX VERSION / TYPE"), H("TEST", "MARKER NAME"),
  H("     7    C1    L1    L2    P2    S1    S2    D1", "# / TYPES OF OBSERV"), H("    15.000", "INTERVAL"),
  H("  2026    10    22    08    00   00.0000000     GPS", "TIME OF FIRST OBS"), H("", "END OF HEADER")];
const sats = [...Array(10)].map((_, i) => "G" + String(i + 1).padStart(2, "0")).concat([...Array(5)].map((_, i) => "R" + String(i + 1).padStart(2, "0")));
for (let k = 0; k < 8; k++) {
  const s = k * 15;
  v2.push(` 26 10 22 08 ${String(Math.floor(s / 60)).padStart(2)} ${(s % 60).toFixed(7).padStart(10)}  0${String(sats.length).padStart(3)}` + sats.slice(0, 12).join(""));
  v2.push(" ".repeat(32) + sats.slice(12).join(""));
  for (const sat of sats) { v2.push(`${(1000 + k).toFixed(3).padStart(14)}  `.repeat(5)); v2.push(`${(2000 + k).toFixed(3).padStart(14)}  `.repeat(2)); }
  if (k === 3) { v2.push(" 26 10 22 08 01 00.0000000  4  1"); v2.push(H("event", "COMMENT")); }
}
({ p, out } = shrink(v2.join("\n") + "\n"));
assert.strictEqual(p.error, null);
assert.strictEqual(p.epochsOut, 4);
assert(!/R0\d/.test(out.split("END OF HEADER")[1]), "GLONASS removed");
assert.strictEqual((out.match(/^ +100[0-9]\.000/mg) || []).length, 4 * 10, "10 GPS satellites x 4 epochs kept");

// Not an observation file
({ p } = shrink(H("     3.05           N: GNSS NAV DATA    M: MIXED", "RINEX VERSION / TYPE") + "\n" + H("", "END OF HEADER") + "\n"));
assert(p.error && /observation/.test(p.error));

console.log("All tests passed");
