# anchor-baseline — conformance suite for `saos-git-custody-v1`

**ROLE (since 2026-10-11, task 10-c un-silence sweep):** this repo is the
fleet's **conformance suite** for the canonical anchor protocol
`saos-git-custody-v1` — one vector set that every anchoring implementation is
validated against (`steem` saos-engine = canonical, Zip weave-anchor,
saos-dex anchor, saos-jummper's future Hive anchors, and this suite itself).
Spec + vectors + runner: **[`conformance/`](conformance/README.md)**
(`node conformance/selftest.mjs` → 35 PASS / 0 FAIL, zero deps, zero keys).

**Why it was silenced:** born as one of five duplicated anchoring
implementations, then reduced to a PASS-stamp archive (integrity bot only);
its Actions died in the org-wide billing wall (private repo, runs die at
setup since ~09-20 — owner billing decision, not a code failure).

**Revival path:** the suite already runs on bare node (no Actions needed).
When the owner lifts the billing wall, dispatch
`.github/workflows/conformance-selftest.yml` (workflow_dispatch only, no
secrets) or let fleet-heal do it — no further code work required.

**Standing duty:** keep `conformance/vectors.json` the single source of
anchor-shape truth. Any implementation refusal discovered in the wild becomes
a new named vector; vectors never move, they only grow.

---

## The baseline archive (original role, kept)

This repository also preserves the **frozen baseline** of the network's early
public record: dated broadcasts, session reports and downloads, guarded by an
integrity bot.

- `broadcasts/` — dated broadcast archive.
- `docs/reports/` — historical session reports (dated snapshots).
- `download/` — public download snapshot.
- `CRITICAL-R11-KEY-BROADCAST.md` — the 2026-09-12 incident record: an
  encrypted key-backup generation was committed beside its passphrase across
  partner repositories. The document describes **paths, field names, lengths
  and character classes only — no secret value appears in it**. Key rotation
  is an owner-held decision; the encrypted artifacts are no longer in the
  current trees (they remain in git history of the partner repos).
- `agent/` — the baseline-integrity bot's truth report and SHA-256 manifest.

## What runs

- **conformance-selftest** (new, `workflow_dispatch` only) — the
  `saos-git-custody-v1` vector suite; zero secrets; the repo's standing duty.
- **baseline-integrity** — SHA-256 manifest guard over the archive
  (`workflow_dispatch` only since 2026-10-07: schedule/push triggers were
  moved off Actions by the zero-minutes decree; the header of each workflow
  documents this honestly).
