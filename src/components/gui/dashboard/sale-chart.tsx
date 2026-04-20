import moment from "@/lib/moment";
import {
  AreaChart,
  Line,
  Area,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { MetricsItem } from "./types";
import { DateRange } from "react-day-picker";
import { TrendingUp } from "lucide-react";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

interface Props {
  data: MetricsItem[];
  previousData?: MetricsItem[];
  isLoading: boolean;
  dateRange: DateRange | undefined;
  showComparison?: boolean;
  onToggleComparison?: (show: boolean) => void;
}

// Helper function to generate date range
function generateDateRange(startDate: moment.Moment, endDate: moment.Moment) {
  const dates = [];
  const currentDate = startDate.clone();

  while (currentDate.isSameOrBefore(endDate)) {
    dates.push(currentDate.format("YYYY-MM-DD"));
    currentDate.add(1, "day");
  }

  return dates;
}

export function SaleChart(props: Props) {
  const {
    data,
    previousData = [],
    isLoading,
    dateRange,
    showComparison = false,
    onToggleComparison,
  } = props;

  const { getSymbol, formatForChart } = useCurrencyFormat();

  // Debug info
  console.log("SaleChart Debug:", {
    hasCallback: !!onToggleComparison,
    previousDataLength: previousData.length,
    showComparison,
  });

  // Calculate duration from dateRange
  const duration =
    dateRange?.from && dateRange?.to
      ? moment(dateRange.to).diff(moment(dateRange.from), "days") + 1
      : 0;

  if (isLoading || !dateRange?.from || !dateRange?.to) {
    return (
      <div className="h-[340px] min-h-[340px] max-h-[340px] flex flex-col">
        <div className="mb-2">
          <span className="font-semibold text-cyan-700 dark:text-cyan-300 text-lg">
            Sale Performance
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
          <div className="animate-pulse text-gray-500 dark:text-gray-400">
            {isLoading ? "Loading chart data..." : "No data available"}
          </div>
        </div>
      </div>
    );
  }

  const startDate = moment(dateRange.from);
  const endDate = moment(dateRange.to);

  // Generate all dates in the range
  const allDates = generateDateRange(startDate, endDate);

  // Group current period data by date and sum sales for each day
  const dailySales = data.reduce((acc: Record<string, number>, item) => {
    const dateKey = moment(item.date).format("YYYY-MM-DD");
    if (!acc[dateKey]) {
      acc[dateKey] = 0;
    }
    acc[dateKey] += Number(item.sale || 0);
    return acc;
  }, {});

  // Group previous period data if comparison is enabled
  const previousDailySales = showComparison
    ? previousData.reduce((acc: Record<string, number>, item) => {
        const dateKey = moment(item.date).format("YYYY-MM-DD");
        if (!acc[dateKey]) {
          acc[dateKey] = 0;
        }
        acc[dateKey] += Number(item.sale || 0);
        return acc;
      }, {})
    : {};

  // Generate previous period dates for comparison
  const previousStartDate = showComparison
    ? startDate.clone().subtract(duration, "days")
    : null;
  const previousEndDate = showComparison
    ? endDate.clone().subtract(duration, "days")
    : null;
  const previousDates =
    showComparison && previousStartDate && previousEndDate
      ? generateDateRange(previousStartDate, previousEndDate)
      : [];

  // Create chart data with all dates in range (including dates with no sales)
  const chartData = allDates.map((dateKey, index) => {
    const chartItem: {
      day: string;
      currentSales: number;
      previousSales?: number;
      sales: number;
    } = {
      day: moment(dateKey).format("MMM-DD"),
      currentSales: dailySales[dateKey] || 0,
      sales: dailySales[dateKey] || 0, // Keep backward compatibility
    };

    // Add previous period data if comparison is enabled
    if (showComparison && previousDates[index]) {
      chartItem.previousSales = previousDailySales[previousDates[index]] || 0;
    }

    return chartItem;
  });

  return (
    <div className="h-[340px] min-h-[340px] max-h-[340px] flex flex-col">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <span className="font-semibold text-cyan-700 dark:text-cyan-300 text-lg">
            Sale Performance
          </span>
          <span className="ml-2 text-gray-500 dark:text-gray-400 text-xs">
            Past {duration} days performance
            {showComparison && (
              <span className="block text-xs text-gray-400 mt-1">
                <span className="inline-block w-3 h-0.5 bg-cyan-500 mr-1"></span>
                Current Period
                <span className="inline-block w-3 h-0.5 bg-gray-500 border-dashed ml-3 mr-1"></span>
                Previous Period
              </span>
            )}
          </span>
        </div>
        <button
          onClick={() =>
            onToggleComparison && onToggleComparison(!showComparison)
          }
          className={`h-8 w-8 rounded border-2 flex items-center justify-center transition-colors ${
            showComparison
              ? "bg-cyan-600 border-cyan-600 text-white hover:bg-cyan-700"
              : "bg-white border-gray-300 text-gray-600 hover:border-cyan-600 hover:text-cyan-600"
          }`}
          title={showComparison ? "Hide comparison" : "Show comparison"}
        >
          <TrendingUp className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
          >
            <defs>
              <linearGradient
                id="colorCurrentSales"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient
                id="colorPreviousSales"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#64748b" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#64748b" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={8}
              axisLine={false}
              interval={
                chartData.length > 10 ? Math.ceil(chartData.length / 7) : 0
              }
              minTickGap={10}
              tick={(props) => {
                const { x, y, payload } = props;
                return (
                  <text
                    x={x}
                    y={y + 10}
                    textAnchor={chartData.length > 7 ? "end" : "middle"}
                    fontSize={11}
                    transform={
                      chartData.length > 7
                        ? `rotate(-35,${x},${y + 10})`
                        : undefined
                    }
                    fill="#64748b"
                  >
                    {payload.value}
                  </text>
                );
              }}
            />
            <YAxis
              tickFormatter={(value) => `${getSymbol()}${value}`}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <Tooltip
              cursor={false}
              contentStyle={{
                borderRadius: 8,
                background: "#fff",
                color: "#0e7490",
                fontWeight: 600,
              }}
              formatter={(value, name) => [
                formatForChart(Array.isArray(value) ? value[0] : value),
                name === "currentSales"
                  ? "Current Period"
                  : name === "previousSales"
                  ? "Previous Period"
                  : "Sales",
              ]}
            />
            {/* Current Period Area */}
            <Area
              type="monotone"
              dataKey="currentSales"
              stroke="#06b6d4"
              fillOpacity={1}
              fill="url(#colorCurrentSales)"
              strokeWidth={3}
              dot={{ r: 2, stroke: "#06b6d4", strokeWidth: 2, fill: "#fff" }}
              activeDot={{
                r: 5,
                fill: "#06b6d4",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />

            {/* Previous Period Area - only show if comparison is enabled */}
            {showComparison && (
              <Area
                type="monotone"
                dataKey="previousSales"
                stroke="#64748b"
                fillOpacity={0.6}
                fill="url(#colorPreviousSales)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{
                  r: 1.5,
                  stroke: "#64748b",
                  strokeWidth: 2,
                  fill: "#fff",
                }}
                activeDot={{
                  r: 4,
                  fill: "#64748b",
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
            )}

            {/* Current Period Line */}
            <Line
              type="monotone"
              dataKey="currentSales"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />

            {/* Previous Period Line - only show if comparison is enabled */}
            {showComparison && (
              <Line
                type="monotone"
                dataKey="previousSales"
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={true}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
