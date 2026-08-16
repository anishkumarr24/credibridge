"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { getOrGenerateDemoUser } from "@/actions/demo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, PlayCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEMO_PRESETS = [
  { id: "stable_worker", label: "Stable Worker" },
  { id: "seasonal_worker", label: "Seasonal Worker" },
  { id: "growing_worker", label: "Growing Worker" },
  { id: "unstable_worker", label: "Unstable Worker" },
  { id: "recovery_worker", label: "Recovery Worker" },
] as const;

type PresetType = typeof DEMO_PRESETS[number]["id"];

export function DemoBanner({ currentEmail }: { currentEmail: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Derive current preset from email (e.g. demo_stable_worker_xyz@...)
  const currentPresetMatch = DEMO_PRESETS.find(p => currentEmail.includes(`demo_${p.id}`));
  const currentPresetId = currentPresetMatch?.id || "stable_worker";

  async function handleSwitch(preset: string) {
    if (preset === currentPresetId) return;
    
    setLoading(true);
    try {
      const credentials = await getOrGenerateDemoUser(preset as PresetType);
      
      const response = await signIn("credentials", {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });

      if (!response?.error) {
        router.push("/dashboard/worker");
        router.refresh();
      }
    } catch (e) {
      console.error(e);
      alert("Failed to switch demo scenario.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between text-sm shadow-sm z-50 relative print:hidden">
      <div className="flex items-center gap-2 font-medium">
        <PlayCircle className="w-4 h-4" />
        <span className="hidden sm:inline">Judge / Demo Mode Active:</span>
        <span className="sm:hidden">Demo:</span>
        
        {loading ? (
          <div className="flex items-center gap-2 ml-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="opacity-80">Switching...</span>
          </div>
        ) : (
          <Select defaultValue={currentPresetId} onValueChange={handleSwitch} disabled={loading}>
            <SelectTrigger className="w-[180px] h-7 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground focus:ring-offset-primary">
              <SelectValue placeholder="Select Scenario" />
            </SelectTrigger>
            <SelectContent>
              {DEMO_PRESETS.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs opacity-80 hidden md:inline">
          Uses real deterministic scoring based on preset synthetic data.
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 px-2 hover:bg-primary-foreground/20 text-primary-foreground"
          onClick={() => {
            router.push("/api/auth/signout?callbackUrl=/login");
          }}
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          Exit Demo
        </Button>
      </div>
    </div>
  );
}
