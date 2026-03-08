"use client"

import * as React from "react"
import { Clock3, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatTime, toTimeInputValue } from "@/lib/formatters"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TimePickerProps {
  value?: string | null
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  allowClear?: boolean
  buttonClassName?: string
}

const hours = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0")
)

const minutes = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0")
)

export function TimePicker({
  value,
  onChange,
  placeholder = "Choisir une heure",
  disabled,
  allowClear = false,
  buttonClassName,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const normalizedValue = toTimeInputValue(value)
  const [selectedHour, selectedMinute] = normalizedValue
    ? normalizedValue.split(":")
    : ["", ""]

  const updateValue = (nextHour: string, nextMinute: string) => {
    if (!nextHour || !nextMinute) return
    onChange(`${nextHour}:${nextMinute}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !normalizedValue && "text-muted-foreground",
            buttonClassName
          )}
        >
          <span>{normalizedValue ? formatTime(normalizedValue) : placeholder}</span>
          <Clock3 className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-3" align="start">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Heure</p>
            <Select
              value={selectedHour}
              onValueChange={(nextHour) => updateValue(nextHour, selectedMinute)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent>
                {hours.map((hour) => (
                  <SelectItem key={hour} value={hour}>
                    {hour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Minute</p>
            <Select
              value={selectedMinute}
              onValueChange={(nextMinute) => updateValue(selectedHour, nextMinute)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {minutes.map((minute) => (
                  <SelectItem key={minute} value={minute}>
                    {minute}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {allowClear && normalizedValue ? (
          <div className="mt-3 border-t pt-2">
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