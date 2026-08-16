import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { calculateWorkerScore } from "@/actions/scoring";
import { ReportActions } from "./report-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScoreDial } from "@/components/dashboard/score-dial";
import { ConfidenceIndicator } from "@/components/dashboard/confidence-indicator";
import { FileText, Briefcase, MapPin, ShieldCheck, Mail, Phone, Clock } from "lucide-react";
import { format } from "date-fns";

export const metadata = {
  title: "Credit Profile Report - CrediBridge",
};

export default async function ProfileReportPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.WORKER) {
    redirect("/login");
  }

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: true }
  });

  if (!profile) {
    redirect("/dashboard/worker/profile");
  }

  const scoreData = await calculateWorkerScore();
  
  if (!scoreData.success || !scoreData.result) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center space-y-4">
        <h2 className="text-xl font-semibold">Report Not Available</h2>
        <p className="text-muted-foreground text-center max-w-md">
          We need more financial data to generate your credit profile. Please add some earnings or payment records.
        </p>
      </div>
    );
  }

  const result = scoreData.result;
  const chartData = scoreData.chartData!;
  const reportDate = format(new Date(), "MMMM do, yyyy");

  type FactorKey = "income" | "payment" | "trend" | "tenure" | "obm";
  const FACTOR_META: Record<FactorKey, { label: string }> = {
    income: { label: "Income Consistency" },
    payment: { label: "Payment Regularity" },
    trend: { label: "Earnings Trend" },
    tenure: { label: "Platform Tenure" },
    obm: { label: "Obligation Burden & Mgt" },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 print:pb-0">
      
      {/* Header / Actions - hidden on print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credit Profile Report</h1>
          <p className="text-muted-foreground mt-1">
            Generated on {reportDate}
          </p>
        </div>
        <ReportActions />
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block border-b pb-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black">CrediBridge</h1>
            <p className="text-gray-600 mt-1 font-medium">Demonstration Credit Profile</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">Report Date</p>
            <p className="text-sm text-gray-600">{reportDate}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Profile Info */}
        <div className="space-y-6 md:col-span-1 print:col-span-1">
          <Card className="print:shadow-none print:border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                Applicant Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium text-lg">{profile.user.name}</p>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{profile.user.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="print:shadow-none print:border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Work Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.occupationType && (
                <div>
                  <p className="text-sm text-muted-foreground">Occupation</p>
                  <p className="font-medium">{profile.occupationType}</p>
                </div>
              )}
              {profile.primaryPlatform && (
                <div>
                  <p className="text-sm text-muted-foreground">Primary Platform</p>
                  <p className="font-medium">{profile.primaryPlatform}</p>
                </div>
              )}
              {profile.platformTenure && (
                <div>
                  <p className="text-sm text-muted-foreground">Platform Tenure</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{profile.platformTenure} months</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Score & Factors */}
        <div className="space-y-6 md:col-span-2 print:col-span-2">
          
          <Card className="bg-gradient-to-br from-card to-card/50 print:shadow-none print:border-gray-200">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                    CrediBridge Score
                  </h3>
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-bold tracking-tight">
                      {result.score}
                    </span>
                    <span className="text-xl text-muted-foreground">/ 900</span>
                  </div>
                  <div className="inline-flex items-center px-3 py-1 mt-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {result.band}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <ScoreDial score={result.score ?? 0} maxScore={900} band={result.band ?? "Moderate"} />
                </div>
                
                <div className="flex-1 md:border-l md:pl-8 border-t md:border-t-0 pt-6 md:pt-0 w-full md:w-auto">
                  <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-3">
                    Data Confidence
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{Math.round(result.confidence?.score ?? 0)}%</span>
                      <span className="text-sm text-muted-foreground">{result.confidence?.tier}</span>
                    </div>
                    {result.confidence && (
                      <ConfidenceIndicator
                        confidence={result.confidence}
                      />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="print:shadow-none print:border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Score Breakdown
              </CardTitle>
              <CardDescription>How this score was calculated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5 mt-4">
                {(Object.keys(FACTOR_META) as Array<keyof typeof FACTOR_META>).map((key) => {
                  const factor = result.factors[key];
                  const meta = FACTOR_META[key];
                  const contribution = result.contributions[key] ?? 0;
                  const explanation = result.factorExplanations[key];
                  
                  if (factor.excluded) return null;

                  return (
                    <div key={key} className="border-l-2 border-primary/30 pl-4 py-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-base">{meta.label}</h4>
                          <p className="text-sm text-muted-foreground mt-1 max-w-md">
                            {explanation}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-lg text-primary">+{contribution} pts</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round(factor.value)}/100 raw
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="print:shadow-none print:border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Evidence & Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-accent/50 p-4 border">
                  <p className="text-sm text-muted-foreground mb-1">Average Monthly Earnings</p>
                  <p className="text-2xl font-bold">₹{chartData.summary.avgMonthlyEarnings.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-accent/50 p-4 border">
                  <p className="text-sm text-muted-foreground mb-1">Earnings Volatility</p>
                  <p className="text-2xl font-bold">{chartData.summary.earningsVolatilityPct}%</p>
                </div>
                <div className="rounded-lg bg-accent/50 p-4 border">
                  <p className="text-sm text-muted-foreground mb-1">On-Time Payment Rate</p>
                  <p className="text-2xl font-bold">{chartData.summary.onTimePaymentPct}%</p>
                </div>
                <div className="rounded-lg bg-accent/50 p-4 border">
                  <p className="text-sm text-muted-foreground mb-1">Total Payments Tracked</p>
                  <p className="text-2xl font-bold">{chartData.paymentBreakdown.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
      
      {/* Footer / Disclaimer */}
      <div className="mt-12 border-t pt-6 text-sm text-muted-foreground flex items-start gap-3 print:mt-8">
        <div className="shrink-0 pt-0.5">
          <ShieldCheck className="h-5 w-5 text-muted-foreground/60" />
        </div>
        <div>
          <p className="font-semibold text-foreground/80 mb-1">Important Disclosure</p>
          <p>
            CrediBridge is a hackathon demonstration platform. The displayed score is a synthetic, internally 
            defined demonstration score designed to evaluate alternative financial signals for gig workers. 
            It is not a CIBIL score, official credit-bureau score, lending decision, or financial guarantee.
            All underlying calculations are fully deterministic and rules-based (v1.0.0).
          </p>
        </div>
      </div>

    </div>
  );
}

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
