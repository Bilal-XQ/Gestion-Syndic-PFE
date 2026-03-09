"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Download, CreditCard } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/features/shared/StatusBadge";
import { OwnerPaymentForm } from "@/components/features/payments/owner-payment-form";
import { downloadPaymentNotice } from "@/lib/actions/charges";
import { exportOwnerPayments, type ExportColumns } from "@/lib/export/excel";
import { formatDate, formatMAD } from "@/lib/formatters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Charge = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  totalAmount: string;
  dueDate: string;
  amountPaid: string;
  remainingAmount: string;
  status: string;
};

type Payment = {
  id: string;
  chargeId: string;
  amount: string;
  paymentDate: string;
  method: string;
  reference: string;
  notes: string | null;
  chargeTitle: string;
  chargeCategory: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
// category and method labels are now built inside the component using translations

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function OwnerPaymentsView() {
  const t = useTranslations("portal");
  const tc = useTranslations("common");
  const exportCols: ExportColumns = {
    chargeTitle: tc("export.columns.chargeTitle"),
    category: tc("export.columns.category"),
    amount: tc("export.columns.amount"),
    currency: tc("export.columns.currency"),
    paymentDate: tc("export.columns.paymentDate"),
    method: tc("export.columns.method"),
    reference: tc("export.columns.reference"),
    fullName: "", email: "", phone: "", apartment: "", ownershipDate: "",
    title: "", totalAmount: "", amountPaid: "",
    remaining: "", dueDate: "", status: "", ownerName: "",
  };
  const categoryLabels: Record<string, string> = {
    electricity: tc("categories.electricity"),
    water: tc("categories.water"),
    maintenance: tc("categories.maintenance"),
    repair: tc("categories.repair"),
    other: tc("categories.other"),
  };
  const methodLabels: Record<string, string> = {
    bank_transfer: tc("paymentMethods.transfer"),
    check: tc("paymentMethods.check"),
    cash: tc("paymentMethods.cash"),
  };
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState<Charge | null>(null);

  const { data: charges = [], isLoading: chargesLoading } = useQuery<Charge[]>({
    queryKey: ["portal", "charges"],
    queryFn: async () => {
      const r = await fetch("/api/portal/charges");
      if (!r.ok) return [];
      const json = await r.json();
      return Array.isArray(json) ? json : [];
    },
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<
    Payment[]
  >({
    queryKey: ["portal", "payments"],
    queryFn: async () => {
      const r = await fetch("/api/portal/payments");
      if (!r.ok) return [];
      const json = await r.json();
      return Array.isArray(json) ? json : [];
    },
  });

  async function handleDownload(chargeId: string) {
    const result = await downloadPaymentNotice(chargeId);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    const blob = new Blob(
      [Uint8Array.from(atob(result.data.buffer), (c) => c.charCodeAt(0))],
      { type: "application/pdf" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.data.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Tabs defaultValue="charges">
        <TabsList>
          <TabsTrigger value="charges">{t("ownerPayments.tabCharges")}</TabsTrigger>
          <TabsTrigger value="history">{t("ownerPayments.tabHistory")}</TabsTrigger>
        </TabsList>

        {/* ─── Tab 1: Charges ─── */}
        <TabsContent value="charges">
          <Card className="border-[--border-default] bg-[--bg-elevated]">
            {chargesLoading ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : charges.length === 0 ? (
              <p className="p-6 text-center text-sm text-[--text-secondary]">
                {t("ownerPayments.chargesEmpty")}
              </p>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("ownerPayments.chargesTable.title")}</TableHead>
                    <TableHead>{t("ownerPayments.chargesTable.category")}</TableHead>
                    <TableHead className="text-end">{t("ownerPayments.chargesTable.total")}</TableHead>
                    <TableHead className="text-end">{t("ownerPayments.chargesTable.paid")}</TableHead>
                    <TableHead className="text-end">{t("ownerPayments.chargesTable.remaining")}</TableHead>
                    <TableHead>{t("ownerPayments.chargesTable.status")}</TableHead>
                    <TableHead>{t("ownerPayments.chargesTable.dueDate")}</TableHead>
                    <TableHead className="text-end">{t("ownerPayments.chargesTable.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {charges.map((charge) => (
                    <TableRow key={charge.id}>
                      <TableCell className="font-medium text-[--text-primary]">
                        {charge.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categoryLabels[charge.category] ?? charge.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end">
                        {formatMAD(charge.totalAmount)}
                      </TableCell>
                      <TableCell className="text-end">
                        {formatMAD(charge.amountPaid)}
                      </TableCell>
                      <TableCell className="text-end">
                        {formatMAD(charge.remainingAmount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={charge.status as "paid" | "partial" | "unpaid"}
                        />
                      </TableCell>
                      <TableCell>{formatDate(charge.dueDate)}</TableCell>
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-1">
                          {charge.status !== "paid" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setSelectedCharge(charge);
                                setPaymentOpen(true);
                              }}
                            >
                              <CreditCard className="me-1 h-4 w-4" />
                              {t("ownerPayments.chargesTable.payButton")}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownload(charge.id)}
                          >
                            <Download className="me-1 h-4 w-4" />
                            {t("ownerPayments.chargesTable.noticeButton")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ─── Tab 2: Payment History ─── */}
        <TabsContent value="history">
          <div className="mb-4 flex justify-end">
            <Button
              variant="outline"
              onClick={() => exportOwnerPayments(payments, exportCols, tc("export.sheetName"))}
              disabled={payments.length === 0}
            >
              <Download className="size-4" />
              {tc("export.button")}
            </Button>
          </div>
          <Card className="border-[--border-default] bg-[--bg-elevated]">
            {paymentsLoading ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : payments.length === 0 ? (
              <p className="p-6 text-center text-sm text-[--text-secondary]">
                {t("ownerPayments.historyEmpty")}
              </p>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("ownerPayments.historyTable.date")}</TableHead>
                    <TableHead>{t("ownerPayments.historyTable.charge")}</TableHead>
                    <TableHead>{t("ownerPayments.historyTable.category")}</TableHead> 
                    <TableHead className="text-end">{t("ownerPayments.historyTable.amount")}</TableHead>
                    <TableHead>{t("ownerPayments.historyTable.method")}</TableHead>
                    <TableHead>{t("ownerPayments.historyTable.reference")}</TableHead>
                    <TableHead>{t("ownerPayments.historyTable.notes")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell className="font-medium text-[--text-primary]">
                        {payment.chargeTitle}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categoryLabels[payment.chargeCategory] ??
                            payment.chargeCategory}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end">
                        {formatMAD(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {methodLabels[payment.method] ?? payment.method}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.reference}</TableCell>
                      <TableCell className="text-[--text-secondary]">
                        {payment.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <OwnerPaymentForm
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        charge={selectedCharge}
        ownerId=""
      />
    </>
  );
}
