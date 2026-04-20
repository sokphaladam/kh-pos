"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { X, ArrowLeft } from "lucide-react";
import { ReportFilters } from "../types";
import { ReportCategoryPicker } from "../report-category-picker";
import { ReportProductPicker } from "../report-product-picker";
import { ReportWarehousePicker } from "../report-warehouse-picker";
import { NavUser } from "@/components/sidebar/nav-user";

interface ReportFiltersSidebarProps {
  filters: ReportFilters;
  onFiltersChangeAction: (key: keyof ReportFilters, value: unknown) => void;
  onClearFiltersAction: () => void;
  activeFiltersCount: number;
  viewMode: "list" | "graph";
}

export function StockReportFiltersSidebar({
  filters,
  onFiltersChangeAction,
  onClearFiltersAction,
  activeFiltersCount,
}: ReportFiltersSidebarProps) {
  return (
    <Sidebar
      side="left"
      variant="sidebar"
      className="w-auto max-w-[260px] overflow-hidden"
    >
      <SidebarHeader className="border-b border-gray-200">
        {/* Back to Dashboard */}
        <Link href="/admin/dashboard" className="block mb-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-gray-900">
            Report Filters
          </h2>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount} active</Badge>
          )}
        </div>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFiltersAction}
            className="w-full text-gray-600 hover:text-gray-800"
          >
            <X className="w-4 h-4 mr-2" />
            Clear All Filters
          </Button>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Date Range Filter */}
        {/* <SidebarGroup>
          <SidebarGroupContent>
            <DateRangePicker
              dateRange={filters.dateRange}
              onChange={(range: DateRange) =>
                onFiltersChangeAction("dateRange", range)
              }
              className="w-full"
            />
          </SidebarGroupContent>
        </SidebarGroup> */}

        <SidebarSeparator />

        {/* Warehouse Filter Only for owners */}
        <SidebarGroup>
          <SidebarGroupContent className="space-y-3">
            <ReportWarehousePicker
              selectedWarehouseIds={filters.warehouseIds}
              onSelectionChange={(v) => {
                onFiltersChangeAction("warehouseIds", v);
              }}
            />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Category Filter */}
        <SidebarGroup>
          <SidebarGroupContent>
            <ReportCategoryPicker
              selectedCategoryIds={filters.categoryId}
              onSelectionChange={(v) => {
                onFiltersChangeAction("categoryId", v);
              }}
            />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Product Filter */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            Product
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ReportProductPicker
              selectedProductId={filters.productId || ""}
              onSelectionChange={(v) => {
                onFiltersChangeAction("productId", v);
              }}
            />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />
      </SidebarContent>
      <SidebarRail />
      <NavUser />
    </Sidebar>
  );
}
