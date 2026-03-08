"use client"

import * as React from "react"
import { CalendarIcon, X } from "lucide-react"
import { fr } from "date-fns/locale"
import { parseISO } from "date-fns"

import { cn } from "@/lib/utils"
import { formatDate, toDateInputValue } from "@/lib/formatters"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string | null
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  allowClear?: boolean
  className?: string
  buttonClassName?: string
  fromDate?: Date
  toDate?: Date
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Choisir une date",
  disabled,
  allowClear = false,
  className,
  buttonClassName,
  fromDate,
  toDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selectedValue = value ? toDateInputValue(value) : ""
  const selectedDate = selectedValue ? parseISO(selectedValue) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selectedValue && "text-muted-foreground",
            buttonClassName
          )}
        >
          <span>{selectedValue ? formatDate(selectedValue) : placeholder}</span>
          <CalendarIcon className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-auto p-0", className)} align="start">
        <Calendar
          mode="single"
          locale={fr}
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) return
            onChange(toDateInputValue(date))
            setOpen(false)
          }}
          fromDate={fromDate}
          toDate={toDate}
          initialFocus
        />
        {allowClear && selectedValue ? (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-center"
              onClick={() => {
                onChange("")
                setOpen(false)
              }}
            >
              <X className="size-4" />
              Effacer
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}