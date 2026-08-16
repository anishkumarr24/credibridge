"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CircleCheck, AlertCircle } from "lucide-react";
import { addManualPayment } from "@/actions/financial-data";
import { paymentRecordSchema, PaymentRecordValues } from "@/lib/schemas";
import { format } from "date-fns";
import { PaymentStatus, DataCategory } from "@prisma/client";

export function ManualPaymentForm() {
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const { control, register, handleSubmit, setValue, reset, formState: { errors } } = useForm<PaymentRecordValues>({
    resolver: zodResolver(paymentRecordSchema),
    defaultValues: {
      category: "Utility",
      amount: 0,
      dueDate: format(new Date(), "yyyy-MM-dd"),
      paidDate: format(new Date(), "yyyy-MM-dd"),
      status: PaymentStatus.PAID,
    },
  });

  const categoryValue = useWatch({ control, name: "category" });
  const statusValue = useWatch({ control, name: "status" });

  async function onSubmit(data: PaymentRecordValues) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    // Map category string to DataCategory enum
    const dataCat = data.category.toLowerCase().includes("rent") 
      ? DataCategory.RENT_PAYMENTS 
      : DataCategory.UTILITY_PAYMENTS;

    const result = await addManualPayment(data, dataCat);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      reset({ category: data.category, dueDate: format(new Date(), "yyyy-MM-dd") }); 
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
          <AlertDescription>Payment record added successfully!</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="category">Payment Category</Label>
        <Select disabled={isLoading} value={categoryValue} onValueChange={(val) => setValue("category", val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Utility (Electricity)">Utility (Electricity)</SelectItem>
            <SelectItem value="Utility (Water)">Utility (Water)</SelectItem>
            <SelectItem value="Utility (Internet)">Utility (Internet)</SelectItem>
            <SelectItem value="Rent">Rent</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount ($)</Label>
          <Input id="amount" type="number" step="0.01" {...register("amount")} disabled={isLoading} />
          {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select disabled={isLoading} value={statusValue} onValueChange={(val: PaymentStatus) => setValue("status", val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
              <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={PaymentStatus.LATE}>Late</SelectItem>
              <SelectItem value={PaymentStatus.MISSED}>Missed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input id="dueDate" type="date" {...register("dueDate")} disabled={isLoading} />
          {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="paidDate">Paid Date (Optional)</Label>
          <Input id="paidDate" type="date" {...register("paidDate")} disabled={isLoading} />
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : "Save Record"}
      </Button>
    </form>
  );
}

