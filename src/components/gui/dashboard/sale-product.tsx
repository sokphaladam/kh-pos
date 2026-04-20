import { useQueryReportSaleBreakdownByCategory } from "@/app/hooks/report/use-query-sale-breakdown-bycategory-report";
import { useAuthentication } from "contexts/authentication-context";
import moment from "moment-timezone";
import { useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ReportHeader } from "@/components/report";
import { ShoppingBag } from "lucide-react";

interface Props {
  dateRange: DateRange | undefined;
  setDateRange?: (dateRange: DateRange | undefined) => void;
  showTop?: number;
  height?: number;
  showHeader?: boolean;
}

interface ChartDataItem {
  name: string;
  value: number;
  fullName: string;
}

type ViewMode = "revenue" | "qty";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataItem;
    value: number;
  }>;
  viewMode: ViewMode;
}

function CustomTooltip({ active, payload, viewMode }: CustomTooltipProps) {
  const { formatWithSymbol } = useCurrencyFormat();

  if (active && payload && payload.length) {
    const data = payload[0].payload as ChartDataItem;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-1">{data.fullName}</p>
        <p className="text-blue-600 font-semibold">
          {viewMode === "revenue"
            ? formatWithSymbol(data.value)
            : `${data.value.toLocaleString()}`}
        </p>
      </div>
    );
  }
  return null;
}

// Function to generate color based on value rank (light to dark)
function getColorByRank(index: number, total: number): string {
  // Calculate intensity from light (0.3) to dark (1.0)
  const intensity = 0.45 + (0.7 * (total - index - 1)) / (total - 1);

  // Generate blue color with varying intensity
  const baseColor = [8, 145, 178]; // RGB for #0891B2
  // const baseColor = [88, 182, 155]; // RGB for #58b69b
  const [r, g, b] = baseColor.map((c) => Math.round(c * intensity));

  return `rgb(${r}, ${g}, ${b})`;
}

export function SaleProduct(props: Props) {
  const { currentWarehouse } = useAuthentication();
  const [groupByProduct] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("revenue");
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

  const { data, isLoading, mutate } =
    useQueryReportSaleBreakdownByCategory(filterParams);

  const reportDate = useMemo(() => {
    return data?.result?.filter((f) => f.type === "detail");
  }, [data]);

  const chartData = useMemo(() => {
    if (!reportDate || reportDate.length === 0) return [];

    // Group by product name and sum values based on view mode
    const grouped = reportDate.reduce((acc, item) => {
      const productName = item.name || "Unknown Product";
      const value =
        viewMode === "revenue"
          ? Number(item.revenue) || 0
          : Number(item.totalQty) || 0;

      if (!acc[productName]) {
        acc[productName] = {
          name: productName.split("-")[0].trim(),
          fullName: productName,
          value: 0,
        };
      }
      acc[productName].value += value;
      return acc;
    }, {} as Record<string, ChartDataItem>);

    // Convert to array and sort by value (descending)
    const result = Object.values(grouped)
      .filter((item) => item.value > 0) // Only include items with positive values
      .sort((a, b) => b.value - a.value);

    const limit = props.showTop || 30;

    const cutoff =
      result.length >= limit
        ? result.at(limit - 1)
        : result.at(result.length - 1);

    const topNWithTies = result.filter(
      (num) => num.value >= Number(cutoff?.value)
    );

    return topNWithTies;
  }, [reportDate, viewMode, props]);

  const totalSales = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  const formatDateRange = useMemo(() => {
    if (!props.dateRange?.from && !props.dateRange?.to) {
      return "All Time";
    }
    const start = props.dateRange?.from
      ? moment(props.dateRange.from).format("MMM D, YYYY")
      : "";
    const end = props.dateRange?.to
      ? moment(props.dateRange.to).format("MMM D, YYYY")
      : "";

    if (start && end) {
      return `${start} - ${end}`;
    }
    return start || end;
  }, [props.dateRange]);

  return (
    <>
      <ReportHeader
        title="Sale Product Report"
        description="Detailed report of product sales over a selected date range."
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
        dateRange={props.dateRange || { from: undefined, to: undefined }}
        onDateRangeChange={props.setDateRange || (() => {})}
        icon={ShoppingBag}
        onRefresh={() => mutate()}
        isLoading={isLoading}
        hasData={chartData.length > 0}
      />
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {props.showHeader === true ? (
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Best Selling Products
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">{formatDateRange}</p>
              </div>
            ) : (
              <div></div>
            )}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">View:</label>
                <Select
                  value={viewMode}
                  onValueChange={(value: ViewMode) => setViewMode(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="qty">Quantity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm font-medium">
                Total {viewMode === "revenue" ? "Sales" : "Quantity"}:{" "}
                <span className="text-green-600 font-semibold">
                  {viewMode === "revenue"
                    ? formatWithSymbol(totalSales)
                    : `${totalSales.toLocaleString()} units`}
                </span>
              </p>
            </div>
          </div>
          {chartData.length === 0 && (
            <p className="text-xs text-amber-600 mt-2">
              Showing sample data - no real sales data found
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div
            className={cn("w-full")}
            style={{
              height: props.height ? props.height : 700,
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                accessibilityLayer
                layout="vertical"
                data={chartData}
                barCategoryGap="30%"
                margin={{
                  top: 20,
                  right: 75,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                  dataKey={"value"}
                  tickFormatter={(value: number) =>
                    viewMode === "revenue"
                      ? formatWithSymbol(value)
                      : value.toLocaleString()
                  }
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  width={140}
                  interval={0}
                />
                <Tooltip content={<CustomTooltip viewMode={viewMode} />} />
                <Bar dataKey="value" layout="vertical" radius={5} barSize={45}>
                  {chartData.map((_, index) => {
                    const idx = chartData.findIndex((f) => f.value === _.value);
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={getColorByRank(
                          chartData.length - idx,
                          chartData.length
                        )}
                      />
                    );
                  })}
                  <LabelList
                    dataKey="value"
                    position="right"
                    offset={8}
                    className="fill-black"
                    fontSize={10}
                    formatter={(f: number) => {
                      return viewMode === "revenue"
                        ? formatWithSymbol(f)
                        : `${f.toLocaleString()}`;
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-xs text-gray-500 text-center">
            {chartData.length === 20
              ? `Showing top 20 products by ${viewMode}`
              : `Showing ${chartData.length} products by ${viewMode}`}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
