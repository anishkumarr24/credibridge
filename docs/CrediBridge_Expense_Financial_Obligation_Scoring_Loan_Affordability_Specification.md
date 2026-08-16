# CrediBridge — Expense & Financial Obligation Scoring + Loan Affordability Specification
### Supersedes the Expense-Adjusted Affordability Addendum (Section 5B) · Extends Phase 5 (Scoring Engine) · Extends the Loan Eligibility & Amount Recommendation Specification
*Smart India Hackathon 2026 — Design Document (no code, no implementation)*

---

## 0. What Changes, What Doesn't

**This document is a Phase 5 *extension*, not a rewrite.** It adds one new scoring factor and refines one existing loan-sizing ceiling. It does not touch Income Consistency's, Payment Regularity's, Earnings Trend's, or Platform Tenure's internal formulas, and it does not touch the Risk Tier table or Affordability Calculation in the Loan Eligibility spec.

| Document | Status |
|---|---|
| **Phase 5 Scoring Specification** — Sections 1, 2.3, 3 (Steps 1, 3–5 unchanged; Step 2's redistribution formula now runs over 5 factors instead of 4, same mechanism), 4.1–4.4 (Income Consistency, Payment Regularity, Earnings Trend, Platform Tenure formulas), 6, 7, 8, 9, 10, 11, 12 | **Retained unchanged.** Section 3 Step 2's *mechanism* is unchanged; only the factor set it operates over grows from 4 to 5. |
| **Phase 5 Scoring Specification** — Section 2.2 weight table (33/28/22/17) | **Superseded.** Replaced by the 5-factor table in Section 6 of this document. Section 2.3's two cross-cutting principles (scale-invariance, self-referential baselines) are **preserved and extended** to the new factor. |
| **Loan Eligibility & Amount Recommendation Specification** — Sections 1–4, 7 (templates unrelated to expenses), 9–12 | **Retained unchanged.** Risk Tier table, Affordability Calculation, eligibility gate, and pseudocode structure are untouched. |
| **Loan Eligibility spec, Section 6** ("two ceilings") | **Superseded by the addendum's Section 4, which is itself refined here.** The three-ceiling model (Section 9 of this document) remains the reconciliation logic, unchanged in structure from the addendum. |
| **Expense-Adjusted Affordability Addendum** — Sections 4 (formula), 6 (templates), 9 (pseudocode) | **Retained, with one refinement:** `VerifiedMonthlyExpenses` is now computed by a single canonical function (`computeVerifiedMonthlyObligations`, Section 3.2 below) shared with the new score factor, and is scoped to an explicit category taxonomy (Section 3.1) instead of "all payment records." The 80% safety buffer, the amortization/reconciliation formula, and `round_to_500` behavior are **unchanged**. |
| **Expense-Adjusted Affordability Addendum** — Section 1's premise that expense data "should never" touch the score | **Superseded.** This was correct under the old product requirement (expenses = loan-sizing input only) but is explicitly overridden by the new requirement that obligation behavior also inform creditworthiness. Section 5 below explains why this is not the same thing as "expenses reduce the score." |
| **Expense-Adjusted Affordability Addendum** — Section 3 (self-reported expenses = advisory only, never authoritative) | **Retained unchanged**, and extended to the score (self-reported data is excluded from the new score factor for the same reasons). |

**Is this an extension of Phase 5 or a modification to Phase 5?** It is an **extension**: a fifth additive factor is introduced (Option A, decided in Section 2), the four existing factor formulas are byte-for-byte unchanged, and the aggregate formula's *mechanism* (weighted sum → confidence cap → band) is unchanged — only the factor set and normalized weights it operates over grow from four to five. Every existing worked example in the Phase 5 spec remains valid for a worker with no verified obligation data, by construction (Section 6.3 proves this).

---

## 1. Purpose

The existing architecture answers two questions separately and, until now, incompletely:

> **"How financially reliable is this worker?"** (Phase 5 Score) — previously blind to financial obligations entirely.
> **"How much could they be lent?"** (Loan Eligibility + Expense-Adjusted Addendum) — already obligation-aware, but only as a hard cash-flow ceiling.

This specification makes financial-obligation behavior visible to **both** questions, without violating the fairness constraint that anchors the whole project: **a worker must never be scored worse simply for having high expenses.** High rent, family responsibility, and expensive-city cost of living are not credit risks by themselves. What is a legitimate signal is **whether a worker's committed obligations leave them realistic repayment headroom, and whether they demonstrably manage that headroom** (on-time payment) rather than falling behind on it.

---

## 2. Relationship to Phase 5 — Option A, Decided

**Option A is adopted: a new, fifth, additive scoring factor.**

**Exact name:** `Obligation Burden & Management` (short form: **OBM**)

**Purpose:** Measures whether a worker's verified recurring financial obligations, relative to their own typical earnings, leave them realistic repayment capacity — and whether they demonstrably manage that capacity (on-time payment behavior on those same obligations) — without penalizing the raw *size* of the obligation itself.

**Why a new factor and not folding this into Payment Regularity:**

1. **Payment Regularity measures *timing only*** (`delta = paid_date − due_date`) and never looks at `amount`. It already answers "does this worker pay obligations on time." It has no mechanism to answer "are those obligations large relative to this worker's income" — that is genuinely new information, not a restatement of an existing one.
2. Payment Regularity's formula, breakpoints, and shrinkage constant (`k=5`) are already used in the fully worked "Rina" example (Phase 5 §14) and cross-referenced by the Loan Eligibility spec's worked example (§8). Redefining that formula to fold in amounts would silently invalidate both existing worked examples and every downstream document that cites them. A new, additive factor leaves both untouched.
3. A **named** factor is independently explainable ("your Obligation Burden & Management factor contributed 74/90 points, here's why") in a way that a modified internal term inside Payment Regularity is not — this matters directly for the explainability and judge-defense requirements below.
4. Section 6.2 below shows the anti-double-counting design in detail: OBM does **reference** Payment Regularity's already-computed output, but only as a *modifier*, never as an independent source of points. This is deliberate and is explained fully in Section 12.

**Why not Option B:** folding a burden-ratio calculation into Payment Regularity would require redefining a formula that four other documents already cite by exact numeric example, for no structural benefit — a new low-weight factor achieves the same product goal with strictly less disruption and strictly more explainability surface area.

---

## 3. Expense & Obligation Taxonomy

### 3.1 Category Classification

| Category | Verified or self-reported? | Data source | Can affect Score? | Can affect Loan Amount? | Status |
|---|---|---|---|---|---|
| Rent | Verified | `PaymentRecord` (`category = RENT`), amount + due/paid dates | Yes (via OBM) | Yes (via Expense-Adjusted ceiling) | Existing category, taxonomy formalized here |
| Electricity / water / recurring utility bills | Verified | `PaymentRecord` (`category = UTILITY`) | Yes | Yes | Existing category, taxonomy formalized here |
| Mobile / recharge, where recorded | Verified | `PaymentRecord` (`category = UTILITY` or `OTHER_RECURRING`, whichever the import maps it to) | Yes | Yes | Included if and only if it has both an amount and a recurrence pattern indistinguishable from a bill — see 3.3 |
| Other verified recurring payments | Verified | `PaymentRecord` (`category = OTHER_RECURRING`) | Yes | Yes | Existing category, taxonomy formalized here |
| Existing loan/EMI obligations (a debt the worker already owes elsewhere) | Would be verified if tracked | **Not present in the current data model** (`WorkerProfile` / `PaymentRecord` schema has no debt-obligation entity — flagged as a pre-existing gap in Loan Eligibility spec §10, limitation 3) | **Not included** — no data exists to include it | **Not included** | Out of scope; see Section 14 (Edge Cases) and Section 20 (Migration) |
| Groceries, transport, family support, informal cash expenses, other general living costs | Self-reported | `WorkerProfile.monthly_expenses` (single optional onboarding field; per the product build spec, Step 1, "optional monthly expenses") | **Never** | **Never** (advisory display + inconsistency flag only) | Existing field, treatment formalized here |

### 3.2 The Canonical Verified-Obligation Function

Both the new score factor (Section 5) and the refined Expense-Adjusted loan ceiling (Section 8.3) consume **one shared function**, so the two places this data is used are guaranteed to agree with each other and never silently drift apart:

```
VERIFIED_OBLIGATION_CATEGORIES = { RENT, UTILITY, OTHER_RECURRING }

function computeVerifiedMonthlyObligations(worker):
    records = [ r for r in worker.payments
                if r.category in VERIFIED_OBLIGATION_CATEGORIES
                and r.amount is not null and r.amount >= 0 ]

    monthly_totals = [ sum(r.amount for r in records if r.month == m)
                        for each distinct month m present in records ]

    if length(monthly_totals) == 0:
        return { verified_monthly_obligations: 0, n_months: 0 }

    return {
        verified_monthly_obligations: median(monthly_totals),
        n_months: length(monthly_totals)
    }
```

This is **exactly** the Addendum's original Section 2 formula, unchanged in method (median-of-monthly-totals, same robustness rationale), with its category scope now made explicit rather than implicit ("all payment records" → the three named categories above). `n_months` is newly exposed because the score factor needs it for shrinkage (Section 5.3); the loan ceiling does not need it and can ignore it.

### 3.3 What "verified" means here

A payment record counts as verified obligation evidence only if it has a non-null `amount` **and** a `category` in the set above. A record with a due date and paid date but no `category` mapping (e.g., an ambiguous CSV import row) is excluded from `computeVerifiedMonthlyObligations` but **may still** contribute to Payment Regularity (Phase 5 §4.2), which only requires `due_date`/`paid_date`, not `category` or `amount`. This is a deliberate scope difference, not an inconsistency: Payment Regularity answers "was this paid on time," which needs no category; OBM answers "how large is this obligation relative to income," which needs both category and amount.

### 3.4 Missing-data treatment

Handled identically to every other Phase 5 factor's philosophy, stated once here for the whole taxonomy:

- **Zero verified obligation records** → `n_months = 0` → OBM factor **excluded** from the score (Section 5.4), and the Expense-Adjusted loan ceiling falls away to its least-restrictive state (Section 8.3, unchanged from the original Addendum). Absence of evidence is never treated as evidence of zero obligations, and is never treated as evidence of high obligations either.
- **Some verified records (1+ months)** → OBM **included**, shrunk toward a neutral prior in proportion to how little evidence exists (Section 5.3).
- **Self-reported general expenses, present or absent** → never gates or shrinks anything authoritative. Its only behavior is the advisory inconsistency check (Section 4).

---

## 4. Verified vs. Self-Reported Data — The Defensible Recommendation

**Self-reported general expenses remain advisory-only for both the score and the loan amount.** This decision is carried forward unchanged from the original Addendum and extended to cover the new score factor. The reasoning:

1. **Unverifiable in either direction.** A worker could understate self-reported expenses to look more creditworthy, or overstate them out of caution or to justify a smaller, "safer" loan ask — CrediBridge has no way to distinguish either from the truth.
2. **Every other authoritative number in this system is traceable to structured, recorded data** (Phase 5 §2.3, §9). A single unverified figure entering an additive score or a hard loan ceiling would break that property for the entire pipeline, not just for this one number.
3. **It would be trivially gameable at the point of maximum incentive** — exactly when a worker is filling in the field that determines their own score or loan size.

**What self-reported data is allowed to do instead:**

- Displayed next to the computed obligation figures for the worker's own reference (unchanged from the Addendum).
- Feeds the existing inconsistency check, now checked against **both** the score explanation and the loan explanation (Section 10):

```
if worker.self_reported_expenses is not null:
    total_reported = VerifiedMonthlyObligations + worker.self_reported_expenses
    if total_reported > MedianMonthlyEarnings:
        show_advisory("Your reported total outgoings exceed your recorded income —
                       please review this loan amount and your budget.")
```

- **Never** contributes to `ConfidenceScore` (Phase 5 §7) either. The onboarding field is explicitly optional; if filling it moved the Profile Completeness or Data Validity confidence components, workers would be incentivized to fill in a number — any number — purely to raise their confidence tier, reintroducing exactly the "volume over behavior" gaming problem the original Phase 5 design rejected for Data Quality (Phase 5 §2.1). No change is made to the Confidence formula's five existing components or their weights.

If a future phase wants self-reported data to carry authoritative weight, it would need independent verification (e.g., bank-statement parsing, UPI transaction linkage) — at which point it stops being "self-reported" and becomes a new verified category under Section 3.1, not a change to how self-reported data is treated.

---

## 5. New Scoring Logic — Obligation Burden & Management (OBM)

OBM has two inputs, both already available elsewhere in the system — **no new raw data collection is required**, exactly mirroring the Loan Eligibility spec's own design principle (§2: "no new worker-facing data collection is required for this module to function").

### 5.1 Input 1 — Verified Obligation Burden Ratio (VOBR)

```
{ verified_monthly_obligations, n_months } = computeVerifiedMonthlyObligations(worker)
MedianMonthlyEarnings = phase5_result.factors.income.median_e     # reused from Income Consistency (§4.1), not recomputed

VOBR = verified_monthly_obligations / MedianMonthlyEarnings        # 0 if MedianMonthlyEarnings is 0 or unavailable — see 5.5
```

This is a **ratio**, not a rupee amount — satisfying the scale-invariance principle (Phase 5 §2.3.1) exactly as every other factor does. A worker earning ₹8,000 with ₹2,000 in verified obligations (VOBR = 0.25) and a worker earning ₹80,000 with ₹20,000 in verified obligations (VOBR = 0.25) score identically on this factor.

### 5.2 Input 2 — Obligation Payment Reliability (reused, not recomputed)

OBM does **not** re-derive a timing statistic from raw `due_date`/`paid_date` records. It reads the **already-computed** Payment Regularity sub-score:

```
PaymentRegularityValue = phase5_result.factors.payment.value     # the shrunk 0–100 sub-score from §4.2, reused as-is
```

This is the deliberate anti-double-counting design explained fully in Section 12. Reusing the *output* once (as a modifier) rather than recomputing the same *inputs* twice (as an independent score) is what keeps this defensible.

### 5.3 Formula

**Step 1 — Burden Headroom Score.** Piecewise-linear interpolation, same transparent style as every other Phase 5 factor:

| VOBR | 0.00 | 0.40 | 0.60 | 0.80 | 1.00 | 1.30+ |
|---|---|---|---|---|---|---|
| Burden Headroom Score | 100 | 95 | 85 | 70 | 50 | 20 (floor) |

Clamp below 0.00 to 100; clamp above 1.30 to the floor of 20 (never 0 — same nonzero-floor philosophy as every other factor, Phase 5 §4.1). Obligations under 40% of income barely move this component at all — this is the mechanism that directly implements the fairness requirement's own example (₹15,000 obligations against ₹20,000 income, VOBR = 0.75, sits between the 0.60 and 0.80 breakpoints and only moderately reduces this *sub*-component before Step 3 relief is even applied).

```
BurdenPenalty = 100 − BurdenHeadroomScore        # ranges 0 to 80
```

**Step 2 — Reliability Multiplier.** Piecewise-linear interpolation on `PaymentRegularityValue`:

| Payment Regularity value | 0 | 40 | 70 | 90 | 100 |
|---|---|---|---|---|---|
| Penalty Multiplier | 1.75 | 1.30 | 1.00 | 0.55 | 0.35 |

The neutral prior used everywhere in Phase 5 (70) is the anchor point where the multiplier is exactly `1.00` — i.e., a worker with a completely average, unshrunk-neutral payment record gets the *unadjusted* burden penalty, neither relief nor amplification. Strong payment reliability (90–100) forgives 45–65% of the burden penalty. Weak reliability (0–40) amplifies it by 30–75%.

```
AdjustedPenalty = min( BurdenPenalty × PenaltyMultiplier , 80 )     # capped so RawOBM never falls below the 20-point floor
RawOBM = 100 − AdjustedPenalty
```

**Step 3 — Insufficient-data shrinkage**, identical mechanism and constants to Income Consistency (Phase 5 §4.1) since VOBR — like RobustCV — is a ratio estimated from a small number of months and is statistically noisy with little data:

```
FinalSubScore = (n_months × RawOBM + k × 70) / (n_months + k)      where k = 3
```

**Score range:** 20 to 100 pre-shrinkage; the shrinkage formula pulls this toward 70 for small `n_months`, so the practical minimum with very little data is closer to `(1×20 + 3×70)/4 = 57.5`, and the practical minimum with abundant data approaches 20. **Maximum contribution: 90 points** (weight, see Section 6). **Minimum contribution:** never zero — same nonzero-floor philosophy as the rest of Phase 5.

**Why not simpler ("just subtract burden ratio from 100")?** Because that is exactly the "higher expenses = automatically worse score" design the product requirement explicitly forbids. The two-step penalty-then-relief structure is the minimum complexity needed to make burden size and payment discipline **interact** rather than being independently punitive, while remaining two piecewise-linear tables and one shrinkage formula — no heavier than any existing Phase 5 factor.

### 5.4 Missing-data handling

```
if n_months == 0:
    factors.obm = EXCLUDED     # weight redistributed per Section 6.2 — identical mechanism to every other factor
```

Consistent with Payment Regularity's own stated reasoning (Phase 5 §4.2): the system does **not** fall back to the shrinkage prior for zero records, because a plausible-looking "70" for a factor with no evidence behind it at all would misrepresent a completely undocumented worker as "average." Exclusion + redistribution is the honest choice, and it is the same choice Phase 5 already makes for the other four factors.

**With exactly `n_months = 1`:** included (unlike Income Consistency's MAD, which is mathematically undefined at n=1, VOBR only needs a single central-tendency value and is well-defined at n=1) — but heavily shrunk, since `k=3` dominates at `n=1`.

### 5.5 Edge case — `MedianMonthlyEarnings` unavailable

If Income Consistency itself is excluded (0–1 months of earnings data, Phase 5 §4.1), `median_e` does not exist, and VOBR cannot be computed regardless of how much obligation data exists. In this case OBM is **also excluded**, not computed with a default earnings figure — a burden ratio without a denominator is not a burden ratio, it is a fabricated number. Weight redistributes across whichever of the remaining factors are includable.

---

## 6. Score Weights and Formulas (Full 5-Factor Table)

### 6.1 Weight Table

| Factor | Previous weight (4-factor) | New weight (5-factor) | Points (of 900) |
|---|---|---|---|
| Income Consistency | 33% | **29.7%** | **267** |
| Payment Regularity | 28% | **25.2%** | **227** |
| Earnings Trend | 22% | **19.8%** | **178** |
| Platform Tenure | 17% | **15.3%** | **138** |
| **Obligation Burden & Management** | — | **10.0%** | **90** |
| **Total** | **100%** | **100%** | **900** |

The four existing factors are scaled down proportionally by a single constant (×0.90), preserving their *relative* proportions to each other exactly — the same re-normalization technique Phase 5 itself used when Data Quality was removed from the additive formula (Phase 5 §2.2). `267 + 227 + 178 + 138 + 90 = 900`, exactly, with no rounding remainder.

### 6.2 Updated Aggregate Formula (Phase 5 §3, Steps 2–3, now over 5 factors)

```
w_i' = w_i / Σ(w_j for j in included factors) × 100     # unchanged mechanism, now over up to 5 factors

RawScore₉₀₀ = Σ over included factors [ (SubScore_i / 100) × (w_i' / 100) × 900 ]     # unchanged mechanism
```

Steps 1, 4 (minimum-threshold: still "fewer than 2 includable → Insufficient Data," now out of 5 rather than 4), and 5 (confidence cap) of Phase 5 §3 are **unchanged**.

### 6.3 Proof of Backward Neutrality — Why This Never Penalizes Missing Obligation Data

When OBM is excluded (`n_months = 0`), the remaining four factors' weights redistribute over their new (scaled-down) values:

```
267 + 227 + 178 + 138 = 810
w_income' = 267 / 810 × 900 = 296.67   ≈ original 297
w_payment' = 227 / 810 × 900 = 252.22  ≈ original 252
w_trend'   = 178 / 810 × 900 = 197.78  ≈ original 198
w_tenure'  = 138 / 810 × 900 = 153.33  ≈ original 153
```

This is not a coincidence — it is arithmetically guaranteed, because each of the four weights was itself produced by multiplying the original weight by exactly `0.90`, and redistributing over a pool that sums to `0.90 × 900` scales everything back up by `1/0.90`, which exactly cancels. **A worker with zero verified obligation records is scored identically (up to floating-point rounding) to how they would have scored under the original 4-factor Phase 5 formula.** This is verified directly against the Phase 5 §14 "Rina" worked example in Section 13.5 below (RawScore₉₀₀ = 761.96, rounds to **762** — the exact figure in the original spec).

---

## 7. Confidence Treatment

**No changes to the `ConfidenceScore` formula, its five components, or their weights (Phase 5 §7).** This is a deliberate minimal-surface-area decision:

- OBM's underlying data source (`PaymentRecord`) is the same table already tracked by the existing **Payment Coverage** confidence component (`min(payment_records/10, 1) × 100`, 30% weight). A worker with thin obligation records already produces a lower Payment Coverage figure through the existing pathway — a second, obligation-specific confidence component would double-count the same underlying thinness signal.
- Self-reported expenses are explicitly excluded from confidence (Section 4) to avoid incentivizing workers to fill an optional field purely to raise their tier.

**Distinguishing "no evidence" from "verified high burden" — required outcome table:**

| Situation | OBM factor state | Score effect | Confidence effect |
|---|---|---|---|
| Zero verified obligation records | **Excluded** | None — weight redistributes exactly as if the factor never existed (Section 6.3) | Indirectly lower via existing Payment Coverage component, same as any thin-payment-record worker |
| 1–2 months of verified obligation records, any VOBR | **Included**, heavily shrunk toward 70 | Small, close to neutral regardless of raw VOBR/reliability | Indirectly lower via Payment Coverage, same mechanism |
| 6+ months of verified obligation records, high VOBR, good reliability | **Included**, lightly shrunk | Mild reduction (Section 13, Example 2) | Not specially affected |
| 6+ months of verified obligation records, high VOBR, poor reliability | **Included**, lightly shrunk | Materially larger reduction (Section 13, Example 3) | Not specially affected |

These four rows produce four **visibly different** outcomes, satisfying the requirement that "no verified expense evidence" and "verified high expense burden" must never collapse into the same result.

---

## 8. Loan Eligibility Interaction

### 8.1 What is unchanged

- Eligibility gate (Loan Eligibility spec §3) — unchanged.
- Risk Tier table (§4) — unchanged inputs (`Band`, `ConfidenceTier`), though `Band` may now shift slightly for workers with obligation data, per the score change above (this is an intended, indirect propagation, not a new mechanism).
- Affordability Calculation (§5) — unchanged; still driven only by `IncomeConsistency.value` and `MedianMonthlyEarnings`.
- Loan Amount Formula Steps 1–2 (§6) — unchanged formulas for `P_affordability` and `P_lti`.
- `round_to_500`, the amortization formula, and the 80% `SafetyBuffer` — unchanged from the original Addendum.

### 8.2 What changes

`VerifiedMonthlyExpenses` in the Expense-Adjusted ceiling formula is now sourced from the **canonical function** (Section 3.2) instead of "all payment records" — scoped explicitly to `{RENT, UTILITY, OTHER_RECURRING}`. In practice this produces the same number as before for any worker whose payment records were already limited to those categories (which is the entire current product scope), so **no existing worked example's numeric result changes** — only the definition is now explicit rather than implicit.

### 8.3 Expense-Adjusted Ceiling — Formula (unchanged from Addendum §4)

```
{ verified_monthly_obligations, n_months } = computeVerifiedMonthlyObligations(worker)   # Section 3.2, shared with OBM

NetMonthlyCapacity  = MedianMonthlyEarnings − verified_monthly_obligations
ExpenseAdjustedEMI  = max(NetMonthlyCapacity × 0.80, 0)

P_expense_adjusted = ExpenseAdjustedEMI × [ (1+i)^n − 1 ] / [ i × (1+i)^n ]
```

### 8.4 Explicit Anti-Double-Counting Explanation (required by the product brief)

Obligation data feeds two places, and this is **not** inappropriate double-counting, for the same reason the existing architecture already treats Income Consistency and `MedianMonthlyEarnings` this way (Loan Eligibility spec §11: *"Why compute two separate caps instead of one number from the score directly?"*):

| | **OBM (Score)** | **Expense-Adjusted Ceiling (Loan sizing)** |
|---|---|---|
| **Question answered** | "Is this worker's obligation level, relative to their own income, a *behavioral risk signal* — and do they manage it well?" | "Given this worker's *actual current* obligations, how much of their *actual current* income is *physically available* for a new monthly payment?" |
| **Measurement type** | Relative, ratio-based, blended with a behavioral reliability signal | Absolute, cash-flow-based, no behavioral blending |
| **Output** | A 0–90 point contribution to a 0–900 creditworthiness score | A rupee ceiling on the loan principal |
| **What moves it** | VOBR *and* payment reliability, interacting | Only the rupee gap between income and verified obligations |

A score answers *"should we trust this worker, and how much,"* while a cash-flow ceiling answers *"can this specific income structurally service this specific new payment on top of what's already committed."* These are different questions with different units, and prudent lending has always kept them separate — exactly the precedent the Loan Eligibility spec already set for Income Consistency vs. Affordability. Obligations doing the analogous dual duty is not a new pattern; it is the same pattern applied to a second input.

### 8.5 What obligation data affects, explicitly

| | Score | Loan Amount | Tenure | EMI | Explanations |
|---|---|---|---|---|---|
| Verified recurring obligations | **Yes** (OBM factor) | **Yes** (Expense-Adjusted ceiling, direct; Band/LTI, indirect via score) | **No direct effect** — tenure is set only by Band and Confidence Tier, unchanged | **Yes** (recomputed on whatever `RecommendedAmount` results) | **Yes** — new OBM template (Section 10) + existing Expense-Adjusted template (Addendum §6, retained) |
| Self-reported general expenses | **No** | **No** (advisory + inconsistency flag only) | **No** | **No** | **Yes** — advisory-only inconsistency message (unchanged) |

---

## 9. The Three-Ceiling Model (Unchanged in Structure)

```
candidates = {
    "affordability":    P_affordability,      # Loan Eligibility §6, unchanged
    "loan-to-income":   P_lti,                # Loan Eligibility §6, unchanged
    "expense-adjusted": P_expense_adjusted    # Section 8.3 above, canonical-function refinement only
}
binding = key_with_min_value(candidates)
RecommendedAmount = round_to_500(candidates[binding])
```

`P_lti` is now indirectly obligation-aware (because `Band` can shift via the score), and `P_expense_adjusted` remains directly obligation-aware, as before. `binding_constraint` continues to report exactly one of the three names — no new reconciliation state is introduced.

---

## 10. Explainability

Every OBM-related sentence is a fixed template bound to a named computed variable, following Phase 5 §9's exact convention: raw statistics are always shown even when the underlying sub-score was shrunk, and every explanation names its sample size.

**New OBM templates:**

- *"Your verified recurring obligations (rent, utilities, and other recorded recurring payments) average ₹{verified_monthly_obligations} per month, against your typical monthly earnings of ₹{MedianMonthlyEarnings} — a ratio of {VOBR×100}%."*
- *(when reliability provides relief)* — *"Your recorded obligations are generally paid on time, so the system applies only a reduced penalty for the size of that burden."*
- *(when reliability amplifies the penalty)* — *"Your verified obligations are high relative to your typical earnings, and a pattern of late or missed payments on those obligations increases the impact on this factor."*
- *(when burden is low)* — *"Your verified recurring obligations are modest relative to your typical earnings, so this factor contributes close to its maximum."*
- *(when excluded)* — *"No verified recurring-obligation records are available yet, so this factor is not included in your score — the other factors' weights adjust accordingly, and this is not treated as a negative signal."*
- *"This factor is based on {n_months} month(s) of verified obligation records; a small statistical adjustment was applied because {n_months} month(s) is not yet a long history."* (shown only when shrinkage is materially pulling the score toward neutral, i.e., `n_months` below roughly 6–8)

**Retained from the Addendum (unchanged), now cross-referencing OBM where relevant:**

- *"After your verified obligations, your estimated monthly surplus is ₹{NetMonthlyCapacity}; we recommend committing no more than 80% of that (₹{ExpenseAdjustedEMI}) to a loan payment."*
- *"Your recommended amount was set by your expense-adjusted limit, not your score or loan-to-income limit."*
- *(inconsistency)* — unchanged from Addendum §6.

---

## 11. Fairness Analysis

| Risk | Mitigation in this design |
|---|---|
| **Different cost-of-living environments / high-rent areas** | VOBR is a *ratio* to the worker's own income, never an absolute rupee comparison across workers (Section 5.1) — satisfies scale-invariance identically to every other Phase 5 factor. |
| **Family responsibilities driving up verified obligations** | The Burden Headroom breakpoints (Section 5.3) barely move below VOBR = 0.40, and even at VOBR = 0.75–0.80 the penalty is modest *before* the reliability relief is applied — a worker with high but well-managed obligations lands close to the top of the factor's range (Section 13, Example 2: 74/90). |
| **Workers with irregular income** | `MedianMonthlyEarnings` is the same robust, outlier-resistant figure already used for Income Consistency (Phase 5 §4.1) — not re-derived, not newly sensitive to volatility. |
| **Workers with incomplete expense records** | Exclusion + redistribution (Section 5.4), proven neutral in Section 6.3 — never scored as if burden were zero, never scored as if burden were average. |
| **Cash-based expenses (e.g., informal cash rent) that never enter the platform** | Explicitly disclosed as a blind spot, not silently assumed to be zero (Section 15) — identical honesty standard to the original Addendum §7. |
| **Self-reported data gaming** | Structurally impossible to game the score or loan amount via self-report, because self-report touches neither (Section 4). |
| **Platform-specific data differences** | Category taxonomy (Section 3.1) is platform-agnostic; any platform's rent/utility/other-recurring records map into the same three buckets. |
| **False assumption that zero verified expenses means zero expenses** | Explicitly the entire point of the exclusion mechanism (Section 5.4) — the explanation template (Section 10) says so directly to the worker. |
| **The score component becoming a backdoor "poverty penalty"** | This is the central risk the product brief raised, and it is why the design blends burden with a behavioral *management* signal rather than scoring burden alone — a worker cannot be pushed low on this factor by income/obligation ratio alone unless their payment discipline on those same obligations is also weak (Section 13 shows this numerically: identical VOBR = 0.80 produces 74/90 with good discipline vs. 56/90 with poor discipline — a 18-point swing driven entirely by *management*, not by the size of the obligation). |

---

## 12. Anti-Gaming Safeguards

1. **Self-reported data cannot move the score or the loan amount** (Section 4) — the single most important anti-gaming property in this specification.
2. **OBM cannot be inflated by simply having zero recorded obligations.** A worker with genuinely zero platform-recorded obligations is *excluded*, not scored 100 — exclusion redistributes weight to other factors rather than crediting a perfect obligation score for an absence of data (Section 5.4). A worker cannot game this factor upward by deliberately avoiding recording rent/utility payments; doing so simply removes the factor from their score rather than helping it.
3. **The reliability multiplier cannot be gamed by paying obligations early/on-time while quietly inflating `amount` fields**, because `verified_monthly_obligations` only *hurts* headroom when it is high, and a worker cannot simultaneously want a high reported obligation amount (for some other, imagined benefit) and a low one (for a better OBM score) — the two inputs pull the score in the same direction the real underlying behavior does, by construction.
4. **No single payment record can dominate the factor.** `computeVerifiedMonthlyObligations` uses a median of monthly totals (Section 3.2), exactly as the original Addendum specified, so one anomalous month (a skipped bill, a double payment) does not swing VOBR.
5. **Shrinkage prevents a short, favorably-selected obligation history from producing an extreme score in either direction** (Section 5.3) — a worker cannot show two or three months of an artificially low obligation total to inflate this factor; the `k=3` shrinkage pulls any thin history hard toward the neutral prior of 70.

---

## 13. Worked Examples

All figures below are computed directly from the formulas in Sections 5 and 8; none are invented. `MedianMonthlyEarnings` in each example is assumed already computed by Income Consistency (Phase 5 §4.1) and is simply reused, per the shared-input principle used throughout this document.

### 13.1 Example 1 — Stable Worker, Moderate Obligations

**Inputs:** `MedianMonthlyEarnings = ₹18,000`, verified obligations = ₹6,000/month (rent + utilities, `n_months = 6`), Payment Regularity value = 92 (mostly on-time).

```
VOBR = 6,000 / 18,000 = 0.333
BurdenHeadroomScore = interpolate(0.333, [0.00→100, 0.40→95]) ≈ 95.83
BurdenPenalty = 4.17
PenaltyMultiplier = interpolate(92, [90→0.55, 100→0.35]) ≈ 0.51
AdjustedPenalty = 4.17 × 0.51 ≈ 2.13
RawOBM = 97.88
FinalSubScore = (6×97.88 + 3×70) / 9 ≈ 88.58
Contribution ≈ 88.58/100 × 90 ≈ 80 / 90 pts
```

**Explanation shown:** *"Your verified recurring obligations average ₹6,000/month against your typical earnings of ₹18,000 — a ratio of 33%. Your recorded obligations are generally paid on time, so the system applies only a reduced penalty for the size of that burden."* Normal, moderate obligations do **not** meaningfully damage the score — the factor lands near its ceiling.

### 13.2 Example 2 — High Obligations, Good Payment Discipline

**Inputs:** `MedianMonthlyEarnings = ₹20,000`, verified obligations = ₹16,000/month (`n_months = 8`), Payment Regularity value = 95 (excellent — same worker as the original Addendum's "Vikram" example, extended with a payment-discipline assumption).

```
VOBR = 16,000 / 20,000 = 0.800
BurdenHeadroomScore = 70.00 (exact breakpoint)
BurdenPenalty = 30.00
PenaltyMultiplier = interpolate(95, [90→0.55, 100→0.35]) = 0.45
AdjustedPenalty = 13.50
RawOBM = 86.50
FinalSubScore = (8×86.50 + 3×70) / 11 = 82.00
Contribution = 82.00/100 × 90 = 73.8 → 74 / 90 pts
```

**Loan side (unchanged Addendum mechanics, Section 8.3):** `NetMonthlyCapacity = ₹4,000`, `ExpenseAdjustedEMI = ₹3,200`, `P_expense_adjusted ≈ ₹67,300` at 24 months/13% — the same result as the original Addendum's Vikram worked example, since the loan-side formula is unchanged.

**What this demonstrates:** the *loan amount* is meaningfully constrained (₹67,500 instead of the ₹80,000 the LTI cap alone would allow) because the obligation is genuinely large relative to income — but the *score* only drops to 74/90 (≈82% of maximum on this factor), because the worker demonstrably manages that obligation. High expenses reduced loan capacity without a severe score penalty — exactly the required behavior.

### 13.3 Example 3 — High Obligations + Repeated Missed Payments

**Inputs:** Same `MedianMonthlyEarnings = ₹20,000` and verified obligations = ₹16,000/month (`n_months = 8`) as Example 2, but Payment Regularity value = 35 (a real pattern of late/severely-late payments, not a single incident).

```
VOBR = 0.800 → BurdenHeadroomScore = 70.00 → BurdenPenalty = 30.00
PenaltyMultiplier = interpolate(35, [0→1.75, 40→1.30]) ≈ 1.356
AdjustedPenalty = 30.00 × 1.356 ≈ 40.69
RawOBM = 59.31
FinalSubScore = (8×59.31 + 3×70) / 11 ≈ 62.23
Contribution ≈ 62.23/100 × 90 ≈ 56 / 90 pts
```

**Same VOBR (0.800) as Example 2 — the entire 18-point swing (74 → 56) is driven by payment discipline, not obligation size.** This is the numeric proof that the design penalizes mismanagement, not burden.

### 13.4 Example 4 — Low / No Verified Expense Data

**Worker "Meena":** Income Consistency = 78.0, Payment Regularity = 81.5, Earnings Trend = 72.0, Platform Tenure = 55.0, **zero verified obligation records** (`n_months = 0`).

```
OBM → EXCLUDED (Section 5.4)
Redistributed weights: income=296.67, payment=252.22, trend=197.78, tenure=153.33  (Section 6.3)
RawScore₉₀₀ = (78.0×2.9667) + (81.5×2.5222) + (72.0×1.9778) + (55.0×1.5333)
            ≈ 231.4 + 205.6 + 142.4 + 84.3
            ≈ 663.7 → rounds to 664
```

**Explanation shown:** *"No verified recurring-obligation records are available yet, so this factor is not included in your score — the other factors' weights adjust accordingly, and this is not treated as a negative signal."* Missing obligation data produces the same score Meena would have gotten under the original 4-factor Phase 5 formula — no penalty for absence.

### 13.5 Example 5 — Self-Reported Expense Inconsistency

**Inputs:** `MedianMonthlyEarnings = ₹15,000`, verified obligations = ₹5,000/month (`n_months = 5`), Payment Regularity value = 88, self-reported general expenses = ₹12,000/month.

**Score (uses verified data only):**
```
VOBR = 5,000/15,000 = 0.333 → BurdenHeadroomScore ≈ 95.83 → BurdenPenalty ≈ 4.17
PenaltyMultiplier ≈ 0.595 → AdjustedPenalty ≈ 2.48 → RawOBM ≈ 97.52
FinalSubScore = (5×97.52 + 3×70)/8 ≈ 87.20
Contribution ≈ 78 / 90 pts
```

**Advisory check (Section 4):** `5,000 + 12,000 = 17,000 > 15,000` → the inconsistency warning fires and is shown to the worker, **but does not change the 78/90 contribution, the score, or the loan amount.**

**Explanation shown alongside the score:** *"Your verified recurring obligations average ₹5,000/month (33% of your typical earnings), which is reflected in your score. You separately told us you spend about ₹12,000/month on other costs — this is shown for your own awareness only and does not affect your score or loan amount, since it can't be independently verified."*

### 13.6 Example 6 — Obligation Burden Improvement / Recovery

**Six months ago:** `MedianMonthlyEarnings = ₹20,000`, verified obligations = ₹17,000/month (`n_months = 6`), Payment Regularity value = 55 (mixed — some late payments).

```
VOBR = 0.850 → BurdenHeadroomScore = 65.00 → BurdenPenalty = 35.00
PenaltyMultiplier = interpolate(55, [40→1.30, 70→1.00]) = 1.15
AdjustedPenalty = 40.25 → RawOBM = 59.75
FinalSubScore = (6×59.75 + 3×70)/9 ≈ 63.17 → Contribution ≈ 57 / 90 pts
```

**Today:** earnings have grown to `₹24,000/month`, verified obligations are unchanged at `₹16,000/month`, `n_months = 12`, Payment Regularity has improved to 90 (a sustained on-time streak).

```
VOBR = 16,000/24,000 = 0.667 → BurdenHeadroomScore = 80.00 → BurdenPenalty = 20.00
PenaltyMultiplier = interpolate(90, [70→1.00, 90→0.55]) = 0.55
AdjustedPenalty = 11.00 → RawOBM = 89.00
FinalSubScore = (12×89.00 + 3×70)/15 = 85.20 → Contribution ≈ 77 / 90 pts
```

**Explanation shown:** *"Your Obligation Burden & Management factor improved from 57/90 to 77/90. Your verified obligation-to-income ratio decreased from 85% to 67%, and your on-time payment record on those obligations improved — both contributed to this increase."* Improved financial behavior is visibly and mechanically rewarded, with no ceiling effect trapping a recovering worker at their old score.

---

## 14. Edge Cases

| Case | Handling |
|---|---|
| `MedianMonthlyEarnings` is 0 or unavailable (Income Consistency excluded) | OBM excluded (Section 5.5) — a ratio with an undefined denominator is not computed with a fabricated substitute. |
| Verified obligations exceed income by a large margin (VOBR ≥ 1.30) | `BurdenHeadroomScore` floors at 20, `BurdenPenalty` floors at 80; `AdjustedPenalty` is capped at 80 regardless of how poor reliability is, so `RawOBM` never falls below 20 — the nonzero-floor principle used throughout Phase 5. |
| Exactly one verified obligation month (`n_months = 1`) | Included (unlike Income Consistency's MAD, no second data point is mathematically required — Section 5.4), but shrinkage pulls it heavily toward 70. |
| Payment Regularity itself is excluded (worker has verified obligation *amounts* but no usable `due_date`/`paid_date` pairs at all) | `PenaltyMultiplier` defaults to `1.00` (the neutral, unadjusted value) — the burden penalty applies without relief or amplification, and the explanation states plainly that reliability could not be assessed due to missing due/paid-date data. |
| A worker's obligations are entirely cash-based and never enter any recorded system | `verified_monthly_obligations = 0`; treated exactly as "no verified evidence" (Section 5.4/15) — never presented as "this worker has no obligations." |
| An existing debt/EMI the worker owes to another lender, not on this platform | Not modeled in the current data schema (Section 3.1) — genuinely absent, not merely unverified; disclosed as a limitation (Section 15), not silently assumed to be zero risk. |
| A worker's obligations *decrease* between two scoring runs (e.g., rent renegotiated down) | No special-case logic needed — `computeVerifiedMonthlyObligations` recomputes from the current record set each time; a lower VOBR flows through the same formula and naturally produces a higher `BurdenHeadroomScore`. |
| Self-reported expenses are present but verified obligations are `0` | Advisory check still runs (`0 + self_reported > income?`) and can still fire; OBM is still excluded regardless of the self-reported figure, since self-reported data never substitutes for verified data (Section 4). |

---

## 15. Limitations

1. **This does not capture true total expenses**, only *verified, recurring, platform-recorded* rent/utility/other-recurring obligations — a worker paying cash rent to a landlord outside any recorded system shows `verified_monthly_obligations = 0` even though real rent exists. This is an honest, disclosed limitation, carried forward unchanged from the original Addendum (§7).
2. **Existing debt/EMI obligations to other lenders are not modeled** in the current data schema at all (Section 3.1) — a production system would need a dedicated debt-obligation entity and a genuine total-debt-to-income check, not just the current EMI-to-verified-obligations view. This is the same gap the Loan Eligibility spec already disclosed (§10, limitation 3); this document does not close it, only avoids pretending otherwise.
3. **The breakpoint tables and the 3:1 relief-to-amplification asymmetry in the reliability multiplier are reasoned prudential choices, not empirically calibrated** — like every other breakpoint table in Phase 5, they would need validation against real repayment/default outcomes before production use.
4. **Mobile/recharge categorization is ambiguous** in the current schema (Section 3.1) — depending on how a given platform's CSV import maps this category, it may or may not be counted as a verified obligation. This should be resolved with an explicit category-mapping decision during implementation, not left to import-time guessing.
5. **`n_months = 1` is mathematically valid but practically thin** — a single month's obligation total, even median-smoothed trivially (median of one value = that value), carries real risk of being unrepresentative (e.g., a one-off large purchase miscategorized as recurring). Shrinkage mitigates but does not eliminate this.
6. **This factor, like all Phase 5 factors, is synthetic-data-only and unvalidated against real repayment outcomes** — the same overarching limitation already disclosed for the rest of Phase 5 (§11, §13) applies here without exception.

---

## 16. Judge-Defense Questions

**Q1: Doesn't scoring "obligation burden" just become a hidden way of penalizing poor or high-cost-of-living workers?**
No — by design. The factor is a *ratio* to the worker's own income (never an absolute rupee figure across workers), and burden alone produces only a modest penalty (Section 5.3's breakpoints) *before* the reliability relief is applied. Example 2 (Section 13.2) shows a worker with a 80%-of-income obligation still landing at 74/90 (≈82%) because they manage it well. What genuinely lowers this factor is **mismanagement of a large obligation**, demonstrated by Example 3's identical 80% ratio landing at 56/90 with a real pattern of missed payments — the same burden, an 18-point difference driven entirely by behavior.

**Q2: Why does the same obligation data feed both the score and the loan amount — isn't that double-counting?**
No — they answer different questions with different units, exactly the same precedent already established between Income Consistency (score) and `MedianMonthlyEarnings` (Affordability ceiling) in the existing Loan Eligibility spec. Full argument in Section 8.4.

**Q3: Why not just recompute Payment Regularity's timing statistic separately for obligation records, instead of reusing its output?**
Reusing the already-computed output (rather than re-deriving from the same raw `due_date`/`paid_date` records) is what keeps this from being a second, redundant scoring of identical raw data under a different name. The reused value acts only as a *modifier* on a genuinely new signal (burden ratio) — it contributes zero points on its own; a worker with VOBR = 0 scores 100 on this factor regardless of Payment Regularity, so timeliness alone can never earn OBM points, only prevent or amplify burden-driven point loss (Section 12, point 3).

**Q4: Why weight this factor at only 10%?**
It is a secondary, corroborating signal — Payment Regularity and Income Consistency together already carry 55% of the score and directly measure the two things this factor only partially re-contextualizes (payment discipline and income stability). A weight comparable to the primary behavioral factors would let a single supplementary signal dominate a score built primarily on more direct evidence. 10% is large enough to move a Band in genuinely extreme cases (Example 3's 18-point OBM swing is real) but small enough that no worker's score is defined by this factor alone.

**Q5: Why not use machine learning to find the "right" way to combine burden and reliability?**
The same reasoning as the rest of Phase 5 (§12, Q4): with no real historical default-outcome data to train or validate against, an ML model here would be uncalibrated and unauditable. Two piecewise-linear tables and one interaction formula are closed-form, reproducible by hand, and fully explainable to the worker they affect — an ML model combining the same two inputs could not clear that bar without outcome data this prototype does not have.

**Q6: What happens to a worker's score the moment they add their first rent payment record?**
It depends entirely on the record itself — this is the correct behavior. A first record with `n_months = 1` is heavily shrunk toward 70 (Section 5.3), so the *initial* effect on the score is small regardless of the obligation's size, and grows more decisive only as more months of evidence accumulate — exactly the same "no cliff-edge jump" philosophy Phase 5 already applies to every other factor.

---

## 17. Pseudocode

### 17.1 Shared function (Section 3.2, repeated here for completeness)

```
VERIFIED_OBLIGATION_CATEGORIES = { RENT, UTILITY, OTHER_RECURRING }

function computeVerifiedMonthlyObligations(worker):
    records = [ r for r in worker.payments
                if r.category in VERIFIED_OBLIGATION_CATEGORIES
                and r.amount is not null and r.amount >= 0 ]
    monthly_totals = [ sum(r.amount for r in records if r.month == m)
                        for each distinct month m present in records ]
    if length(monthly_totals) == 0:
        return { verified_monthly_obligations: 0, n_months: 0 }
    return { verified_monthly_obligations: median(monthly_totals), n_months: length(monthly_totals) }
```

### 17.2 OBM factor (extends `computeCrediBridgeScore`, Phase 5 §15)

```
BURDEN_BREAKPOINTS  = [(0.00,100),(0.40,95),(0.60,85),(0.80,70),(1.00,50),(1.30,20)]
RELIEF_BREAKPOINTS  = [(0,1.75),(40,1.30),(70,1.00),(90,0.55),(100,0.35)]
PRIOR = 70

function computeOBM(worker, income_median_e, payment_regularity_value):
    obligations = computeVerifiedMonthlyObligations(worker)

    if income_median_e is null or income_median_e == 0:
        return EXCLUDED     # Section 5.5

    if obligations.n_months == 0:
        return EXCLUDED     # Section 5.4

    vobr = obligations.verified_monthly_obligations / income_median_e
    burden_score = interpolate(vobr, BURDEN_BREAKPOINTS, clampLow=100, clampHigh=20)
    burden_penalty = 100 - burden_score

    if payment_regularity_value is null:      # Payment Regularity itself excluded — see Section 14
        multiplier = 1.00
    else:
        multiplier = interpolate(payment_regularity_value, RELIEF_BREAKPOINTS, clampLow=1.75, clampHigh=0.35)

    adjusted_penalty = min(burden_penalty * multiplier, 80)
    raw = 100 - adjusted_penalty

    n = obligations.n_months
    shrunk = (n*raw + 3*PRIOR) / (n+3)

    return { value: shrunk, n: n, vobr: vobr, raw: raw,
             burden_score: burden_score, multiplier: multiplier }
```

### 17.3 Integration point in `computeCrediBridgeScore` (Phase 5 §15)

```
WEIGHTS_PCT = { income: 29.7, payment: 25.2, trend: 19.8, tenure: 15.3, obm: 10.0 }   # Section 6.1

# ... existing income/payment/trend/tenure blocks, unchanged ...

factors.obm = computeOBM(worker, factors.income.median_e if factors.income != EXCLUDED else null,
                          factors.payment.value if factors.payment != EXCLUDED else null)

included = [f for f in factors if factors[f] != EXCLUDED]
if length(included) < 2:                      # unchanged threshold, now out of 5
    return { status: "INSUFFICIENT_DATA" }

total_w = sum(WEIGHTS_PCT[f] for f in included)
raw_score_900 = sum( (factors[f].value/100) * (WEIGHTS_PCT[f]/total_w) * 900 for f in included )
# ... confidence, cap, band unchanged (Phase 5 §7-8) ...
```

### 17.4 Loan Eligibility integration (extends `recommendLoan`, Loan Eligibility spec §12)

```
function computeExpenseAdjustedCeiling(worker, phase5_result, tier, n, i):
    obligations = computeVerifiedMonthlyObligations(worker)     # Section 3.2 — shared with OBM
    net_capacity = phase5_result.factors.income.median_e - obligations.verified_monthly_obligations
    expense_adjusted_emi = max(net_capacity * 0.80, 0)
    p_expense_adjusted = expense_adjusted_emi * ((1+i)**n - 1) / (i * (1+i)**n)
    return { p_expense_adjusted, verified_monthly_obligations: obligations.verified_monthly_obligations, expense_adjusted_emi }

# --- inside recommendLoan(), reconciliation step (Section 9) unchanged from Addendum §9 ---
```

---

## 18. Required Outputs / Types

```
OBMFactorResult {
    value: number            // 0-100, shrunk sub-score, or absent if EXCLUDED
    n_months: integer        // months of verified obligation data used
    vobr: number              // 0+, verified_monthly_obligations / median_e
    raw: number               // 0-100, pre-shrinkage
    burden_score: number      // 0-100, Step 1 output before relief/amplification
    multiplier: number        // 0.35-1.75, Step 2 output
    status: "INCLUDED" | "EXCLUDED"
    exclusion_reason?: "NO_OBLIGATION_DATA" | "NO_INCOME_DATA"
}

VerifiedObligationsResult {
    verified_monthly_obligations: number     // rupees, median of monthly totals
    n_months: integer
}

LoanRecommendationResult {                    // extends existing shape from Loan Eligibility spec §12
    ...,
    recommended_amount: number,
    binding_constraint: "affordability" | "loan-to-income" | "expense-adjusted",
    estimated_emi: number,
    verified_monthly_obligations: number,     // renamed from verified_monthly_expenses for taxonomy consistency (Section 3)
    advisory_flag: string | null,
    obm_reference: OBMFactorResult            // included for explanation cross-linking between score and loan output
}
```

---

## 19. Test Cases

| # | Scenario | Key inputs | Expected OBM behavior | Expected loan-ceiling behavior |
|---|---|---|---|---|
| T1 | Zero obligation records | `n_months = 0` | Factor `EXCLUDED`; total score matches pre-OBM 4-factor formula (Section 6.3) | `verified_monthly_obligations = 0`; expense-adjusted ceiling is the least restrictive of the three |
| T2 | Moderate burden, good discipline | VOBR ≈ 0.33, PR = 92, n=6 | Contribution ≈ 80/90 | Ceiling reduced proportionally to obligation size |
| T3 | High burden (0.80), excellent discipline | PR = 95, n=8 | Contribution ≈ 74/90 (Section 13.2) | Expense-adjusted ceiling binds, ≈ ₹67,300 principal at the stated tier/tenure |
| T4 | High burden (0.80), poor discipline | PR = 35, n=8 | Contribution ≈ 56/90 (Section 13.3) — strictly lower than T3 despite identical VOBR | Same ceiling as T3 (loan side unaffected by reliability — reliability only affects OBM/score) |
| T5 | Extreme burden (VOBR ≥ 1.30) | any PR | `burden_score` floors at 20; `RawOBM` never below 20 regardless of PR | `NetMonthlyCapacity` may be negative; `ExpenseAdjustedEMI` floors at 0 (Addendum's `max(...,0)`, unchanged) |
| T6 | `n_months = 1` | any VOBR/PR | Heavy shrinkage toward 70; factor included, not excluded | Ceiling computed normally on the single-month figure (loan side has no shrinkage concept) |
| T7 | Income data excluded (0–1 months earnings) | — | OBM `EXCLUDED` (`NO_INCOME_DATA`), regardless of obligation data present | Entire loan module also gates closed (eligibility gate, unchanged Loan Eligibility §3) |
| T8 | Self-reported expenses present, no verified obligations | verified = 0, self-reported = ₹8,000 | OBM still `EXCLUDED` | `verified_monthly_obligations = 0`; advisory may fire if `0 + 8,000 > income`, but ceiling unaffected |
| T9 | Payment Regularity itself excluded | obligation amounts present, no due/paid dates | `multiplier = 1.00` (neutral, Section 14) | Unaffected — loan ceiling never depended on Payment Regularity |
| T10 | Recovery over time (Section 13.6) | VOBR 0.85→0.667, PR 55→90 | Contribution rises 57→77/90 | Ceiling loosens correspondingly as `verified_monthly_obligations` falls relative to rising income |
| T11 | Full pipeline regression | Rina's exact Phase 5 §14 inputs, obligation data absent | Total score = 762, unchanged from original spec (Section 6.3) | N/A (Rina's worked loan example, Loan Eligibility §8, also unaffected) |

---

## 20. Migration / Integration Considerations

1. **Rename `verified_monthly_expenses` → `verified_monthly_obligations` throughout the codebase and API surface** for consistency with the taxonomy formalized in Section 3 — the old name conflated "expenses" (which includes self-reported living costs) with "obligations" (which is exclusively the verified, recurring subset). This is a naming clarification, not a behavior change for existing integrations that only read the numeric value.
2. **`PaymentRecord.category` must have a confirmed enum** matching `{RENT, UTILITY, OTHER_RECURRING}` (Section 3.1) before `computeVerifiedMonthlyObligations` can be implemented exactly as specified — if the actual Prisma schema uses different category labels (e.g., a single free-text field instead of an enum), a mapping layer is needed, and mobile/recharge's category assignment (Section 15, limitation 4) must be decided explicitly at that point.
3. **`Score.ScoreFactor` (or equivalent per-factor storage entity) needs a fifth row type** (`obm`) alongside the existing four, storing `value`, `n_months`, `vobr`, `raw`, `burden_score`, and `multiplier` for explanation rendering (Section 18).
4. **`WEIGHTS_PCT` becomes a 5-key configuration object** instead of 4 — any admin/config UI that currently hardcodes four weight sliders needs a fifth, and the minimum-includable-factors threshold (Phase 5 §3 Step 4) should be re-confirmed as "2 of 5" in that same configuration surface, not silently left reading "2 of 4" in a comment.
5. **Existing stored scores computed under the 4-factor formula remain valid and require no recomputation** for any worker with zero verified obligation records at the time of storage, by the neutrality proof in Section 6.3 — but should be flagged for a one-time rescore if the worker has since accumulated obligation records, since their score would now legitimately include the fifth factor.
6. **The Loan Eligibility spec's own pseudocode (`recommendLoan`, §12) should import `computeVerifiedMonthlyObligations` from the same module the scoring engine uses**, rather than maintaining a second implementation — this is the single-source-of-truth requirement from Section 3.2 and is the concrete engineering action that prevents the two use sites from drifting apart over time.
7. **Sample CSV templates and manual-entry forms (product build spec, Data Upload / CSV Format Support) should confirm their `category` column values map cleanly onto the three verified-obligation categories** before this specification is implemented against real import data, per limitation 4 (Section 15).
