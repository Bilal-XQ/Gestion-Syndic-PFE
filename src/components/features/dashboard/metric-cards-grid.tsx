"use client"

import {
  Users2,
  Building2,
  DoorOpen,
  DoorClosed,
  FileText,
  CreditCard,
} from "lucide-react"
import { useTranslations } from "next-intl";
import { AnimatedMetricCard } from "./animated-metric-card"
import type { DashboardMetrics } from "@/lib/db/queries/dashboard"
import { formatMAD } from "@/lib/formatters"

interface MetricCardsGridProps {
  metrics: DashboardMetrics
  financialSummary: {
    totalChargesIssued: string
    totalCollected: string
    totalOutstanding: string
  }
}

export function MetricCardsGrid({ metrics, financialSummary }: MetricCardsGridProps) {
  const t = useTranslations("dashboard");
  const totalCollectedFormatted = formatMAD(financialSummary.totalCollected)

  const cards = [
    {
      label: t("metrics.owners"),
      value: metrics.totalOwners,
      secondaryText: t("metrics.ownersSecondary"),
      icon: Users2,
    },
    {
      label: t("metrics.apartments"),
      value: metrics.totalApartments,
      secondaryText: t("metrics.apartmentsSecondary"),
      icon: Building2,
    },
    {
      label: t("metrics.occupied"),
      value: metrics.occupiedApartments,
      secondaryText: t("metrics.occupiedSecondary"),
      icon: DoorOpen,
    },
    {
      label: t("metrics.vacant"),
      value: metrics.vacantApartments,
      secondaryText: t("metrics.vacantSecondary"),
      icon: DoorClosed,
    },
    {
      label: t("metrics.activeCharges"),
      value: metrics.totalCharges,
      secondaryText: t("metrics.activeChargesSecondary"),
      icon: FileText,
    },
    {
      label: t("metrics.totalCollected"),
      value: totalCollectedFormatted,
      secondaryText: t("metrics.totalCollectedSecondary"),
      icon: CreditCard,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <AnimatedMetricCard
          key={card.label}
          label={card.label}
          value={card.value}
          secondaryText={card.secondaryText}
          icon={card.icon}
          index={index}
        />
      ))}
    </div>
  )
}
