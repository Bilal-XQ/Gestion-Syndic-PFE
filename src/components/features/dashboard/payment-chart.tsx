"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card } from "@/components/ui/card"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { motion } from "motion/react"
import { useTranslations } from "next-intl"
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
  if (!active || !payload?.length) return null

  const amount = payload[0]?.value ?? 0
  let displayLabel = label ?? ""

  try {
    if (label && /^\d{4}-\d{2}/.test(label)) {
      displayLabel = format(parseISO(label), "MMMM yyyy", { locale: fr })
      displayLabel = displayLabel.charAt(0).toUpperCase() + displayLabel.slice(1)
    }
  } catch {
    displayLabel = label ?? ""
  }

  return (
    <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-elevated] px-3 py-2.5 shadow-[var(--shadow-md)]">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-[--text-muted] capitalize">
        {displayLabel}
      </p>
      <p className="font-[family-name:var(--font-geist-mono)] text-[14px] font-semibold text-[--text-primary]">
        {formatMAD(amount)}
      </p>
    </div>
  )
}

export function PaymentChart({ data }: PaymentChartProps) {
  const t = useTranslations("dashboard")
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted ? resolvedTheme === "dark" : true

  const chartColors = {
    grid: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    axis: isDark ? "#636363" : "#9A9A9A",
  }

  const isEmpty = data.length === 0 || data.every((d) => d.total === 0)

  if (!data || data.length < 2) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="p-5">
          <div className="mb-4">
            <p className="text-sm font-medium">{t("paymentChart.title")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("paymentChart.subtitle")}</p>
          </div>
          <div className="flex h-[220px] items-center justify-center">
            <p className="text-[13px] text-[--text-muted]">
              Pas assez de données à afficher
            </p>
          </div>
        </Card>
      </motion.div>
    )
  }

  const tickFormatter = (value: string) => {
    try {
      if (/^\d{4}-\d{2}/.test(value)) {
        return format(parseISO(value), "MMM", { locale: fr })
      }
      return value
    } catch {
      return value
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="p-5">
        <div className="mb-4">
          <p className="text-sm font-medium">{t("paymentChart.title")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("paymentChart.subtitle")}</p>
        </div>

        {isEmpty ? (
          <div className="h-[260px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              {t("paymentChart.empty")}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isDark ? "#D4A853" : "#8B6520"}
                    stopOpacity={0.15}
                  />
                  <stop
                    offset="95%"
                    stopColor={isDark ? "#D4A853" : "#8B6520"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartColors.grid}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tickFormatter={tickFormatter}
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 11,
                  fill: chartColors.axis,
                  fontFamily: "var(--font-geist-mono, monospace)",
                }}
                dy={8}
              />
              <YAxis
                tick={{
                  fontSize: 11,
                  fill: chartColors.axis,
                  fontFamily: "var(--font-geist-mono, monospace)",
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  strokeWidth: 1,
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke={isDark ? "#D4A853" : "#8B6520"}
                strokeWidth={1.5}
                fill="url(#chartGradient)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: isDark ? "#D4A853" : "#8B6520",
                  stroke: isDark ? "rgba(212,168,83,0.3)" : "rgba(139,101,32,0.2)",
                  strokeWidth: 4,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>
    </motion.div>
  )
}
