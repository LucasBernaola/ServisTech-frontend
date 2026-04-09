export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0b0f16] text-white">
      <div className="mx-auto w-full max-w-2xl px-3 py-5 sm:px-4 sm:py-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <div className="h-4 w-36 sm:h-5 sm:w-48 animate-pulse rounded bg-white/10" />
          <div className="mt-3 h-7 w-32 sm:h-8 sm:w-40 animate-pulse rounded bg-white/10" />
          <div className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3">
            <div className="h-16 sm:h-20 animate-pulse rounded-xl bg-white/10" />
            <div className="h-16 sm:h-20 animate-pulse rounded-xl bg-white/10" />
            <div className="h-24 sm:h-28 animate-pulse rounded-xl bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}