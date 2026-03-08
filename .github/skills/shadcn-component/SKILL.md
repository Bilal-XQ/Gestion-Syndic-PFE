# Skill: shadcn/ui Component Scaffolding

**When to use:** Adding a new shadcn/ui component to the project, building a new feature UI panel (slide-over, dialog, table), or creating a composite component that combines multiple shadcn primitives.

Reference this skill by adding to your prompt: `Use the shadcn-component skill in .github/skills/shadcn-component/SKILL.md`

---

## Installing a new shadcn/ui component

This project uses the **Tailwind v4 + React 19 canary** version of shadcn. Always use the CLI — never copy-paste component code manually.

```bash
pnpm dlx shadcn@canary add <component-name>
```

Generated components land in `src/components/ui/`. Never edit files in that directory directly. Extend them by wrapping in a new component in `src/components/features/<domain>/`.

---

## Slide-over panel (Sheet) — add / edit forms

This is the standard pattern for all add and edit operations in the syndic dashboard.

```tsx
// src/components/features/<domain>/<Domain>Panel.tsx
"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  domainSchema,
  type DomainFormValues,
} from "@/lib/validations/<domain>";
import { createDomainAction } from "@/lib/actions/<domain>";
import { toast } from "sonner";

interface DomainPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<DomainFormValues>;
}

export function DomainPanel({
  open,
  onOpenChange,
  defaultValues,
}: DomainPanelProps) {
  const queryClient = useQueryClient();

  const form = useForm<DomainFormValues>({
    resolver: zodResolver(domainSchema),
    defaultValues: defaultValues ?? {},
  });

  async function onSubmit(values: DomainFormValues) {
    const result = await createDomainAction(values);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Saved successfully");
    queryClient.invalidateQueries({ queryKey: ["<domain>"] });
    onOpenChange(false);
    form.reset();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="border-[--border-default] bg-[--bg-elevated] sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle className="text-[--text-primary]">Add Item</SheetTitle>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {/* fields */}
        </form>
      </SheetContent>
    </Sheet>
  );
}
```

Key rules for Sheet panels:

- Background: `bg-[--bg-elevated]`, border: `border-[--border-default]`
- On success: close sheet → invalidate TanStack Query → `form.reset()`
- On error: `toast.error(result.error)` — never throw
- `onOpenChange(false)` is called only on success, not on validation errors

---

## Confirmation dialog (AlertDialog) — destructive actions

All soft-delete confirmations use `AlertDialog`, not `window.confirm`.

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
  <AlertDialogContent className="border-[--border-default] bg-[--bg-elevated]">
    <AlertDialogHeader>
      <AlertDialogTitle className="text-[--text-primary]">
        Are you sure?
      </AlertDialogTitle>
      <AlertDialogDescription className="text-[--text-secondary]">
        This action cannot be undone. The record will be archived.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel className="border-[--border-default] text-[--text-secondary]">
        Cancel
      </AlertDialogCancel>
      <AlertDialogAction
        onClick={handleDelete}
        className="bg-[--status-error] text-white hover:bg-[--status-error]/90"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>;
```

---

## Data table with row actions

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow className="border-[--border-subtle] hover:bg-transparent">
      <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
        Column Name
      </TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {rows.map((row) => (
      <TableRow
        key={row.id}
        className="border-[--border-subtle] transition-colors duration-[150ms]
                   hover:bg-[--bg-card-hover]"
      >
        <TableCell className="text-sm text-[--text-secondary]">
          {row.value}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>;
```

Rules:

- Header text: `text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]`
- Row hover: `hover:bg-[--bg-card-hover]` — no zebra striping
- Financial values: `font-mono` (`Geist Mono`)

---

## Status badge component

Build once, reuse everywhere. Never write inline status badge styles.

```tsx
// src/components/features/shared/StatusBadge.tsx
type Status =
  | "paid"
  | "partial"
  | "unpaid"
  | "occupied"
  | "vacant"
  | "scheduled"
  | "completed"
  | "cancelled"
  | "accepted"
  | "declined"
  | "invited";

const statusConfig: Record<
  Status,
  { label: string; color: string; bg: string }
> = {
  paid: { label: "Paid", color: "#22C55E", bg: "rgba(34,197,94,0.10)" },
  partial: { label: "Partial", color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
  unpaid: { label: "Unpaid", color: "#EF4444", bg: "rgba(239,68,68,0.10)" },
  occupied: { label: "Occupied", color: "#22C55E", bg: "rgba(34,197,94,0.10)" },
  vacant: { label: "Vacant", color: "#888888", bg: "rgba(136,136,136,0.12)" },
  scheduled: {
    label: "Scheduled",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.10)",
  },
  completed: {
    label: "Completed",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.10)",
  },
  cancelled: {
    label: "Cancelled",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.10)",
  },
  accepted: { label: "Accepted", color: "#22C55E", bg: "rgba(34,197,94,0.10)" },
  declined: { label: "Declined", color: "#EF4444", bg: "rgba(239,68,68,0.10)" },
  invited: { label: "Invited", color: "#888888", bg: "rgba(136,136,136,0.12)" },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, color, bg } = statusConfig[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-[10px] py-[2px] text-xs font-medium"
      style={{ color, backgroundColor: bg }}
    >
      {label}
    </span>
  );
}
```

---

## Form field pattern (React Hook Form + shadcn Input)

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div className="space-y-1.5">
  <Label htmlFor="firstName" className="text-xs text-[--text-secondary]">
    First Name
  </Label>
  <Input
    id="firstName"
    {...form.register("firstName")}
    className="border-[--border-default] bg-[--bg-input] text-[--text-primary]
               placeholder:text-[--text-placeholder] focus-visible:ring-white/[0.06]"
    placeholder="Jean"
  />
  {form.formState.errors.firstName && (
    <p className="text-xs text-[--status-error]">
      {form.formState.errors.firstName.message}
    </p>
  )}
</div>;
```

---

## Checklist before submitting a component

- [ ] No `"use client"` unless the component genuinely requires browser APIs or reactive state
- [ ] All colors use CSS token variables — no hard-coded hex
- [ ] Sheet panels close and reset the form on success only
- [ ] Destructive actions are gated by an `AlertDialog`
- [ ] TanStack Query key is invalidated after successful mutation
- [ ] Financial values use `font-mono` class
- [ ] Status badges use the shared `StatusBadge` component
- [ ] No zebra striping in any table
