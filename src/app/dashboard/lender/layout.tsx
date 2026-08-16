import { ReactNode } from "react";
import { LenderSidebar } from "@/components/layout/lender-sidebar";

export const metadata = {
  title: "Lender Dashboard | CrediBridge",
  description: "Manage applications and view applicant profiles.",
};

export default function LenderDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <LenderSidebar />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
