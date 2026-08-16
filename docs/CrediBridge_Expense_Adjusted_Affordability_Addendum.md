# CrediBridge — Expense-Adjusted Affordability (Addendum)
### Adds Section 5B to the Loan Eligibility & Amount Recommendation Specification
*Smart India Hackathon 2026 — Design Document (no code, no implementation)*

---

## 1. Why This Addendum Exists

The original Loan Eligibility spec sizes a loan from two ceilings: a behavioral risk tier (Section 4) and an income-ratio affordability estimate (Section 5). Neither ever looks at what the worker actually spends. Two workers earning an identical ₹20,000/month get an identical recommendation whether one has ₹2,000 of fixed monthly obligations or ₹16,000 — that's a real blind spot, and for a population where over-indebtedness (not under-lending) is historically the bigger harm in informal-sector credit, it's worth closing.

The fix is **not** "add an expenses field and subtract it." Rent/utility amounts already sit in CrediBridge's verified payment records; general living expenses do not exist anywhere in the platform's data and would have to be self-reported — and self-reported numbers are exactly the kind of unverifiable input the rest of this scoring system deliberately avoids (Section 2.3 and Section 9 of the scoring spec both lean on the principle that every number driving the score must be traceable to real, structured data). So this addendum treats the two differently:

- **Verified recurring obligations** (rent/utility payment records already in the database) → a **hard constraint** on the loan amount.
- **Self-reported general expenses** (anything typed in, unverified) → **advisory display only**, never allowed to change the computed number.

This keeps the loan-amount formula fully auditable while still giving real protection against recommending a payment the worker's actual verified budget can't support.

---

## 2. Verified Monthly Expenses

**Definition.** The worker's typical monthly recurring committed outflow, computed from the same utility/rent payment records already used for Payment Regularity (Phase 5, Section 4.2) — this time using the recorded **amount** on each record rather than its timing.

**Formula:**

```
monthly_totals          = [ sum(payment.amount for payment in worker.payments if in month m)
                             for each month m that has at least one payment record ]
VerifiedMonthlyExpenses  = median(monthly_totals)
```

Median, not mean — consistent with the robustness principle used everywhere else in the scoring engine (Phase 5, Section 4.1): a single skipped or doubled-up payment month shouldn't swing the estimate.

**Missing data.** If no payment records with amounts exist, `VerifiedMonthlyExpenses = 0`. This must **never** be presented as "this worker has no expenses" — it means "we have no verified evidence of expenses." Because of how the formula is structured (Section 4 below), a value of 0 makes this constraint fall away entirely rather than tightening anything, which is the correct behavior: absence of data should not be treated as a negative signal, exactly as in the core scoring engine (Phase 5, Section 5).

---

## 3. Self-Reported General Expenses — Advisory Only

If the product ever collects a self-reported figure (groceries, transport, family support, informal/cash debts), it is:

- **Never** used in `RecommendedAmount` or `ActualEMI`.
- Displayed next to the computed ceilings for the worker's own reference.
- Compared against verified obligations to flag inconsistency, without silently trusting or overriding either number:

```
if (VerifiedMonthlyExpenses + SelfReportedExpenses) > MedianMonthlyEarnings:
    show_advisory("Your reported total outgoings exceed your recorded income —
                   please review this loan amount against your full budget.")
```

This keeps the hard math fully traceable to verified data, while still surfacing a genuinely useful warning instead of pretending the self-report doesn't exist.

---

## 4. Expense-Adjusted Affordability Ceiling — Formula

```
NetMonthlyCapacity  = MedianMonthlyEarnings − VerifiedMonthlyExpenses
ExpenseAdjustedEMI  = max(NetMonthlyCapacity × SafetyBuffer, 0)          # SafetyBuffer = 0.80
```

