"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateWorkerProfile } from "@/actions/worker-profile";
import { profileSchema, ProfileFormValues } from "@/lib/schemas";
import { WorkerProfile } from "@prisma/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface ProfileFormProps {
  initialData: WorkerProfile;
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: initialData.phone || "",
      location: initialData.location || "",
      occupationType: initialData.occupationType || "",
      primaryPlatform: initialData.primaryPlatform || "",
      platformTenure: initialData.platformTenure || "",
      monthlyExpenses: initialData.monthlyExpenses || "",
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const result = await updateWorkerProfile(data);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      router.refresh();
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    }

    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
          <AlertDescription>Profile updated successfully!</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" placeholder="+1 (555) 000-0000" {...register("phone")} disabled={isLoading} />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" placeholder="City, State" {...register("location")} disabled={isLoading} />
          {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="occupationType">Occupation Type</Label>
          <Input id="occupationType" placeholder="e.g. Rideshare Driver, Freelancer" {...register("occupationType")} disabled={isLoading} />
          {errors.occupationType && <p className="text-sm text-destructive">{errors.occupationType.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryPlatform">Primary Gig Platform</Label>
          <Input id="primaryPlatform" placeholder="e.g. Uber, Upwork, DoorDash" {...register("primaryPlatform")} disabled={isLoading} />
          {errors.primaryPlatform && <p className="text-sm text-destructive">{errors.primaryPlatform.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="platformTenure">Platform Tenure (Months)</Label>
          <Input id="platformTenure" type="number" min="0" placeholder="e.g. 24" {...register("platformTenure")} disabled={isLoading} />
          {errors.platformTenure && <p className="text-sm text-destructive">{errors.platformTenure.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthlyExpenses">Estimated Monthly Expenses ($)</Label>
          <Input id="monthlyExpenses" type="number" min="0" step="0.01" placeholder="e.g. 1500" {...register("monthlyExpenses")} disabled={isLoading} />
          {errors.monthlyExpenses && <p className="text-sm text-destructive">{errors.monthlyExpenses.message}</p>}
        </div>
      </div>

      <Button type="submit" disabled={isLoading || !isDirty} className="w-full sm:w-auto">
        {isLoading ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}

