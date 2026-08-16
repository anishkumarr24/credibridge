import { auth } from "@/../auth";
import { redirect } from "next/navigation";
import { DashboardMobileNav } from "@/components/layout/dashboard-mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <DashboardMobileNav role={session.user.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
