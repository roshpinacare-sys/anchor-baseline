# conformance/ — the saos-git-custody-v1 conformance suite

**Role (2026-10-11, task 10-c un-silence sweep):** anchor-baseline is the
**conformance suite** for the fleet's canonical anchor protocol
`saos-git-custody-v1` — the single place where every anchoring
implementation is validated against one set of vectors, instead of five
divergent implementations that drift in silence.

- **`PROTOCOL.md`** — the pinned v1 spec, extracted from the canonical
  sources in `steem@saos-cockpit` (anchor-now-t38.mjs:86, ci-act.mjs:203).
- **`vectors.json`** — 28 named test vectors (valid + refusals), each citing
  the law it pins.
- **`validate.mjs`** — zero-dep runner (library + CLI): validates a payload
  or a full `custom_json` op; never throws; never signs; never broadcasts;
  no keys.
- **`selftest.mjs`** — the green line: all vectors + determinism +
  no-throw + freshness rails. `node conformance/selftest.mjs` →
  `35 PASS / 0 FAIL`.

Runs on bare `node` ≥ 18, no install step, zero secrets. CI:
`.github/workflows/conformance-selftest.yml` (workflow_dispatch only —
this repo is private and the org Actions budget is billing-walled; when
minutes return, dispatch it, or run it locally on any machine).

Adding an implementation? Point it at `PROTOCOL.md`, run its anchor payload
through `validate.mjs`, and add any refusal it exposes as a new named vector
(with a note) — vectors never move, they only grow.
