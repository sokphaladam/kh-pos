"use client";

import { useQueryShowtimeReport } from "@/app/hooks/cinema/use-query-showtime";
import { DateRangePicker } from "@/components/date-range-picker";
import { useAuthentication } from "contexts/authentication-context";
import { endOfDay, startOfDay } from "date-fns";
import moment from "moment-timezone";
import { useCallback, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Clock,
  DollarSign,
  Download,
  Filter,
  SortAsc,
  SortDesc,
  Send,
} from "lucide-react";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { Button } from "@/components/ui/button";
import { onGetExportExcel } from "@/lib/export-xlsx";
import { ImageWithFallback } from "@/components/image-with-fallback";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryCinemaShowtimeSendEmail } from "@/app/hooks/report/use-query-cinema-showtime";
import { toast } from "sonner";

interface ShowtimeData {
  showDate: string;
  startTime: string;
  endTime: string;
  qty: number;
  totalPrice: number;
  modifier: number;
  discount: number;
  amount: number;
}

interface MovieData {
  totals: {
    qty: number;
    totalPrice: number;
    modifier: number;
    discount: number;
    amount: number;
  };
  showtimes: ShowtimeData[];
  images?: {
    image_url: string;
  };
}

interface ReportData {
  grand: {
    qty: number;
    totalPrice: number;
    modifier: number;
    discount: number;
    amount: number;
  };
  [movieTitle: string]:
    | MovieData
    | {
        qty: number;
        totalPrice: number;
        modifier: number;
        discount: number;
        amount: number;
      };
}

type SortOption = "showtime" | "tickets" | "amount";
type SortOrder = "asc" | "desc";

