# PROTOCOL — saos-git-custody-v1 (canonical, pinned v1)

**Status:** canonical · frozen shape · version 1
**Canonical implementations (source of truth):**
- `steem@saos-cockpit · mini-services/saos-engine/anchor-now-t38.mjs:86`
- `steem@saos-cockpit · mini-services/saos-engine/ci-act.mjs:203`

## The operation

A Steem/Hive `custom_json`, built exactly as the canonical engine builds it:

```json
["custom_json", {
  "required_auths": [],
  "required_posting_auths": ["<account>"],
  "id": "saos-git-custody-v1",
  "json": "{\"branch\":\"…\",\"tip\":\"…\",\"at\":\"…\",\"src\":\"…\",\"fp\":\"…\"}"
}]
```

## Rails (all mandatory — the validator refuses anything else)

| Rail | Law | Why |
|---|---|---|
| `id` | exactly `saos-git-custody-v1` | the protocol identity; `saos.weave.core.v1` is a **different** protocol (Zip weave) |
| `required_auths` | `[]` | the anchor rides the **posting role only** — active authority never signs it |
| `required_posting_auths` | non-empty array of valid account names (`^[a-z0-9][a-z0-9-\.]{1,15}$`) | the chain must attribute the anchor |
| `json` | a **string** (the chain stores a string) that parses to the payload | non-canonical to embed an object |

## Payload shape — exactly five fields

| Field | Type | Constraint | Canonical source |
|---|---|---|---|
| `branch` | string | non-empty, printable, no whitespace | `git rev-parse --abbrev-ref HEAD` |
| `tip` | string | full lowercase 40-hex git SHA-1 | `git rev-parse HEAD` |
| `at` | string | `YYYY-MM-DDTHH:MM:SS.sssZ` (canonical `new Date().toISOString()`) | broadcast moment |
| `src` | string | non-empty, printable, ≤64 | organ tag (`"ci-act"`, `"t38-anchor-now"`) |
| `fp` | string | non-empty, printable, ≤64 | organ fingerprint (`"t38"`, `"inproc-r280"`) |

**Unknown fields are a refusal.** This is the hash-only discipline (exposure
policy 7-b): anchors carry hashes and timestamps, never strategy, params,
account rosters, or path names.

## Freshness law (t38)

A consumer of the anchor refuses one older than **90 minutes**
(`DEFAULT_MAX_AGE_MIN = 90` in `validate.mjs`): with a stale anchor the
runner's takeover gate goes DUE — the freshness check exists so consumers
fail-closed instead of trusting a dead custodian. `checkFreshness(at)` returns
`{fresh, ageMin, reason}`.

## Conformance

- `vectors.json` — 28 named cases (6 valid, 22 invalid), each with a note
  citing the law it pins.
- `validate.mjs` — the runner (library + CLI). `node conformance/validate.mjs <file.json>`
  → exit 0 valid / 1 invalid / 2 usage. Works on a bare payload object or a
  full op array.
- `selftest.mjs` — runs all vectors + determinism + no-throw + freshness
  rails; `35 PASS / 0 FAIL` is the green line.

## Who must conform (the anchoring family, 5 implementations)

| Implementation | Protocol today | Path to conformance |
|---|---|---|
| steem saos-engine (canonical) | `saos-git-custody-v1` ✓ | is the source; suite asserts it stays true |
| Zip weave-anchor | `saos.weave.core.v1` (different, richer protocol) | keep distinct id; if a custody-v1 mode is added, validate with this suite |
| saos-dex `saos-dex.anchor.v1` | own shape | map to custody-v1 fields or declare distinct id in its README |
| saos-jummper anchor | HIVE custom_json plans (dormant) | its future HIVE anchor must use this exact shape (same custom_json family on Hive) |
| anchor-baseline (this repo) | suite itself | self-hosts the vectors; conformance-selftest workflow |

**Versioning:** any shape change = protocol v2 = new id (`saos-git-custody-v2`)
— v1 vectors never move. The fleet never breaks an anchored past.
