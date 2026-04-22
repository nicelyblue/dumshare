---
phase: 7
slug: in-person-sync-exchange
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-22
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | package.json (`scripts.test`) |
| **Quick run command** | `npm run test -- in-person-sync` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~25 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- in-person-sync`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 1 | SYNC-01, SYNC-02 | T-07-01/T-07-02 | Organizer only accepts valid sync-request payloads for session bootstrap | unit | `npm run test -- in-person-sync-handshake` | ✅ | ⬜ pending |
| 7-01-02 | 01 | 1 | SYNC-03 | T-07-03 | Repository provides deterministic unseen-event deltas from checkpoint | unit | `npm run test -- in-person-sync-handshake` | ✅ | ⬜ pending |
| 7-02-01 | 02 | 2 | SYNC-03, SYNC-04 | T-07-03/T-07-04 | Bidirectional exchange applies deduped remote events and advances checkpoint | integration | `npm run test -- in-person-sync-exchange` | ✅ | ⬜ pending |
| 7-02-02 | 02 | 2 | SYNC-05 | T-07-05 | Exchange emits plain-language status timeline for send/receive lifecycle | unit | `npm run test -- in-person-sync-exchange` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-22