**Why an 80% buffer, not 100%.** `NetMonthlyCapacity` only accounts for *verified* obligations — food, transport, and family support are real costs that exist for every worker but aren't captured anywhere in CrediBridge's data. Reserving 20% of the post-obligation surplus is a deliberate, disclosed acknowledgment that unverified costs exist even though they can't be measured, rather than pretending the full surplus is available for an EMI.

**Third principal ceiling**, using the same amortization formula as Section 6 of the Loan Eligibility spec (`i` = midpoint rate from the risk tier, `n` = `EffectiveMaxTenure`):

```
P_expense_adjusted = ExpenseAdjustedEMI × [ (1+i)^n − 1 ] / [ i × (1+i)^n ]
```

**Updated reconciliation (replaces Loan Eligibility spec, Section 6, Step 3):**

```
RecommendedAmount = round_to_500( min(P_affordability, P_lti, P_expense_adjusted) )
```

`binding_constraint` now reports one of three values: `"affordability"`, `"loan-to-income"`, or `"expense-adjusted"` — the explanation template (Section 6 below) names whichever one actually bound.

---

## 5. Worked Example — "Vikram," Auto-Rickshaw Driver

**Inputs:** `MedianMonthlyEarnings = ₹20,000`, Income Consistency sub-score = 90, `Band = Very Strong` (LTI 4.0×, tenure 24 months, rate midpoint 13%), Confidence = High. Verified payment records show a median monthly rent + utility outflow of **₹16,000** (a real, tight-margin case — high rent relative to income). Vikram also self-reports "~₹10,000/month" in additional groceries/transport/family costs.

**Affordability ceiling (Section 5, original spec):**
```
AffordabilityRatio = 0.20 + 0.15×(90/100) = 0.335
AffordableEMI      = 20,000 × 0.335 = ₹6,700/month
P_affordability    ≈ ₹140,900   (24 months @ 13%)
```

**Loan-to-income ceiling:**
```
P_lti = 20,000 × 4.0 = ₹80,000
```

**Expense-adjusted ceiling (this addendum):**
```
NetMonthlyCapacity = 20,000 − 16,000 = ₹4,000
ExpenseAdjustedEMI = 0.80 × 4,000 = ₹3,200/month
P_expense_adjusted ≈ ₹67,300   (24 months @ 13%)
```

**Reconciliation:**
```
min(140,900, 80,000, 67,300) = 67,300 → rounds to ₹67,500
```
**Binding constraint: expense-adjusted** — the first time in these worked examples that this is the tightest of the three, precisely because Vikram's verified rent is unusually high relative to his income.

**Actual EMI on ₹67,500 over 24 months ≈ ₹3,210/month.**

**Advisory check:** `16,000 (verified) + 10,000 (self-reported) = 26,000 > 20,000 income` → the inconsistency warning fires and is shown to Vikram, without changing the ₹67,500 recommendation.

### Why this matters — before vs. after

Without this addendum, the recommendation would have been `min(140,900, 80,000) = ₹80,000` at **≈₹3,800/month** EMI. Against Vikram's real verified monthly surplus of ₹4,000 (after rent/utilities), that EMI would consume **95% of his entire disposable income**, leaving almost nothing for unmeasured but very real costs like food and transport. With the addendum, the recommended EMI (₹3,210) consumes exactly the intended **80% of his verified surplus**, leaving a **₹790/month cushion** by design. Same worker, same excellent score, same generous risk tier — a materially safer number once verified obligations are taken into account.

---

## 6. Explainability Templates (adds to Loan Eligibility spec, Section 7)

- *"Your verified monthly rent and utility payments average ₹{VerifiedMonthlyExpenses}, based on {n} recorded payment months."*
- *"After your verified obligations, your estimated monthly surplus is ₹{NetMonthlyCapacity}; we recommend committing no more than 80% of that (₹{ExpenseAdjustedEMI}) to a loan payment, to leave room for everyday costs we can't verify."*
- *"Your recommended amount was set by your expense-adjusted limit, not your score or loan-to-income limit — your verified rent and utilities leave less monthly room than your score alone would suggest."*
- *(only if self-reported figures were provided and inconsistent)* — *"You told us you spend about ₹{SelfReportedExpenses}/month beyond your verified bills. Combined with your verified ₹{VerifiedMonthlyExpenses}, your reported total (₹{total}) is close to or above your recorded income (₹{MedianMonthlyEarnings}) — please review this amount carefully."*

