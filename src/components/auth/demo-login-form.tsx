"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2, PlayCircle } from "lucide-react";
import { getOrGenerateDemoUser, getOrGenerateDemoLender, getOrGenerateDemoAdmin } from "@/actions/demo";

const DEMO_PRESETS = [
  { id: "stable_worker", label: "Stable Worker", desc: "Consistent earnings, on-time payments" },
  { id: "seasonal_worker", label: "Seasonal Worker", desc: "Expected income fluctuations" },
  { id: "growing_worker", label: "Growing Worker", desc: "Upward income trajectory" },
  { id: "unstable_worker", label: "Unstable Worker", desc: "Volatile income, missed payments" },
  { id: "recovery_worker", label: "Recovery Worker", desc: "Recent recovery after a slump" },
] as const;

type PresetType = typeof DEMO_PRESETS[number]["id"];

export function DemoLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loadingPreset, setLoadingPreset] = useState<PresetType | null>(null);

  async function handleDemoLogin(preset: PresetType | "lender" | "admin") {
    setLoadingPreset(preset as PresetType);
    setError(null);

    try {
      let credentials;
      let redirectPath = "/dashboard/worker";

      if (preset === "lender") {
        credentials = await getOrGenerateDemoLender();
        redirectPath = "/dashboard/lender";
      } else if (preset === "admin") {
        credentials = await getOrGenerateDemoAdmin();
        redirectPath = "/dashboard/admin";
      } else {
        credentials = await getOrGenerateDemoUser(preset as PresetType);
      }
      
      const response = await signIn("credentials", {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });

      if (response?.error) {
        setError("Failed to authenticate demo user.");
        setLoadingPreset(null);
        return;
      }

      router.push(redirectPath);
      router.refresh();
    } catch (e: unknown) {
      console.error(e);
      setError("Failed to prepare demo environment. Please try again.");
      setLoadingPreset(null);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto border-dashed border-primary/50 shadow-md">
      <CardHeader className="space-y-1 text-center bg-primary/5 rounded-t-xl pb-6">
        <div className="mx-auto bg-primary/10 w-12 h-12 flex items-center justify-center rounded-full mb-2">
          <PlayCircle className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-primary">Demo / Judge Mode</CardTitle>
        <CardDescription>
          Quickly experience CrediBridge from the perspective of different synthetic worker profiles.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="space-y-3">
          {DEMO_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              className="w-full justify-start h-auto py-3 px-4 flex flex-col items-start gap-1 hover:border-primary hover:bg-primary/5"
              disabled={loadingPreset !== null}
              onClick={() => handleDemoLogin(preset.id)}
            >
              <div className="flex items-center w-full justify-between">
                <span className="font-semibold">{preset.label}</span>
                {loadingPreset === preset.id && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              </div>
              <span className="text-xs text-muted-foreground font-normal">{preset.desc}</span>
            </Button>
          ))}
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4 flex flex-col items-start gap-1 hover:border-primary hover:bg-primary/5"
            disabled={loadingPreset !== null}
            onClick={() => handleDemoLogin("lender")}
          >
            <div className="flex items-center w-full justify-between">
              <span className="font-semibold">Demo Lender</span>
              {/* @ts-expect-error Typescript incorrectly types button child components */}
              {loadingPreset === "lender" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
            <span className="text-xs text-muted-foreground font-normal">Review applications and scores</span>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4 flex flex-col items-start gap-1 hover:border-primary hover:bg-primary/5"
            disabled={loadingPreset !== null}
            onClick={() => handleDemoLogin("admin")}
          >
            <div className="flex items-center w-full justify-between">
              <span className="font-semibold">Demo Admin</span>
              {/* @ts-expect-error Typescript incorrectly types button child components */}
              {loadingPreset === "admin" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
            <span className="text-xs text-muted-foreground font-normal">Manage synthetic data generation</span>
          </Button>
        </div>
        
        <div className="mt-6 text-xs text-center text-muted-foreground">
          These profiles use the real deterministic scoring engine based on generated financial histories.
        </div>
      </CardContent>
    </Card>
  );
}
