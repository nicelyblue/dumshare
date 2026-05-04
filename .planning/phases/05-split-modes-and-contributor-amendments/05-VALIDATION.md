---
phase: 05
slug: split-modes-and-contributor-amendments
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-22
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `package.json` scripts |
| **Quick run command** | `npm run test -- expense-split-modes` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- expense-split-modes` or `npm run test -- contributor-amendments` (task-scoped)
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | EXPS-04/05/06 | T-05-01 / T-05-02 | Reject malformed split payloads before replay mutation | unit | `npm run test -- expense-split-modes` | ✅ | ⬜ pending |
| 05-01-02 | 01 | 1 | EXPS-04/05/06 | T-05-03 | Deterministic owed-share derivation sums to expense total | unit | `npm run test -- expense-split-modes && npm run test -- expense-capture-foundations` | ✅ | ⬜ pending |
| 05-02-01 | 02 | 2 | EXPS-07 | T-05-04 / T-05-05 | Contributor amendments require claimed device and existing expense target | unit | `npm run test -- contributor-amendments` | ✅ | ⬜ pending |
| 05-02-02 | 02 | 2 | EXPS-07 | T-05-06 | Amendment submissions enter pending queue and never auto-apply to approved entries | unit | `npm run test -- contributor-amendments && npm test` | ✅ | ⬜ pending |

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
