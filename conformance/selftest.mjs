/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONFORMANCE SELFTEST — saos-git-custody-v1
 * ═══════════════════════════════════════════════════════════════════════════
 * Runs every vector in vectors.json through the runner and demands the exact
 * expected verdict. Also proves: determinism (2 runs → identical results),
 * no-throw law (fuzz-lite: null/undefined/numbers/strings through both
 * validators), and the t38 freshness helper rails.
 *
 * Exit 0 = suite green · exit 1 = any failure (named, fail-honest).
 * Zero dependencies · zero secrets · never signs · never broadcasts.
 * ═══════════════════════════════════════════════════════════════════════════
 */
"use strict";
import { validatePayload, validateAnchorOp, checkFreshness, PROTOCOL_ID } from "./validate.mjs";
import { readFileSync } from "node:fs";

let pass = 0;
let fail = 0;
const failures = [];

function assert(name, cond, detail = "") {
  if (cond) { pass += 1; console.log(`PASS  ${name}`); }
  else { fail += 1; failures.push({ name, detail }); console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`); }
}

const vectors = JSON.parse(readFileSync(new URL("./vectors.json", import.meta.url), "utf8"));
assert("vectors-manifest-names-this-protocol", vectors.protocol === PROTOCOL_ID, `got ${vectors.protocol}`);

const results = [];
for (const c of vectors.cases) {
  const r = c.kind === "op" ? validateAnchorOp(c.value) : validatePayload(c.value);
  const ok = r.ok === (c.expect === "valid");
  assert(`vector:${c.name}`, ok, `expected ${c.expect}, got ${r.ok ? "valid" : "invalid"}${r.ok ? "" : ` (${r.reasons.join(" | ").slice(0, 160)})`}`);
  results.push([c.name, r.ok]);
}

// Determinism: a second pass must produce byte-identical verdicts.
const again = vectors.cases.map((c) => (c.kind === "op" ? validateAnchorOp(c.value).ok : validatePayload(c.value).ok));
assert("determinism-two-pass-identical", JSON.stringify(results.map(([, ok]) => ok)) === JSON.stringify(again));

// No-throw law: hostile inputs must return {ok:false}, never raise.
let threw = false;
for (const hostile of [null, undefined, 42, "string", true, [], [{}, 1], new Date(0)]) {
  try {
    const a = validatePayload(hostile);
    const b = validateAnchorOp(hostile);
    if (a.ok || b.ok) threw = true;
  } catch { threw = true; }
}
assert("no-throw-hostile-inputs", !threw);

// Freshness rails (t38 law, 90min).
const f1 = checkFreshness(new Date(Date.now() - 30 * 60_000).toISOString());
const f2 = checkFreshness(new Date(Date.now() - 120 * 60_000).toISOString());
const f3 = checkFreshness("not-a-date");
assert("freshness-30min-is-fresh", f1.fresh === true && f1.ageMin <= 31);
assert("freshness-120min-stale-cites-t38", f2.fresh === false && /t38/.test(f2.reason || ""));
assert("freshness-unparseable-refused", f3.fresh === false && f3.reason === "unparseable at");

// Round-trip: stringify → parse preserves validity (the chain path).
const p = vectors.cases[0].value;
const rt = validateAnchorOp(["custom_json", { required_auths: [], required_posting_auths: ["headcorner"], id: PROTOCOL_ID, json: JSON.stringify(p) }]);
assert("roundtrip-stringify-parse-valid", rt.ok === true);

console.log(`\n${pass} PASS / ${fail} FAIL  (protocol ${PROTOCOL_ID})`);
if (fail > 0) {
  console.log(JSON.stringify({ suite: "saos-git-custody-v1-conformance", ok: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ suite: "saos-git-custody-v1-conformance", ok: true, vectors: vectors.cases.length }));
