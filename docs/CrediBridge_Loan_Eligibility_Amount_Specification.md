# CrediBridge — Loan Eligibility & Amount Recommendation Specification
### Extends Phase 5 (Scoring Engine) — does not modify or renumber existing phases
*Smart India Hackathon 2026 — Design Document (no code, no implementation)*

---

## 1. Executive Summary

This module answers a question the CrediBridge Score deliberately does **not** answer: *given this worker's score and behavior, how much could they responsibly be offered, over what tenure, at roughly what price?*

It is designed as a **consumer of Phase 5's outputs**, not a rework of it. It introduces exactly two new mechanics on top of the existing score:

1. A **Risk Tier**, derived directly from the existing Score Band and Confidence Tier, which sets ceilings (loan-to-income multiple, max tenure, indicative rate band, guarantor requirement).
2. An **Affordability calculation**, derived from the worker's own median monthly earnings (already computed inside Phase 5's Income Consistency factor) and their Income Consistency sub-score, which sets an independent ceiling based on repayment capacity rather than risk appetite.

The final recommended amount is always the **more conservative of the two ceilings** — this is standard prudent-lending practice and gives a second, explainable reason the module never has to invent: "your score allows more, but your income comfortably supports less" (or vice versa).

No new behavioral factors, no new unaudited data, and no absolute-income comparisons between workers are introduced — every fairness property established in Phase 5 (scale-invariance across workers, self-referential baselines) is preserved.

---

## 2. Inputs Consumed From Phase 5

This module takes as input, unchanged, from the existing scoring engine:

| Input | Source in Phase 5 |
|---|---|
| `DisplayedScore` (0–900) | Section 3, Step 5 |
| `Band` | Section 8 |
| `ConfidenceTier` (High/Medium/Low/Insufficient) | Section 7 |
| `IncomeConsistency.value` (shrunk sub-score, 0–100) | Section 4.1 |
| `MedianMonthlyEarnings` | already computed as `median_e` inside Section 4.1 — reused, not recomputed |

No new worker-facing data collection is required for this module to function — it is purely a downstream calculation on numbers Phase 5 already produces.

---

## 3. Eligibility Gate

Loan sizing is attempted **only if both** of the following hold:

1. Phase 5 produced a numeric score (`ConfidenceTier ≠ Insufficient Data`).
2. `MedianMonthlyEarnings` exists — i.e., the Income Consistency factor was not excluded (Section 4.1, "0–1 months of earnings").

**Rule 3.2 is stricter than Phase 5's own minimum-scoring threshold.** Phase 5 can produce a valid score using only 2 of its 4 factors via weight redistribution — for example, a score built from Payment Regularity + Tenure alone, with zero earnings records. That score is legitimate for *behavioral* purposes, but a loan **amount** cannot be responsibly sized without any income-magnitude data at all, regardless of how good the behavioral score looks. This module therefore has its own, independent data requirement on top of Phase 5's.

If either condition fails: no amount is computed. The UI shows *"Not yet eligible for a loan recommendation — add at least [X] months of earnings data to unlock this."* This is a neutral, forward-looking message, consistent with the "Building History" framing in Phase 5 (Section 8) — never a rejection.

---

## 4. Risk Tier Table

Derived directly from `Band` (primary) with `ConfidenceTier` as an independent modifier on tenure only (never on amount or rate — confidence already shaped the score itself in Phase 5; it should not be double-counted into the amount as well, only into duration of lender exposure).

| Band | Max Loan-to-Income (LTI) Multiple* | Band Max Tenure | Indicative Annual Rate Band | Guarantor |
|---|---|---|---|---|
| Very Strong | 4.0× | 24 months | 12–14% | Not required |
| Strong | 3.0× | 18 months | 14–17% | Not required |
| Moderate | 2.0× | 12 months | 17–20% | Optional |
| Emerging | 1.0× | 6 months | 20–24% | Recommended |
| Building History | 0.5× (starter/credit-building product) | 3 months | 24–28% | Required |

*\*Multiple of `MedianMonthlyEarnings`.*

