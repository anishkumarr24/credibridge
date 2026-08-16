"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Database,
} from "lucide-react";

const sidebarLinks = [
  { href: "/dashboard/admin",                label: "Metrics Overview",       icon: LayoutDashboard },
  { href: "/dashboard/admin/synthetic-data", label: "Synthetic Data Controls",icon: Database },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2 min-w-56 p-4 border-r min-h-screen bg-card hidden md:flex">
      <div className="font-semibold px-4 mb-4 text-muted-foreground uppercase text-xs tracking-wider">
        Admin & Demo Controls
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
