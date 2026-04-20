"use client";

import { useQueryReportSaleBreakdownByCategory } from "@/app/hooks/report/use-query-sale-breakdown-bycategory-report";
import { useAuthentication } from "contexts/authentication-context";
import moment from "moment-timezone";
import { useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { TrendingUp, Package } from "lucide-react";

interface Props {
  dateRange: DateRange | undefined;
}

interface ChartDataItem {
  name: string;
  value: number;
  percentage: number;
  totalQty: number;
  revenue: number;
  color: string;
}

// Predefined color palette for consistent theming
const COLORS = [
  "#06b6d4", // cyan-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#f97316", // orange-500
  "#14b8a6", // teal-500
  "#6366f1", // indigo-500
  "#84cc16", // lime-500
  "#ec4899", // pink-500
];

export function BestSellCategory(props: Props) {
  const { currentWarehouse } = useAuthentication();
  const [groupByProduct] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<"revenue" | "totalQty">(
    "revenue"
  );
  const { formatWithSymbol } = useCurrencyFormat();

  const filterParams = useMemo(() => {
    return {
      startDate: props.dateRange?.from
        ? moment(props.dateRange.from).format("YYYY-MM-DD")
        : "",
      endDate: props.dateRange?.to
        ? moment(props.dateRange.to).format("YYYY-MM-DD")
        : "",
      warehouseId: currentWarehouse?.id || "",
      groupBy: groupByProduct ? ("product" as const) : ("time" as const),
    };
  }, [props.dateRange, currentWarehouse, groupByProduct]);

  const { data, isLoading } =
    useQueryReportSaleBreakdownByCategory(filterParams);

  const reportData = useMemo(() => {
    const result = data?.result
      ?.filter((f) => f.type === "category")
      .sort((a, b) => {
        //  (a.profit < b.profit ? 1 : -1)
        if (selectedMetric === "revenue") {
          return a.revenue < b.revenue ? 1 : -1;
        } else {
          return a.totalQty < b.totalQty ? 1 : -1;
        }
      });

    const cutOff =
      (result?.length || 0) >= 7
        ? result?.at(6)
        : result?.at(result.length - 1);

    const top7WithTies = result?.filter((f) => {
      if (selectedMetric === "revenue") {
        return f.revenue >= (cutOff?.revenue || 0);
      } else {
        return f.totalQty >= (cutOff?.totalQty || 0);
      }
    });

    return top7WithTies || [];
  }, [data?.result, selectedMetric]);

  // Transform data for pie chart based on selected metric
  const chartData: ChartDataItem[] = useMemo(() => {
    if (!reportData.length) return [];

    // Sort by selected metric
    const sortedData = [...reportData].sort((a, b) => {
      const aValue = selectedMetric === "revenue" ? a.revenue : a.totalQty;
      const bValue = selectedMetric === "revenue" ? b.revenue : b.totalQty;
      return bValue - aValue; // Descending order
    });

    const totalMetricValue = sortedData.reduce(
      (sum, item) =>
        sum + (selectedMetric === "revenue" ? item.revenue : item.totalQty),
      0
    );

    return sortedData.slice(0, 8).map((item, index) => {
      const metricValue =
        selectedMetric === "revenue" ? item.revenue : item.totalQty;
      return {
        name: item.name || "Unknown Category",
        value: metricValue,
        percentage:
          totalMetricValue > 0 ? (metricValue / totalMetricValue) * 100 : 0,
        totalQty: item.totalQty,
        revenue: item.revenue,
        color: COLORS[index % COLORS.length],
      };
    });
  }, [reportData, selectedMetric]);

  // Custom tooltip component
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataItem;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {data.name}
          </p>
          {/* Highlight selected metric */}
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            <span className="capitalize font-semibold">
              {selectedMetric === "revenue" ? "Revenue" : "Total Qty"}:
            </span>{" "}
            <span className="font-medium text-cyan-600 text-base">
              {selectedMetric === "revenue"
                ? formatWithSymbol(data.revenue)
                : data.totalQty.toLocaleString()}
            </span>
          </p>
          {/* Show other metric as secondary */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {selectedMetric === "revenue" ? "Total Qty" : "Revenue"}:{" "}
            <span className="font-medium">
              {selectedMetric === "revenue"
                ? data.totalQty.toLocaleString()
                : formatWithSymbol(data.revenue)}
            </span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Share:{" "}
            <span className="font-medium">{data.percentage.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading || !props.dateRange?.from || !props.dateRange?.to) {
    return (
      <div className="h-[300px] sm:h-[340px] lg:h-[380px] xl:h-[400px] min-h-[280px] max-h-[450px] flex flex-col w-full">
        <div className="mb-4">
          <span className="font-semibold text-cyan-700 dark:text-cyan-300 text-base sm:text-lg">
            Best Selling Categories
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
          <div className="animate-pulse text-gray-500 dark:text-gray-400 text-sm">
            {isLoading ? "Loading category data..." : "No date range selected"}
          </div>
        </div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="h-[300px] sm:h-[340px] lg:h-[380px] xl:h-[400px] min-h-[280px] max-h-[450px] flex flex-col w-full">
        <div className="mb-4">
          <span className="font-semibold text-cyan-700 dark:text-cyan-300 text-base sm:text-lg">
            Best Selling Categories
          </span>
          <span className="ml-2 text-gray-500 dark:text-gray-400 text-xs">
            No sales data available
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
          <div className="text-center">
            <Package className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No category sales found
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Try adjusting your date range
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[300px] sm:h-[340px] lg:h-[380px] xl:h-[400px] min-h-[280px] max-h-[450px] flex flex-col w-full">
      {/* Header */}
      <div className="mb-2 sm:mb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-cyan-700 dark:text-cyan-300 text-base sm:text-lg">
              Best Selling Categories
            </span>
            <span className="ml-1 sm:ml-2 text-gray-500 dark:text-gray-400 text-xs block sm:inline">
              Top {chartData.length} categories by{" "}
              {selectedMetric === "revenue" ? "Revenue" : "Quantity"}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Metric Selector */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded p-1">
              <button
                onClick={() => setSelectedMetric("revenue")}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedMetric === "revenue"
                    ? "bg-cyan-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-cyan-600"
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setSelectedMetric("totalQty")}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedMetric === "totalQty"
                    ? "bg-cyan-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-cyan-600"
                }`}
              >
                Quantity
              </button>
            </div>
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" />
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 flex flex-col sm:flex-row min-h-0">
        {/* Donut Chart */}
        <div className="flex-1 relative min-h-[200px] sm:min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={"90%"}
                innerRadius={"64%"}
                fill="#8884d8"
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend - responsive layout */}
        <div className="w-full sm:w-32 lg:w-36 xl:w-40 sm:pl-2 mt-2 sm:mt-0 overflow-y-auto max-h-32 sm:max-h-full">
          <div className="grid grid-cols-2 sm:block gap-1 sm:gap-0 sm:space-y-1">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center text-xs">
                <div
                  className="w-3 h-3 rounded-sm mr-2 flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="truncate min-w-0">
                  <p className="font-medium text-gray-800 dark:text-gray-200 truncate text-xs sm:text-xs">
                    {item.name.split(":")[1]?.trim() || item.name}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">
                    {item.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
