"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ManualEarningForm } from "./manual-earning-form";
import { ManualPaymentForm } from "./manual-payment-form";
import { CSVUpload } from "./csv-upload";
import { SyntheticDataPanel } from "./synthetic-data-panel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { EarningRecord, PaymentRecord, FinancialSource } from "@prisma/client";
import { getEarningsPage, getPaymentsPage } from "@/actions/financial-data";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface FinancialDataClientProps {
  initialSummary: {
    totalEarnings: number;
    totalPayments: number;
    earnings: EarningRecord[];
    payments: PaymentRecord[];
    sources: FinancialSource[];
  };
  initialEarnings: {
    records: EarningRecord[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null;
  initialPayments: {
    records: PaymentRecord[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null;
}

export function FinancialDataClient({ initialSummary, initialEarnings, initialPayments }: FinancialDataClientProps) {
  // Earnings Pagination State
  const [earningsData, setEarningsData] = React.useState(initialEarnings);
  const [earningsLoading, setEarningsLoading] = React.useState(false);

  // Payments Pagination State
  const [paymentsData, setPaymentsData] = React.useState(initialPayments);
  const [paymentsLoading, setPaymentsLoading] = React.useState(false);

  const fetchEarningsPage = async (page: number) => {
    setEarningsLoading(true);
    const data = await getEarningsPage(page, 20);
    setEarningsData(data);
    setEarningsLoading(false);
  };

  const fetchPaymentsPage = async (page: number) => {
    setPaymentsLoading(true);
    const data = await getPaymentsPage(page, 20);
    setPaymentsData(data);
    setPaymentsLoading(false);
  };

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <TabsList className="grid w-full grid-cols-5 md:w-auto md:inline-grid h-auto">
          <TabsTrigger value="overview" className="py-2">Overview</TabsTrigger>
          <TabsTrigger value="earnings" className="py-2">Earnings ({initialSummary.totalEarnings})</TabsTrigger>
          <TabsTrigger value="payments" className="py-2">Payments ({initialSummary.totalPayments})</TabsTrigger>
          <TabsTrigger value="upload" className="py-2">Upload Data</TabsTrigger>
          <TabsTrigger value="demo" className="py-2">Demo Data</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Earnings</CardTitle>
              <CardDescription>Your latest gig income records</CardDescription>
            </CardHeader>
            <CardContent>
              {initialSummary.earnings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No earnings recorded yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead className="text-right">Net Earned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialSummary.earnings.slice(0, 5).map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{format(new Date(e.date), "MMM d, yyyy")}</TableCell>
                        <TableCell>{e.platform || "Unknown"}</TableCell>
                        <TableCell className="text-right">₹{e.netEarnings.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Your latest rent and utility bills</CardDescription>
            </CardHeader>
            <CardContent>
              {initialSummary.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialSummary.payments.slice(0, 5).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{format(new Date(p.dueDate), "MMM d, yyyy")}</TableCell>
                        <TableCell className="capitalize">{p.category.toLowerCase()}</TableCell>
                        <TableCell>{p.status}</TableCell>
                        <TableCell className="text-right">₹{p.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="earnings">
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Earnings History</CardTitle>
                <CardDescription>All your recorded gig earnings</CardDescription>
              </CardHeader>
              <CardContent>
                {earningsData?.records.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No earnings recorded yet.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Platform</TableHead>
                            <TableHead className="text-right">Gross</TableHead>
                            <TableHead className="text-right">Net</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {earningsLoading ? (
                            <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center">
                                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                              </TableCell>
                            </TableRow>
                          ) : (
                            earningsData?.records.map((e) => (
                              <TableRow key={e.id}>
                                <TableCell>{format(new Date(e.date), "MMM d, yyyy")}</TableCell>
                                <TableCell>{e.platform || "Unknown"}</TableCell>
                                <TableCell className="text-right">₹{e.grossEarnings.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-medium">₹{e.netEarnings.toFixed(2)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {earningsData && earningsData.totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Page {earningsData.page} of {earningsData.totalPages}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={earningsData.page <= 1 || earningsLoading}
                            onClick={() => fetchEarningsPage(earningsData.page - 1)}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={earningsData.page >= earningsData.totalPages || earningsLoading}
                            onClick={() => fetchEarningsPage(earningsData.page + 1)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Add Earning</CardTitle>
                <CardDescription>Manually enter a record</CardDescription>
              </CardHeader>
              <CardContent>
                <ManualEarningForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="payments">
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Payments History</CardTitle>
                <CardDescription>All your recorded rent and utility payments</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentsData?.records.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paymentsLoading ? (
                            <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center">
                                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                              </TableCell>
                            </TableRow>
                          ) : (
                            paymentsData?.records.map((p) => (
                              <TableRow key={p.id}>
                                <TableCell>{format(new Date(p.dueDate), "MMM d, yyyy")}</TableCell>
                                <TableCell className="capitalize">{p.category}</TableCell>
                                <TableCell>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    p.status === "PAID" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                    p.status === "LATE" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" :
                                    p.status === "MISSED" ? "bg-destructive/10 text-destructive" :
                                    "bg-muted text-muted-foreground"
                                  }`}>
                                    {p.status}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-medium">₹{p.amount.toFixed(2)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {paymentsData && paymentsData.totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Page {paymentsData.page} of {paymentsData.totalPages}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={paymentsData.page <= 1 || paymentsLoading}
                            onClick={() => fetchPaymentsPage(paymentsData.page - 1)}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={paymentsData.page >= paymentsData.totalPages || paymentsLoading}
                            onClick={() => fetchPaymentsPage(paymentsData.page + 1)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Add Payment</CardTitle>
                <CardDescription>Manually enter a payment</CardDescription>
              </CardHeader>
              <CardContent>
                <ManualPaymentForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="upload">
        <CSVUpload />
      </TabsContent>
      
      <TabsContent value="demo">
        <SyntheticDataPanel />
      </TabsContent>
    </Tabs>
  );
}
