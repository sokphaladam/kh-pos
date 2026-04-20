"use client";
import dynamic from "next/dynamic";
import { memo } from "react";

// Dynamically import the dashboard layout with no SSR to prevent hydration issues
const DashboardLayoutDynamic = dynamic(
  () =>
    import("@/components/gui/dashboard/dashboard-layout").then((mod) => ({
      default: mod.DashboardLayout,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex-1 bg-gradient-to-br from-gray-50 to-slate-100 dark:from-[#18181b] dark:to-[#23272f] p-0 md:p-0">
        <section className="w-full max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center flex-wrap md:justify-between gap-4 mb-6 border-b pb-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-64"></div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#18181b] rounded-xl shadow-lg p-6"
              >
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`bg-white dark:bg-[#18181b] rounded-xl shadow-lg p-6 ${
                  i === 2 ? "md:col-span-2" : ""
                }`}
              >
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    ),
  }
);

function DashboardPageClient() {
  return <DashboardLayoutDynamic />;
}

export default memo(DashboardPageClient);
