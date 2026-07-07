export function SearchResultsSkeleton() {
  return (
    <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <div className="border-b border-border px-4 py-3 sm:px-5">
        <div className="h-6 w-64 max-w-full animate-pulse rounded-lg bg-sand/70" />
        <div className="mt-2 h-4 w-48 animate-pulse rounded bg-sand/50" />
      </div>
      <div className="hidden min-h-0 flex-1 lg:flex">
        <div className="w-[54%] overflow-hidden border-r border-border p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[16/10] rounded-xl bg-sand/60" />
                <div className="mt-3 h-4 w-3/4 rounded bg-sand/50" />
                <div className="mt-2 h-3 w-1/2 rounded bg-sand/40" />
                <div className="mt-2 h-4 w-1/3 rounded bg-sand/50" />
              </div>
            ))}
          </div>
        </div>
        <div className="relative w-[46%] bg-sand/30">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#e8e8e8]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
            <span className="text-sm text-muted">Φόρτωση χάρτη...</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 lg:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[16/10] rounded-xl bg-sand/60" />
            <div className="mt-3 h-4 w-3/4 rounded bg-sand/50" />
            <div className="mt-2 h-3 w-1/2 rounded bg-sand/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
