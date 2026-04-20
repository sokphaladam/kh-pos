"use client";

import { SearchModeToolbar } from "@/components/search-mode-toolbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCallback, useMemo, useState } from "react";
import { bookingForm } from "./form";
import {
  useQueryBooking,
  useMutationDeleteBooking,
} from "@/app/hooks/accounting/use-query-booking";
import { DateRange } from "react-day-picker";
import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Pagination } from "@/components/pagination";
import { useSearchParams } from "next/navigation";
import SkeletonTableList from "@/components/skeleton-table-list";
import { toast } from "sonner";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { useCommonDialog } from "@/components/common-dialog";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { Formatter } from "@/lib/formatter";
import { DateRangePicker } from "@/components/date-range-picker";
import { TrendingUp, TrendingDown, Scale, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type AccountTypeFilter = "all" | "expense" | "revenue";

export function BookingLayout() {
  const searchParams = useSearchParams();
  const offset = Number(searchParams.get("offset") || 0);
  const limit = 30;
  const { formatForDisplay } = useCurrencyFormat();
  const now = new Date();
  const defaultStartDate = startOfMonth(now).toISOString();
  const defaultEndDate = endOfMonth(now).toISOString();

  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(defaultStartDate),
    to: new Date(defaultEndDate),
  });
  const [accountTypeFilter, setAccountTypeFilter] =
    useState<AccountTypeFilter>("all");

  const { showDialog } = useCommonDialog();

  const startDate = date?.from ? format(date.from, "yyyy-MM-dd") : undefined;
  const endDate = date?.to
    ? `${format(date.to, "yyyy-MM-dd")} 23:59:59`
    : undefined;

  // Main paginated query (respects type filter)
  const { data, isLoading, mutate } = useQueryBooking({
    limit,
    offset,
    startDate,
    endDate,
    accountType: accountTypeFilter === "all" ? undefined : accountTypeFilter,
  });

  const { trigger: deleteTrigger, isMutating: isDeleting } =
    useMutationDeleteBooking();

  const { totalRevenue, totalExpense, netProfit } = useMemo(() => {
    return {
      totalRevenue: data?.result?.summary.total_revenue || 0,
      totalExpense: data?.result?.summary.total_expense || 0,
      totalCount: data?.result?.summary.total_count || 0,
      netProfit: data?.result?.summary.total_amount || 0,
    };
  }, [data]);

  const onClickAdd = useCallback(async () => {
    const res = await bookingForm.show({});
    if (res) {
      mutate();
    }
  }, [mutate]);

  const onClickDelete = useCallback(
    async (id: string) => {
      await showDialog({
        title: "Delete Booking Entry",
        content: "Are you sure you want to delete this booking entry?",
        actions: [
          {
            onClick: async () => {
              try {
                const result = await deleteTrigger({ id });
                if (result.success) {
                  toast.success("Booking entry deleted successfully");
                  mutate();
                } else {
                  toast.error("Failed to delete booking entry");
                }
              } catch {
                toast.error("An error occurred while deleting");
              }
            },
            text: "Delete",
          },
        ],
      });
    },
    [deleteTrigger, showDialog, mutate],
  );

  const headerRight = useMemo(() => {
    return (
      <div className="flex flex-row items-center gap-2">
        <DateRangePicker
          dateRange={date}
          onChange={setDate}
          className="w-full"
        />
        <Button size="sm" onClick={onClickAdd} disabled={isDeleting}>
          <Plus className="w-4 h-4 mr-1" />
          Create New
        </Button>
      </div>
    );
  }, [onClickAdd, isDeleting, date]);

  const bookings = data?.result?.data || [];
  const total = data?.result?.summary.total_count || 0;

  const filterButtons: { label: string; value: AccountTypeFilter }[] = [
    { label: "All", value: "all" },
    { label: "Revenue", value: "revenue" },
    { label: "Expense", value: "expense" },
  ];

  return (
    <div className="w-full flex flex-col gap-4 relative">
      <SearchModeToolbar text="Account Booking" headerRight={headerRight} />

      {/* P&L Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className=" dark:bg-emerald-950/20 dark:border-emerald-800">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  Total Revenue
                </p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                  {formatForDisplay(totalRevenue)}
                </p>
              </div>
              <div className="rounded-full bg-emerald-100 dark:bg-emerald-900 p-2">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className=" dark:bg-rose-950/20 dark:border-rose-800">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                  Total Expense
                </p>
                <p className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-1">
                  {formatForDisplay(totalExpense)}
                </p>
              </div>
              <div className="rounded-full bg-rose-100 dark:bg-rose-900 p-2">
                <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "border",
            netProfit >= 0
              ? "dark:bg-blue-950/20 dark:border-blue-800"
              : "dark:bg-orange-950/20 dark:border-rose-800",
          )}
        >
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={cn(
                    "text-xs font-medium uppercase tracking-wide",
                    netProfit >= 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-rose-700 dark:text-rose-300",
                  )}
                >
                  {netProfit >= 0 ? "Net Profit" : "Net Loss"}
                </p>
                <p
                  className={cn(
                    "text-xl font-bold mt-1",
                    netProfit >= 0
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-rose-700 dark:text-rose-300",
                  )}
                >
                  {formatForDisplay(netProfit)}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-full p-2",
                  netProfit >= 0
                    ? "bg-blue-100 dark:bg-blue-900"
                    : "bg-rose-100 dark:bg-rose-900",
                )}
              >
                <Scale
                  className={cn(
                    "w-5 h-5",
                    netProfit >= 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-rose-600 dark:text-rose-400",
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base">Account Booking</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                View and manage your accounting bookings
              </CardDescription>
            </div>
            {/* Type Filter */}
            <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
              {filterButtons.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setAccountTypeFilter(value)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                    accountTypeFilter === value
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <SkeletonTableList />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-nowrap text-xs w-[120px]">
                    Date
                  </TableHead>
                  <TableHead className="text-nowrap text-xs">Account</TableHead>
                  <TableHead className="text-nowrap text-xs w-[90px]">
                    Type
                  </TableHead>
                  <TableHead className="text-nowrap text-xs text-right w-[140px]">
                    Amount
                  </TableHead>
                  <TableHead className="text-nowrap text-xs">
                    Description
                  </TableHead>
                  <TableHead className="text-nowrap text-xs w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-12 text-sm"
                    >
                      No booking entries found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking) => {
                    const isRevenue =
                      booking.account?.accountType === "revenue";
                    return (
                      <TableRow key={booking.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {booking.createdAt
                            ? Formatter.date(booking.createdAt)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {booking.account?.accountName || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-medium capitalize",
                              isRevenue
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                : "border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
                            )}
                          >
                            {booking.account?.accountType || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right text-sm font-mono font-semibold",
                            isRevenue
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400",
                          )}
                        >
                          {formatForDisplay(booking.amount)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate">
                          {booking.description || "—"}
                        </TableCell>
                        <TableCell>
                          <BasicMenuAction
                            value={booking}
                            disabled={isDeleting}
                            onDelete={() => onClickDelete(booking.id)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="border-t pt-3">
          <Pagination
            limit={limit}
            offset={offset}
            total={total}
            totalPerPage={bookings.length}
            text="entries"
          />
        </CardFooter>
      </Card>
    </div>
  );
}
