"use client";
import { useQuerySaleByWarehouse } from "@/app/hooks/report/use-query-sale-by-warehouse";
import { DateRangePicker } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import { endOfMonth, startOfMonth } from "date-fns";
import { useState, useEffect, useMemo } from "react";
import moment from "moment-timezone";

interface WarehouseData {
  total_amount: string;
  warehouse_id: string;
  warehouse: {
    id: string;
    name: string;
    isMain: boolean;
    phone?: string;
    address?: string;
  };
}

interface IntegrationGroup {
  name: string;
  data: WarehouseData[];
}

interface SaleByWarehouseResult {
  local: WarehouseData[];
  integration: IntegrationGroup[];
}

function WarehouseCard({ item }: { item: WarehouseData }) {
  return (
    <div className="bg-white dark:bg-[#18181b] rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 sm:p-5 flex flex-col gap-3 border border-gray-100 dark:border-gray-800">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
            {item.warehouse.name}
          </p>
          {item.warehouse.isMain && (
            <span className="inline-block mt-1 ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200">
              Main
            </span>
          )}
        </div>
        <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950">
          <svg
            className="w-5 h-5 text-indigo-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </div>
      </div>
      <div>
        <p className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {item.total_amount}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Total Sales</p>
      </div>
      {item.warehouse.address && (
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
          {item.warehouse.address}
        </p>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#18181b] rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-800 animate-pulse">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-1" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
    </div>
  );
}

export default function BoardMemberDashboardPage() {
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setDate({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    });
  }, []);

  const dateFilters = useMemo(() => {
    if (!date?.from || !date?.to) return { startDate: "", endDate: "" };
    return {
      startDate: moment(date.from).format("YYYY-MM-DD"),
      endDate: `${moment(date.to).format("YYYY-MM-DD")} 23:59:59`,
    };
  }, [date]);

  const { data, isLoading } = useQuerySaleByWarehouse(dateFilters);

  const result = data?.result as SaleByWarehouseResult | undefined;

  const localItems = useMemo<WarehouseData[]>(() => {
    const local = result?.local ?? [];
    const group = result?.integration ?? [];

    return [...local, ...group.flatMap((g) => g.data)];
  }, [result]);

  const isReady = isClient && !isLoading && !!date;

  if (!isClient) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-[#18181b] dark:to-[#23272f]">
        <section className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
          <div className="h-8 sm:h-10 bg-gray-200 dark:bg-gray-700 rounded w-48 sm:w-64 animate-pulse mb-4 sm:mb-8" />
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-[#18181b] dark:to-[#23272f]">
      <section className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 mb-4 sm:mb-6 border-b pb-4 sm:pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Sales by Warehouse
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Overview of total sales across all warehouses
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <DateRangePicker dateRange={date} onChange={setDate} />
          </div>
        </div>

        {/* Local Warehouses */}
        <div className="mb-4 sm:mb-8">
          {!isReady ? (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(2)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : localItems.length === 0 ? (
            <div className="text-sm text-gray-400 dark:text-gray-500 italic px-2">
              No data for this period.
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {localItems.map((item) => (
                <WarehouseCard key={item.warehouse_id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