**Confidence-based tenure cap** (applied after the band's own max tenure, whichever is smaller):

```
ConfidenceTenureCap = { High: no additional cap, Medium: 18 months, Low: 6 months }
EffectiveMaxTenure   = min(BandMaxTenure, ConfidenceTenureCap)
```

This mirrors Phase 5's own "cap the score, don't zero it" philosophy (Section 5 of the scoring spec): a thin-file worker with an excellent score can still receive a healthy loan, just not committed over a multi-year tenure the lender has little evidence to underwrite confidently.

**Indicative rate bands are illustrative only** — see Limitations (Section 9). A production system would combine this risk tier with the lender's actual cost of funds and applicable regulatory rate ceilings; this specification only recommends a *band*, never a bindable number.

---

## 5. Affordability Calculation

Independent of score/band — based purely on the worker's own income magnitude and its consistency:

```
AffordabilityRatio = 0.20 + 0.15 × (IncomeConsistency.value / 100)      # range: 20%–35%
AffordableEMI      = MedianMonthlyEarnings × AffordabilityRatio
```

**Why the ratio scales with Income Consistency (already computed in Phase 5, not a new factor):** a worker with highly variable income needs a larger buffer between their typical earnings and their committed monthly payment, so a low Income Consistency sub-score pulls the safe ratio down toward 20%; a very stable earner can safely commit up to 35% of a typical month's earnings. This reuses an already-computed, already-fairness-reviewed number rather than introducing a new unaudited affordability model.

---

## 6. Loan Amount Formula

**Step 1 — Affordability-derived principal**, using the standard reducing-balance amortization formula solved for principal, with `i` = the monthly rate from the midpoint of the band's indicative annual rate, and `n = EffectiveMaxTenure`:

```
i = (midpoint annual rate) / 12
P_affordability = AffordableEMI × [ (1+i)^n − 1 ] / [ i × (1+i)^n ]
```

**Step 2 — Loan-to-Income–derived principal:**

```
P_lti = MedianMonthlyEarnings × MaxLTIMultiple
```

**Step 3 — Take the more conservative of the two**, and round to the nearest ₹500:

```
RecommendedAmount = round_to_500( min(P_affordability, P_lti) )
```

**Step 4 — Recompute the actual EMI** the worker would pay on `RecommendedAmount` (not the affordability ceiling) at the same rate and tenure, so the explanation can show real headroom:

```
ActualEMI = RecommendedAmount × i×(1+i)^n / ((1+i)^n − 1)
```

**Binding-constraint disclosure:** the output always states which of the two caps determined the final number (`"affordability"` or `"loan-to-income"`) — this is itself an explainability requirement, not an implementation detail, since a worker or judge should be able to see *why* the number is what it is.

---

## 7. Explainability Templates

Same philosophy as Phase 5 (Section 9 of the scoring spec) — fixed templates, variables from computed values only:

- *"Based on your Income Consistency score, we use an affordability ratio of {ratio}%, giving an affordable monthly payment of ₹{AffordableEMI}."*
- *"Your score band ({Band}) allows up to {LTI}× your average monthly earnings (₹{MedianMonthlyEarnings}), which is ₹{P_lti}."*
- *"Because your confidence tier is {ConfidenceTier}, the maximum tenure considered is {EffectiveMaxTenure} months."*
- *"Your recommended amount, ₹{RecommendedAmount} over {n} months, was set by your {binding_constraint} limit — your other limit would have allowed up to ₹{other_value}."*
- *"At this amount and tenure, your estimated monthly payment is ₹{ActualEMI}, which is well within your affordable range of ₹{AffordableEMI}."* (shown only when `ActualEMI < AffordableEMI`)

---

## 8. Worked Example — Continuing "Rina" (from Phase 5, Section 14)

**Inputs carried over:** `DisplayedScore = 762`, `Band = Very Strong`, `ConfidenceTier = High`, `IncomeConsistency.value = 90.2`, `MedianMonthlyEarnings = ₹15,500`.

**Eligibility gate:** passes (score exists, earnings data exists).

**Risk tier (Very Strong):** LTI = 4.0×, Band max tenure = 24 months, indicative rate 12–14% (midpoint 13%), no guarantor.
**Confidence modifier:** High → no additional tenure cap. `EffectiveMaxTenure = 24 months`.

**Affordability:**
```
AffordabilityRatio = 0.20 + 0.15×(90.2/100) = 0.335
AffordableEMI      = 15,500 × 0.335 ≈ ₹5,193/month
```

**Step 1 — Affordability-derived principal** (i = 13%/12 = 0.01083, n = 24):
```
P_affordability ≈ 5,193 × 21.03 ≈ ₹109,200
```

**Step 2 — LTI-derived principal:**
```
P_lti = 15,500 × 4.0 = ₹62,000
```

**Step 3 — Binding constraint:** `min(109,200, 62,000) = 62,000` → **Loan-to-Income cap binds**, not affordability.
`RecommendedAmount = ₹62,000`.

**Step 4 — Actual EMI on ₹62,000 over 24 months:**
```
ActualEMI ≈ ₹2,950/month
```

**Output:**
- Recommended amount: **₹62,000**, tenure **24 months**, indicative rate **12–14% p.a.**, estimated EMI **≈ ₹2,950/month**.
- *"Your recommended amount was set by your loan-to-income limit (4× your average monthly earnings of ₹15,500), not your affordability limit — your income consistency alone would have supported a larger amount, but the loan-to-income cap keeps the offer proportional to your actual earnings."*
- *"At ₹2,950/month, your estimated payment is well within your affordable range of ₹5,193/month."*

This example intentionally shows the **LTI cap binding instead of affordability** — a realistic and useful case to present to judges, since it demonstrates the dual-cap system doing real work (an excellent behavioral score alone does not inflate the amount beyond what the worker's actual income can proportionally support).

---

## 9. Fairness Considerations Specific to This Module

- **Proportionality is intentional, not a flaw.** Two workers with an identical Very Strong score but different `MedianMonthlyEarnings` will receive different absolute loan amounts — this is by design (nobody is offered more than their own income can proportionally support) and is consistent with Phase 5's self-referential-baseline principle (each worker is measured against their own history and their own income, never against another worker).
- **Indicative rate bands are not a pricing engine.** Real interest-rate setting must additionally account for regulatory ceilings (e.g., NBFC/MFI interest-rate regulations) and the lender's cost of funds — factors entirely outside the scope of a hackathon prototype. This specification produces a **band**, deliberately, not a bindable rate.
- **Guarantor requirements should not become a hidden exclusion.** For "Building History," a guarantor requirement is recommended as a risk mitigant, not framed as a rejection — the eligibility messaging (Section 3) should always pair any such requirement with a clear, constructive path to reduce it (more data, more tenure, an on-time payment streak).

---

## 10. Limitations (Additional to Phase 5's)

1. Indicative interest-rate bands are illustrative placeholders, not validated against real cost-of-funds or regulatory constraints.
2. The affordability ratio range (20–35%) is a reasoned prudential assumption, not empirically calibrated against real default data for this population.
3. This module does not currently account for a worker's existing outstanding debt obligations (not tracked in Phases 1–4) — a production system would need a total-debt-to-income check, not just an EMI-to-income check on the new loan alone.
4. Amortization uses a simple standard reducing-balance formula; it does not model processing fees, insurance, or other product-specific costs.

---

## 11. Judge-Defense Additions

**Why compute two separate caps instead of one number from the score directly?** Standard prudent-lending practice: the score answers "should we lend, and how much risk are we taking," while affordability answers "can this specific income structurally service this specific payment." A high score alone should never be allowed to produce an amount the worker's actual earnings can't comfortably support — the dual-cap, take-the-lower approach is how real lenders reconcile these two independent questions, and it makes the "why this number" story defensible in one sentence.

**Why reuse the Income Consistency sub-score instead of a new affordability model?** It keeps the surface area of the system small and reuses a number that has already been through Phase 5's fairness and explainability design — introducing a brand-new, unaudited factor purely for loan sizing would undercut the "no opaque model" principle this entire project is built on.

**Why not output an exact interest rate?** Real pricing depends on regulatory rate caps and the lender's own cost of funds — neither of which a scoring prototype can know. Producing an indicative band, and disclosing that explicitly, is more honest than fabricating a precise number the prototype has no basis for.

---

## 12. Pseudocode

```
function recommendLoan(worker, phase5_result):

    RISK_TIERS = {
      "Very Strong":      {lti: 4.0, max_tenure: 24, rate_mid: 0.13, guarantor: false},
      "Strong":           {lti: 3.0, max_tenure: 18, rate_mid: 0.155, guarantor: false},
      "Moderate":         {lti: 2.0, max_tenure: 12, rate_mid: 0.185, guarantor: "optional"},
      "Emerging":         {lti: 1.0, max_tenure: 6,  rate_mid: 0.22, guarantor: "recommended"},
      "Building History": {lti: 0.5, max_tenure: 3,  rate_mid: 0.26, guarantor: true},
    }
    CONFIDENCE_TENURE_CAP = {HIGH: null, MEDIUM: 18, LOW: 6}

    # --- Eligibility gate ---
    if phase5_result.confidence_tier == "INSUFFICIENT_DATA":
        return { status: "NOT_ELIGIBLE", reason: "no score available yet" }
    if phase5_result.factors.income == EXCLUDED:
        return { status: "NOT_ELIGIBLE", reason: "no earnings data available to size a loan" }

    tier = RISK_TIERS[phase5_result.band]
    conf_cap = CONFIDENCE_TENURE_CAP[phase5_result.confidence_tier]
    n = min(tier.max_tenure, conf_cap) if conf_cap != null else tier.max_tenure

    income_consistency = phase5_result.factors.income.value
    median_earnings    = phase5_result.factors.income.median_e   # reused from Phase 5

    # --- Affordability leg ---
    ratio = 0.20 + 0.15 * (income_consistency / 100)
    affordable_emi = median_earnings * ratio
    i = tier.rate_mid / 12
    p_affordability = affordable_emi * ((1+i)**n - 1) / (i * (1+i)**n)

    # --- LTI leg ---
    p_lti = median_earnings * tier.lti

    # --- Reconcile ---
    recommended = round_to_nearest(min(p_affordability, p_lti), 500)
    binding = "affordability" if p_affordability < p_lti else "loan-to-income"
    actual_emi = recommended * (i*(1+i)**n) / ((1+i)**n - 1)

    return {
        status: "ELIGIBLE",
        recommended_amount: recommended,
        tenure_months: n,
        indicative_rate_band: [tier.rate_mid - 0.01, tier.rate_mid + 0.01],
        estimated_emi: actual_emi,
        affordable_emi_ceiling: affordable_emi,
        binding_constraint: binding,
        guarantor_required: tier.guarantor,
        explanations: generateLoanExplanations(...)   # templates, Section 7
    }
```
