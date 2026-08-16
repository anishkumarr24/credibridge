/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CircleCheck, AlertCircle } from "lucide-react";
import { addManualEarning } from "@/actions/financial-data";
import { earningRecordSchema, EarningRecordValues } from "@/lib/schemas";
import { format } from "date-fns";
import { z } from "zod";

export function ManualEarningForm() {
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof earningRecordSchema>>({
    resolver: zodResolver(earningRecordSchema) as any,
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      platform: "",
      grossEarnings: 0,
      incentives: 0,
      deductions: 0,
      netEarnings: 0,
      workingHours: undefined,
      trips: undefined,
    } as any,
  });

  async function onSubmit(formData: any) {
    const data = formData as EarningRecordValues;
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const result = await addManualEarning(data);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      reset({ date: format(new Date(), "yyyy-MM-dd"), platform: data.platform }); // Keep platform but reset others
      setTimeout(() => setSuccess(false), 3000);
    }

    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900">
          <CircleCheck className="h-4 w-4 text-green-600 dark:text-green-500" />
          <AlertDescription>Earning record added successfully!</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" {...register("date")} disabled={isLoading} />
        {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="platform">Platform (Optional)</Label>
        <Input id="platform" placeholder="e.g. Uber, DoorDash" {...register("platform")} disabled={isLoading} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="grossEarnings">Gross Earnings ($)</Label>
          <Input id="grossEarnings" type="number" step="0.01" {...register("grossEarnings")} disabled={isLoading} />
          {errors.grossEarnings && <p className="text-sm text-destructive">{errors.grossEarnings.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="netEarnings">Net Earnings ($)</Label>
          <Input id="netEarnings" type="number" step="0.01" {...register("netEarnings")} disabled={isLoading} />
          {errors.netEarnings && <p className="text-sm text-destructive">{errors.netEarnings.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="workingHours">Hours Worked</Label>
          <Input id="workingHours" type="number" step="0.1" {...register("workingHours")} disabled={isLoading} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="trips">Trips / Tasks</Label>
          <Input id="trips" type="number" {...register("trips")} disabled={isLoading} />
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : "Save Record"}
      </Button>
    </form>
  );
}


