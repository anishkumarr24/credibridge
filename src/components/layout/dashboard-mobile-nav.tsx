"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Role } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";

// Import sidebar link definitions or recreate them here
import {
  LayoutDashboard,
  User,
  PieChart,
  BarChart2,
  FileText,
  Database,
} from "lucide-react";

const workerLinks = [
  { href: "/dashboard/worker",                label: "Overview",       icon: LayoutDashboard },
  { href: "/dashboard/worker/profile",         label: "My Profile",    icon: User },
  { href: "/dashboard/worker/financial-data",  label: "Financial Data", icon: PieChart },
  { href: "/dashboard/worker/history",         label: "Score History", icon: BarChart2 },
  { href: "/dashboard/worker/profile-report",  label: "Credit Report", icon: FileText },
];

const lenderLinks = [
  { href: "/dashboard/lender",              label: "Overview",     icon: LayoutDashboard },
  { href: "/dashboard/lender/applications", label: "Applications", icon: FileText },
];

const adminLinks = [
  { href: "/dashboard/admin",               label: "Metrics Overview", icon: LayoutDashboard },
  { href: "/dashboard/admin/synthetic-data",label: "Synthetic Data",   icon: Database },
];

export function DashboardMobileNav({ role }: { role: string }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  let links = workerLinks;
  if (role === Role.LENDER) links = lenderLinks;
  if (role === Role.ADMIN) links = adminLinks;

  return (
    <div className="md:hidden print:hidden relative z-40">
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="font-semibold text-lg tracking-tight text-foreground">Dashboard</div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-[65px] left-0 right-0 border-b bg-background shadow-lg overflow-hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-4 max-h-[80vh] overflow-y-auto">
              {links.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
