# Phase 3: Contributor Onboarding and Authority Model - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-21
**Phase:** 3-contributor-onboarding-and-authority-model
**Areas discussed:** Invite lifecycle

---

## Invite lifecycle

| Option | Description | Selected |
|--------|-------------|----------|
| Single-use only | Invitation consumed immediately after first successful join. | ✓ |
| Expiry only | Invitation reusable until timeout. | |
| Single-use + expiry | Consumed on first join and also auto-expires if unused. | |

**User's choice:** Single-use only
**Notes:** Decision aligns with locked single-device contributor identity and minimizes ambiguity.

| Option | Description | Selected |
|--------|-------------|----------|
| No auto-expiry | Invite stays valid until consumed or revoked. | ✓ |
| Time-based expiry | Invite expires after fixed duration. | |
| Session expiry | Invite expires when app/session closes. | |

**User's choice:** No auto-expiry
**Notes:** Prioritizes predictable offline behavior and avoids dependence on device time quality.

| Option | Description | Selected |
|--------|-------------|----------|
| Manual revoke action | Organizer explicitly revokes unused invite. | ✓ |
| Regenerate only | New invite silently invalidates old one. | |
| No revoke path | Unused invite only invalidated by consumption. | |

**User's choice:** Manual revoke action
**Notes:** User chose explicit control and auditable lifecycle behavior.

| Option | Description | Selected |
|--------|-------------|----------|
| Clear block + ask organizer | Explain invite invalid and ask for new code. | ✓ |
| Generic invalid code | Minimal generic invalid message. | |
| Silent return | Return to scan screen without explanation. | |

**User's choice:** Clear block + ask organizer
**Notes:** Must stay plain-language and actionable for non-technical travel use.

---

## the agent's Discretion

- Event naming and exact schema shape for invitation lifecycle events.
- Exact screen copy wording, provided it remains plain and action-oriented.

## Deferred Ideas

None.
