"use client";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { StockReportFiltersSidebar } from "./report-stock-filter-sidebar";
import { useMemo, useState } from "react";
import { ReportFilters } from "../types";
import { endOfDay, startOfDay } from "date-fns";
import { useAuthentication } from "contexts/authentication-context";
import { useQueryReportStock } from "@/app/hooks/report/use-query-stock-report";
import moment from "moment-timezone";
import { Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StockReportExportToExcel } from "./report-stock-export-to-excel";
import { StockReportList } from "./report-stock-list";

export function StockReportLayout() {
  const { currentWarehouse, user } = useAuthentication();
  const today = new Date();
  const [viewMode] = useState<"list" | "graph">("list");
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      from: startOfDay(today),
      to: endOfDay(today),
    },
    userIds: [],
    categoryId: [],
    productId: null,
    viewValue: "revenue",
    groupBy: "product",
    warehouseIds: [currentWarehouse?.id || ""],
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
      categoryIds: filters.categoryId ? filters.categoryId : [],
      productId: filters.productId || "",
    };
  }, [filters]);

  const { data, isLoading, mutate } = useQueryReportStock(filterParams);

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
      warehouseIds: [currentWarehouse?.id || ""],
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    // if (filters.dateRange) count++;
    if (filters.categoryId.length > 0) count++;
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
        <StockReportFiltersSidebar
          filters={filters}
          onFiltersChangeAction={updateFilters}
          onClearFiltersAction={clearFilters}
          activeFiltersCount={activeFiltersCount}
          viewMode={viewMode}
        />
        <SidebarInset className="flex-1">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Stock Report
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Analyze your stock levels with detailed insights
                  </p>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => mutate()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <StockReportExportToExcel
                  data={data}
                  dateRange={
                    filters.dateRange || {
                      from: startOfDay(today),
                      to: endOfDay(today),
                    }
                  }
                />
              </div>
            </div>

            {/* Active Filters Summary */}
            {activeFiltersCount > 0 && (
              <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-sm">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    Active Filters:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {/* {filters.dateRange && (
                      <Badge
                        variant="outline"
                        className="text-blue-700 border-blue-300"
                      >
                        Date Range
                      </Badge>
                    )} */}
                    {filters.warehouseIds &&
                      filters.warehouseIds.length > 0 &&
                      user?.role?.role === "OWNER" && (
                        <Badge
                          variant="outline"
                          className="text-blue-700 border-blue-300"
                        >
                          {filters.warehouseIds.length} Branches
                        </Badge>
                      )}
                    {filters.categoryId.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-blue-700 border-blue-300"
                      >
                        Category
                      </Badge>
                    )}
                    {filters.productId && (
                      <Badge
                        variant="outline"
                        className="text-blue-700 border-blue-300"
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600">Loading report data...</p>
                </div>
              </div>
            ) : viewMode === "list" ? (
              <div className="space-y-3">
                <StockReportList data={data} />
              </div>
            ) : (
              <div className="w-full"></div>
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
