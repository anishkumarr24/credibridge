import { auth } from "@/../auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { AlertCircle, CheckCircle2, Clock, Database, User } from "lucide-react";
import { calculateAndSaveScore } from "@/actions/scoring";
import { ExplainabilityPanel } from "@/components/dashboard/explainability-panel";
import { LoanEligibilityCard } from "@/components/dashboard/loan-eligibility-card";
import { calculateLoanEligibility } from "@/lib/loan-eligibility/calculator";

export const metadata = {
  title: "Worker Dashboard | CrediBridge",
  description: "Your explainable credit score dashboard.",
};

export default async function WorkerDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== Role.WORKER) {
    redirect(session.user.role === Role.LENDER ? "/dashboard/lender" : "/");
  }

  // --- Data fetching ---
  const [scoreActionResult, profile] = await Promise.all([
    calculateAndSaveScore(),
    prisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { earningRecords: true, paymentRecords: true },
        },
        applications: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Profile not found. Please contact support.</p>
      </div>
    );
  }

  const engineResult = 'success' in scoreActionResult && scoreActionResult.success ? scoreActionResult.result! : null;
  const chartData = 'success' in scoreActionResult && scoreActionResult.success ? scoreActionResult.chartData! : null;

  // --- Profile completion ---
  const fieldsToCheck = ["phone", "location", "occupationType", "primaryPlatform", "monthlyExpenses"] as const;
  const filledFields = fieldsToCheck.filter(f => profile[f] !== null && profile[f] !== undefined).length;
  const profileCompletion = Math.round((filledFields / fieldsToCheck.length) * 100);

  const earningsCount = profile._count.earningRecords;
  const paymentsCount = profile._count.paymentRecords;
  const totalRecords = earningsCount + paymentsCount;

  // --- Latest record date ---
  const [latestEarning, latestPayment] = await Promise.all([
    prisma.earningRecord.findFirst({ where: { profileId: profile.id }, orderBy: { date: "desc" } }),
    prisma.paymentRecord.findFirst({ where: { profileId: profile.id }, orderBy: { dueDate: "desc" } }),
  ]);

  let latestDate: Date | null = null;
  if (latestEarning && latestPayment) {
    latestDate = latestEarning.date > latestPayment.dueDate ? latestEarning.date : latestPayment.dueDate;
  } else {
    latestDate = latestEarning?.date ?? latestPayment?.dueDate ?? null;
  }

  // --- Data status ---
  let dataStatus = "No Data Yet";
  let DataIcon = AlertCircle;
  let dataStatusColor = "text-rose-500";

  if (earningsCount > 10 && paymentsCount > 5) {
    dataStatus = "Good";
    DataIcon = CheckCircle2;
    dataStatusColor = "text-emerald-500";
  } else if (totalRecords > 0) {
    dataStatus = "Building";
    DataIcon = Clock;
    dataStatusColor = "text-amber-500";
  }

  const greeting = getGreeting();

  return (
    <div className="space-y-8 pb-12">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, {session.user.name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here is your explainable credit profile.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard/worker/profile"
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm h-9 px-3 font-medium transition-colors"
          >
            <User className="h-4 w-4" />
            Profile
          </Link>
          <Link
            href="/dashboard/worker/financial-data"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-9 px-3 font-medium transition-colors"
          >
            <Database className="h-4 w-4" />
            Add Data
          </Link>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Profile completion */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Profile</span>
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{profileCompletion}%</div>
          <div className="space-y-1">
            <div className="w-full h-1.5 rounded-full bg-muted/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {filledFields} / {fieldsToCheck.length} fields complete
            </p>
          </div>
        </div>

        {/* Records count */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Records</span>
            <Database className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{totalRecords}</div>
          <p className="text-xs text-muted-foreground">
            {earningsCount} earnings · {paymentsCount} payments
          </p>
        </div>

        {/* Data status */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data Status</span>
            <DataIcon className={`h-4 w-4 ${dataStatusColor}`} />
          </div>
          <div className={`text-xl font-bold ${dataStatusColor}`}>{dataStatus}</div>
          {latestDate && (
            <p className="text-xs text-muted-foreground">
              Last record: {format(latestDate, "MMM d, yyyy")}
            </p>
          )}
          {!latestDate && (
            <p className="text-xs text-muted-foreground">
              No records uploaded yet
            </p>
          )}
        </div>

        {/* Quick score preview (kept in sync with dial) */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Credit Score</span>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>
          {engineResult?.status === "OK" && engineResult.score !== null ? (
            <>
              <div className="text-2xl font-bold text-primary">{engineResult.score}</div>
              <p className="text-xs text-muted-foreground">
                {engineResult.band} · out of 900
              </p>
            </>
          ) : (
            <>
              <div className="text-xl font-bold text-muted-foreground">—</div>
              <p className="text-xs text-muted-foreground">Add data to calculate</p>
            </>
          )}
        </div>
      </div>

      {/* Explainability panel — the core of Phase 8 */}
      {engineResult && chartData && (
        <div className="space-y-8">
          <LoanEligibilityCard 
            eligibility={calculateLoanEligibility(engineResult)} 
            requestedAmount={profile.applications?.[0]?.requestedAmount}
          />
          <ExplainabilityPanel
            engineResult={engineResult}
            chartData={chartData}
            userName={session.user.name ?? "Worker"}
          />
        </div>
      )}

      {/* Empty state when no engine result */}
      {!engineResult && (
        <div className="rounded-xl border bg-card p-10 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Database className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-semibold">Your score is ready when your data is ready</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Upload your earnings history or payment records to generate your explainable credit score.
            </p>
          </div>
          <Link
            href="/dashboard/worker/financial-data"
            className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-10 px-6 font-medium"
          >
            <Database className="h-4 w-4" />
            Add Financial Data
          </Link>
        </div>
      )}
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
