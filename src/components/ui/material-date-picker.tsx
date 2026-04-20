"use client";
import { cn } from "@/lib/utils";
import {
  addMonths,
  format,
  getDay,
  getDaysInMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "./button";
import { Tabs, TabsList, TabsTrigger } from "./tabs";

interface CalendarProps {
  value?: Date;
  disabled?: Date;
  onChange?: (date: Date) => void;
}

export function MaterialDatePicker({
  disabled,
  value,
  onChange,
}: CalendarProps) {
  const currentDate = new Date();
  const [date, setDate] = useState<Date>(value ?? currentDate);
  const [currentMonth, setCurrentMonth] = useState<Date>(value ?? currentDate);
  const [isYearView, setIsYearView] = useState(false);
  const [activeTab, setActiveTab] = useState<"year" | "month">("year");
  // Toggle between calendar and year view
  const toggleYearView = () => {
    setIsYearView(!isYearView);
  };

  // Handle month navigation
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Generate calendar days
  const generateCalendarDays = useCallback(() => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const startWeekday = getDay(startOfMonth(currentMonth));
    const days = [];

    // Previous month days
    const prevMonthDays = getDaysInMonth(subMonths(currentMonth, 1));
    for (let i = startWeekday - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        month: "prev",
        date: new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() - 1,
          prevMonthDays - i
        ),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month: "current",
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i),
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows of 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        month: "next",
        date: new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          i
        ),
      });
    }

    return days;
  }, [currentMonth]);

  // Generate years for selection
  const generateYears = () => {
    const years = [];
    const startYear = 2008;
    const endYear = 2035;

    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }

    return years;
  };

  // Check if a date is the selected date
  const isSelectedDate = (day: number, month: string) => {
    if (month !== "current") return false;
    return (
      day === date.getDate() &&
      currentMonth.getMonth() === date.getMonth() &&
      currentMonth.getFullYear() === date.getFullYear()
    );
  };

  // Handle date selection
  const selectDate = (day: { day: number; month: string; date: Date }) => {
    if (isDisabledDate(day.date)) return;
    setDate(day.date);
    onChange?.(day.date);
  };

  // Handle year selection
  const selectYear = (year: number) => {
    const newDate = new Date(date);
    newDate.setFullYear(year);
    setDate(newDate);
    setCurrentMonth((prev) => {
      const updated = new Date(prev);
      updated.setFullYear(year);
      return updated;
    });

    setIsYearView(false);
    onChange?.(newDate);
  };

  const selectMonth = (monthIndex: number) => {
    const newDate = new Date(date);
    newDate.setMonth(monthIndex);
    newDate.setFullYear(currentMonth.getFullYear());
    setDate(newDate);
    setCurrentMonth((prev) => {
      const updated = new Date(prev);
      updated.setMonth(monthIndex);
      return updated;
    });

    setIsYearView(false);
    onChange?.(newDate);
  };

  const isDisabledDate = (dateToCheck: Date) => {
    if (!disabled) return false;
    return dateToCheck < new Date(disabled.setHours(0, 0, 0, 0));
  };

  // Format the calendar days into weeks
  const calendarDays = useMemo(
    () => generateCalendarDays(),
    [generateCalendarDays]
  );

  const calendarWeeks = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }
    return weeks;
  }, [calendarDays]);

  return (
    <div className="max-w-[320px]">
      <div className="bg-white rounded shadow-md">
        {/* Calendar or Year View */}
        <div className="p-3">
          {/* Header - always visible */}
          <div className="flex justify-between items-center mb-3 h-[40px]">
            <Button
              variant="ghost"
              onClick={toggleYearView}
              className="px-1 gap-1"
              type="button"
            >
              {format(currentMonth, "MMMM yyyy")}
              {isYearView ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>

            {/* Only show navigation arrows in calendar view */}
            {!isYearView ? (
              <div className="flex flex-row gap-1">
                <Button
                  variant="ghost"
                  className="rounded-full"
                  size="icon"
                  onClick={prevMonth}
                  type="button"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  className="rounded-full"
                  variant="ghost"
                  size="icon"
                  onClick={nextMonth}
                  type="button"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Tabs
                defaultValue="year"
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as "year" | "month")
                }
              >
                <TabsList>
                  <TabsTrigger value="year">Year</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>

          {/* Calendar View */}
          {!isYearView ? (
            <>
              {/* Days of week */}
              <div className="grid grid-cols-7 mb-2">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                  <div
                    key={i}
                    className="text-center text-gray-600 font-medium"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-y-2">
                {calendarWeeks.flat().map((day, i) => (
                  <div key={i} className="text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => selectDate(day)}
                      disabled={isDisabledDate(day.date)}
                      className={cn(
                        "h-10 w-10 rounded-full flex text-sm",
                        day.month === "current"
                          ? "text-gray-800"
                          : "text-gray-400",
                        isDisabledDate(day.date) &&
                          "opacity-40 cursor-not-allowed pointer-events-none",
                        isSelectedDate(day.day, day.month)
                          ? "bg-purple-600 text-white hover:bg-purple-600 hover:text-white"
                          : "hover:bg-gray-100"
                      )}
                    >
                      {day.day}
                    </Button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {activeTab === "year" ? (
                <div className="grid grid-cols-5 gap-y-2 gap-x-4 max-h-[300px] overflow-y-auto pr-2">
                  {generateYears().map((year) => (
                    <div key={year} className="text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => selectYear(year)}
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center text-sm transition",
                          year === date.getFullYear()
                            ? "bg-purple-600 text-white"
                            : "text-gray-800 hover:bg-gray-100"
                        )}
                      >
                        {year}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-y-2 gap-x-4 max-h-[300px] overflow-y-auto pr-2">
                  {Array.from({ length: 12 }, (_, month) => (
                    <Button
                      type="button"
                      key={month}
                      variant="ghost"
                      onClick={() => selectMonth(month)}
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-sm transition",
                        month === date.getMonth()
                          ? "bg-purple-600 text-white"
                          : "text-gray-800 hover:bg-gray-100"
                      )}
                    >
                      {format(new Date(2000, month, 1), "MMM")}
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
