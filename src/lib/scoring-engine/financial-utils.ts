import { WorkerData } from "./types";

export type VerifiedCategory = "RENT" | "UTILITY" | "OTHER_RECURRING";

export function mapPaymentCategory(rawCategory: string): VerifiedCategory | null {
  const normalized = rawCategory.trim().toUpperCase();
  
  if (normalized === "RENT" || normalized === "RENT_PAYMENTS") {
    return "RENT";
  }
  
  if (
    normalized === "UTILITY" ||
    normalized === "UTILITY_PAYMENTS" ||
    normalized === "UTILITY (ELECTRICITY)" ||
    normalized === "UTILITY (WATER)" ||
    normalized === "UTILITY (INTERNET)" ||
    normalized === "ELECTRICITY" ||
    normalized === "WATER" ||
    normalized === "INTERNET" ||
    normalized === "BROADBAND" ||
    normalized === "GAS"
  ) {
    return "UTILITY";
  }

  // Strict mapping for mobile: only if it's explicitly tagged as a recurring bill (e.g. postpaid)
  // or mapped to OTHER_RECURRING by explicit system labels.
  if (
    normalized === "OTHER_RECURRING" ||
    normalized === "OTHER" ||
    normalized === "SUBSCRIPTION" ||
    normalized === "MOBILE (POSTPAID)" ||
    normalized === "MOBILE_BILL"
  ) {
    return "OTHER_RECURRING";
  }

  return null;
}

export function computeVerifiedMonthlyObligations(worker: WorkerData): {
  verified_monthly_obligations: number;
  n_months: number;
} {
  // Filter and map to verified categories
  const verifiedRecords = worker.payments.filter((r) => {
    if (r.amount == null || r.amount < 0) return false;
    const mappedCategory = mapPaymentCategory(r.category);
    return mappedCategory !== null;
  });

  if (verifiedRecords.length === 0) {
    return { verified_monthly_obligations: 0, n_months: 0 };
  }

  // Group by month
  const monthlyTotalsMap = new Map<string, number>();
  
  for (const record of verifiedRecords) {
    // dueDate is used to group the obligation
    const d = new Date(record.dueDate);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    
    const current = monthlyTotalsMap.get(monthKey) || 0;
    monthlyTotalsMap.set(monthKey, current + record.amount);
  }

  const monthlyTotals = Array.from(monthlyTotalsMap.values());
  
  if (monthlyTotals.length === 0) {
    return { verified_monthly_obligations: 0, n_months: 0 };
  }

  // Compute median
  monthlyTotals.sort((a, b) => a - b);
  let median = 0;
  const mid = Math.floor(monthlyTotals.length / 2);
  if (monthlyTotals.length % 2 !== 0) {
    median = monthlyTotals[mid];
  } else {
    median = (monthlyTotals[mid - 1] + monthlyTotals[mid]) / 2.0;
  }

  return {
    verified_monthly_obligations: median,
    n_months: monthlyTotals.length,
  };
}
