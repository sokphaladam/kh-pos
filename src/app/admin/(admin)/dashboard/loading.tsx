export default function Loading() {
  return (
    <div className="min-h-screen flex-1 dark:from-[#18181b] dark:to-[#23272f] p-0 md:p-0">
      <section className="w-full max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center flex-wrap md:justify-between gap-4 mb-6 border-b pb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="h-10 bg-muted rounded animate-pulse w-64"></div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-card dark:bg-[#18181b] rounded-xl shadow-lg p-6"
            >
              <div className="h-20 bg-muted rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`bg-card dark:bg-[#18181b] rounded-xl shadow-lg p-6 ${
 i === 2 ? "md:col-span-2" : ""
 }`}
            >
              <div className="h-64 bg-muted rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
