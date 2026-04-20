"use client";

import React, { useState } from "react";
import { useQueryExpiryReport } from "@/app/hooks/user-expiry-report";
import { ExpiryProductList } from "./expiry-product-list";
import ExpirySummaryCards from "./expiry-summary-cards";
import ExpiryProductFilters from "./expiry-product-filters";
import {
  ExpiryFilters,
  SummaryExpiryStatus,
} from "@/classes/reports/product-expiry";
import {
  HeaderSkeleton,
  SummaryCardsSkeleton,
  FiltersSkeleton,
  ProductTableSkeleton,
} from "./expiry-skeleton";

export default function ExpiryReportDashboard() {
  const [filters, setFilters] = useState<ExpiryFilters>({
    timeFrame: "all_products",
  });
  const { data, isLoading } = useQueryExpiryReport();

  // Defensive fallback for empty data
  const allProducts = data?.result?.productList ?? [];
  const allDashboard = data?.result?.dashboard ?? [];
  const slots = data?.result?.slots ?? [];
  const categories = data?.result?.categories ?? [];

  // Get dynamic time frames from API response
  const timeFrames = data?.result?.expiryTimeFrame || {
    urgent: 1,
    critical: 7,
    warning: 30,
  };

  // Client-side filtering logic
  const getFilteredProducts = () => {
    let filtered = [...allProducts];

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter((p) => {
        const productName = (
          p.variant?.basicProduct?.title ||
          p.variant?.name ||
          ""
        ).toLowerCase();
        const sku = (p.variant?.sku || "").toString().toLowerCase();
        const barcode = (p.variant?.barcode || "").toLowerCase();

        return (
          productName.includes(searchTerm) ||
          sku.includes(searchTerm) ||
          barcode.includes(searchTerm)
        );
      });
    }

    // Filter by timeFrame
    if (filters.timeFrame !== "all_products") {
      filtered = filtered.filter((p) => p.status === filters.timeFrame);
    }

    // Filter by slot
    if (filters.slotId) {
      filtered = filtered.filter((p) => p.slot?.id === filters.slotId);
    }

    // Filter by category
    if (filters.categoryId) {
      filtered = filtered.filter((p) =>
        p.categories?.some((c) => c.categoryId === filters.categoryId)
      );
    }

    return filtered;
  };

  // Get filtered dashboard data based on filtered products
  const getFilteredDashboard = () => {
    const filteredProducts = getFilteredProducts();

    // Recalculate dashboard stats from filtered products
    const statusGroups = {
      expired: filteredProducts.filter((p) => p.status === "expired"),
      urgent: filteredProducts.filter((p) => p.status === "urgent"),
      critical: filteredProducts.filter((p) => p.status === "critical"),
      warning: filteredProducts.filter((p) => p.status === "warning"),
    };

    return Object.entries(statusGroups).map(([status, products]) => ({
      status: status as unknown,
      qty: products.reduce((sum, p) => sum + Number(p.quantity), 0),
      value: products.reduce((sum, p) => sum + Number(p.value), 0),
      uniqueProductCount: new Set(products.map((p) => p.variant?.id)).size,
    }));
  };

  const productList = getFilteredProducts();
  const dashboard =
    filters.timeFrame === "all_products" &&
    !filters.search &&
    !filters.slotId &&
    !filters.categoryId
      ? allDashboard
      : (getFilteredDashboard() as SummaryExpiryStatus[]);

  return (
    <div className="mx-auto w-full max-w-7xl">
      {isLoading ? (
        <>
          <HeaderSkeleton />
          <SummaryCardsSkeleton />
          <FiltersSkeleton />
          <ProductTableSkeleton />
        </>
      ) : (
        <>
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Inventory Expiry Dashboard
                </h1>
                <p className="text-gray-600 text-lg">
                  Monitor product expiration dates and manage inventory
                  efficiently
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Last Updated</div>
                <div className="text-lg font-semibold text-gray-700">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="mb-8">
            <ExpirySummaryCards
              dashboard={dashboard}
              currentTimeFrame={filters.timeFrame}
              timeFrames={timeFrames}
              onFilterChange={(timeFrame) => {
                setFilters({
                  ...filters,
                  timeFrame: timeFrame as ExpiryFilters["timeFrame"],
                });
                // Scroll to product list after a short delay to allow state update
              }}
            />
          </div>

          {/* Filters Section */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Filter Products
              </h2>
              <ExpiryProductFilters
                slots={slots}
                categories={categories}
                selectedSlot={filters.slotId ?? ""}
                selectedCategory={filters.categoryId ?? ""}
                onChange={setFilters}
                filters={filters}
              />
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                  Product Expiry Details
                </h2>
                <div className="text-sm text-gray-600">
                  {productList.length}{" "}
                  {productList.length === 1 ? "product" : "products"} found
                </div>
              </div>
            </div>

            <div className="p-6">
              <ExpiryProductList products={productList} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
