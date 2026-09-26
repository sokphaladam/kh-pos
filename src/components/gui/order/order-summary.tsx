import { useQueryOrderList } from "@/app/hooks/use-query-order";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { StatCard, type StatTone } from "@/components/ui/page-header";
import {
  CheckCircle2,
  Clock,
  type LucideIcon,
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
  { label: string; icon: LucideIcon; tone: StatTone }
> = {
  dine_in: { label: "Dine In", icon: Utensils, tone: "destructive" },
  take_away: { label: "Take Away", icon: ShoppingBag, tone: "warning" },
  food_delivery: { label: "Delivery", icon: Truck, tone: "success" },
  customer: { label: "Customer", icon: User, tone: "info" },
  unknown: { label: "Unknown", icon: TrendingUp, tone: "default" },
};

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

  const orders = (count: number) => `${count.toLocaleString()} orders`;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        label="Completed Orders"
        value={formatForDisplay(summary.completedTotal)}
        hint={orders(summary.completedCount)}
        icon={CheckCircle2}
        tone="success"
        loading={isLoading}
      />
      <StatCard
        label="Draft Orders"
        value={formatForDisplay(summary.draftTotal)}
        hint={orders(summary.draftCount)}
        icon={Clock}
        tone="warning"
        loading={isLoading}
      />
      <StatCard
        label="Expected Revenue"
        value={formatForDisplay(summary.expectationTotal)}
        hint={orders(summary.expectationCount)}
        icon={TrendingUp}
        tone="info"
        loading={isLoading}
      />
      {(isLoading || summary.byServedType.length > 0) && (
        <div className="sm:col-span-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <StatCard key={i} label="Loading" value="" loading />
              ))
            : summary.byServedType.map(({ servedType, count, total }) => {
                const meta =
                  SERVED_TYPE_META[servedType] ?? SERVED_TYPE_META.unknown;
                return (
                  <StatCard
                    key={servedType}
                    label={meta.label}
                    value={formatForDisplay(total)}
                    hint={orders(count)}
                    icon={meta.icon}
                    tone={meta.tone}
                  />
                );
              })}
        </div>
      )}
    </div>
  );
}
