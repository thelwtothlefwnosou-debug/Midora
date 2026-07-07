export function RecentlyAddedSkeleton() {
  return (
    <section className="home-section home-bg-sand border-t border-border">
      <div className="mx-auto max-w-7xl animate-pulse px-4 sm:px-6">
        <div className="mb-8 space-y-3 sm:mb-10">
          <div className="h-8 w-56 rounded-lg bg-sand/80" />
          <div className="h-4 w-72 max-w-full rounded bg-sand/60" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="home-card overflow-hidden">
              <div className="aspect-[4/3] bg-sand/70" />
              <div className="space-y-3 p-4">
                <div className="h-5 w-3/4 rounded bg-sand/80" />
                <div className="h-4 w-1/2 rounded bg-sand/60" />
                <div className="h-6 w-1/3 rounded bg-sand/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
