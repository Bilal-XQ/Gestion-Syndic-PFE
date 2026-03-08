export default function ResetPasswordLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[--bg-base] px-4">
      <div className="w-full max-w-sm">
        {/* Logo placeholder */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="h-10 w-10 animate-pulse rounded-[12px] border border-[--border-default] bg-[--bg-card]" />
          <div className="h-5 w-44 animate-pulse rounded-[8px] bg-[--bg-card]" />
          <div className="h-4 w-56 animate-pulse rounded-[8px] bg-[--bg-card]" />
        </div>

        {/* Card skeleton */}
        <div className="rounded-[16px] border border-[--border-default] bg-[--bg-card] p-6">
          <div className="flex flex-col gap-4">
            {/* Email input */}
            <div className="flex flex-col gap-2">
              <div className="h-4 w-16 animate-pulse rounded-[6px] bg-[--bg-elevated]" />
              <div className="h-10 w-full animate-pulse rounded-[10px] bg-[--bg-elevated]" />
            </div>
            {/* Submit button */}
            <div className="h-10 w-full animate-pulse rounded-[10px] bg-[--bg-elevated]" />
            {/* Back to login link */}
            <div className="mx-auto h-4 w-36 animate-pulse rounded-[6px] bg-[--bg-elevated]" />
          </div>
        </div>
      </div>
    </div>
  );
}
