"use client";

import { useState } from "react";
import { createSyntheticData } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";

type PresetType = "stable_worker" | "seasonal_worker" | "growing_worker" | "unstable_worker" | "recovery_worker";

const PRESETS: { id: PresetType; label: string; description: string }[] = [
  { id: "stable_worker", label: "Stable Worker", description: "Stable monthly income with high payment regularity and moderate weekly volatility." },
  { id: "seasonal_worker", label: "Seasonal Worker", description: "Strong seasonal variations with otherwise stable behaviour." },
  { id: "growing_worker", label: "Growing Worker", description: "Consistently increasing earnings over time." },
  { id: "unstable_worker", label: "Unstable Worker", description: "Highly irregular earnings and multiple missed payments." },
  { id: "recovery_worker", label: "Recovery Worker", description: "A previous sharp decline in earnings followed by a recent recovery." },
];

export function SyntheticControls() {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleGenerate(preset: PresetType) {
    setLoadingId(preset);
    try {
      const res = await createSyntheticData(preset);
      if (res.error) {
        alert(`Error: ${res.error}`);
      } else {
        alert("Success: Synthetic dataset generated successfully.");
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred";
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {PRESETS.map((preset) => (
        <Card key={preset.id} className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">{preset.label}</CardTitle>
            <CardDescription>{preset.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              Generates a full worker profile, 12 months of earning and payment records, runs the scoring engine, and creates a demo loan application.
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => handleGenerate(preset.id)} 
              disabled={loadingId !== null}
              className="w-full"
            >
              {loadingId === preset.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Dataset
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
