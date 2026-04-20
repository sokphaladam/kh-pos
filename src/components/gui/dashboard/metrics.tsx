import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  DollarSign,
  LineChart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import moment from "@/lib/moment";
import { MetricsItem } from "./types";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

interface Props {
  currentData: MetricsItem[];
  previousData: MetricsItem[];
  isLoading: boolean;
}

export function Metrics(props: Props) {
  const { currentData, previousData, isLoading } = props;
  const { formatForDisplay } = useCurrencyFormat();

  // Calculate current period totals
  const total = currentData.reduce(
    (acc, item) => ({
      sale: acc.sale + Number(item.sale || 0),
      cost: acc.cost + Number(item.cost || 0),
      profit: acc.profit + Number(item.profit || 0),
    }),
    { sale: 0, cost: 0, profit: 0 }
  );

  // Calculate previous period totals
  const totalPrevious = previousData.reduce(
    (acc, item) => ({
      sale: acc.sale + Number(item.sale || 0),
      cost: acc.cost + Number(item.cost || 0),
      profit: acc.profit + Number(item.profit || 0),
    }),
    { sale: 0, cost: 0, profit: 0 }
  );

  // Calculate profit margins
  const profit_margin =
    total.sale === 0 ? 0 : (total.profit / total.sale) * 100;
  const profit_margin_previous =
    totalPrevious.sale === 0
      ? 0
      : (totalPrevious.profit / totalPrevious.sale) * 100;

  // Calculate comparisons
  const saleDiff = total.sale - totalPrevious.sale;
  const salePercentChange =
    totalPrevious.sale === 0 ? 0 : (saleDiff / totalPrevious.sale) * 100;
  const saleDirection = saleDiff >= 0 ? "+" : "-";

  const costDiff = total.cost - totalPrevious.cost;
  const costPercentChange =
    totalPrevious.cost === 0 ? 0 : (costDiff / totalPrevious.cost) * 100;
  const costDirection = costDiff >= 0 ? "+" : "-";

  const profitDiff = total.profit - totalPrevious.profit;
  const profitPercentChange =
    totalPrevious.profit === 0 ? 0 : (profitDiff / totalPrevious.profit) * 100;
  const profitDirection = profitDiff >= 0 ? "+" : "-";

  const marginDiff = profit_margin - profit_margin_previous;
  const marginDirection = marginDiff >= 0 ? "+" : "-";

  // Get time period description
  const getTimePeriodText = () => {
    if (currentData.length === 0) return "period";

    const firstDate = moment(currentData[0]?.date);
    const lastDate = moment(currentData[currentData.length - 1]?.date);
    const duration = lastDate.diff(firstDate, "days") + 1;

    if (duration === 1) return "day";
    if (duration <= 7) return "week";
    if (duration <= 31) return "month";
    return `${duration} days`;
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-md hover:shadow-xl transition border-0 bg-gradient-to-br from-blue-50 to-white dark:from-[#23272f] dark:to-[#18181b]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            Total Sales
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-6 w-[120px] rounded" />
          ) : (
            <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-300">
              {formatForDisplay(total.sale)}
            </div>
          )}
          {isLoading ? (
            <Skeleton className="h-4 w-[80px] mt-4 rounded" />
          ) : (
            <p className="text-xs flex items-center gap-1 mt-1">
              {saleDiff > 0 && (
                <TrendingUp className="inline h-4 w-4 text-green-500" />
              )}
              {saleDiff < 0 && (
                <TrendingDown className="inline h-4 w-4 text-red-500" />
              )}
              <span
                className={
                  saleDiff > 0
                    ? "text-green-600"
                    : saleDiff < 0
                    ? "text-red-600"
                    : "text-gray-500"
                }
              >
                {saleDirection}
                {Math.abs(salePercentChange).toFixed(2)}%
              </span>
              <span className="text-gray-400 ml-1">
                from previous {getTimePeriodText()}
              </span>
            </p>
          )}
        </CardContent>
      </Card>
      <Card className="shadow-md hover:shadow-xl transition border-0 bg-gradient-to-br from-pink-50 to-white dark:from-[#23272f] dark:to-[#18181b]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            Total Costs
            <TrendingDown className="h-4 w-4 text-pink-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-6 w-[120px] rounded" />
          ) : (
            <div className="text-2xl font-extrabold text-pink-700 dark:text-pink-300">
              {formatForDisplay(total.cost)}
            </div>
          )}
          {isLoading ? (
            <Skeleton className="h-4 w-[80px] mt-4 rounded" />
          ) : (
            <p className="text-xs flex items-center gap-1 mt-1">
              {costDiff > 0 && (
                <TrendingUp className="inline h-4 w-4 text-green-500" />
              )}
              {costDiff < 0 && (
                <TrendingDown className="inline h-4 w-4 text-red-500" />
              )}
              <span
                className={
                  costDiff > 0
                    ? "text-green-600"
                    : costDiff < 0
                    ? "text-red-600"
                    : "text-gray-500"
                }
              >
                {costDirection}
                {Math.abs(costPercentChange).toFixed(2)}%
              </span>
              <span className="text-gray-400 ml-1">
                from previous {getTimePeriodText()}
              </span>
            </p>
          )}
        </CardContent>
      </Card>
      <Card className="shadow-md hover:shadow-xl transition border-0 bg-gradient-to-br from-green-50 to-white dark:from-[#23272f] dark:to-[#18181b]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            Profit
            <BarChart className="h-4 w-4 text-green-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-6 w-[120px] rounded" />
          ) : (
            <div className="text-2xl font-extrabold text-green-700 dark:text-green-300">
              {formatForDisplay(total.profit)}
            </div>
          )}
          {isLoading ? (
            <Skeleton className="h-4 w-[80px] mt-4 rounded" />
          ) : (
            <p className="text-xs flex items-center gap-1 mt-1">
              {profitDiff > 0 && (
                <TrendingUp className="inline h-4 w-4 text-green-500" />
              )}
              {profitDiff < 0 && (
                <TrendingDown className="inline h-4 w-4 text-red-500" />
              )}
              <span
                className={
                  profitDiff > 0
                    ? "text-green-600"
                    : profitDiff < 0
                    ? "text-red-600"
                    : "text-gray-500"
                }
              >
                {profitDirection}
                {Math.abs(profitPercentChange).toFixed(2)}%
              </span>
              <span className="text-gray-400 ml-1">
                from previous {getTimePeriodText()}
              </span>
            </p>
          )}
        </CardContent>
      </Card>
      <Card className="shadow-md hover:shadow-xl transition border-0 bg-gradient-to-br from-yellow-50 to-white dark:from-[#23272f] dark:to-[#18181b]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            Profit Margin
            <LineChart className="h-4 w-4 text-yellow-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-6 w-[120px] rounded" />
          ) : (
            <div className="text-2xl font-extrabold text-yellow-700 dark:text-yellow-300">
              {profit_margin.toFixed(2)}%
            </div>
          )}
          {isLoading ? (
            <Skeleton className="h-4 w-[80px] mt-4 rounded" />
          ) : (
            <p className="text-xs flex items-center gap-1 mt-1">
              {marginDiff > 0 && (
                <TrendingUp className="inline h-4 w-4 text-green-500" />
              )}
              {marginDiff < 0 && (
                <TrendingDown className="inline h-4 w-4 text-red-500" />
              )}
              <span
                className={
                  marginDiff > 0
                    ? "text-green-600"
                    : marginDiff < 0
                    ? "text-red-600"
                    : "text-gray-500"
                }
              >
                {marginDirection}
                {Math.abs(marginDiff).toFixed(2)}%
              </span>
              <span className="text-gray-400 ml-1">
                from previous {getTimePeriodText()}
              </span>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
