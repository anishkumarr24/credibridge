/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CircleCheck, AlertCircle, UploadCloud } from "lucide-react";
import { uploadEarningsCSV, uploadPaymentsCSV } from "@/actions/financial-data";
import { earningRecordSchema, paymentRecordSchema, EarningRecordValues, PaymentRecordValues } from "@/lib/schemas";
import { DataCategory, PaymentStatus } from "@prisma/client";

export function CSVUpload() {
  const [uploadType, setUploadType] = React.useState<"earnings" | "payments">("earnings");
  const [paymentCategory, setPaymentCategory] = React.useState<DataCategory>(DataCategory.RENT_PAYMENTS);

  const [file, setFile] = React.useState<File | null>(null);
  const [parsedRecords, setParsedRecords] = React.useState<any[]>([]);
  const [validRecords, setValidRecords] = React.useState<any[]>([]);
  const [errors, setErrors] = React.useState<any[]>([]);
  
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadResult, setUploadResult] = React.useState<{success?: boolean; error?: string; count?: number} | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      parseCSV(selectedFile, uploadType);
      setUploadResult(null);
    }
  };

  const handleTypeChange = (type: "earnings" | "payments") => {
    setUploadType(type);
    setFile(null);
    setParsedRecords([]);
    setValidRecords([]);
    setErrors([]);
    setUploadResult(null);
  };

  const parseCSV = (file: File, type: "earnings" | "payments") => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        const valid: any[] = [];
        const rowErrors: any[] = [];

        rows.forEach((row: any, index) => {
          const normalizedRow: any = {};
          Object.keys(row).forEach(k => {
            normalizedRow[k.trim().toLowerCase()] = row[k];
          });

          if (type === "earnings") {
            const mappedRecord = {
              date: normalizedRow.date || normalizedRow.timestamp || "",
              platform: normalizedRow.platform || "",
              grossEarnings: normalizedRow.grossearnings || normalizedRow.gross || normalizedRow.earnings || 0,
              incentives: normalizedRow.incentives || normalizedRow.bonus || 0,
              deductions: normalizedRow.deductions || normalizedRow.fees || 0,
              netEarnings: normalizedRow.netearnings || normalizedRow.net || 0,
              workingHours: normalizedRow.workinghours || normalizedRow.hours || undefined,
              trips: normalizedRow.trips || normalizedRow.tasks || undefined,
            };

            const parsed = earningRecordSchema.safeParse(mappedRecord);
            if (parsed.success) {
              valid.push(parsed.data);
            } else {
              rowErrors.push({ row: index + 1, data: row, errors: parsed.error.errors });
            }
          } else {
            // Payments
            const mappedRecord = {
              category: normalizedRow.category || normalizedRow.type || "Other",
              amount: normalizedRow.amount || normalizedRow.cost || 0,
              dueDate: normalizedRow.duedate || normalizedRow.date || "",
              paidDate: normalizedRow.paiddate || normalizedRow.paymentdate || null,
              status: (normalizedRow.status?.toUpperCase() as PaymentStatus) || PaymentStatus.PENDING,
            };

            const parsed = paymentRecordSchema.safeParse(mappedRecord);
            if (parsed.success) {
              valid.push(parsed.data);
            } else {
              rowErrors.push({ row: index + 1, data: row, errors: parsed.error.errors });
            }
          }
        });

        setParsedRecords(rows);
        setValidRecords(valid);
        setErrors(rowErrors);
      },
      error: (error) => {
        setUploadResult({ error: `Failed to parse CSV: ${error.message}` });
      }
    });
  };

  const handleUpload = async () => {
    if (validRecords.length === 0) return;
    
    setIsUploading(true);
    setUploadResult(null);

    let result;
    if (uploadType === "earnings") {
      result = await uploadEarningsCSV(validRecords as EarningRecordValues[], file?.name || "upload.csv");
    } else {
      result = await uploadPaymentsCSV(validRecords as PaymentRecordValues[], file?.name || "upload.csv", paymentCategory);
    }
    
    setUploadResult(result);
    setIsUploading(false);

    if (result.success) {
      setFile(null);
      setParsedRecords([]);
      setValidRecords([]);
      setErrors([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Button 
          variant={uploadType === "earnings" ? "default" : "outline"} 
          onClick={() => handleTypeChange("earnings")}
        >
          Gig Earnings CSV
        </Button>
        <Button 
          variant={uploadType === "payments" ? "default" : "outline"} 
          onClick={() => handleTypeChange("payments")}
        >
          Payments/Bills CSV
        </Button>
      </div>

      {uploadType === "payments" && (
        <div className="flex items-center gap-4 border p-4 rounded-lg bg-card">
          <div className="text-sm font-medium">Payment Data Category:</div>
          <Select value={paymentCategory} onValueChange={(v: DataCategory) => setPaymentCategory(v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DataCategory.RENT_PAYMENTS}>Rent Payments</SelectItem>
              <SelectItem value={DataCategory.UTILITY_PAYMENTS}>Utility Bills</SelectItem>
              <SelectItem value={DataCategory.OTHER_RECURRING}>Other Recurring</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-center w-full">
          <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 border-muted-foreground/25">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              <p className="text-xs text-muted-foreground">
                {uploadType === "earnings" 
                  ? "Earnings CSV (Date, Platform, Gross, Net)" 
                  : "Payments CSV (DueDate, Category, Amount, Status)"}
              </p>
            </div>
            <Input id="dropzone-file" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
        {file && <p className="text-sm font-medium">Selected: {file.name}</p>}
      </div>

      {uploadResult?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadResult.error}</AlertDescription>
        </Alert>
      )}

      {uploadResult?.success && (
        <Alert className="bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900">
          <CircleCheck className="h-4 w-4 text-green-600 dark:text-green-500" />
          <AlertTitle>Upload Successful</AlertTitle>
          <AlertDescription>Successfully saved {uploadResult.count} records.</AlertDescription>
        </Alert>
      )}

      {parsedRecords.length > 0 && !uploadResult?.success && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Preview Data</h3>
            <div className="text-sm">
              <span className="text-green-600 font-medium">{validRecords.length} valid</span>
              {" | "}
              <span className="text-destructive font-medium">{errors.length} invalid</span>
            </div>
          </div>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Validation Errors Detected</AlertTitle>
              <AlertDescription>
                {errors.length} rows have invalid data and will not be saved.
              </AlertDescription>
            </Alert>
          )}

          <div className="border rounded-md max-h-96 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                <TableRow>
                  <TableHead>Status</TableHead>
                  {uploadType === "earnings" ? (
                    <>
                      <TableHead>Date</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead className="text-right">Net Earned</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedRecords.map((row, i) => {
                  const isInvalid = errors.some(e => e.row === i + 1);
                  const keys = Object.keys(row);
                  
                  if (uploadType === "earnings") {
                    const dateKey = keys.find(k => k.toLowerCase().includes('date')) || keys[0];
                    const netKey = keys.find(k => k.toLowerCase().includes('net')) || keys.find(k => k.toLowerCase().includes('earn'));
                    const platformKey = keys.find(k => k.toLowerCase().includes('plat'));
                    return (
                      <TableRow key={i} className={isInvalid ? "bg-destructive/10" : ""}>
                        <TableCell>{isInvalid ? <AlertCircle className="h-4 w-4 text-destructive" /> : <CircleCheck className="h-4 w-4 text-green-600" />}</TableCell>
                        <TableCell>{String(row[dateKey || ''] || '')}</TableCell>
                        <TableCell>{platformKey ? String(row[platformKey]) : ""}</TableCell>
                        <TableCell className="text-right">{netKey ? String(row[netKey]) : ""}</TableCell>
                      </TableRow>
                    );
                  } else {
                    const dueKey = keys.find(k => k.toLowerCase().includes('due')) || keys.find(k => k.toLowerCase().includes('date')) || keys[0];
                    const amtKey = keys.find(k => k.toLowerCase().includes('amount')) || keys.find(k => k.toLowerCase().includes('cost'));
                    const statusKey = keys.find(k => k.toLowerCase().includes('status'));
                    return (
                      <TableRow key={i} className={isInvalid ? "bg-destructive/10" : ""}>
                        <TableCell>{isInvalid ? <AlertCircle className="h-4 w-4 text-destructive" /> : <CircleCheck className="h-4 w-4 text-green-600" />}</TableCell>
                        <TableCell>{String(row[dueKey || ''] || '')}</TableCell>
                        <TableCell>{statusKey ? String(row[statusKey]) : ""}</TableCell>
                        <TableCell className="text-right">{amtKey ? String(row[amtKey]) : ""}</TableCell>
                      </TableRow>
                    );
                  }
                })}
              </TableBody>
            </Table>
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={isUploading || validRecords.length === 0}
            className="w-full"
          >
            {isUploading ? "Saving..." : `Save ${validRecords.length} Valid Records`}
          </Button>
        </div>
      )}
    </div>
  );
}


