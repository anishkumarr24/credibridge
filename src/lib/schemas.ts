import { z } from "zod";
import { PaymentStatus } from "@prisma/client";

export const earningRecordSchema = z.object({
  date: z.string().or(z.date()),
  platform: z.string().optional(),
  grossEarnings: z.coerce.number().min(0, "Gross earnings cannot be negative"),
  incentives: z.coerce.number().min(0, "Incentives cannot be negative").default(0),
  deductions: z.coerce.number().min(0, "Deductions cannot be negative").default(0),
  netEarnings: z.coerce.number().min(0, "Net earnings cannot be negative"),
  workingHours: z.coerce.number().min(0).optional(),
  trips: z.coerce.number().int().min(0).optional(),
});

export const paymentRecordSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(0, "Amount cannot be negative"),
  dueDate: z.string().or(z.date()),
  paidDate: z.string().or(z.date()).optional().nullable(),
  status: z.nativeEnum(PaymentStatus),
});

export type EarningRecordValues = z.infer<typeof earningRecordSchema>;
export type PaymentRecordValues = z.infer<typeof paymentRecordSchema>;

export const profileSchema = z.object({
  phone: z.string().optional(),
  location: z.string().optional(),
  occupationType: z.string().optional(),
  primaryPlatform: z.string().optional(),
  platformTenure: z.coerce.number().min(0).optional().or(z.literal("")),
  monthlyExpenses: z.coerce.number().min(0).optional().or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
