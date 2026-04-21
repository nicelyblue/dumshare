---
phase: 04
slug: expense-capture-foundations
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-21
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | package.json (`scripts.test`) |
| **Quick run command** | `npm run test -- expense-capture-foundations` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- expense-capture-foundations`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | EXPS-01, EXPS-02, EXPS-03 | T-04-01 / T-04-02 | Reject malformed expense payload and unauthorized creator before projection mutation | unit | `npm run test -- expense-capture-foundations` | ✅ | ⬜ pending |
| 04-01-02 | 01 | 1 | EXPS-03 | T-04-03 | Reject unknown payer participant IDs and preserve deterministic replay failure behavior | unit | `npm run test -- expense-capture-foundations && npm test` | ✅ | ⬜ pending |

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

**Approval:** pending
