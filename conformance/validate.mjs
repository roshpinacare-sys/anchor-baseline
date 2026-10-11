/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONFORMANCE RUNNER — saos-git-custody-v1 (the canonical anchor protocol)
 * ═══════════════════════════════════════════════════════════════════════════
 * ROLE (task 10-c, un-silence sweep 2026-10-11): this repo is no longer a
 * dead duplicate anchoring implementation — it is THE CONFORMANCE SUITE that
 * every anchoring implementation in the fleet is validated against.
 *
 * Canonical source of the protocol (extracted, not invented):
 *   steem@saos-cockpit · mini-services/saos-engine/anchor-now-t38.mjs:86
 *   steem@saos-cockpit · mini-services/saos-engine/ci-act.mjs:203
 * Both broadcast the Steem/Hive operation:
 *   ["custom_json", {
 *     required_auths: [],
 *     required_posting_auths: ["headcorner"],
 *     id: "saos-git-custody-v1",
 *     json: JSON.stringify({ branch, tip, at, src, fp })
 *   }]
 * Laws honored: posting-role only (never active), hash-only payload
 * (exposure policy 7-b: "anchors carry hashes, not strategy").
 *
 * Zero dependencies · never throws · never signs · never broadcasts ·
 * zero secrets · runs on bare `node` ≥ 18.
 * ═══════════════════════════════════════════════════════════════════════════
 */
"use strict";

export const PROTOCOL_ID = "saos-git-custody-v1";
export const PROTOCOL_VERSION = 1;
/** Exact payload field set — extras are a refusal (hash-only discipline). */
export const PAYLOAD_FIELDS = ["branch", "tip", "at", "src", "fp"];
/** t38 freshness law: >90min stale anchor = consumer gates open. */
export const DEFAULT_MAX_AGE_MIN = 90;

const GIT_SHA_RE = /^[0-9a-f]{40}$/;
const ISO_UTC_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const ACCOUNT_RE = /^[a-z0-9][a-z0-9-\.]{1,15}$/;
const PRINTABLE_RE = /^[\x20-\x7E]+$/;

function isStr(v) { return typeof v === "string"; }

function checkBranch(v) {
  if (!isStr(v) || v.length === 0) return "branch must be a non-empty string";
  if (v.length > 200) return "branch too long (>200)";
  if (!PRINTABLE_RE.test(v)) return "branch must be printable ascii (no control chars/unicode)";
  if (/\s/.test(v)) return "branch must not contain whitespace (git ref names)";
  return null;
}

function checkTip(v) {
  if (!isStr(v)) return "tip must be a string (full git SHA-1 from `git rev-parse HEAD`)";
  if (!GIT_SHA_RE.test(v)) return "tip must be a full lowercase 40-hex git SHA-1";
  return null;
}

function checkAt(v) {
  if (!isStr(v)) return "at must be a string (canonical: new Date().toISOString())";
  if (!ISO_UTC_RE.test(v)) return "at must be canonical ISO-8601 UTC form YYYY-MM-DDTHH:MM:SS.sssZ";
  const t = Date.parse(v);
  if (!Number.isFinite(t)) return "at does not parse as a Date";
  return null;
}

function checkSrc(v) {
  if (!isStr(v) || v.length === 0) return "src must be a non-empty string (source organ tag)";
  if (v.length > 64) return "src too long (>64)";
  if (!PRINTABLE_RE.test(v)) return "src must be printable ascii";
  return null;
}

function checkFp(v) {
  if (!isStr(v) || v.length === 0) return "fp must be a non-empty string (organ fingerprint)";
  if (v.length > 64) return "fp too long (>64)";
  if (!PRINTABLE_RE.test(v)) return "fp must be printable ascii";
  return null;
}

const FIELD_CHECKS = { branch: checkBranch, tip: checkTip, at: checkAt, src: checkSrc, fp: checkFp };

/**
 * Validate a custody payload object.
 * @returns {{ok: boolean, reasons: string[]}} — never throws.
 */
