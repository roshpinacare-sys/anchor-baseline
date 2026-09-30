# anchor-baseline — the baseline archive

This repository is the **frozen baseline** of the network's early public
record: dated broadcasts, session reports and downloads, guarded by an
integrity bot.

## What is here

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

One scheduled GitHub Action: **baseline-integrity** (daily 07:13 UTC) —
builds a SHA-256 manifest of broadcasts, docs and downloads, compares to the
previous manifest, reports additions/changes, and **fails when history files
are deleted**.
