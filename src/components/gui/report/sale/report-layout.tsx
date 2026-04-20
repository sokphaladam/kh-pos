"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { BarChart3, List, Filter, RefreshCw } from "lucide-react";
import { ReportFilters } from "../types";
import { ReportFiltersSidebar } from "./report-filters-sidebar";
import { ReportList } from "./report-list";
import { useAuthentication } from "contexts/authentication-context";
import { endOfDay, startOfDay } from "date-fns";
import moment from "moment-timezone";
import { useQueryReportSaleBreakdownByCategory } from "@/app/hooks/report/use-query-sale-breakdown-bycategory-report";
import { ReportChart } from "./report-chart";
import { ReportExportToExcel } from "./report-export-to-excel";

export function SaleReportLayout() {
  const { currentWarehouse, user } = useAuthentication();
  const today = new Date();
  const [viewMode, setViewMode] = useState<"list" | "graph">("list");
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
      groupBy: filters.groupBy as "product" | "time",
      userIds: filters.userIds ? filters.userIds : [],
      categoryIds: filters.categoryId ? filters.categoryId : [],
      productId: filters.productId || "",
    };
  }, [filters]);

  const { data, isLoading, mutate } =
    useQueryReportSaleBreakdownByCategory(filterParams);

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
        />

        <SidebarInset className="flex-1">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Sales Reports
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Analyze your sales performance with detailed insights
                  </p>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">View:</span>
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(value) =>
                    value && setViewMode(value as "list" | "graph")
                  }
                >
                  <ToggleGroupItem
                    value="list"
                    className="flex items-center gap-2"
                  >
                    <List className="w-4 h-4" />
                    List
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="graph"
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Chart
                  </ToggleGroupItem>
                </ToggleGroup>
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
              <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-sm">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    Active Filters:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {filters.dateRange && (
                      <Badge
                        variant="outline"
                        className="text-blue-700 border-blue-300"
                      >
                        Date Range
                      </Badge>
                    )}
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
                    {filters.userIds.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-blue-700 border-blue-300"
                      >
                        {filters.userIds.length} Users
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
                    {filters.groupBy && (
                      <Badge
                        variant="outline"
                        className="text-blue-700 border-blue-300"
                      >
                        Group By: {filters.groupBy}
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
