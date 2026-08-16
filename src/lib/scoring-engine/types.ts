export type ScoreFactorResult = {
  value: number;
  n?: number;
  raw?: number;
  excluded?: boolean;
  months?: number;
  cv?: number | null;
  onTimePct?: number;
  slopePct?: number;
  seasonalAdjusted?: boolean;
  median_e?: number;
};

export type OBMFactorResult = ScoreFactorResult & {
  vobr: number;
  raw: number;
  burden_score: number;
  multiplier: number;
  verified_monthly_obligations: number;
};

export type ConfidenceResult = {
  score: number;
  tier: "HIGH" | "MEDIUM" | "LOW";
  cap: number;
  breakdown: {
    earningsCoverage: number;
    paymentCoverage: number;
    profileCompleteness: number;
    sourceDiversity: number;
    dataValidity: number;
  };
};

export type EngineResult = {
  score: number | null;
  band: string | null;
  status: "OK" | "INSUFFICIENT_DATA";
  confidence: ConfidenceResult | null;
  factors: {
    income: ScoreFactorResult;
    payment: ScoreFactorResult;
    trend: ScoreFactorResult;
    tenure: ScoreFactorResult;
    obm: OBMFactorResult;
  };
  // Server-computed weighted point contributions (NOT calculated on client)
  contributions: {
    income: number | null;
    payment: number | null;
    trend: number | null;
    tenure: number | null;
    obm: number | null;
  };
  explanations: string[];
  // Per-factor human-readable explanation strings (keyed by factor)
  factorExplanations: {
    income: string;
    payment: string;
    trend: string;
    tenure: string;
    obm: string;
  };
};

export type WorkerData = {
  earnings: { date: Date; netEarnings: number }[];
  payments: { dueDate: Date; paidDate: Date | null; isUnpaid: boolean; category: string; amount: number }[];
  profile: {
    platformTenureMonths: number | null;
    filledRequiredFields: number;
    totalRequiredFields: number;
  };
  sources: {
    distinctSources: number;
    validRecords: number;
    totalRecords: number;
  };
};

// Evidence data that powers charts — derived from the same validated data used by the engine
export type ChartData = {
  // Monthly earnings for the trend chart — same aggregated series used by the engine
  monthlyEarnings: { month: string; earnings: number }[];
  // Payment regularity breakdown for the bar chart
  paymentBreakdown: {
    onTime: number;
    lateUnder5: number;
    lateUnder15: number;
    lateOver15: number;
    unpaid: number;
    total: number;
  };
  // Summary stats
  summary: {
    avgMonthlyEarnings: number;
    medianMonthlyEarnings: number;
    earningsVolatilityPct: number; // cv as percentage
    onTimePaymentPct: number;
    platformTenureMonths: number | null;
  };
};
