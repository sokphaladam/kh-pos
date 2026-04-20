import { SummaryExpiryStatus } from "@/classes/reports/product-expiry";
import React from "react";

export default function ExpirySummaryCards({
  dashboard,
  onFilterChange,
  currentTimeFrame = "all_products",
  timeFrames,
}: {
  dashboard: SummaryExpiryStatus[];
  onFilterChange: (timeFrame: string) => void;
  currentTimeFrame?: string;
  timeFrames?: {
    urgent: number;
    critical: number;
    warning: number;
  };
}) {
  // Use dynamic time frames with fallback to defaults
  const frames = timeFrames || { urgent: 1, critical: 7, warning: 30 };

  const statusConfig = {
    expired: {
      label: "Expired",
      icon: "⚠️",
      bgGradient: "from-red-50 to-red-100",
      borderColor: "border-red-200",
      textColor: "text-red-700",
      valueColor: "text-red-600",
      description: "Products past expiry date",
      timeFrame: "expired",
    },
    urgent: {
      label: "Urgent",
      icon: "🔥",
      bgGradient: "from-orange-50 to-orange-100",
      borderColor: "border-orange-200",
      textColor: "text-orange-700",
      valueColor: "text-orange-600",
      description: `Expiring within ${frames.urgent} day${
        frames.urgent !== 1 ? "s" : ""
      }`,
      timeFrame: "urgent",
    },
    critical: {
      label: "Critical",
      icon: "⏰",
      bgGradient: "from-yellow-50 to-yellow-100",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-700",
      valueColor: "text-yellow-600",
      description: `Expiring within ${frames.critical} day${
        frames.critical !== 1 ? "s" : ""
      }`,
      timeFrame: "critical",
    },
    warning: {
      label: "Warning",
      icon: "📅",
      bgGradient: "from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
      valueColor: "text-blue-600",
      description: `Expiring within ${frames.warning} day${
        frames.warning !== 1 ? "s" : ""
      }`,
      timeFrame: "warning",
    },
  };

  if (!dashboard || dashboard.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <div className="text-gray-500 text-lg font-medium">
            No expiry summary data available
          </div>
          <div className="text-gray-400 text-sm mt-1">
            Data will appear here once products are loaded
          </div>
        </div>
      </div>
    );
  }

  const totalProducts = dashboard.reduce((sum, item) => sum + item.qty, 0);
  const totalValue = dashboard.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Inventory Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="text-sm font-medium text-blue-600 mb-1">
              Total Items
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {totalProducts.toLocaleString()}
            </div>
            <div className="text-xs text-blue-500 mt-1">
              Units requiring attention
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
            <div className="text-sm font-medium text-green-600 mb-1">
              Total Value
            </div>
            <div className="text-2xl font-bold text-green-700">
              ${totalValue.toLocaleString()}
            </div>
            <div className="text-xs text-green-500 mt-1">Inventory at risk</div>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboard.map((item) => {
          const config = statusConfig[item.status as keyof typeof statusConfig];
          const percentage =
            totalProducts > 0
              ? ((item.qty / totalProducts) * 100).toFixed(1)
              : "0";

          const isActive = currentTimeFrame === config.timeFrame;

          const handleCardClick = () => {
            if (isActive) {
              // If card is already active, deselect it (show all products)
              onFilterChange("all_products");
            } else {
              // If card is not active, select it
              onFilterChange(config.timeFrame);
            }
          };

          return (
            <div
              key={item.status}
              onClick={handleCardClick}
              className={`bg-gradient-to-br ${
                config.bgGradient
              } rounded-xl shadow-sm border ${
                config.borderColor
              } p-6 cursor-pointer transition-all duration-200 ${
                isActive
                  ? "shadow-lg scale-105 ring-2 ring-white ring-opacity-60"
                  : "hover:shadow-lg hover:scale-105"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-2xl">{config.icon}</div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`text-xs font-medium px-2 py-1 rounded-full bg-white ${config.textColor}`}
                  >
                    {percentage}%
                  </div>
                  {isActive && (
                    <div
                      className={`w-2 h-2 rounded-full ${config.valueColor.replace(
                        "text-",
                        "bg-"
                      )} animate-pulse`}
                    ></div>
                  )}
                </div>
              </div>

              <div
                className={`font-semibold text-lg mb-2 ${config.textColor} capitalize`}
              >
                {config.label}
              </div>

              <div className={`text-3xl font-bold mb-2 ${config.valueColor}`}>
                {item.qty.toLocaleString()}
              </div>

              <div className="text-base text-gray-600 mb-2 font-medium">
                ${item.value.toLocaleString()}
              </div>

              <div className="flex items-center text-xs text-gray-600 mb-2">
                <span className="mr-1 text-sm">📦</span>
                <span className="font-medium">
                  {item.uniqueProductCount.toLocaleString()} products
                </span>
              </div>

              <div className="text-xs text-gray-500 leading-tight">
                {config.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
