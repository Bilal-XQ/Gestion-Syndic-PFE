"use client"

import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card } from "@/components/ui/card"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { motion } from "motion/react"
import { formatMAD } from "@/lib/formatters"

interface PaymentChartProps {
  data: { month: string; total: number }[]
}

interface TooltipPayload {
  value: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length || !label) return null
  const monthLabel = format(parseISO(label), "MMMM yyyy", { locale: fr })
  return (
    <div className="bg-card border border-border rounded-lg shadow-sm px-3 py-2 text-sm">
      <p className="font-medium capitalize">{monthLabel}</p>
      <p className="text-muted-foreground mt-0.5">{formatMAD(payload[0].value)}</p>
    </div>
  )
}

export function PaymentChart({ data }: PaymentChartProps) {
  const isEmpty = data.length === 0 || data.every((d) => d.total === 0)

  const chartData = data.map((d) => ({
    month: d.month,
    total: d.total,
    label: format(parseISO(d.month), "MMM", { locale: fr }),
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="p-5">
        <div className="mb-4">
          <p className="text-sm font-medium">Activité des paiements</p>
          <p className="text-xs text-muted-foreground mt-0.5">6 derniers mois</p>
        </div>

        {isEmpty ? (
          <div className="h-[260px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Aucun paiement enregistré
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                fill="hsl(var(--chart-1))"
                fillOpacity={0.12}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>
    </motion.div>
  )
}
