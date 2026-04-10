"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react"

import { cn } from "@/lib/utils"

export interface TimelineItem {
  id: string
  label: string
  title: string
  description: string
}

interface TimelineProps {
  items: TimelineItem[]
  defaultActiveIndex?: number
  className?: string
}

const clampIndex = (value: number, max: number) =>
  Math.min(Math.max(value, 0), Math.max(max - 1, 0))

export function Timeline({
  items,
  defaultActiveIndex = 0,
  className,
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLOListElement>(null)
  const markerRefs = useRef<Array<HTMLDivElement | null>>([])
  const [railHeight, setRailHeight] = useState(0)
  const [activeIndex, setActiveIndex] = useState(
    clampIndex(defaultActiveIndex, items.length)
  )

  const safeActiveIndex = clampIndex(activeIndex, items.length)
  const activeItem = items[safeActiveIndex]

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 35%", "end 70%"],
  })

  const progressHeight = useTransform(scrollYProgress, [0, 1], [0, railHeight])
  const progressOpacity = useTransform(scrollYProgress, [0, 0.08], [0.25, 1])

  useEffect(() => {
    setActiveIndex(clampIndex(defaultActiveIndex, items.length))
  }, [defaultActiveIndex, items.length])

  useEffect(() => {
    const node = railRef.current

    if (!node) return

    const measure = () => {
      const nextHeight = Math.max(node.getBoundingClientRect().height - 40, 0)
      setRailHeight(nextHeight)
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(node)

    return () => observer.disconnect()
  }, [items.length])

  useMotionValueEvent(scrollYProgress, "change", () => {
    if (!markerRefs.current.length || typeof window === "undefined") return

    const threshold = window.innerHeight * 0.45
    let closestIndex = 0
    let closestDistance = Number.POSITIVE_INFINITY

    markerRefs.current.forEach((marker, index) => {
      if (!marker) return

      const rect = marker.getBoundingClientRect()
      const markerCenter = rect.top + rect.height / 2
      const distance = Math.abs(markerCenter - threshold)

      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })

    setActiveIndex((currentIndex) =>
      currentIndex === closestIndex ? currentIndex : closestIndex
    )
  })

  const progressText = useMemo(() => {
    const current = String(safeActiveIndex + 1).padStart(2, "0")
    const total = String(items.length).padStart(2, "0")

    return `${current} / ${total}`
  }, [items.length, safeActiveIndex])

  if (!activeItem) return null

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      <div className="grid gap-10 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:gap-16">
        <div className="md:sticky md:top-28 md:self-start">
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute top-5 h-[calc(100%-40px)] w-px bg-gradient-to-b from-transparent via-[--border-default] to-transparent"
              style={{ insetInlineStart: "1.25rem" }}
            />
            <motion.div
              aria-hidden="true"
              className="absolute top-5 w-px rounded-full bg-gradient-to-b from-[--accent] via-[--accent-muted] to-transparent"
              style={{
                insetInlineStart: "1.25rem",
                height: progressHeight,
                opacity: progressOpacity,
              }}
            />
            <ol ref={railRef} className="relative flex flex-col gap-5">
              {items.map((item, index) => {
                const isActive = index === safeActiveIndex
                const isComplete = index < safeActiveIndex

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-current={isActive ? "step" : undefined}
                      aria-label={`${item.label} ${item.title}`}
                      onClick={() => {
                        setActiveIndex(index)
                        markerRefs.current[index]?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        })
                      }}
                      className={cn(
                        "group flex w-full items-start gap-4 rounded-[28px] border border-transparent bg-transparent p-3 text-start transition-all duration-300 outline-none",
                        "focus-visible:border-[--accent-border] focus-visible:bg-[--bg-card] focus-visible:shadow-[0_0_0_1px_var(--accent-border)]",
                        isActive && "border-[--accent-border] bg-[--bg-card] shadow-[var(--shadow-sm)]"
                      )}
                    >
                      <span className="relative z-10 flex shrink-0 items-center justify-center">
                        <span
                          className={cn(
                            "flex size-10 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300",
                            "font-[family-name:var(--font-syne)]",
                            isActive || isComplete
                              ? "border-[--accent-border] bg-[--accent-bg] text-[--accent] shadow-[0_8px_24px_var(--accent-glow)]"
                              : "border-[--border-default] bg-[--bg-card] text-[--text-muted]"
                          )}
                        >
                          {item.label}
                        </span>
                      </span>
                      <span className="flex min-w-0 flex-col gap-1.5 pt-1">
                        <span
                          className={cn(
                            "font-[family-name:var(--font-syne)] text-[10px] font-semibold uppercase tracking-[0.18em]",
                            isActive || isComplete
                              ? "text-[--accent-muted]"
                              : "text-[--text-muted]"
                          )}
                        >
                          {item.label}
                        </span>
                        <span
                          className={cn(
                            "text-base font-medium transition-colors duration-300 md:text-lg",
                            isActive
                              ? "text-[--text-primary]"
                              : "text-[--text-secondary] group-hover:text-[--text-primary]"
                          )}
                        >
                          {item.title}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>

        <div className="relative">
          <div className="md:sticky md:top-28">
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="overflow-hidden rounded-[32px] border border-[--border-default] bg-[--bg-card] shadow-[var(--shadow-lg)]"
            >
              <div className="relative p-8 md:p-10">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,168,83,0.12),transparent_45%)] opacity-60" />
                <div className="relative flex flex-col gap-8">
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex w-fit items-center rounded-full border border-[--accent-border] bg-[--accent-bg] px-4 py-1.5 font-[family-name:var(--font-syne)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[--accent-muted]">
                      {activeItem.label}
                    </span>
                    <span className="font-[family-name:var(--font-syne)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[--text-muted]">
                      {progressText}
                    </span>
                  </div>

                  <div className="flex flex-col gap-4">
                    <h3
                      className="font-[family-name:var(--font-instrument-serif)] text-[--text-primary]"
                      style={{
                        fontSize: "clamp(28px, 3vw, 42px)",
                        lineHeight: "1.08",
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {activeItem.title}
                    </h3>
                    <p className="max-w-2xl text-[15px] leading-8 text-[--text-secondary] md:text-[17px]">
                      {activeItem.description}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {items.map((item, index) => {
                      const isCurrent = index === safeActiveIndex

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveIndex(index)
                            markerRefs.current[index]?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            })
                          }}
                          className={cn(
                            "rounded-2xl border px-4 py-4 text-start transition-all duration-300",
                            isCurrent
                              ? "border-[--accent-border] bg-[--accent-bg]"
                              : "border-[--border-subtle] bg-[--bg-subtle] hover:border-[--border-default] hover:bg-[--bg-card-hover]"
                          )}
                        >
                          <span className="mb-2 block font-[family-name:var(--font-syne)] text-[10px] font-semibold uppercase tracking-[0.16em] text-[--accent-muted]">
                            {item.label}
                          </span>
                          <span className="block text-sm font-medium text-[--text-primary]">
                            {item.title}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div aria-hidden="true" className="pointer-events-none mt-8 flex flex-col">
            {items.map((item, index) => (
              <div
                key={item.id}
                ref={(node) => {
                  markerRefs.current[index] = node
                }}
                className={cn(
                  "min-h-28 md:min-h-[18rem]",
                  index === items.length - 1 && "min-h-20 md:min-h-[12rem]"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
