---
phase: 6
slug: organizer-approval-gate
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-22
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | package.json (`scripts.test`) |
| **Quick run command** | `npm run test -- organizer-approval-gate` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- organizer-approval-gate`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 1 | APRV-01, APRV-02 | T-06-01 | Contributor submissions enter pending queue only | unit | `npm run test -- organizer-approval-gate -- contributor` | ✅ | ⬜ pending |
| 6-01-02 | 01 | 1 | APRV-03, APRV-04 | T-06-02 | Organizer-only explicit approve/reject accepted | unit | `npm run test -- organizer-approval-gate -- review` | ✅ | ⬜ pending |
| 6-02-01 | 02 | 2 | APRV-05 | T-06-03 | Reject path never mutates approved balances | unit | `npm run test -- organizer-approval-gate -- reject` | ✅ | ⬜ pending |
| 6-02-02 | 02 | 2 | APRV-01..APRV-05 | T-06-01/T-06-02/T-06-03 | End-to-end replay invariants hold | integration | `npm test` | ✅ | ⬜ pending |

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
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-22
