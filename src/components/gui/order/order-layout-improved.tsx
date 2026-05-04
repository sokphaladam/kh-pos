import { useQueryOrderList } from "@/app/hooks/use-query-order";
import { useAuthentication } from "contexts/authentication-context";
import { OrderFilters } from "./components/order-filters";
import { OrderList } from "./components/order-list-improved";
import { useOrderFilters } from "./hooks/use-order-filters";
import { useMemo } from "react";
import { OrderSummary } from "./order-summary";

export function OrderLayoutImproved() {
  const { setting } = useAuthentication();
  const { filters, updateFilters, resetFilters } = useOrderFilters();

  const formatInvoiceNo = useMemo(() => {
    if (!filters.invoiceNo) return undefined;
    return filters.invoiceNo?.trim().match(/\d+/)?.at(0);
  }, [filters.invoiceNo]);

  const { data, isLoading, isValidating, mutate } = useQueryOrderList({
    ...filters,
    invoiceNo: filters.invoiceNo ? formatInvoiceNo : undefined,
  });

  const POS = JSON.parse(
    setting?.data?.result?.find((f) => f.option === "TYPE_POS")?.value || "{}",
  ) || { system_type: "POS" };

  // Handle filter changes
  const handleFiltersChange = updateFilters;

  // Reset filterss
  const handleResetFilters = resetFilters;

  // Handle refresh
  const handleRefresh = () => {
    mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Order Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage and track your customer orders
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={() =>
                window.open(
                  POS.system_type === "RESTAURANT"
                    ? "/admin/restaurant"
                    : "/admin/a/pos",
                  "_blank",
                )
              }
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              New Order
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <OrderSummary
          startDate={filters.startDate || ""}
          endDate={filters.endDate || ""}
        />

        {/* Filters */}
        <OrderFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleResetFilters}
        />

        {/* Order List */}
        <OrderList
          data={data}
          loading={isLoading || isValidating}
          limit={filters.limit || 30}
          offset={filters.offset || 0}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}
