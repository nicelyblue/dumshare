---
phase: 03
slug: contributor-onboarding-and-authority-model
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-21
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | package.json |
| **Quick run command** | `npm run test -- contributor-onboarding` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~25 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- contributor-onboarding`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | LEDR-03 | T-03-01 | Invite lifecycle enforces single-use + revoke semantics | unit | `npm run test -- contributor-onboarding-invitations` | ✅ | ⬜ pending |
| 03-01-02 | 01 | 1 | LEDR-04 | T-03-02 | Join blocked for used/revoked invite and second-device claim | unit | `npm run test -- contributor-onboarding-invitations` | ✅ | ⬜ pending |
| 03-02-01 | 02 | 2 | LEDR-05 | T-03-03 | Organizer-only authority guard accepts organizer, rejects others | unit | `npm run test -- contributor-authority-policy` | ✅ | ⬜ pending |
| 03-02-02 | 02 | 2 | LEDR-05 | T-03-04 | Replay-derived authority fields wire into guard checks | integration | `npm run test -- contributor-authority-policy` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/tests/contributor-onboarding-invitations.spec.ts` — stubs for LEDR-03/LEDR-04
- [ ] `src/tests/contributor-authority-policy.spec.ts` — stubs for LEDR-05

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
