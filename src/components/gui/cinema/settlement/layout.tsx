"use client";

import { useQuerySettlementList } from "@/app/hooks/cinema/use-query-settlement";
import { DateRangePicker } from "@/components/date-range-picker";
import { SearchModeToolbar } from "@/components/search-mode-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { generateSettlement } from "./generate-settlement";
import { SettlementRow } from "./settlement-row";
import SkeletonTableList from "@/components/skeleton-table-list";

export function SettlementLayout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offset = Number(searchParams.get("offset") || 0);
  const limit = 30;
  const now = new Date();
  const defaultStartDate = startOfMonth(now).toISOString();
  const defaultEndDate = endOfMonth(now).toISOString();

  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(defaultStartDate),
    to: new Date(defaultEndDate),
  });
  const [isSettledFilter, setIsSettledFilter] = useState<
    "all" | "settled" | "unsettled"
  >("all");

  const isSettled =
    isSettledFilter === "all"
      ? undefined
      : isSettledFilter === "settled"
        ? true
        : false;

  const { data, isLoading, mutate } = useQuerySettlementList({
    limit,
    offset,
    startDate: date?.from ? format(date.from, "yyyy-MM-dd") : undefined,
    endDate: date?.to ? `${format(date.to, "yyyy-MM-dd")} 23:59:59` : undefined,
    isSettled,
  });

  const onClickAdd = useCallback(async () => {
    const res = await generateSettlement.show({});
    if (res) {
      mutate();
    }
  }, [mutate]);

  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    setDate(dateRange);
  };

  const handlePageChange = (newOffset: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("offset", String(newOffset));
    router.push(`?${params.toString()}`);
  };

  const totalPages = data?.result?.total || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPageCount = Math.ceil(totalPages / limit);

  const headerRight = useMemo(() => {
    return (
      <div className="flex flex-row items-center gap-2">
        <Select
          value={isSettledFilter}
          onValueChange={(value) =>
            setIsSettledFilter(value as "all" | "settled" | "unsettled")
          }
        >
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="settled">Settled</SelectItem>
            <SelectItem value="unsettled">Unsettled</SelectItem>
          </SelectContent>
        </Select>
        <DateRangePicker
          dateRange={date}
          onChange={handleDateRangeChange}
          className="w-full"
        />
        <Button size="sm" onClick={onClickAdd} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Generate Settlement
        </Button>
      </div>
    );
  }, [onClickAdd, date, isSettledFilter]);

  return (
    <div className="w-full flex flex-col gap-4 relative">
      <SearchModeToolbar
        text="Settlement Management"
        headerRight={headerRight}
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <SkeletonTableList />;
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Movie</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Settled At</TableHead>
                  <TableHead>Settled By</TableHead>
                  <TableHead>Proof</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.result?.data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No settlements found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.result?.data.map((settlement, index) => (
                    <SettlementRow
                      key={settlement.id}
                      settlement={settlement}
                      index={offset + index + 1}
                      onSuccessAction={mutate}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {!isLoading && data?.result?.data && data.result.data.length > 0 && (
          <CardFooter className="flex items-center justify-between border-t px-6 py-4">
            <div className="text-xs text-muted-foreground">
              Showing{" "}
              <strong>
                {offset + 1}-{Math.min(offset + limit, totalPages)}
              </strong>{" "}
              of <strong>{totalPages}</strong> settlements
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(0, offset - limit))}
                disabled={offset === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPageCount}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(offset + limit)}
                disabled={offset + limit >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
