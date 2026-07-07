export function ListingsPageSkeleton() {
  return (
    <main className="bg-white pt-[4.25rem] lg:flex lg:h-[100dvh] lg:flex-col">
      <div className="w-full shrink-0 border-b border-border bg-white px-4 py-2 sm:px-5">
        <div className="mb-2 h-9 w-56 max-w-full animate-pulse rounded-full bg-sand/60" />
        <div className="h-10 animate-pulse rounded-full bg-sand/60" />
      </div>

      <div className="border-b border-border bg-white px-4 py-2.5 sm:px-5">
        <div className="h-5 w-40 animate-pulse rounded bg-sand/60" />
        <div className="mt-1.5 h-4 w-28 animate-pulse rounded bg-sand/50" />
      </div>

      <div className="flex min-h-[50vh] flex-1 animate-pulse lg:min-h-0">
        <div className="w-full space-y-5 p-4 lg:w-[min(100%,58%)] lg:border-r lg:border-border lg:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2.5">
                <div className="aspect-[4/3] rounded-xl bg-sand/60" />
                <div className="h-4 w-4/5 rounded bg-sand/60" />
                <div className="h-3 w-1/2 rounded bg-sand/50" />
                <div className="h-4 w-1/3 rounded bg-sand/60" />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden min-h-[320px] flex-1 bg-sand/40 lg:block" />
      </div>
    </main>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse bg-cream pt-24 pb-16">
      <div className="mx-auto max-w-6xl space-y-6 px-6">
        <div className="h-10 w-48 rounded-lg bg-sand" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-sand/70" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-sand/60" />
      </div>
    </div>
  );
}

export function ListingDetailSkeleton() {
  return (
    <div className="animate-pulse bg-cream pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-6 h-4 w-32 rounded bg-sand" />
        <div className="aspect-[16/10] rounded-2xl bg-sand" />
        <div className="mt-8 grid gap-10 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="h-10 w-2/3 rounded-lg bg-sand" />
            <div className="h-4 w-1/3 rounded bg-sand/80" />
            <div className="h-32 rounded-2xl bg-sand/60" />
          </div>
          <div className="h-64 rounded-2xl bg-sand" />
        </div>
      </div>
    </div>
  );
}
