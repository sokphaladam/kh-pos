import { useState, useEffect, useMemo } from "react";
import { SaleChart } from "./sale-chart";
import { DateRange } from "react-day-picker";
import { endOfMonth, startOfMonth } from "date-fns";
import { Metrics } from "./metrics";
import { DateRangePicker } from "@/components/date-range-picker";
// import { RecentTrasaction } from "./recent-transaction";
// import { BackLog } from "./back-log";
import { cn } from "@/lib/utils";
import { useQueryReportMetrics } from "@/app/hooks/user-query-report";
import moment from "@/lib/moment";
import { MetricsItem } from "./types";
import { HotHour } from "./hot-hour";
import { BestSellCategory } from "./best-sell-category";

export function DashboardLayout() {
  // Initialize date state as undefined to prevent hydration mismatch
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  // Set default date range after component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
    setDate({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    });
  }, []);

  // Prepare date filters for API calls
  const dateFilters = useMemo(() => {
    if (!date?.from || !date?.to) {
      return null;
    }

    const fromDate = moment(date.from);
    const toDate = moment(date.to);
    const duration = toDate.diff(fromDate, "day") + 1;

    const lastStart = fromDate.clone().subtract(duration, "days");
    const lastEnd = fromDate.clone().subtract(1, "days");

    return {
      current: {
        startDate: fromDate.format("YYYY-MM-DD") + " 00:00:00",
        endDate: toDate.format("YYYY-MM-DD") + " 23:59:59",
      },
      previous: {
        startDate: lastStart.format("YYYY-MM-DD") + " 00:00:00",
        endDate: lastEnd.format("YYYY-MM-DD") + " 23:59:59",
      },
      duration,
    };
  }, [date]);

  // Fetch current period data
  const currentMetricsQuery = useQueryReportMetrics(
    dateFilters?.current || { startDate: "", endDate: "" }
  );

  // Fetch previous period data for comparison
  const previousMetricsQuery = useQueryReportMetrics(
    dateFilters?.previous || { startDate: "", endDate: "" }
  );

  const isLoading =
    !isClient ||
    currentMetricsQuery.isLoading ||
    previousMetricsQuery.isLoading ||
    !dateFilters;

  // Show loading state until client-side hydration completes
  if (!isClient) {
    return (
      <main
        className={cn(
          "min-h-screen flex-1 bg-gradient-to-br from-gray-50 to-slate-100 dark:from-[#18181b] dark:to-[#23272f]",
          "p-0 md:p-0"
        )}
        suppressHydrationWarning
      >
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
                className={cn(
                  "bg-white dark:bg-[#18181b] rounded-xl shadow-lg p-6",
                  i === 2 ? "md:col-span-2" : ""
                )}
              >
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      className={cn(
        "min-h-screen flex-1 bg-gradient-to-br from-gray-50 to-slate-100 dark:from-[#18181b] dark:to-[#23272f]",
        "p-0 md:p-0"
      )}
      suppressHydrationWarning
    >
      <section className="w-full max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center flex-wrap md:justify-between gap-4 mb-6 border-b pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <div className="flex items-center gap-4 flex-wrap">
            <DateRangePicker dateRange={date} onChange={setDate} />
          </div>
        </div>
        <Metrics
          currentData={
            (currentMetricsQuery.data?.result as MetricsItem[]) || []
          }
          previousData={
            (previousMetricsQuery.data?.result as MetricsItem[]) || []
          }
          isLoading={isLoading}
        />
        <div className="w-full flex-1 h-full mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-[#18181b] rounded-xl shadow-lg p-6 transition hover:shadow-2xl">
              <SaleChart
                data={(currentMetricsQuery.data?.result as MetricsItem[]) || []}
                previousData={
                  (previousMetricsQuery.data?.result as MetricsItem[]) || []
                }
                isLoading={isLoading}
                dateRange={date}
                showComparison={showComparison}
                onToggleComparison={setShowComparison}
              />
            </div>
            <div className="bg-white dark:bg-[#18181b] rounded-xl shadow-lg p-6 transition hover:shadow-2xl">
              <BestSellCategory dateRange={date} />
            </div>
            <div className="md:col-span-2 bg-white dark:bg-[#18181b] rounded-xl shadow-lg p-6 mt-4 transition hover:shadow-2xl">
              <HotHour dateRange={date} />
            </div>
            {/* <div className="md:col-span-2">
              <SaleProduct
                dateRange={date}
                showTop={10}
                height={450}
                showHeader={true}
              />
            </div> */}
          </div>
        </div>
      </section>
    </main>
  );
}
