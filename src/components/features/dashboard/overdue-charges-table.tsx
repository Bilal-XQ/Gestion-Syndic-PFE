import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { getOverdueCharges } from "@/lib/db/queries/charges"
import { formatDate, formatMAD } from "@/lib/formatters"

type OverdueChargesTableProps = {
  charges: Awaited<ReturnType<typeof getOverdueCharges>>
}

export function OverdueChargesTable({ charges }: OverdueChargesTableProps) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-muted-foreground">
              Propriétaire
            </TableHead>
            <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-muted-foreground">
              Charge
            </TableHead>
            <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-muted-foreground">
              Appartement
            </TableHead>
            <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-muted-foreground">
              Restant
            </TableHead>
            <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-muted-foreground">
              Échéance
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {charges.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center text-muted-foreground"
              >
                Aucune charge en retard
              </TableCell>
            </TableRow>
          ) : (
            charges.map((c) => (
              <TableRow key={c.id} className="transition-colors duration-150">
                <TableCell>
                  {c.ownerFirstName ?? "–"} {c.ownerLastName ?? ""}
                </TableCell>
                <TableCell className="text-muted-foreground">{c.title}</TableCell>
                <TableCell className="text-muted-foreground">{c.unitNumber}</TableCell>
                <TableCell className="font-mono text-destructive">
                  {formatMAD(c.remainingAmount)}
                </TableCell>
                <TableCell className="text-destructive">{formatDate(c.dueDate)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
