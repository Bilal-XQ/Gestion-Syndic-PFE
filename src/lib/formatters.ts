import { format, isValid, parseISO } from "date-fns"
import { fr } from "date-fns/locale"

function parseDateValue(value: Date | string | null | undefined): Date | null {
  if (!value) return null

  if (value instanceof Date) {
    return isValid(value) ? value : null
  }

  if (/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    return null
  }

  const parsed = parseISO(value)
  if (isValid(parsed)) return parsed

  const fallback = new Date(value)
  return isValid(fallback) ? fallback : null
}

function normalizeNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === "string") {
    const normalized = Number(value)
    return Number.isFinite(normalized) ? normalized : 0
  }

  return 0
}

export function formatMAD(amount: number | string | null | undefined): string {
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(normalizeNumber(amount))} MAD`
}

export function formatDate(value: Date | string | null | undefined): string {
  const parsed = parseDateValue(value)
  if (!parsed) return "—"
  return format(parsed, "d MMM yyyy", { locale: fr })
}

export function formatDateLong(value: Date | string | null | undefined): string {
  const parsed = parseDateValue(value)
  if (!parsed) return "—"
  return format(parsed, "EEEE d MMMM yyyy", { locale: fr })
}

export function formatDateTime(value: Date | string | null | undefined): string {
  const parsed = parseDateValue(value)
  if (!parsed) return "—"
  return format(parsed, "d MMM yyyy HH:mm", { locale: fr })
}

export function formatTime(value: Date | string | null | undefined): string {
  if (!value) return "—"

  if (typeof value === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    return value.slice(0, 5)
  }

  const parsed = parseDateValue(value)
  if (!parsed) return "—"
  return format(parsed, "HH:mm")
}

export function toDateInputValue(
  value: Date | string | null | undefined
): string {
  const parsed = parseDateValue(value)
  if (!parsed) return ""
  return format(parsed, "yyyy-MM-dd")
}

export function toTimeInputValue(value: string | null | undefined): string {
  if (!value) return ""
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    return value.slice(0, 5)
  }

  const parsed = parseDateValue(value)
  if (!parsed) return ""
  return format(parsed, "HH:mm")
}