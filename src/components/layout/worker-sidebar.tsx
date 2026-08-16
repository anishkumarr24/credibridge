"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  PieChart,
  BarChart2,
  FileText,
} from "lucide-react";

const sidebarLinks = [
  { href: "/dashboard/worker",                label: "Overview",       icon: LayoutDashboard },
  { href: "/dashboard/worker/profile",         label: "My Profile",    icon: User },
  { href: "/dashboard/worker/financial-data",  label: "Financial Data", icon: PieChart },
  { href: "/dashboard/worker/history",         label: "Score History", icon: BarChart2 },
  { href: "/dashboard/worker/profile-report",  label: "Credit Report", icon: FileText },
];

export function WorkerSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2 min-w-56 p-4 border-r min-h-screen bg-card hidden md:flex print:hidden">
      <div className="font-semibold px-4 mb-4 text-muted-foreground uppercase text-xs tracking-wider">
        Worker Dashboard
      </div>
      {sidebarLinks.map((link) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
