import { ChargesTable } from "@/components/features/charges/charges-table";

export default function ChargesPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">
        Charges
      </h1>
      <ChargesTable />
    </div>
  );
}
