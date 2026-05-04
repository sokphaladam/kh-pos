import { useQueryOrderList } from "@/app/hooks/use-query-order";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { useMemo } from "react";

interface Props {
  startDate: string;
  endDate: string;
}

interface SummaryCardProps {
  label: string;
  count: number;
  total: number;
  countLabel: string;
  formatCurrency: (n: number) => string;
  icon: React.ReactNode;
  gradientClass: string;
  iconColorClass: string;
  valueColorClass: string;
  isLoading: boolean;
}

function SummaryCard({
  label,
  count,
  total,
  countLabel,
  formatCurrency,
  icon,
  gradientClass,
  iconColorClass,
  valueColorClass,
  isLoading,
}: SummaryCardProps) {
  return (
    <Card
      className={`flex-1 min-w-0 shadow-md hover:shadow-xl transition border-0 ${gradientClass}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          {label}
          <span className={iconColorClass}>{icon}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-6 w-[120px] rounded" />
        ) : (
          <div className={`text-2xl font-extrabold ${valueColorClass}`}>
            {formatCurrency(total)}
          </div>
        )}
        {isLoading ? (
          <Skeleton className="h-4 w-[80px] mt-4 rounded" />
        ) : (
          <p className="text-xs text-gray-400 mt-1">
            {count.toLocaleString()} {countLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function OrderSummary(props: Props) {
  const { data, isLoading } = useQueryOrderList({
    limit: 10000,
    offset: 0,
    startDate: props.startDate,
    endDate: props.endDate,
  });

  const { formatForDisplay } = useCurrencyFormat();

  const summary = useMemo(() => {
    const orders = data?.result?.orders ?? [];

    let completedCount = 0;
    let completedTotal = 0;
    let draftCount = 0;
    let draftTotal = 0;
    let expectationCount = 0;
    let expectationTotal = 0;

    for (const order of orders) {
      const amount = parseFloat(order.totalAmount ?? "0") || 0;
      if (order.orderStatus === "COMPLETED") {
        completedCount++;
        completedTotal += amount;
      } else if (order.orderStatus === "DRAFT") {
        draftCount++;
        draftTotal += amount;
      } else if (
        order.orderStatus === "APPROVED" ||
        order.orderStatus === "PROCESSING"
      ) {
        expectationCount++;
        expectationTotal += amount;
      }
    }

    return {
      completedCount,
      completedTotal,
      draftCount,
      draftTotal,
      expectationCount,
      expectationTotal,
    };
  }, [data]);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <SummaryCard
        label="Completed Orders"
        count={summary.completedCount}
        countLabel="orders"
        total={summary.completedTotal}
        formatCurrency={formatForDisplay}
        isLoading={isLoading}
        gradientClass="bg-gradient-to-br from-green-50 to-white dark:from-[#23272f] dark:to-[#18181b]"
        iconColorClass="text-green-500"
        valueColorClass="text-green-700 dark:text-green-300"
        icon={<CheckCircle2 className="h-4 w-4" />}
      />
      <SummaryCard
        label="Draft Orders"
        count={summary.draftCount}
        countLabel="orders"
        total={summary.draftTotal}
        formatCurrency={formatForDisplay}
        isLoading={isLoading}
        gradientClass="bg-gradient-to-br from-amber-50 to-white dark:from-[#23272f] dark:to-[#18181b]"
        iconColorClass="text-amber-500"
        valueColorClass="text-amber-700 dark:text-amber-300"
        icon={<Clock className="h-4 w-4" />}
      />
      <SummaryCard
        label="Expected Revenue"
        count={summary.expectationCount}
        countLabel="pending"
        total={summary.expectationTotal}
        formatCurrency={formatForDisplay}
        isLoading={isLoading}
        gradientClass="bg-gradient-to-br from-blue-50 to-white dark:from-[#23272f] dark:to-[#18181b]"
        iconColorClass="text-blue-500"
        valueColorClass="text-blue-700 dark:text-blue-300"
        icon={<TrendingUp className="h-4 w-4" />}
      />
    </div>
  );
}
