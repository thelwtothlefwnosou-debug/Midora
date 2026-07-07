export default function DashboardLoading() {
  return (
    <div className="min-h-screen animate-pulse bg-cream">
      <div className="h-14 border-b border-border bg-white" />

      <div className="mx-auto flex w-full max-w-[min(100%,1480px)]">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-white p-4 lg:block">
          <div className="h-16 rounded-xl bg-sand/70" />
          <div className="mt-6 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-sand/50" />
            ))}
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-3 py-5 sm:px-5 lg:py-8">
          <div className="mb-6 space-y-2">
            <div className="h-8 w-48 rounded-lg bg-sand/70" />
            <div className="h-4 w-72 max-w-full rounded bg-sand/50" />
          </div>
          <div className="space-y-4">
            <div className="h-36 rounded-2xl bg-sand/60" />
            <div className="h-36 rounded-2xl bg-sand/60" />
            <div className="h-24 rounded-2xl bg-sand/50" />
          </div>
        </main>
      </div>
    </div>
  );
}