export default function AdminCinemaShowtimeReportPage() {
  const { currentWarehouse } = useAuthentication();
  const { formatForDisplay } = useCurrencyFormat();
  const today = new Date();
  const [expandedMovies, setExpandedMovies] = useState<string[]>([]);

  // Sorting and filtering state
  const [sortBy, setSortBy] = useState<SortOption>("showtime");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterMinTickets, setFilterMinTickets] = useState<string>("");
  const [filterMinAmount, setFilterMinAmount] = useState<string>("");
  const [searchMovie, setSearchMovie] = useState<string>("");

  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(today),
    to: endOfDay(today),
  });

  const filterParams = useMemo(() => {
    return {
      startDate: dateRange.from
        ? moment(dateRange.from).format("YYYY-MM-DD")
        : "",
      endDate: dateRange.to ? moment(dateRange.to).format("YYYY-MM-DD") : "",
      warehouseId: currentWarehouse?.id || "",
    };
  }, [dateRange, currentWarehouse]);

  const { data, isLoading } = useQueryShowtimeReport(filterParams);
  const { trigger, isMutating } = useQueryCinemaShowtimeSendEmail();
  const reportData = useMemo(() => data?.result || {}, [data]) as ReportData;

  const toggleMovieExpansion = (movieTitle: string) => {
    setExpandedMovies((prev) =>
      prev.includes(movieTitle)
        ? prev.filter((title) => title !== movieTitle)
        : [...prev, movieTitle],
    );
  };

  const movieEntries = useMemo(() => {
    let entries = Object.entries(reportData).filter(([key]) => key !== "grand");

    // Apply search filter
    if (searchMovie.trim()) {
      entries = entries.filter(([movieTitle]) =>
        movieTitle.toLowerCase().includes(searchMovie.toLowerCase()),
      );
    }

    // Apply minimum tickets filter
    if (filterMinTickets.trim()) {
      const minTickets = parseInt(filterMinTickets);
      if (!isNaN(minTickets)) {
        entries = entries.filter(
          ([, movieData]) => (movieData as MovieData).totals.qty >= minTickets,
        );
      }
    }

    // Apply minimum amount filter
    if (filterMinAmount.trim()) {
      const minAmount = parseFloat(filterMinAmount);
      if (!isNaN(minAmount)) {
        entries = entries.filter(
          ([, movieData]) =>
            (movieData as MovieData).totals.amount >= minAmount,
        );
      }
    }

    // Apply sorting
    entries.sort(([, aData], [, bData]) => {
      const a = aData as MovieData;
      const b = bData as MovieData;

      let comparison = 0;

      switch (sortBy) {
        case "showtime":
          comparison = a.showtimes.length - b.showtimes.length;
          break;
        case "tickets":
          comparison = a.totals.qty - b.totals.qty;
          break;
        case "amount":
          comparison = a.totals.amount - b.totals.amount;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return entries;
  }, [
    reportData,
    sortBy,
    sortOrder,
    filterMinTickets,
    filterMinAmount,
    searchMovie,
  ]);

  const handleExportToExcel = () => {
    if (!reportData || movieEntries.length === 0) return;

    // Prepare data for Excel export
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const excelData: any[] = [];

    // Add grand totals
    excelData.push({
      Type: "GRAND TOTAL",
      Movie: "ALL MOVIES",
      "Show Date": "",
      "Start Time": "",
      "End Time": "",
      "Tickets Qty": reportData.grand.qty,
      "Total Price": reportData.grand.totalPrice,
      Modifier: reportData.grand.modifier,
      Discount: reportData.grand.discount,
      "Final Amount": reportData.grand.amount,
    });

    // Add empty row for separation
    excelData.push({});

    // Add movie data with showtimes
    movieEntries.forEach(([movieTitle, movieData]) => {
      const typedMovieData = movieData as MovieData;

      // Add movie totals
      excelData.push({
        Type: "MOVIE TOTAL",
        Movie: movieTitle,
        "Show Date": "",
        "Start Time": "",
        "End Time": "",
        "Tickets Qty": typedMovieData.totals.qty,
        "Total Price": typedMovieData.totals.totalPrice,
        Modifier: typedMovieData.totals.modifier,
        Discount: typedMovieData.totals.discount,
        "Final Amount": typedMovieData.totals.amount,
      });

      // Add showtime details
      typedMovieData.showtimes.forEach((showtime) => {
        excelData.push({
          Type: "SHOWTIME",
          Movie: movieTitle,
          "Show Date": moment(showtime.showDate).format("YYYY-MM-DD"),
          "Start Time": moment(showtime.startTime).format("HH:mm"),
          "End Time": moment(showtime.endTime).format("HH:mm"),
          "Tickets Qty": showtime.qty,
          "Total Price": showtime.totalPrice,
          Modifier: showtime.modifier,
          Discount: showtime.discount,
          "Final Amount": showtime.amount,
        });
      });

      // Add empty row between movies
      excelData.push({});
    });

    // Export to Excel
    const dateRangeText = `${moment(dateRange.from).format("YYYY-MM-DD")} to ${moment(dateRange.to).format("YYYY-MM-DD")}`;
    onGetExportExcel(
      excelData,
      `Cinema-Sales-Report-${dateRangeText}`,
      "Cinema Sales Report",
      {
        title: `Cinema Sales Report (${dateRangeText})`,
        boldRows: ["GRAND TOTAL", "MOVIE TOTAL"],
      },
    );
  };

  const handleSendEmail = useCallback(() => {
    trigger({
      date: filterParams.startDate,
    })
      .then((res) => {
        console.log("Email send response:", res);
        if (res.success) {
          toast.success("Email sent successfully!");
        } else {
          toast.error("Failed to send email.");
        }
      })
      .catch(() => {
        toast.error("An error occurred while sending email.");
      });
  }, [filterParams.startDate, trigger]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      {!!isMutating && (
        <div className="fixed top-0 bottom-0 left-0 right-0 bg-gray-500/80 text-white flex items-center justify-center z-50">
          <div className="flex flex-col items-center justify-center animate-bounce">
            <Send className="h-8 w-8 mb-4" />
            <span className="text-lg">Preparing send to email...</span>
          </div>
        </div>
      )}
      {/* Header and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Cinema Sales Report
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Sales breakdown by movie and showtime
            </p>
          </div>

          {!isLoading && movieEntries.length > 0 && (
            <div className="flex flex-row gap-2">
              {filterParams.startDate && (
                <Button
                  onClick={handleSendEmail}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={isMutating || isLoading}
                >
                  <Send className="h-4 w-4" />
                  Send Email
                </Button>
              )}
              <Button
                onClick={handleExportToExcel}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={isMutating || isLoading}
              >
                <Download className="h-4 w-4" />
                Export to Excel
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <DateRangePicker
                dateRange={dateRange}
                onChange={(range) => setDateRange(range)}
                className="w-full sm:w-auto"
              />
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label
                htmlFor="search-movie"
                className="text-sm font-medium text-gray-700"
              >
                Search Movie
              </Label>
              <Input
                id="search-movie"
                type="text"
                placeholder="Search by movie title..."
                value={searchMovie}
                onChange={(e) => setSearchMovie(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label
                htmlFor="min-tickets"
                className="text-sm font-medium text-gray-700"
              >
                Min Tickets
              </Label>
              <Input
                id="min-tickets"
                type="number"
                placeholder="Min tickets sold"
                value={filterMinTickets}
                onChange={(e) => setFilterMinTickets(e.target.value)}
                className="mt-1"
                min="0"
              />
            </div>

            <div>
              <Label
                htmlFor="min-amount"
                className="text-sm font-medium text-gray-700"
              >
                Min Amount
              </Label>
              <Input
                id="min-amount"
                type="number"
                placeholder="Min amount"
                value={filterMinAmount}
                onChange={(e) => setFilterMinAmount(e.target.value)}
                className="mt-1"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">
                Sort By
              </Label>
              <div className="flex gap-2 mt-1">
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as SortOption)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="showtime">Showtime Count</SelectItem>
                    <SelectItem value="tickets">Ticket Qty</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="px-3"
                >
                  {sortOrder === "asc" ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(searchMovie ||
            filterMinTickets ||
            filterMinAmount ||
            sortBy !== "showtime" ||
            sortOrder !== "desc") && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Active Filters & Sorting
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-blue-700">
                {searchMovie && (
                  <span className="bg-white px-2 py-1 rounded border">
                    Movie: &quot;{searchMovie}&quot;
                  </span>
                )}
                {filterMinTickets && (
                  <span className="bg-white px-2 py-1 rounded border">
                    Min Tickets: {filterMinTickets}
                  </span>
                )}
                {filterMinAmount && (
                  <span className="bg-white px-2 py-1 rounded border">
                    Min Amount: {filterMinAmount}
                  </span>
                )}
                <span className="bg-white px-2 py-1 rounded border">
                  Sort:{" "}
                  {sortBy === "showtime"
                    ? "Showtime Count"
                    : sortBy === "tickets"
                      ? "Tickets"
                      : "Amount"}
                  ({sortOrder === "asc" ? "Low to High" : "High to Low"})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchMovie("");
                    setFilterMinTickets("");
                    setFilterMinAmount("");
                    setSortBy("showtime");
                    setSortOrder("desc");
                  }}
                  className="h-6 px-2 text-blue-600 hover:text-blue-800"
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <span className="ml-2 text-gray-600">Loading report data...</span>
        </div>
      )}

      {/* Grand Total Summary */}
      {!isLoading && reportData.grand && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <DollarSign className="h-5 w-5" />
              Grand Total Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-900">
                  {reportData.grand.qty}
                </p>
                <p className="text-sm text-blue-700">Total Tickets</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-900">
                  {formatForDisplay(reportData.grand.totalPrice)}
                </p>
                <p className="text-sm text-blue-700">Total Price</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-900">
                  {formatForDisplay(reportData.grand.modifier)}
                </p>
                <p className="text-sm text-blue-700">Modifiers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-900">
                  {formatForDisplay(reportData.grand.discount)}
                </p>
                <p className="text-sm text-blue-700">Discounts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-900">
                  {formatForDisplay(reportData.grand.amount)}
                </p>
                <p className="text-sm text-blue-700">Final Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Movies Breakdown */}
      {!isLoading && movieEntries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Sales by Movie ({movieEntries.length} movies)
            </h2>
            <div className="text-sm text-gray-500">
              Sorted by{" "}
              {sortBy === "showtime"
                ? "Showtime Count"
                : sortBy === "tickets"
                  ? "Tickets"
                  : "Amount"}
              ({sortOrder === "asc" ? "Low to High" : "High to Low"})
            </div>
          </div>

          {movieEntries.map(([movieTitle, movieData]) => {
            const isExpanded = expandedMovies.includes(movieTitle);
            const typedMovieData = movieData as MovieData;
            return (
              <Card key={movieTitle} className="overflow-hidden">
                <Collapsible>
                  <CollapsibleTrigger
                    onClick={() => toggleMovieExpansion(movieTitle)}
                    className="w-full"
                  >
                    <CardHeader className="hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                          <CardTitle className="text-left flex flex-row  items-center gap-4">
                            <ImageWithFallback
                              alt=""
                              src={typedMovieData.images?.image_url || ""}
                              width={65}
                              height={100}
                            />
                            {movieTitle}
                          </CardTitle>
                        </div>

                        <div className="grid grid-cols-3 md:grid-cols-5 gap-5 text-right">
                          <div>
                            <p className="font-bold">
                              {typedMovieData.showtimes.length}
                            </p>
                            <p className="text-sm text-gray-500">Showtimes</p>
                          </div>
                          <div>
                            <p className="font-bold">
                              {typedMovieData.totals.qty}
                            </p>
                            <p className="text-sm text-gray-500">Tickets</p>
                          </div>
                          <div>
                            <p className="font-bold">
                              {formatForDisplay(
                                typedMovieData.totals.totalPrice,
                              )}
                            </p>
                            <p className="text-sm text-gray-500">Total Price</p>
                          </div>
                          <div className="hidden md:block">
                            <p className="font-bold">
                              {formatForDisplay(typedMovieData.totals.discount)}
                            </p>
                            <p className="text-sm text-gray-500">Discounts</p>
                          </div>
                          <div>
                            <p className="font-bold">
                              {formatForDisplay(typedMovieData.totals.amount)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Final Amount
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3 text-gray-900">
                          Showtime Details
                        </h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-24">Date</TableHead>
                              <TableHead className="w-32">Start Time</TableHead>
                              <TableHead className="w-32">End Time</TableHead>
                              <TableHead className="w-20 text-right">
                                Ticket
                              </TableHead>
                              <TableHead className="w-24 text-right">
                                Total Price
                              </TableHead>
                              <TableHead className="w-24 text-right">
                                Modifier
                              </TableHead>
                              <TableHead className="w-24 text-right">
                                Discount
                              </TableHead>
                              <TableHead className="w-24 text-right">
                                Amount
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {typedMovieData.showtimes.map((showtime, index) => (
                              <TableRow
                                key={index}
                                className={
                                  showtime.qty > 0 ? "bg-green-50" : ""
                                }
                              >
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    {moment(showtime.showDate).format("MM/DD")}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    {moment(showtime.startTime).format("HH:mm")}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {moment(showtime.endTime).format("HH:mm")}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {showtime.qty}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatForDisplay(showtime.totalPrice)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatForDisplay(showtime.modifier)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatForDisplay(showtime.discount)}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatForDisplay(showtime.amount)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && movieEntries.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No sales data found</p>
              <p className="text-sm">
                No cinema sales were recorded for the selected date range.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