---

## 7. Fairness & Limitations

- **This constraint can only ever tighten the loan, never loosen it** — with zero verified payment records, `VerifiedMonthlyExpenses = 0` and the ceiling becomes the least restrictive of the three (Section 2), so a worker with no recorded bills is never penalized for lacking that data, consistent with Phase 5's "missing data is not a penalty" principle.
- **This does not capture true expenses**, only *verified, recurring, platform-recorded* ones — a worker paying cash rent to a landlord outside any recorded system will show `VerifiedMonthlyExpenses = 0` even though real rent exists. This is an honest limitation, not a claim that unrecorded workers have no expenses — it should be disclosed exactly as such to judges.
- **The 80% safety buffer is a reasoned prudential choice, not empirically calibrated** — like the affordability ratio in the base spec, it would need validation against real repayment/default outcomes before production use.
- **Self-reported data is deliberately excluded from the binding calculation** specifically to avoid a gameable, unverifiable number driving loan sizing — this is a design trade-off (some real expense information is left unused) made explicitly in favor of auditability.

---

## 8. Judge-Defense Addition

**Why not just ask the worker how much they spend and use that directly?** Because it's unverifiable and easily gamed in either direction — understated to unlock a larger loan, or overstated out of caution. Every other number in this scoring and lending system is traceable to structured, recorded data; adding a single unverified self-reported number as a hard constraint would break that property for the whole pipeline. Instead, self-reported figures are shown for the worker's own awareness and cross-checked for gross inconsistency, but the loan math itself only ever moves on data CrediBridge already trusts elsewhere in the system (the same rent/utility records used in Payment Regularity).

**Why an 80%, not 100%, buffer on the verified surplus?** Verified obligations are a floor on real expenses, not the total — everyone has food, transport, and other costs this platform can't see. Reserving 20% is an explicit, disclosed acknowledgment of that gap rather than an implicit assumption that verified data equals total spending.

---

## 9. Pseudocode (extends Loan Eligibility spec, Section 12)

```
function computeExpenseAdjustedCeiling(worker, phase5_result, tier, n, i):

    monthly_totals = groupPaymentAmountsByMonth(worker.payments)
    verified_expenses = median(monthly_totals) if length(monthly_totals) > 0 else 0

    net_capacity = phase5_result.factors.income.median_e - verified_expenses
    expense_adjusted_emi = max(net_capacity * 0.80, 0)

    p_expense_adjusted = expense_adjusted_emi * ((1+i)**n - 1) / (i * (1+i)**n)

    return { p_expense_adjusted, verified_expenses, expense_adjusted_emi }


# --- inside recommendLoan(), replacing the Section 12 reconciliation step ---

expense = computeExpenseAdjustedCeiling(worker, phase5_result, tier, n, i)

candidates = {
    "affordability":     p_affordability,
    "loan-to-income":     p_lti,
    "expense-adjusted":   expense.p_expense_adjusted
}
binding = key_with_min_value(candidates)
recommended = round_to_nearest(candidates[binding], 500)
actual_emi  = recommended * (i*(1+i)**n) / ((1+i)**n - 1)

advisory = null
if worker.self_reported_expenses is not null:
    total_reported = expense.verified_expenses + worker.self_reported_expenses
    if total_reported > phase5_result.factors.income.median_e:
        advisory = "reported outgoings exceed recorded income — review recommended"

return {
    ...,
    recommended_amount: recommended,
    binding_constraint: binding,
    estimated_emi: actual_emi,
    verified_monthly_expenses: expense.verified_expenses,
    advisory_flag: advisory
}
```
