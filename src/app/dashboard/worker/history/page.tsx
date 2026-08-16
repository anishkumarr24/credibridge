import { auth } from "@/../auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getScoreHistory } from "@/actions/score-history";
import { ScoreHistoryClient } from "./score-history-client";
import Link from "next/link";
import { BarChart2, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Score History | CrediBridge",
  description: "Track how your explainable credit score has changed over time.",
};

export default async function ScoreHistoryPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== Role.WORKER) {
    redirect(session.user.role === Role.LENDER ? "/dashboard/lender" : "/");
  }

  const { entries, error } = await getScoreHistory(30);

  return (
    <div className="space-y-8 pb-12">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/worker"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BarChart2 className="h-6 w-6 text-primary" />
              Score History
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              See how your credit score has evolved over time and why it changed.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/worker/financial-data"
          className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-9 px-4 font-medium transition-colors shrink-0"
        >
          Add Financial Data
        </Link>
      </div>

      {/* Explanation note */}
      <div className="rounded-xl border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">How this works:</strong> Each time you visit your dashboard,
          a score snapshot is saved automatically (at most once per day if your score changes).
          Click any point on the chart or any row in the list below to see exactly which factors drove a change.
          All explanations are derived from your real financial data.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : (
        <ScoreHistoryClient entries={entries} />
      )}
    </div>
  );
}
