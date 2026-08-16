/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSyntheticPresets, generateSyntheticData, getSyntheticDataStatus } from "@/actions/synthetic-data";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";

export function SyntheticDataPanel() {
  const [loading, setLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [datasets, setDatasets] = React.useState<any[]>([]);
  const [presets, setPresets] = React.useState<any[]>([]);

  React.useEffect(() => {
    getSyntheticDataStatus().then((data) => {
      if (data) setDatasets(data);
    });
    getSyntheticPresets().then((data) => {
      if (data) setPresets(data);
    });
  }, []);

  const handleGenerate = async (presetKey: string) => {
    setLoading(presetKey);
    setError(null);
    setSuccess(null);

    const res = await generateSyntheticData(presetKey as any);
    
    if (res.error) {
      setError(res.error);
    } else if (res.success) {
      setSuccess(`Generated ${res.earningCount} earnings and ${res.paymentCount} payments for "${res.preset}".`);
      getSyntheticDataStatus().then((data) => {
        if (data) setDatasets(data);
      });
    }
    
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      <Alert variant="default" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
        <AlertCircle className="h-4 w-4" color="currentColor" />
        <AlertTitle>Demo Mode / Hackathon Testing</AlertTitle>
        <AlertDescription>
          These presets will generate approximately 12 months of realistic, deterministic financial data. 
          All generated data is permanently tagged as <strong>Synthetic/Demo data — not real financial records</strong>.
          It will not delete your existing manual or uploaded records.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-emerald-500/50 text-emerald-600 bg-emerald-500/10">
          <CheckCircle2 className="h-4 w-4" color="currentColor" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {presets.map((preset) => (
          <Card key={preset.key} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{preset.label}</CardTitle>
              <CardDescription className="text-xs">Platform: {preset.platform}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground">{preset.description}</p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant="outline" 
                disabled={loading !== null}
                onClick={() => handleGenerate(preset.key)}
              >
                {loading === preset.key ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Data"
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {datasets.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Generated Demo Datasets</CardTitle>
            <CardDescription>History of synthetic data generated for your profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {datasets.map((ds, idx) => (
                <div key={idx} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <div className="font-medium">{presets.find(p => p.key === ds.preset)?.label || ds.preset}</div>
                    <div className="text-xs text-muted-foreground">Generated {format(new Date(ds.createdAt), "PPpp")}</div>
                  </div>
                  <div className="text-sm font-medium">
                    {ds.recordCount} records
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

