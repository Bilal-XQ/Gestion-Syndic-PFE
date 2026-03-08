"use client"

import { motion } from "motion/react"
import { Card } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface AnimatedMetricCardProps {
  label: string
  value: string | number
  secondaryText: string
  icon: LucideIcon
  index: number
}

export function AnimatedMetricCard({
  label,
  value,
  secondaryText,
  icon: Icon,
  index,
}: AnimatedMetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className="p-5 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-3xl font-bold tracking-tight font-mono">{value}</p>
        <p className="text-xs text-muted-foreground mt-1.5">{secondaryText}</p>
      </Card>
    </motion.div>
  )
}
