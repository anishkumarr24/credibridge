import { getApplicationDetails } from "@/actions/lender";
import { calculateLenderApplicantScore } from "@/actions/scoring";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, MapPin, Briefcase, Phone, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScoreDial } from "@/components/dashboard/score-dial";
import { ConfidenceIndicator } from "@/components/dashboard/confidence-indicator";
import { LenderApplicationActions } from "./lender-actions";
import { LoanEligibilityCard } from "@/components/dashboard/loan-eligibility-card";
import { calculateLoanEligibility } from "@/lib/loan-eligibility/calculator";

export async function generateMetadata() {
  return {
    title: "Application Details | Lender Dashboard",
  };
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const application = await getApplicationDetails(resolvedParams.id).catch(() => null);
  
  if (!application) {
    notFound();
  }

  // Calculate score deterministically on the server side
  const scoreResult = await calculateLenderApplicantScore(resolvedParams.id);
  
  if (scoreResult.error || !scoreResult.result) {
    return (
      <div className="p-8 text-center text-muted-foreground border rounded-lg bg-card">
        <AlertCircle className="mx-auto h-8 w-8 mb-4 opacity-50" />
        <p>Could not calculate score for this applicant.</p>
        <p className="text-sm mt-2">{scoreResult.error}</p>
      </div>
    );
  }

  const { worker, result, chartData } = scoreResult;

  type FactorKey = "income" | "payment" | "trend" | "tenure" | "obm";
  const FACTOR_META: Record<FactorKey, { label: string }> = {
    income: { label: "Income Consistency" },
    payment: { label: "Payment Regularity" },
    trend: { label: "Earnings Trend" },
    tenure: { label: "Platform Tenure" },
    obm: { label: "Obligation Burden & Mgt" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/lender/applications" 
          className="p-2 hover:bg-muted rounded-full transition-colors flex-shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Application Review</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            Submitted {format(application.createdAt, "MMMM do, yyyy")}
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
              {application.status}
            </span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        {/* Main Content */}
        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle>Credit Profile Details</CardTitle>
              <CardDescription>Server-authoritative scoring evaluation.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-8 py-4">
                <div className="flex-shrink-0">
                  <ScoreDial score={result.score ?? 0} maxScore={900} band={result.band ?? "Moderate"} />
                </div>
                
                <div className="flex-1 w-full space-y-4 min-w-0">
                  <h3 className="font-semibold text-lg">Score Breakdown</h3>
                  <div className="space-y-3">
                    {(Object.keys(FACTOR_META) as FactorKey[]).map((key) => {
                      const factor = result.factors[key];
                      const meta = FACTOR_META[key];
                      if (!factor || factor.excluded) return null;
                      
                      const contribution = result.contributions[key] ?? 0;
                      const isPositive = factor.value >= 50;

                      return (
                        <div key={key} className="flex flex-col sm:flex-row sm:items-start justify-between py-2 border-b last:border-0 gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-sm">{meta.label}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {result.factorExplanations[key]}
                            </p>
                          </div>
                          <div className={`text-sm font-semibold tabular-nums text-right ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {contribution > 0 ? "+" : ""}{Math.round(contribution)} pts
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <LoanEligibilityCard 
            eligibility={calculateLoanEligibility(result)} 
            requestedAmount={application.requestedAmount}
          />

          <Card>
            <CardHeader>
              <CardTitle>Financial Evidence</CardTitle>
              <CardDescription>Validated metrics based on imported records.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Avg Monthly Income</span>
                  <p className="text-lg font-semibold">₹{chartData.summary.avgMonthlyEarnings.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Income Volatility</span>
                  <p className="text-lg font-semibold">{chartData.summary.earningsVolatilityPct}%</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">On-Time Payments</span>
                  <p className="text-lg font-semibold">{chartData.summary.onTimePaymentPct}%</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Platform Tenure</span>
                  <p className="text-lg font-semibold">
                    {chartData.summary.platformTenureMonths ? `${chartData.summary.platformTenureMonths} mo` : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {result.confidence && (
            <ConfidenceIndicator confidence={result.confidence} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle>Applicant Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center p-4 border rounded-lg bg-muted/20">
                <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xl font-bold mb-3">
                  {worker.user.name.charAt(0)}
                </div>
                <h3 className="font-semibold text-center break-words">{worker.user.name}</h3>
                <p className="text-sm text-muted-foreground break-all text-center">{worker.user.email}</p>
              </div>

              {application.requestedAmount ? (
                <div className="flex flex-col items-center justify-center p-4 bg-muted/30 border rounded-lg mt-4">
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Worker Requested Amount</p>
                  <p className="text-2xl font-bold text-primary mt-1">₹{application.requestedAmount.toLocaleString('en-IN')}</p>
                </div>
              ) : null}

              <div className="space-y-3 pt-2 text-sm">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{worker.occupationType || "Occupation Unknown"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{worker.location || "Location Unknown"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{worker.phone || "No phone provided"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lender Decision</CardTitle>
            </CardHeader>
            <CardContent>
              <LenderApplicationActions applicationId={application.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
