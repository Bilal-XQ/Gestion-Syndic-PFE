export default function OwnersLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 animate-pulse rounded-[8px] bg-[--bg-card]" />
        <div className="h-10 w-36 animate-pulse rounded-[10px] bg-[--bg-card]" />
      </div>
      <div className="h-96 animate-pulse rounded-[20px] border border-[--border-subtle] bg-[--bg-card]" />
    </div>
  );
}
