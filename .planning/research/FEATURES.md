# Feature Landscape

**Domain:** Local-first mobile shared-expense app (frontend rebuild)
**Researched:** 2026-05-12

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| First-share onboarding (welcome -> create share) | Users must be able to start immediately with no setup confusion | Low | Flow already defined in mocks; must persist via existing setup mutations. |
| Share setup (share name + owner + save) | Core primitive of any shared-expense app is creating a bill/group context | Low | Supports "add participants now" and "later" branches from mock flow. |
| Participant management (add, edit, delete) | Group membership changes are routine and expected in expense splitting | Medium | Must use participant lifecycle APIs; long-press actions are UX table stake in provided pattern. |
| Persistent share switching (active share) | Users often track multiple trips/events and need fast context switch | Medium | Side menu + current-share highlight; must map to ledger list and active context resolution. |
| Home balance snapshot (net / owed / owes) | Main promise of product is who owes whom at a glance | Medium | Backed by existing balance/snapshot readers; needs clear empty/loading/error states. |
| Add expense flow (name, amount, currency, payer, participants) | Expense entry is the primary repeated action | High | Currency search + participant selection + validation messaging are critical UX details. |
| Split modes (equal + custom) | Users expect at least equal split plus manual override | High | Must align with existing domain split validation and prevent impossible splits. |
| Ledger entries list (chronological history) | Audit trail and trust depend on visible historical entries | Medium | Show what/how much/split summary; supports review and confidence. |
| Edit/delete expense from ledger | Mistakes happen; correction path is expected | High | Long-press actions should prefill edit form and preserve event-sourced integrity. |
| Settle-up flow (choose currency -> recommendations) | Users expect closure: explicit settlement output | Medium | Uses existing settlement/balance computation; output must be explainable not magical. |
| Navigation shell (header, side menu, bottom tabs) | Mobile discoverability and orientation depend on stable nav chrome | Medium | Required tabs: Home, Add, Ledger, Settle; side menu carries global controls. |
| Theme toggle (light/dark) | Baseline accessibility/usability expectation on mobile | Low | Stored locally; should apply app-wide instantly. |
| Delete-all data control (with confirmation) | Local-first users expect control over device data lifecycle | Medium | Must be clearly destructive with confirmation and post-reset re-onboarding. |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Explainable settle-up outcome card | Builds trust by showing optimal transfers with clear participant-level breakdown | Medium | "Why this result" messaging can materially improve confidence vs generic calculators. |
| Last-entered expense surfaced on home | Reduces context switching and reassures users their latest action persisted | Low | Quick feedback loop; useful in local-first flows with no server sync indicator. |
| Strong offline-first resilience UX | Positioning advantage: app remains fully usable without connectivity | Medium | Include explicit local persistence cues and deterministic recovery after app restart. |
| Fast multi-share workflow via side menu long-press actions | Power-user efficiency for people managing many concurrent shares | Medium | Active/edit/delete shortcuts in-place are higher-leverage than deeper settings screens. |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Accounts/authentication in v1 | Out of scope for milestone; adds backend/security burden and delays usable frontend | Keep device-local authority model and ship reliable local UX first. |
| Cloud sync / realtime collaboration | Conflicts with current local-first milestone and existing architecture boundary | Design UI states so sync can be layered later without changing core flows. |
| Web/desktop-specific optimization work | Dilutes mobile rebuild objective and increases testing matrix too early | Target Expo mobile UX quality and parity with provided mocks. |
| Gamification/social feed features | Adds novelty but not core value of accurate shared-expense tracking | Invest effort in data clarity, speed, and correction workflows. |
| Over-advanced split logic in v1 (weights, recurring templates, OCR scanning) | High complexity with weak immediate necessity; risks destabilizing core flow | Ship equal + custom split reliably with strong validation and edit support. |

## Feature Dependencies

```text
Create Share -> Add Participants -> Add Expense -> Ledger History -> Edit/Delete Expense
Create Share -> Add Expense -> Home Balance Snapshot -> Settle-Up Recommendations
Share Switching -> All Tab Flows (Home/Add/Ledger/Settle) scoped to active share
Participant Management -> Payer/Participant selectors in expense form
Currency Selection -> Expense Save Validation + Settle-Up Currency Output
Delete-All Data -> Welcome/Onboarding flow reset
```

## MVP Recommendation

Prioritize:
1. First-share onboarding + create-share + participant basics
2. Add expense (equal/custom split) + home balance snapshot
3. Ledger history with edit/delete + settle-up output

Defer: Expanded split intelligence (weights/templates/automation): high complexity for limited v1 value; preserve extension points in form/state models.

## Sources

- `.planning/PROJECT.md` (HIGH confidence: explicit scope, constraints, out-of-scope boundaries)
- `frontend mock/plans.txt` (HIGH confidence: explicit expected UI behavior and flow sequence)
- `.planning/codebase/ARCHITECTURE.md` (HIGH confidence: existing backend capabilities and integration boundaries)
