"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
const categoryLabels: Record<string, string> = {
  electricity: "Électricité",
  water: "Eau",
  maintenance: "Entretien",
  repair: "Réparation",
  other: "Autre",
};

const methodLabels: Record<string, string> = {
  bank_transfer: "Virement",
  check: "Chèque",
  cash: "Espèces",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function OwnerPaymentsView() {
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
          <TabsTrigger value="charges">Mes charges</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
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
                Aucune charge pour le moment.
              </p>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Payé</TableHead>
                    <TableHead className="text-right">Restant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell className="text-right">
                        {Number(charge.totalAmount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(charge.amountPaid).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(charge.remainingAmount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={charge.status as "paid" | "partial" | "unpaid"}
                        />
                      </TableCell>
                      <TableCell>{charge.dueDate}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {charge.status !== "paid" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedCharge(charge);
                                setPaymentOpen(true);
                              }}
                            >
                              <CreditCard className="mr-1 h-4 w-4" />
                              Payer
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownload(charge.id)}
                          >
                            <Download className="mr-1 h-4 w-4" />
                            Avis
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
          <Card className="border-[--border-default] bg-[--bg-elevated]">
            {paymentsLoading ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : payments.length === 0 ? (
              <p className="p-6 text-center text-sm text-[--text-secondary]">
                Aucun paiement enregistré.
              </p>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Charge</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.paymentDate}</TableCell>
                      <TableCell className="font-medium text-[--text-primary]">
                        {payment.chargeTitle}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categoryLabels[payment.chargeCategory] ??
                            payment.chargeCategory}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(payment.amount).toFixed(2)}
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
