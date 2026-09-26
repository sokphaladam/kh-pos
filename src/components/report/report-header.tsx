import React from "react";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import { RefreshCw, Download, LucideIcon } from "lucide-react";

interface ReportHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onRefresh: () => void;
  onExport?: () => void;
  isLoading?: boolean;
  hasData?: boolean;
  children?: React.ReactNode;
}

export function ReportHeader({
  title,
  description,
  icon: Icon,
  iconBgColor = "bg-info/15",
  iconColor = "text-info",
  dateRange,
  onDateRangeChange,
  onRefresh,
  onExport,
  isLoading = false,
  hasData = true,
  children,
}: ReportHeaderProps) {
  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
      <div className="flex flex-col space-y-6">
        {/* Title and Description */}
        <div className="flex items-center gap-3">
          <div className={`p-2 ${iconBgColor} rounded-lg`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="flex-1 space-y-4 lg:space-y-0 lg:flex lg:items-end lg:gap-4">
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Date Range
              </label>
              <DateRangePicker
                dateRange={dateRange}
                onChange={onDateRangeChange}
                className="w-full lg:w-auto"
              />
            </div>
            {children && <div className="flex-shrink-0">{children}</div>}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={onRefresh}
              variant="outline"
              className="gap-2"
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            {onExport && (
              <Button
                onClick={onExport}
                variant="outline"
                className="gap-2"
                disabled={isLoading || !hasData}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
