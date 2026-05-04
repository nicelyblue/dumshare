---
phase: 08
slug: per-currency-balances-and-settlement-readiness
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-22
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `package.json` scripts (`npm run test`, `npm test`) |
| **Quick run command** | `npm run test -- per-currency-balances` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- per-currency-balances`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | BALN-01 | T-08-01 | Balance derivation reads approved entries only | unit | `npm run test -- per-currency-balances` | ✅ | ⬜ pending |
| 08-01-02 | 01 | 1 | BALN-01 | T-08-02 | Per-currency accumulator never merges distinct currency codes | unit | `npm run test -- per-currency-balances` | ✅ | ⬜ pending |
| 08-02-01 | 02 | 2 | BALN-02 | T-08-03 | Output shape preserves per-currency paid/owed/net detail | unit | `npm run test -- per-currency-balances` | ✅ | ⬜ pending |
| 08-02-02 | 02 | 2 | BALN-03 | T-08-04 | Pending/rejected submissions excluded from approved balances and surfaced as metadata note | unit | `npm run test -- per-currency-balances` | ✅ | ⬜ pending |

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

**Approval:** pending
