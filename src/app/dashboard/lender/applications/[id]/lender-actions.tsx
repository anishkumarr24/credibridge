"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateApplicationStatus } from "@/actions/lender";
import { Check, X, FileQuestion, Loader2 } from "lucide-react";

export function LenderApplicationActions({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(status: "APPROVED" | "DECLINED" | "MORE_INFO_NEEDED") {
    setLoading(status);
    try {
      await updateApplicationStatus(applicationId, status);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to update status. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3">
      <Button 
        variant="outline" 
        onClick={() => handleAction("MORE_INFO_NEEDED")}
        disabled={loading !== null}
        className="flex-1 whitespace-nowrap"
      >
        {loading === "MORE_INFO_NEEDED" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileQuestion className="mr-2 h-4 w-4" />}
        Request Info
      </Button>
      <Button 
        variant="destructive" 
        onClick={() => handleAction("DECLINED")}
        disabled={loading !== null}
        className="flex-1 whitespace-nowrap"
      >
        {loading === "DECLINED" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
        Decline
      </Button>
      <Button 
        variant="default" 
        className="bg-emerald-600 hover:bg-emerald-700 flex-1 whitespace-nowrap"
        onClick={() => handleAction("APPROVED")}
        disabled={loading !== null}
      >
        {loading === "APPROVED" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
        Approve Loan
      </Button>
    </div>
  );
}
