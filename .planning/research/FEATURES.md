# Feature Research

**Domain:** Offline organizer-led mobile shared-expense tracking (travel groups)
**Researched:** 2026-04-20
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Group ledger creation + participant management | All major apps center around “group/list + members” as the primary unit (trip, household, event). | MEDIUM | Must support organizer + contributor + passive participant roles from PROJECT.md. |
| Fast expense entry (who paid, amount, note) | Core day-to-day job to be done; every product foregrounds quick add flow. | LOW | Keep “add in <10 seconds” UX target. |
| Flexible split methods (equal + custom amounts + percentages) | Users expect non-equal splits for real trips; competitors explicitly advertise uneven/custom split support. | HIGH | Must include multi-payer + equal/exact/percentage as stated in PROJECT.md. |
| Running balances (“who owes whom”) | Baseline expectation in Splitwise/Tricount/Splitser/Kittysplit positioning. | MEDIUM | Required per-currency balance view (PROJECT.md). |
| Settlement suggestions (minimize transactions) | “Settle up” and debt simplification are common category defaults. | MEDIUM | Start with deterministic transaction minimization, then add UX niceties. |
| Editable expense history (amend/correct mistakes) | Real groups frequently mistype amounts/participants; inability to fix leads to abandonment. | MEDIUM | In Dumshare, contributor edits should remain approval-gated before entering approved ledger. |
| Multi-currency capture | Travel use-case expects foreign currency entries; multiple products highlight this directly. | HIGH | For v1: keep per-currency balances, avoid forced FX merging (PROJECT.md). |
| Offline entry at minimum | Even cloud-first competitors advertise offline entry + later sync, so users expect no data-loss in low connectivity. | HIGH | Dumshare requirement is stronger: fully offline operation and in-person sync. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Organizer-controlled approval workflow for submitted expenses/edits | Creates trusted ledger state for groups with uneven trust (one person reconciles final truth). | HIGH | This is uncommon in mainstream “everyone edits live” apps; strong differentiator for trips with a clear organizer. |
| Fully offline, local-first, no-account operation | Works in low/no internet environments and privacy-sensitive groups; zero cloud dependency. | HIGH | Must be explicit in onboarding and value messaging. |
| In-person sync via QR bootstrap + Bluetooth deltas | Reliable in-field sync without backend infra; avoids account/login friction. | HIGH | Needs robust failure handling + resumable session UX. |
| Single-device contributor identity + organizer-star topology | Reduces merge complexity and keeps mental model simple for non-technical users. | MEDIUM | Tradeoff: less flexibility vs significantly simpler conflict surface for v1. |
| Deterministic event-log audit trail visible in plain language (“pending”, “approved”, “rejected”) | Improves trust and dispute resolution beyond opaque direct mutation models. | HIGH | Keep technical internals hidden; expose human-readable activity timeline. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Cloud accounts + always-on sync in v1 | Familiar from mainstream finance apps; expectation of cross-device continuity. | Conflicts with core offline/local-first promise; introduces auth/backend/compliance complexity early. | Keep local-first + manual in-person sync for v1; revisit optional cloud bridge in v2+ only if validated. |
| Contributor-to-contributor mesh sync | Sounds “more flexible” and faster than organizer hub. | Explodes conflict resolution paths and trust governance; hard to explain UX. | Keep organizer-centric star topology (PROJECT.md). |
| Automatic conflict resolution without organizer review | Marketed as “no manual work.” | Hides contentious merges and can silently corrupt social trust in shared ledger. | Preserve explicit organizer approval/rejection workflow. |
| Forced single-currency auto-conversion ledger | Feels simpler at first glance. | Creates FX-rate disputes and temporal inconsistency in trip accounting. | Maintain per-currency balances and optional explicit settlement conversions. |
| “Everything integrations” (bank linking, payment rails, receipts OCR) in MVP | Perceived convenience and parity with mature incumbents. | Distracts from core offline sync reliability; high maintenance and regional compliance burden. | Focus MVP on robust core ledger + sync; add integrations only after reliability targets are met. |

## Feature Dependencies

```
[Group ledger + participant roles]
    └──requires──> [Expense entry + split engine]
                         └──requires──> [Balance calculation]
                                              └──requires──> [Settlement suggestion]

[Invitation + role assignment]
    └──requires──> [Single-device contributor identity]
                         └──requires──> [QR bootstrap + Bluetooth sync session]

[Contributor expense submission]
    └──requires──> [Organizer approval queue]
                         └──requires──> [Approved/pending/rejected state model]

[Multi-currency entry]
    └──requires──> [Per-currency balance projection]

[Contributor-to-contributor sync] ──conflicts──> [Organizer-only approval governance]
[Auto-merge conflicts] ──conflicts──> [Human approval model]
```

### Dependency Notes

