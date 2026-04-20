import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, ChevronDown, ChevronRight } from "lucide-react";
import moment from "moment-timezone";
import React, { useState } from "react";

interface GuestNumberData {
  type: string;
  date: string | null;
  hour: string | null;
  total_guests: number;
}

export function GuestNumberTable({ data }: { data: GuestNumberData[] }) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Group data by type and date
  const guestTotal = data.find((item) => item.type === "guest_total");
  const guestDates = data.filter((item) => item.type === "guest_date");
  const guestTimes = data.filter((item) => item.type === "guest_time");

  // Group guest_time data by date
  const timesByDate = guestTimes.reduce((acc, item) => {
    const date = item.date || "";
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, GuestNumberData[]>);

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  // Calculate total records including expanded time entries
  const totalRecords =
    guestDates.length +
    Array.from(expandedDates).reduce(
      (sum, date) => sum + (timesByDate[date]?.length || 0),
      0
    ) +
    (guestTotal ? 1 : 0);

  return (
    <Card>
      <CardHeader className="border-b bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Guest Number Details
            </CardTitle>
            <CardDescription>
              Detailed breakdown by date and time (click daily totals to expand)
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-sm">
            {totalRecords} records
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Time</TableHead>
                <TableHead className="font-semibold text-right">
                  Guests
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Show guest_total first if exists */}
              {guestTotal && (
                <TableRow className="bg-red-50/50 font-bold border-b-4 border-red-200">
                  <TableCell className="pl-8">
                    <Badge
                      variant="destructive"
                      className="bg-red-100 text-red-700"
                    >
                      Grand Total
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {guestTotal.date || "-"}
                  </TableCell>
                  <TableCell>-</TableCell>
                  <TableCell className="text-right font-semibold">
                    <span className="text-red-700 text-xl font-bold">
                      {guestTotal.total_guests.toLocaleString()}
                    </span>
                  </TableCell>
                </TableRow>
              )}

              {/* Show guest_date rows with collapsible functionality */}
              {guestDates.map((dateItem, index) => {
                const isExpanded = expandedDates.has(dateItem.date || "");
                const timesForDate = timesByDate[dateItem.date || ""] || [];

                return (
                  <React.Fragment key={`date-${index}`}>
                    {/* Daily total row (clickable) */}
                    <TableRow
                      className="bg-blue-50/30 font-medium border-b-2 cursor-pointer hover:bg-blue-100/40 transition-colors"
                      onClick={() => toggleDate(dateItem.date || "")}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {timesForDate.length > 0 &&
                            (isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-blue-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-blue-600" />
                            ))}
                          <Badge
                            variant="default"
                            className="bg-blue-100 text-blue-700"
                          >
                            Daily Total
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {dateItem.date || "-"}
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-right font-semibold">
                        <span className="text-blue-700 text-lg">
                          {dateItem.total_guests.toLocaleString()}
                        </span>
                      </TableCell>
                    </TableRow>

                    {/* Hourly detail rows (shown only when expanded) */}
                    {isExpanded &&
                      timesForDate.map((timeItem, timeIndex) => (
                        <TableRow
                          key={`time-${index}-${timeIndex}`}
                          className="hover:bg-gray-50 border-l-4 border-l-blue-200"
                        >
                          <TableCell className="pl-8">
                            <Badge
                              variant="secondary"
                              className="bg-gray-100 text-gray-600"
                            >
                              Hourly
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium pl-4">
                            {timeItem.date || "-"}
                          </TableCell>
                          <TableCell>
                            {timeItem.hour
                              ? moment(timeItem.hour, "HH:mm:ss").format(
                                  "h:mm A"
                                )
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            <span className="text-gray-900">
                              {timeItem.total_guests.toLocaleString()}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                  </React.Fragment>
                );
              })}

              {data.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-gray-500"
                  >
                    No guest data available for the selected date range
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
