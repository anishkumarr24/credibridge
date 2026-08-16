"use client";

import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportActions() {
  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    alert("Secure Link Copied: https://demo.credibridge.app/p/demo-1234\n\n(This is a simulated hackathon workflow)");
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={handlePrint} className="print:hidden">
        <Download className="mr-2 h-4 w-4" />
        Download PDF
      </Button>
      <Button onClick={handleShare} className="print:hidden">
        <Share2 className="mr-2 h-4 w-4" />
        Share Secure Link
      </Button>
    </div>
  );
}
