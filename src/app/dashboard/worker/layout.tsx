import { ReactNode } from "react";
import { WorkerSidebar } from "@/components/layout/worker-sidebar";

export default function WorkerDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <WorkerSidebar />
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