- **Group ledger + participant roles requires expense entry + split engine:** members are only meaningful if they can transact with split rules.
- **Expense entry + split engine requires balance calculation:** entries without immediate balance impact feel broken.
- **Balance calculation requires settlement suggestion:** users expect actionable “who pays whom,” not only raw net balances.
- **Invitation + roles requires single-device contributor identity:** deterministic mapping avoids duplicate identities during offline sync.
- **Single-device identity requires QR + Bluetooth sync session:** identity handoff and trust bootstrap happen in person.
- **Contributor submissions require organizer approval queue:** this is the core governance differentiator and must exist before contributor editing is “real.”
- **Multi-currency entry requires per-currency projection:** otherwise totals become misleading and disputes increase.
- **Contributor mesh sync conflicts with organizer governance:** bypasses authoritative approval checkpoint.
- **Auto-merge conflicts with human approval:** opaque algorithmic merges undermine trust guarantees.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] Organizer creates group ledger and manages participants/roles — foundation for all workflows.
- [ ] Contributor invitation via QR + single-device binding — enables controlled participation offline.
- [ ] Expense entry with multi-payer + equal/exact/percentage splits — core trip reality coverage.
- [ ] Offline-first local persistence on Android/iOS — must work without internet.
- [ ] In-person sync (QR bootstrap + Bluetooth delta exchange) — core replication mechanism.
- [ ] Organizer approval/rejection queue for contributor changes — core trust/governance differentiator.
- [ ] Per-currency balances + settlement suggestions — closes the loop from entry to payback.

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Receipt photo attachments (not OCR) — add context for disputes once sync reliability is proven.
- [ ] Expense categories + lightweight analytics — add after users show repeated-trip retention.
- [ ] Smart reminders for unsettled balances — add when group cadence data exists.
- [ ] Export/share ledger summary (PDF/CSV) — add when users request trip closure artifacts.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Optional cloud backup/restore bridge — only after local-first model is validated.
- [ ] Multi-device contributor identities — only after identity + merge model matures.
- [ ] Payment rail integrations by region — only with clear demand and compliance resourcing.
- [ ] Advanced FX tooling (rate snapshots, conversion-assisted settlement) — after per-currency baseline stabilizes.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Group + participant management | HIGH | MEDIUM | P1 |
| Expense entry + split engine | HIGH | HIGH | P1 |
| Offline local persistence | HIGH | HIGH | P1 |
| QR + Bluetooth sync | HIGH | HIGH | P1 |
| Organizer approval workflow | HIGH | HIGH | P1 |
| Per-currency balances | HIGH | MEDIUM | P1 |
| Settlement minimization | HIGH | MEDIUM | P1 |
| Receipt photos | MEDIUM | MEDIUM | P2 |
| Categories + insights | MEDIUM | MEDIUM | P2 |
| Export summaries | MEDIUM | LOW | P2 |
| Cloud backup bridge | MEDIUM | HIGH | P3 |
| Payment integrations | LOW-MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Splitwise | Tricount | Our Approach (Dumshare v1) |
|---------|-----------|----------|-----------------------------|
| Core shared ledger + balances | Strong baseline; mature web/mobile product | Strong baseline; group-focused UX | Match baseline with simpler role language and organizer authority. |
| Flexible splitting | Equal/unequal/%/shares highlighted | Equal/custom and uneven splits highlighted | Include equal/exact/percentage + multi-payer from day one. |
| Offline behavior | Markets “offline mode” (with cloud-sync model overall) | Markets offline entry with auto-sync later | Go further: fully offline core with no cloud dependency. |
| Multi-currency | 100+ currencies + conversion features | Multi-currency with auto-conversion | Keep mixed currencies but no forced conversion in MVP. |
| Governance model | Mostly collaborative edits; no organizer-approval-first positioning | Collaborative edits | Differentiate with approval-gated contributor submissions. |
| Sync model | Internet/cloud account centric | Internet/cloud account centric | In-person QR + Bluetooth organizer-centric sync. |

## Sources

- Project context and constraints: `.planning/PROJECT.md` (local source)
- Splitwise product page (feature set and category baseline): https://www.splitwise.com/  
- Splitwise helpdesk (debt simplification behavior): https://feedback.splitwise.com/knowledgebase/articles/107220-what-does-the-simplify-debts-setting-do  
- Tricount homepage + feature pages (offline mode, multi-currency, custom splits, payment requests):  
  - https://tricount.com/en/  
  - https://tricount.com/en/expense-tracker-features  
  - https://tricount.com/en/expense-tracker-features/offline-expense-tracking  
  - https://tricount.com/en/expense-tracker-features/multi-currency-support  
- Splitser homepage (group lists, 150+ currencies, settlement minimization): https://splitser.com/  
- Kittysplit homepage (no-account simplicity, shared link collaboration): https://kittysplit.com/en  
- Settle Up homepage (cross-platform shared expenses, minimizing transactions): https://www.settleup.io/

### Confidence Notes

- **HIGH confidence:** table-stakes consensus on group ledgers, flexible splits, balances, and settlement minimization (supported by multiple major products).
- **MEDIUM confidence:** differentiation potential of organizer approval and offline in-person sync (strongly aligned with PROJECT.md and relatively uncommon in mainstream marketing, but not exhaustively benchmarked against every niche app).
- **LOW confidence:** none asserted as core conclusions.

---
*Feature research for: offline organizer-led expense sharing*
*Researched: 2026-04-20*
