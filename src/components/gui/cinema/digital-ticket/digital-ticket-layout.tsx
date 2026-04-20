"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Ticket,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  QrCode,
  Search,
  Clock,
  MapPin,
  Users,
  Film,
  RotateCcw,
  Printer,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import PrintTicketClient from "../../order/components/print-ticket-client";
import { requestReservationByCode } from "@/app/hooks/cinema/use-query-reservation";
import { SeatReservation } from "@/classes/cinema/reservation";
import moment from "moment";

const STATUS_STYLES: Record<string, { badge: string; label: string }> = {
  confirmed: {
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    label: "Confirmed",
  },
  pending: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    label: "Pending",
  },
  admitted: {
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    label: "Admitted",
  },
  cancelled: {
    badge: "bg-red-100 text-red-700 border-red-200",
    label: "Cancelled",
  },
  expired: {
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    label: "Expired",
  },
};

export function DigitalTicketLayout() {
  const refPrintTicket = useRef<HTMLButtonElement | null>(null);
  const [reservations, setReservations] = useState<SeatReservation[]>([]);
  const [searchResults, setSearchResults] = useState<SeatReservation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchType, setSearchType] = useState<"code" | "phone">("code");
  const [searchInput, setSearchInput] = useState("");
  const [lastProcessed, setLastProcessed] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<
    "idle" | "searching" | "results" | "success" | "error"
  >("idle");
  const [selectedReservation, setSelectedReservation] =
    useState<SeatReservation | null>(null);

  const handleSearch = () => {
    const input = searchInput.trim();
    if (!input) {
      toast.error(
        `Please enter a ${searchType === "code" ? "ticket code" : "customer phone number"}`,
      );
      return;
    }

    setIsLoading(true);
    setProcessingStatus("searching");
    setSearchResults([]);

    const searchParams =
      searchType === "code" ? { code: input } : { customerPhone: input };

    requestReservationByCode(searchParams)
      .then((res) => {
        if (res.result && Array.isArray(res.result) && res.result.length > 0) {
          setSearchResults(res.result);
          setLastProcessed(input);
          setProcessingStatus("results");
          toast.success(`Found ${res.result.length} reservation(s)`);
        } else {
          setProcessingStatus("error");
          toast.error(
            `No reservations found for ${searchType === "code" ? "ticket code" : "phone number"}: ${input}`,
          );
        }
      })
      .catch((error) => {
        console.error("Error searching reservations:", error);
        setProcessingStatus("error");
        toast.error("Failed to search reservations. Please try again.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleSelectReservation = (reservation: SeatReservation) => {
    setSelectedReservation(reservation);
    setReservations([reservation]);
    setProcessingStatus("success");
    setTimeout(() => refPrintTicket.current?.click(), 100);
    toast.success("Printing ticket...");
  };

  const resetSearch = () => {
    setSearchInput("");
    setSearchResults([]);
    setSelectedReservation(null);
    setProcessingStatus("idle");
    setReservations([]);
    setLastProcessed(null);
  };

  const statusStyle = (status: string) =>
    STATUS_STYLES[status] ?? STATUS_STYLES["expired"];

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm flex-shrink-0">
          <Ticket className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-semibold leading-tight">
            Find Ticket
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Search by ticket code or customer phone to print tickets
          </p>
        </div>
      </div>

      {/* ── Search Panel ── */}
      <Card className="shadow-sm">
        <CardContent className="pt-5 pb-5 space-y-4">
          {/* Search type tabs */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg w-full sm:w-fit">
            <button
              onClick={() => {
                setSearchType("code");
                resetSearch();
              }}
              disabled={isLoading}
              className={`flex flex-1 sm:flex-none items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                searchType === "code"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              Ticket Code
            </button>
            <button
              onClick={() => {
                setSearchType("phone");
                resetSearch();
              }}
              disabled={isLoading}
              className={`flex flex-1 sm:flex-none items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                searchType === "phone"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Phone className="h-3.5 w-3.5" />
              Phone Number
            </button>
          </div>

          {/* Input row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              {searchType === "code" ? (
                <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              ) : (
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              )}
              <Input
                id="search-input"
                type="text"
                placeholder={
                  searchType === "code"
                    ? "Enter ticket code (e.g., ABC123)…"
                    : "Enter phone number…"
                }
                className="pl-9 h-11"
                autoComplete="off"
                value={searchInput}
                disabled={isLoading}
                onChange={(e) => {
                  if (searchType === "phone") {
                    // Allow only digits, spaces, dashes, parentheses, and plus sign for phone input
                    const normalized = /^[1-9]/.test(e.target.value)
                      ? "0" + e.target.value
                      : e.target.value;

                    setSearchInput(normalized);
                  } else {
                    setSearchInput(e.target.value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) handleSearch();
                }}
                autoFocus
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading || !searchInput.trim()}
              className="h-11 px-3 sm:px-5"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="hidden sm:inline ml-2">
                {isLoading ? "Searching…" : "Search"}
              </span>
            </Button>
            {processingStatus !== "idle" && (
              <Button
                variant="outline"
                onClick={resetSearch}
                disabled={isLoading}
                className="h-11 px-3 sm:px-4"
                title="New search"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Inline status feedback */}
          {processingStatus === "searching" && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
              <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
              Searching for reservations…
            </div>
          )}
          {processingStatus === "error" && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              No reservations found for &quot;{lastProcessed}&quot;. Check the{" "}
              {searchType === "code" ? "ticket code" : "phone number"} and try
              again.
            </div>
          )}
          {processingStatus === "success" && selectedReservation && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-md">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              Ticket{" "}
              <span className="font-mono font-medium">
                {selectedReservation.code || selectedReservation.id}
              </span>{" "}
              sent to printer.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Search Results ── */}
      {processingStatus === "results" && searchResults.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <p className="text-sm font-medium">
              {searchResults.length} reservation
              {searchResults.length > 1 ? "s" : ""} found
              {lastProcessed && (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  for &quot;{lastProcessed}&quot;
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              Select a row to print
            </p>
          </div>

          <div className="space-y-2">
            {searchResults.map((reservation) => {
              const ss = statusStyle(reservation.status);
              const movieTitle =
                reservation.showtime?.variant?.at(0)?.basicProduct?.title;
              return (
                <button
                  key={reservation.id}
                  onClick={() => handleSelectReservation(reservation)}
                  className={`w-full text-left rounded-xl border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                    selectedReservation?.id === reservation.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                  }`}
                >
                  <div className="p-3 sm:p-4 flex items-start sm:items-center gap-3 sm:gap-4">
                    {/* Movie icon */}
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                      <Film className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">
                          {movieTitle ?? "—"}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs px-2 py-0 h-5 font-medium border ${ss.badge}`}
                        >
                          {ss.label}
                        </Badge>
                        {reservation.code && (
                          <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono text-muted-foreground">
                            {reservation.code}
                          </code>
                        )}
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4 text-xs text-muted-foreground flex-wrap">
                        {reservation.showtime?.startTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {moment(reservation.showtime.startTime).format(
                              "MMM D · HH:mm",
                            )}
                          </span>
                        )}
                        {reservation.showtime?.hall?.name && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {reservation.showtime.hall.name}
                          </span>
                        )}
                        {reservation.seat && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {reservation.seat.row}
                            {reservation.seat.column}
                            <span className="capitalize hidden sm:inline">
                              ({reservation.seat.type})
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price + action */}
                    <div className="flex-shrink-0 text-right space-y-1">
                      <div className="text-sm sm:text-base font-bold text-foreground">
                        ${reservation.price?.toFixed(2) ?? "0.00"}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                        <Printer className="h-3 w-3" />
                        <span className="hidden sm:inline">Print</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <Separator />
          <p className="text-xs text-muted-foreground">
            Booked on{" "}
            {moment(searchResults[0]?.createdAt).format("MMM D, YYYY")}
          </p>
        </div>
      )}

      {/* ── Idle empty state ── */}
      {processingStatus === "idle" && (
        <div className="flex flex-col items-center justify-center py-14 text-center text-muted-foreground space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <Search className="h-7 w-7 text-muted-foreground/60" />
          </div>
          <div>
            <p className="text-sm font-medium">Ready to scan</p>
            <p className="text-xs mt-1 max-w-xs">
              Enter a ticket code or customer&apos;s phone number above to find
              and print their reservation.
            </p>
          </div>
        </div>
      )}

      {/* Hidden Print Component */}
      <div className="hidden">
        <PrintTicketClient reservations={reservations} ref={refPrintTicket} />
      </div>
    </div>
  );
}
