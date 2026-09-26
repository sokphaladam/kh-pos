"use client";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { LatticeLoader } from "@/components/ui/lattice-loader";
import {
  useQueryReportSaleBreakdownByCategory,
  useQueryReportSaleBreakdownByCategoryWithIntegration,
} from "@/app/hooks/report/use-query-sale-breakdown-bycategory-report";
import { ReportChart } from "@/components/gui/report/sale/report-chart";
import { ReportExportToExcel } from "@/components/gui/report/sale/report-export-to-excel";
import { ReportFiltersSidebar } from "@/components/gui/report/sale/report-filters-sidebar";
import { ReportList } from "@/components/gui/report/sale/report-list";
import { ReportFilters } from "@/components/gui/report/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuthentication } from "contexts/authentication-context";
import { endOfDay, startOfDay } from "date-fns";
import { BarChart3, Filter, List, RefreshCw } from "lucide-react";
import moment from "moment-timezone";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function BoardMemberSaleReportPage() {
  const { user } = useAuthentication();
  const today = new Date();
  const searchParams = useSearchParams();
  const local = searchParams.get("local");
  const warehouseId = searchParams.get("warehouseId");
  const warehouseName = searchParams.get("warehouse");
  const brandName = searchParams.get("brandName");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const [viewMode, setViewMode] = useState<"list" | "graph">("list");
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      from: startDate ? moment(startDate).toDate() : startOfDay(today),
      to: endDate ? moment(endDate).toDate() : endOfDay(today),
    },
    userIds: [],
    categoryId: [],
    productId: null,
    viewValue: "revenue",
    groupBy: "product",
    warehouseIds: [warehouseId || ""],
  });

  const filterParams = useMemo(() => {
    return {
      startDate: filters.dateRange?.from
        ? moment(filters.dateRange.from).format("YYYY-MM-DD")
        : "",
      endDate: filters.dateRange?.to
        ? moment(filters.dateRange.to).format("YYYY-MM-DD")
        : "",
      warehouseId:
        filters.warehouseIds && filters.warehouseIds.length > 0
          ? filters.warehouseIds.join(",")
          : "",
      groupBy: filters.groupBy as "product" | "time",
      userIds: filters.userIds ? filters.userIds : [],
      categoryIds: filters.categoryId ? filters.categoryId : [],
      productId: filters.productId || "",
    };
  }, [filters]);

  const { data, isLoading, mutate } =
    local === "1"
      ? // eslint-disable-next-line react-hooks/rules-of-hooks
        useQueryReportSaleBreakdownByCategory(filterParams)
      : // eslint-disable-next-line react-hooks/rules-of-hooks
        useQueryReportSaleBreakdownByCategoryWithIntegration({
          ...filterParams,
          brandName: brandName || "",
        });

  const updateFilters = (key: keyof ReportFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      dateRange: {
        from: startOfDay(today),
        to: endOfDay(today),
      },
      userIds: [],
      categoryId: [],
      productId: null,
      viewValue: "revenue",
      groupBy: "product",
      warehouseIds: [warehouseId || ""],
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange) count++;
    if (filters.userIds.length > 0) count++;
    if (filters.categoryId.length > 0) count++;
    if (filters.groupBy) count++;
    if (filters.productId) count++;
    if (
      filters.warehouseIds &&
      filters.warehouseIds.length > 0 &&
      user?.role?.role === "OWNER"
    )
      count++;
    return count;
  }, [filters, user]);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        <ReportFiltersSidebar
          filters={filters}
          onFiltersChangeAction={updateFilters}
          onClearFiltersAction={clearFilters}
          activeFiltersCount={activeFiltersCount}
          viewMode={viewMode}
          forBoardMember
        />
        <SidebarInset className="flex-1 -ml-[16%]">
          {/* Header */}
          <div className="bg-card border-b border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-foreground">
                    Sales Reports - {warehouseName || "All Branches"}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Analyze your sales performance with detailed insights for{" "}
                    {warehouseName || "All Branches"}. From{" "}
                    {filterParams.startDate || "N/A"} to{" "}
                    {filterParams.endDate || "N/A"}.
                  </p>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <SegmentedControl
                  aria-label="View mode"
                  size="sm"
                  value={viewMode}
                  onChange={(value) => setViewMode(value as "list" | "graph")}
                  items={[
                    {
                      value: "list",
                      label: "List",
                      icon: <List className="size-3.5" />,
                    },
                    {
                      value: "graph",
                      label: "Chart",
                      icon: <BarChart3 className="size-3.5" />,
                    },
                  ]}
                />
                <Button variant="outline" size="sm" onClick={() => mutate()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <ReportExportToExcel
                  data={data}
                  dateRange={
                    filters.dateRange || {
                      from: startOfDay(today),
                      to: endOfDay(today),
                    }
                  }
                  groupByProduct={filters.groupBy === "product"}
                  type={"sale-by-category"}
                />
              </div>
            </div>

            {/* Active Filters Summary */}
            {activeFiltersCount > 0 && (
              <div className="mt-3 p-2 bg-info/10 rounded-lg border border-info/20">
                <div className="flex items-center gap-2 text-sm">
                  <Filter className="w-4 h-4 text-info" />
                  <span className="font-medium text-info">
                    Active Filters:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {filters.dateRange && (
                      <Badge
                        variant="outline"
                        className="text-info border-info/30"
                      >
                        Date Range: {filterParams.startDate || "N/A"} -{" "}
                        {filterParams.endDate || "N/A"}
                      </Badge>
                    )}
                    {filters.warehouseIds &&
                      filters.warehouseIds.length > 0 &&
                      user?.role?.role === "OWNER" && (
                        <Badge
                          variant="outline"
                          className="text-info border-info/30"
                        >
                          {filters.warehouseIds.length} Branches
                        </Badge>
                      )}
                    {filters.userIds.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-info border-info/30"
                      >
                        {filters.userIds.length} Users
                      </Badge>
                    )}
                    {filters.categoryId.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-info border-info/30"
                      >
                        Category
                      </Badge>
                    )}
                    {filters.groupBy && (
                      <Badge
                        variant="outline"
                        className="text-info border-info/30"
                      >
                        Group By: {filters.groupBy}
                      </Badge>
                    )}
                    {filters.productId && (
                      <Badge
                        variant="outline"
                        className="text-info border-info/30"
                      >
                        Product
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                  <LatticeLoader label="Loading report data" />
                </div>
              </div>
            ) : viewMode === "list" ? (
              <div className="space-y-3">
                <ReportList data={data} type="sale-by-category" />
              </div>
            ) : (
              <div className="w-full">
                <ReportChart
                  data={data}
                  type="sale-by-category"
                  viewValue={filters.viewValue}
                />
              </div>
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
