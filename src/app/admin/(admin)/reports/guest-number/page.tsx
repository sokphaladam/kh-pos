"use client";

import React, { useState, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { startOfDay, endOfDay } from "date-fns";
import moment from "moment-timezone";
import { Users } from "lucide-react";
import { useQueryGuestNumberOrderReport } from "@/app/hooks/user-query-report";
import { ReportHeader } from "@/components/report/report-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { onGetExportExcel } from "@/lib/export-xlsx";
import { GuestNumberSkeleton } from "./components/guest-number-skeleton";
import { GuestSummaryCards } from "./components/guest-summary";
import { GuestNumberTable } from "./components/guest-number-table";

// Types for the guest number report data
interface GuestNumberData {
  type: string;
  date: string | null;
  hour: string | null;
  total_guests: number;
}

export default function GuestNumberReportPage() {
  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(today),
    to: endOfDay(today),
  });

  const filterParams = useMemo(() => {
    return {
      startDate: dateRange.from
        ? moment(dateRange.from).format("YYYY-MM-DD")
        : "",
      endDate: dateRange.to
        ? `${moment(dateRange.to).format("YYYY-MM-DD")} 23:59:59`
        : "",
    };
  }, [dateRange]);

  const { data, isLoading, mutate } =
    useQueryGuestNumberOrderReport(filterParams);

  const reportData = (data?.result || []) as GuestNumberData[];

  const handleExportToExcel = async () => {
    if (!reportData || reportData.length === 0) {
      alert("No data to export");
      return;
    }

    // Transform data for Excel export
    const excelData = (reportData as GuestNumberData[]).map(
      (item: GuestNumberData) => ({
        Type:
          item.type === "guest_total"
            ? "GRAND TOTAL"
            : item.type === "guest_date"
            ? "Daily Summary"
            : "Hourly Detail",
        Date: item.date || "",
        Time: item.hour ? moment(item.hour, "HH:mm:ss").format("h:mm A") : "",
        "Total Guests": item.total_guests,
      })
    );

    const filename = `Guest-Number-Report-${moment(dateRange.from).format(
      "YYYY-MM-DD"
    )}-to-${moment(dateRange.to).format("YYYY-MM-DD")}-${Date.now()}`;

    await onGetExportExcel(
      excelData,
      filename,
      `Guest Number Report From ${moment(dateRange.from).format(
        "YYYY-MM-DD"
      )} to ${moment(dateRange.to).format("YYYY-MM-DD")}`,
      {
        boldRows: ["GRAND TOTAL", "Daily Summary"],
        title: `Guest Number Report From ${moment(dateRange.from).format(
          "YYYY-MM-DD"
        )} to ${moment(dateRange.to).format("YYYY-MM-DD")}`,
      }
    );
  };

  const handleRefresh = () => {
    mutate();
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <ReportHeader
        title="Guest Number Report"
        description="Track guest count patterns and trends over time"
        icon={Users}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onRefresh={handleRefresh}
        onExport={handleExportToExcel}
        isLoading={isLoading}
        hasData={reportData.length > 0}
      />

      {isLoading ? (
        <GuestNumberSkeleton />
      ) : (
        <div className="space-y-6">
          {reportData.length > 0 ? (
            <>
              <GuestSummaryCards data={reportData} />
              <GuestNumberTable data={reportData} />
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Guest Data Available
                </h3>
                <p className="text-gray-600 mb-4">
                  No guest number data found for the selected date range.
                </p>
                <Button onClick={handleRefresh} variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
