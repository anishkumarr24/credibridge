import { LoanEligibilityResult } from "@/lib/loan-eligibility/calculator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Calculator, Info, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function LoanEligibilityCard({ eligibility, requestedAmount }: { eligibility: LoanEligibilityResult, requestedAmount?: number | null }) {
  if (eligibility.status === "NOT_ELIGIBLE") {
    return (
      <Card className="border-muted bg-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-muted-foreground" />
            Loan Recommendation
          </CardTitle>
          <CardDescription>
            CrediBridge recommends loan amounts based on your score and income.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <Info className="h-8 w-8 text-muted-foreground mb-4" />
            <p className="text-muted-foreground max-w-sm">
              {eligibility.reason || "Not yet eligible for a loan recommendation."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (val?: number) => val ? val.toLocaleString('en-IN') : '0';

  return (
    <div className="space-y-6">
      {requestedAmount && (
        <Card className="border-muted bg-muted/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Your Requested Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              ₹{formatCurrency(requestedAmount)}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            CrediBridge Recommended Amount
          </div>
          <div className="text-2xl font-bold text-primary">
            ₹{formatCurrency(eligibility.recommended_amount)}
          </div>
        </CardTitle>
        <CardDescription>
          Based on your Phase 5 Credit Score and Income Consistency.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1 p-4 rounded-lg bg-background border">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Tenure</span>
            <p className="text-lg font-bold">{eligibility.tenure_months} mo</p>
          </div>
          <div className="space-y-1 p-4 rounded-lg bg-background border">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Est. EMI</span>
            <p className="text-lg font-bold">₹{formatCurrency(eligibility.estimated_emi)}</p>
          </div>
          <div className="space-y-1 p-4 rounded-lg bg-background border">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Indicative Rate</span>
            <p className="text-lg font-bold">
              {eligibility.indicative_rate_band?.[0] ? Math.round(eligibility.indicative_rate_band[0] * 100) : 0}-
              {eligibility.indicative_rate_band?.[1] ? Math.round(eligibility.indicative_rate_band[1] * 100) : 0}%
            </p>
          </div>
          <div className="space-y-1 p-4 rounded-lg bg-background border">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Guarantor</span>
            <p className="text-lg font-bold capitalize">
              {String(eligibility.guarantor_required)}
            </p>
          </div>
        </div>

        {eligibility.guarantor_required === true && (
          <Alert variant="default" className="bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-900">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Guarantor Required</AlertTitle>
            <AlertDescription>
              To access this loan amount, a guarantor is required. You can remove this requirement by building a longer on-time payment history.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3 mt-2 border-t border-border/50 pt-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Calculator className="h-4 w-4 text-muted-foreground" />
            Ceilings & Binding Constraint
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1 p-3 rounded-lg bg-background border text-sm">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Affordability Ceiling</span>
              <p className="font-bold">₹{formatCurrency(eligibility.affordability_ceiling)}</p>
            </div>
            <div className="space-y-1 p-3 rounded-lg bg-background border text-sm">
              <span className="text-xs text-muted-foreground uppercase font-semibold">LTI Ceiling</span>
              <p className="font-bold">₹{formatCurrency(eligibility.lti_ceiling)}</p>
            </div>
            <div className="space-y-1 p-3 rounded-lg bg-background border text-sm">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Expense-Adjusted Ceiling</span>
              <p className="font-bold">
                {eligibility.expense_adjusted_ceiling !== undefined && eligibility.expense_adjusted_ceiling > 0
                  ? `₹${formatCurrency(eligibility.expense_adjusted_ceiling)}` 
                  : "N/A"}
              </p>
            </div>
          </div>
          
          <div className="bg-muted/50 p-3 rounded-lg border flex items-center justify-between text-sm">
            <span className="font-medium">Binding Constraint</span>
            <span className="font-bold text-primary capitalize px-2 py-1 bg-background rounded border">
              {eligibility.binding_constraint?.replace(/-/g, ' ')}
            </span>
          </div>
        </div>

        <div className="space-y-3 mt-2 border-t border-border/50 pt-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Info className="h-4 w-4" />
            Why this amount?
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {eligibility.explanations?.map((exp, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                <span>{exp}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
