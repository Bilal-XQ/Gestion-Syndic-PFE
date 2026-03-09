import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { getPaymentsGlobal } from "@/lib/db/queries/payments"
import { formatDate, formatMAD } from "@/lib/formatters"

type RecentPaymentsProps = {
  payments: Awaited<ReturnType<typeof getPaymentsGlobal>>
}

export async function RecentPayments({ payments }: RecentPaymentsProps) {
  const t = await getTranslations("dashboard");
  return (
    <Card className="p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium">{t("recentPayments.title")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {payments.length} {t(payments.length > 1 ? "recentPayments.last_other" : "recentPayments.last_one")}
          </p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            {t("recentPayments.empty")}
          </p>
        </div>
      ) : (
        <div>
          {payments.map((payment, index) => (
            <div key={payment.id}>
              <div className="flex items-center gap-3 py-3">
                <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0 text-xs font-semibold text-secondary-foreground select-none">
                  {payment.ownerFirstName?.[0]?.toUpperCase()}
                  {payment.ownerLastName?.[0]?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none truncate">
                    {payment.ownerFirstName} {payment.ownerLastName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {payment.chargeTitle}
                  </p>
                </div>

                <div className="text-end shrink-0">
                  <p className="text-sm font-mono font-medium leading-none">
                    +{formatMAD(payment.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(payment.paymentDate)}
                  </p>
                </div>
              </div>
              {index < payments.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
