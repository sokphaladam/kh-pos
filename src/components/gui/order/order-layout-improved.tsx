import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
    <div className="min-h-screen bg-muted/50">
      <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
        <PageHeader
          title="Order Management"
          description="Manage and track your customer orders"
          actions={
            <Button
              onClick={() =>
                window.open(
                  POS.system_type === "RESTAURANT"
                    ? "/admin/restaurant"
                    : "/admin/a/pos",
                  "_blank",
                )
              }
            >
              <Plus className="size-4" />
              New Order
            </Button>
          }
        />

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