export function validatePayload(payload) {
  const reasons = [];
  try {
    if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
      return { ok: false, reasons: ["payload must be a JSON object"] };
    }
    const keys = Object.keys(payload);
    for (const f of PAYLOAD_FIELDS) {
      const err = FIELD_CHECKS[f](payload[f]);
      if (err) reasons.push(err);
    }
    for (const k of keys) {
      if (!PAYLOAD_FIELDS.includes(k)) reasons.push(`unknown field "${k}" — hash-only discipline: anchors carry hashes, not strategy`);
    }
  } catch (e) {
    reasons.push(`validator internal error: ${String(e && e.message).slice(0, 120)}`);
  }
  return { ok: reasons.length === 0, reasons };
}

/**
 * Validate the full custom_json operation as the canonical engine builds it:
 *   ["custom_json", {required_auths, required_posting_auths, id, json}]
 * `json` MUST be the stringified payload (that is what the chain stores).
 * @returns {{ok: boolean, reasons: string[], payload?: object}}
 */
export function validateAnchorOp(op) {
  const reasons = [];
  let payload;
  try {
    if (!Array.isArray(op) || op.length !== 2 || op[0] !== "custom_json" || op[1] === null || typeof op[1] !== "object") {
      return { ok: false, reasons: ["op must be [\"custom_json\", {…}] exactly as the canonical engine builds it"] };
    }
    const body = op[1];
    if (body.id !== PROTOCOL_ID) reasons.push(`id must be exactly "${PROTOCOL_ID}"`);
    if (!Array.isArray(body.required_auths) || body.required_auths.length !== 0) {
      reasons.push("required_auths must be [] — the anchor uses the POSTING role only (never active)");
    }
    if (!Array.isArray(body.required_posting_auths) || body.required_posting_auths.length === 0) {
      reasons.push("required_posting_auths must be a non-empty array of account names");
    } else {
      for (const a of body.required_posting_auths) {
        if (!isStr(a) || !ACCOUNT_RE.test(a)) reasons.push(`posting auth "${String(a).slice(0, 24)}" is not a valid account name`);
      }
    }
    if (!isStr(body.json)) {
      reasons.push("json must be the stringified payload (the chain stores a string)");
    } else {
      try {
        payload = JSON.parse(body.json);
        const r = validatePayload(payload);
        if (!r.ok) reasons.push(...r.reasons.map((x) => `json: ${x}`));
      } catch {
        reasons.push("json does not parse as JSON");
      }
    }
  } catch (e) {
    reasons.push(`validator internal error: ${String(e && e.message).slice(0, 120)}`);
  }
  const out = { ok: reasons.length === 0, reasons };
  if (payload !== undefined) out.payload = payload;
  return out;
}

/**
 * Freshness policy helper (t38 law): a consumer refuses an anchor older than
 * maxAgeMin minutes — with a stale anchor the runner's takeover gate goes DUE.
 * @returns {{fresh: boolean, ageMin: number, reason: string|null}}
 */
export function checkFreshness(at, { maxAgeMin = DEFAULT_MAX_AGE_MIN, now = Date.now() } = {}) {
  const t = Date.parse(at);
  if (!Number.isFinite(t)) return { fresh: false, ageMin: NaN, reason: "unparseable at" };
  const ageMin = Math.round((now - t) / 60_000);
  if (ageMin > maxAgeMin) return { fresh: false, ageMin, reason: `anchor ${ageMin}min old > ${maxAgeMin}min law (t38)` };
  return { fresh: true, ageMin, reason: null };
}

/* ── CLI ─────────────────────────────────────────────────────────────────── */
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const fs = await import("node:fs");
  const arg = process.argv[2];
  if (!arg || arg === "-h" || arg === "--help") {
    console.log("usage: node conformance/validate.mjs <file.json>   # file = payload object OR full [\"custom_json\",{…}] op; exit 0=valid 1=invalid 2=usage");
    process.exit(2);
  }
  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(arg, "utf8"));
  } catch (e) {
    console.error(`cannot read/parse ${arg}: ${String(e.message).slice(0, 120)}`);
    process.exit(2);
  }
  const r = Array.isArray(doc) ? validateAnchorOp(doc) : validatePayload(doc);
  if (r.ok) {
    console.log(JSON.stringify({ ok: true, protocol: PROTOCOL_ID, at: doc.at ?? r.payload?.at ?? null }));
    process.exit(0);
  }
  console.error(JSON.stringify({ ok: false, protocol: PROTOCOL_ID, reasons: r.reasons }));
  process.exit(1);
}
