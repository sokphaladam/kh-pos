import { useQueryOrderList } from "@/app/hooks/use-query-order";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Clock,
  ShoppingBag,
  TrendingUp,
  Truck,
  User,
  Utensils,
} from "lucide-react";
import { useMemo } from "react";

interface Props {
  startDate: string;
  endDate: string;
}

const SERVED_TYPE_META: Record<
  string,
  { label: string; icon: React.ReactNode; gradientClass: string; iconColorClass: string; valueColorClass: string }
> = {
  dine_in: {
    label: "Dine In",
    icon: <Utensils className="h-4 w-4" />,
    gradientClass:
      "bg-gradient-to-br from-red-50 to-white dark:from-[#23272f] dark:to-[#18181b]",
    iconColorClass: "text-red-500",
    valueColorClass: "text-red-700 dark:text-red-300",
  },
  take_away: {
    label: "Take Away",
    icon: <ShoppingBag className="h-4 w-4" />,
    gradientClass:
      "bg-gradient-to-br from-orange-50 to-white dark:from-[#23272f] dark:to-[#18181b]",
    iconColorClass: "text-orange-500",
    valueColorClass: "text-orange-700 dark:text-orange-300",
  },
  food_delivery: {
    label: "Delivery",
    icon: <Truck className="h-4 w-4" />,
    gradientClass:
      "bg-gradient-to-br from-teal-50 to-white dark:from-[#23272f] dark:to-[#18181b]",
    iconColorClass: "text-teal-500",
    valueColorClass: "text-teal-700 dark:text-teal-300",
  },
  customer: {
    label: "Customer",
    icon: <User className="h-4 w-4" />,
    gradientClass:
      "bg-gradient-to-br from-purple-50 to-white dark:from-[#23272f] dark:to-[#18181b]",
    iconColorClass: "text-purple-500",
    valueColorClass: "text-purple-700 dark:text-purple-300",
  },
  unknown: {
    label: "Unknown",
    icon: <TrendingUp className="h-4 w-4" />,
    gradientClass:
      "bg-gradient-to-br from-gray-50 to-white dark:from-[#23272f] dark:to-[#18181b]",
    iconColorClass: "text-gray-400",
    valueColorClass: "text-gray-700 dark:text-gray-300",
  },
};

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
      }

      expectationCount++;
      expectationTotal += amount;
    }

    const servedTypeMap = new Map<string, { count: number; total: number }>();
    for (const order of orders) {
      const amount = parseFloat(order.totalAmount ?? "0") || 0;
      const key = order.servedType ?? "unknown";
      const entry = servedTypeMap.get(key) ?? { count: 0, total: 0 };
      entry.count++;
      entry.total += amount;
      servedTypeMap.set(key, entry);
    }
    const byServedType = Array.from(servedTypeMap.entries())
      .map(([servedType, value]) => ({ servedType, ...value }))
      .sort((a, b) => b.total - a.total);

    return {
      completedCount,
      completedTotal,
      draftCount,
      draftTotal,
      expectationCount,
      expectationTotal,
      byServedType,
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
        countLabel="orders"
        total={summary.expectationTotal}
        formatCurrency={formatForDisplay}
        isLoading={isLoading}
        gradientClass="bg-gradient-to-br from-blue-50 to-white dark:from-[#23272f] dark:to-[#18181b]"
        iconColorClass="text-blue-500"
        valueColorClass="text-blue-700 dark:text-blue-300"
        icon={<TrendingUp className="h-4 w-4" />}
      />
      {(isLoading || summary.byServedType.length > 0) && (
        <div className="sm:col-span-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <SummaryCard
                  key={i}
                  label="Loading"
                  count={0}
                  countLabel="orders"
                  total={0}
                  formatCurrency={formatForDisplay}
                  isLoading
                  gradientClass="bg-gradient-to-br from-gray-50 to-white dark:from-[#23272f] dark:to-[#18181b]"
                  iconColorClass="text-gray-400"
                  valueColorClass="text-gray-700 dark:text-gray-300"
                  icon={<Clock className="h-4 w-4" />}
                />
              ))
            : summary.byServedType.map(({ servedType, count, total }) => {
                const meta =
                  SERVED_TYPE_META[servedType] ?? SERVED_TYPE_META.unknown;
                return (
                  <SummaryCard
                    key={servedType}
                    label={meta.label}
                    count={count}
                    countLabel="orders"
                    total={total}
                    formatCurrency={formatForDisplay}
                    isLoading={false}
                    gradientClass={meta.gradientClass}
                    iconColorClass={meta.iconColorClass}
                    valueColorClass={meta.valueColorClass}
                    icon={meta.icon}
                  />
                );
              })}
        </div>
      )}
    </div>
  );
}
