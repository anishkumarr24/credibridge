import { getLenderApplications } from "@/actions/lender";
import Link from "next/link";
import { ApplicationStatus } from "@prisma/client";
import { format } from "date-fns";
import { ArrowRight, Users, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Lender Dashboard | CrediBridge",
};

export default async function LenderDashboardPage() {
  const applications = await getLenderApplications();

  const total = applications.length;
  const pending = applications.filter(a => a.status === ApplicationStatus.SUBMITTED || a.status === ApplicationStatus.UNDER_REVIEW).length;
  const approved = applications.filter(a => a.status === ApplicationStatus.APPROVED).length;

  // Calculate average score of those with scores
  const appsWithScores = applications.filter(a => a.worker.scores.length > 0);
  const avgScore = appsWithScores.length > 0 
    ? appsWithScores.reduce((sum, a) => sum + a.worker.scores[0].totalScore, 0) / appsWithScores.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lender Overview</h1>
        <p className="text-muted-foreground mt-2">
          Monitor your loan applications and applicants&apos; credit profiles.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Loans</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgScore)}</div>
            <p className="text-xs text-muted-foreground">Out of 900</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Recent Applications</h2>
          <Link href="/dashboard/lender/applications" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="rounded-md border bg-card">
          {applications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No applications found.
            </div>
          ) : (
            <div className="divide-y">
              {applications.slice(0, 5).map((app) => {
                const score = app.worker.scores[0];
                return (
                  <div key={app.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{app.worker.user.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span>{app.worker.occupationType || "Unknown Occupation"}</span>
                        <span>&bull;</span>
                        <span>Applied {format(app.createdAt, "MMM d, yyyy")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {score && (
                        <div className="text-right hidden sm:block">
                          <p className="font-semibold">{Math.round(score.totalScore)} / 900</p>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                      )}
                      <div className="text-right">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                          {app.status}
                        </span>
                      </div>
                      <Link 
                        href={`/dashboard/lender/applications/${app.id}`}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
