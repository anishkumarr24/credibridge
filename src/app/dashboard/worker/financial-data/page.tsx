import { getFinancialSummary, getEarningsPage, getPaymentsPage } from "@/actions/financial-data";
import { FinancialDataClient } from "./financial-data-client";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Financial Data | CrediBridge",
  description: "Manage your gig earnings and payment records.",
};

export default async function FinancialDataPage() {
  const summary = await getFinancialSummary();
  const initialEarnings = await getEarningsPage(1, 20);
  const initialPayments = await getPaymentsPage(1, 20);

  if (!summary) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Financial Data</h1>
        <p className="text-muted-foreground mt-2">
          Manage your gig earnings, utility bills, and rent payments. Providing this data helps us generate a fair and explainable credit score for you.
        </p>
      </div>

      <FinancialDataClient 
        initialSummary={summary} 
        initialEarnings={initialEarnings}
        initialPayments={initialPayments}
      />
    </div>
  );
}
