"use client";

import { SaleByCategoryReportRow } from "@/app/api/report/sale-by-category/sale-by-category";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { ResponseType } from "@/lib/types";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ReportListProps {
  data: ResponseType<SaleByCategoryReportRow[]> | undefined;
  type: "sale-by-category" | "other-report-type";
  viewValue: "revenue" | "qty" | "profit";
}

interface ChartDataItem {
  name: string;
  value: number;
  fullName: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataItem;
    value: number;
  }>;
  viewMode: "revenue" | "qty" | "profit";
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

function getColorByRank(index: number, total: number): string {
  // Calculate intensity from light (0.3) to dark (1.0)
  const intensity = 0.45 + (0.7 * (total - index - 1)) / (total - 1);

  // Generate blue color with varying intensity
  const baseColor = [8, 145, 178]; // RGB for #0891B2
  // const baseColor = [88, 182, 155]; // RGB for #58b69b
  const [r, g, b] = baseColor.map((c) => Math.round(c * intensity));

  return `rgb(${r}, ${g}, ${b})`;
}

export function ReportChart({ data, type, viewValue }: ReportListProps) {
  const { formatWithSymbol } = useCurrencyFormat();

  const reportData = useMemo(() => {
    return data?.result?.filter((f) => f.type === "detail");
  }, [data]);

  const chartData = useMemo(() => {
    if (!reportData || reportData.length === 0) return [];

    // Group by product name and sum values based on view mode
    const grouped = reportData.reduce((acc, item) => {
      const productName = item.name || "Unknown Product";
      let value = item.revenue;

      if (viewValue === "qty") {
        value = item.totalQty;
      }

      if (viewValue === "profit") {
        value = item.profit;
      }

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

    const limit = 30;

    const cutoff =
      result.length >= limit
        ? result.at(limit - 1)
        : result.at(result.length - 1);

    const topNWithTies = result.filter(
      (num) => num.value >= Number(cutoff?.value)
    );

    return topNWithTies;
  }, [reportData, viewValue]);

  if (type === "sale-by-category") {
    return (
      <Card className="w-full">
        <CardContent>
          <div
            className={"w-full"}
            style={{
              height: 700,
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
                    viewValue === "revenue" || viewValue === "profit"
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
                <Tooltip content={<CustomTooltip viewMode={viewValue} />} />
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
                      return viewValue === "revenue" || viewValue === "profit"
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
              ? `Showing top 20 products by ${viewValue}`
              : `Showing ${chartData.length} products by ${viewValue}`}
          </div>
        </CardContent>
      </Card>
    );
  }

  return <div></div>;
}
