"use client"

import {
  Users2,
  Building2,
  DoorOpen,
  DoorClosed,
  FileText,
  CreditCard,
} from "lucide-react"
import { AnimatedMetricCard } from "./animated-metric-card"
import type { DashboardMetrics } from "@/lib/db/queries/dashboard"

interface MetricCardsGridProps {
  metrics: DashboardMetrics
  financialSummary: {
    totalChargesIssued: string
    totalCollected: string
    totalOutstanding: string
  }
}

export function MetricCardsGrid({ metrics, financialSummary }: MetricCardsGridProps) {
  const totalCollectedFormatted =
    Number(financialSummary.totalCollected).toLocaleString("fr-MA") + " MAD"

  const cards = [
    {
      label: "Copropriétaires",
      value: metrics.totalOwners,
      secondaryText: "propriétaires actifs",
      icon: Users2,
    },
    {
      label: "Appartements",
      value: metrics.totalApartments,
      secondaryText: "dans l'immeuble",
      icon: Building2,
    },
    {
      label: "Occupés",
      value: metrics.occupiedApartments,
      secondaryText: "appartements occupés",
      icon: DoorOpen,
    },
    {
      label: "Vacants",
      value: metrics.vacantApartments,
      secondaryText: "appartements disponibles",
      icon: DoorClosed,
    },
    {
      label: "Charges actives",
      value: metrics.totalCharges,
      secondaryText: "en attente de paiement",
      icon: FileText,
    },
    {
      label: "Total collecté",
      value: totalCollectedFormatted,
      secondaryText: "paiements reçus",
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
