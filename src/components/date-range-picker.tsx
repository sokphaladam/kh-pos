"use client";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCallback, useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import moment from "moment-timezone";

type DateRangePickerProps = {
  dateRange: DateRange | undefined;
  onChange?: (range: DateRange) => void;
  className?: string;
};

type PeriodType = "this" | "past" | "custom";
type PeriodUnit = "day" | "week" | "month" | "year";

export function DateRangePicker({
  onChange,
  className,
  dateRange,
}: DateRangePickerProps) {
  const [periodType, setPeriodType] = useState<PeriodType>("this");
  const [periodUnit, setPeriodUnit] = useState<PeriodUnit>("day");
  const [isCustomRange, setIsCustomRange] = useState(false);

  const detectPresetPeriod = useCallback(
    (range: DateRange): { type: PeriodType; unit: PeriodUnit } | null => {
      const today = new Date();

      // Check for "this" periods
      if (
        isSameDay(range.from!, startOfDay(today)) &&
        isSameDay(range.to!, endOfDay(today))
      ) {
        return { type: "this", unit: "day" };
      }

      if (
        isSameDay(range.from!, startOfWeek(today, { weekStartsOn: 1 })) &&
        isSameDay(range.to!, endOfWeek(today, { weekStartsOn: 1 }))
      ) {
        return { type: "this", unit: "week" };
      }

      if (
        isSameDay(range.from!, startOfMonth(today)) &&
        isSameDay(range.to!, endOfMonth(today))
      ) {
        return { type: "this", unit: "month" };
      }

      if (
        isSameDay(range.from!, startOfYear(today)) &&
        isSameDay(range.to!, endOfYear(today))
      ) {
        return { type: "this", unit: "year" };
      }

      // Check for "past" periods
      const prevDay = subDays(today, 1);
      if (
        isSameDay(range.from!, startOfDay(prevDay)) &&
        isSameDay(range.to!, endOfDay(prevDay))
      ) {
        return { type: "past", unit: "day" };
      }

      const prevWeek = subWeeks(today, 1);
      if (
        isSameDay(range.from!, startOfWeek(prevWeek, { weekStartsOn: 1 })) &&
        isSameDay(range.to!, endOfWeek(prevWeek, { weekStartsOn: 1 }))
      ) {
        return { type: "past", unit: "week" };
      }

      const prevMonth = subMonths(today, 1);
      if (
        isSameDay(range.from!, startOfMonth(prevMonth)) &&
        isSameDay(range.to!, endOfMonth(prevMonth))
      ) {
        return { type: "past", unit: "month" };
      }

      const prevYear = subYears(today, 1);
      if (
        isSameDay(range.from!, startOfYear(prevYear)) &&
        isSameDay(range.to!, endOfYear(prevYear))
      ) {
        return { type: "past", unit: "year" };
      }

      // Similar checks could be added for "next" and "past" periods
      // For brevity, we'll return null for now if it doesn't match "this" periods
      return null;
    },
    [],
  );

  // Utility: check if two dates are the same day
  function isSameDay(date1?: Date, date2?: Date): boolean {
    if (!date1 || !date2) return false;
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  // Utility: format a date range for display
  function formatDateRangeDisplay(
    range?: DateRange,
    fallback = "No range selected",
  ) {
    if (range?.from && range?.to) {
      return `${moment(range.from).format("MMM DD, YYYY")} - ${moment(
        range.to,
      ).format("MMM DD, YYYY")}`;
    }
    return fallback;
  }

  // Utility: get preset ranges
  function getPresetRanges() {
    return [
      { label: "Today", range: calculateDateRange("this", "day") },
      { label: "This Week", range: calculateDateRange("this", "week") },
      { label: "This Month", range: calculateDateRange("this", "month") },
      {
        label: "Last 7 Days",
        range: {
          from: subDays(new Date(), 6),
          to: endOfDay(new Date()),
        },
      },
      {
        label: "Last 30 Days",
        range: {
          from: subDays(new Date(), 29),
          to: endOfDay(new Date()),
        },
      },
    ];
  }

  useEffect(() => {
    if (dateRange) {
      const isCustom = !detectPresetPeriod(dateRange);
      setIsCustomRange(isCustom);

      if (!isCustom) {
        const { type, unit } = detectPresetPeriod(dateRange) || {
          type: "this",
          unit: "day",
        };
        setPeriodType(type);
        setPeriodUnit(unit);
      }
    }
  }, [dateRange, detectPresetPeriod]);

  // Move calculateDateRange outside component for clarity
  function calculateDateRange(type: PeriodType, unit: PeriodUnit): DateRange {
    const today = new Date();
    switch (type) {
      case "this":
        switch (unit) {
          case "day":
            return { from: startOfDay(today), to: endOfDay(today) };
          case "week":
            return {
              from: startOfWeek(today, { weekStartsOn: 1 }),
              to: endOfWeek(today, { weekStartsOn: 1 }),
            };
          case "month":
            return {
              from: startOfMonth(today),
              to: endOfMonth(today),
            };
          case "year":
            return {
              from: startOfYear(today),
              to: endOfYear(today),
            };
        }
        break;
      case "past":
        switch (unit) {
          case "day": {
            const prevDay = subDays(today, 1);
            return { from: startOfDay(prevDay), to: endOfDay(prevDay) };
          }
          case "week": {
            const prevWeek = subWeeks(today, 1);
            return {
              from: startOfWeek(prevWeek, { weekStartsOn: 1 }),
              to: endOfWeek(prevWeek, { weekStartsOn: 1 }),
            };
          }
          case "month": {
            const prevMonth = subMonths(today, 1);
            return {
              from: startOfMonth(prevMonth),
              to: endOfMonth(prevMonth),
            };
          }
          case "year": {
            const prevYear = subYears(today, 1);
            return {
              from: startOfYear(prevYear),
              to: endOfYear(prevYear),
            };
          }
        }
        break;
    }
    return { from: startOfDay(today), to: endOfDay(today) };
  }

  const handlePeriodTypeChange = (value: PeriodType) => {
    if (value === "custom") {
      setIsCustomRange(true);
      return;
    }

    setIsCustomRange(false);
    setPeriodType(value);
    const newRange = calculateDateRange(value, periodUnit);
    // setDateRange(newRange);
    onChange?.(newRange);
  };

  const handlePeriodUnitChange = (value: PeriodUnit) => {
    setPeriodUnit(value);
    const newRange = calculateDateRange(periodType, value);
    // setDateRange(newRange);
    onChange?.(newRange);
  };

  // Refactor handleCalendarSelect for clarity
  const handleCalendarSelect = (range: DateRange | undefined, day?: Date) => {
    if (!day) return;
    // If no range or both set, start new range
    if (!dateRange?.from || (dateRange.from && dateRange.to)) {
      onChange?.({ from: day, to: undefined });
      return;
    }
    // If only from is set
    if (dateRange.from && !dateRange.to) {
      if (day >= dateRange.from) {
        // Allow selecting the same day or a later day
        onChange?.({ from: dateRange.from, to: day });
      } else {
        // If user clicks before the start date, start new range
        onChange?.({ from: day, to: undefined });
      }
      return;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="capitalize flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-400 shadow-sm hover:bg-cyan-50 dark:hover:bg-cyan-900 transition-colors"
          aria-label="Select date range"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-cyan-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">
            {formatDateRangeDisplay(dateRange)}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-[340px] p-4 rounded-lg border border-cyan-200 dark:border-cyan-800 shadow-lg animate-fade-in">
        <div className={cn("space-y-4", className)}>
          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2 mb-2">
            {getPresetRanges().map((preset) => {
              const from = preset.range.from;
              const to = preset.range.to;
              const isActive =
                from &&
                to &&
                isSameDay(dateRange?.from, from) &&
                isSameDay(dateRange?.to, to);
              return (
                <Button
                  key={preset.label}
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  className={
                    isActive
                      ? "bg-cyan-500 text-white border-cyan-500 hover:bg-cyan-600"
                      : "border-cyan-200 dark:border-cyan-800"
                  }
                  onClick={() => onChange?.(preset.range)}
                >
                  {preset.label}
                </Button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Select
              value={isCustomRange ? "custom" : periodType}
              onValueChange={(value) =>
                handlePeriodTypeChange(value as PeriodType | "custom")
              }
            >
              <SelectTrigger className="w-[110px] rounded-md border-cyan-300">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this">This</SelectItem>
                <SelectItem value="past">Past</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {!isCustomRange && (
              <Select
                value={periodUnit}
                onValueChange={(value) =>
                  handlePeriodUnitChange(value as PeriodUnit)
                }
              >
                <SelectTrigger className="w-[110px] rounded-md border-cyan-300">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          {/* Selected Range Summary */}
          <div className="text-xs text-cyan-700 dark:text-cyan-300 font-medium mb-2">
            {formatDateRangeDisplay(dateRange)}
          </div>
          <div className="flex flex-col items-center mt-4">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range, day) => handleCalendarSelect(range, day)}
              numberOfMonths={2}
              initialFocus
              className="rounded-lg border border-cyan-200 dark:border-cyan-800 shadow-sm animate-fade-in"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
