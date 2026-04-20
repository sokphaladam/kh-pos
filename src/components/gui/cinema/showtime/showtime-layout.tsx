"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CalendarViewTimeline } from "./timeline/calendar-view-timeline";
import { useCallback, useState, useEffect } from "react";
import { Clock, Info, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useMutationCreateShowtime,
  useMutationUpdateShowtime,
  useMutationDeleteShowtime,
  useQueryShowtimeList,
} from "@/app/hooks/cinema/use-query-showtime";
import { toast } from "sonner";
import moment from "moment-timezone";
import { Showtime } from "@/classes/cinema/showtime";
import { useCommonDialog } from "@/components/common-dialog";
import { Formatter } from "@/lib/formatter";
import { useWindowSize } from "@/components/use-window-size";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useAuthentication } from "contexts/authentication-context";
import { posterPreviewDialog } from "./poster/poster-preview-dialog";

export const SHOWTIME_TYPE = {
  scheduled:
    "bg-blue-500/60 text-white border-blue-500/70 focus:ring-blue-400 shadow-blue-500/20",
  selling:
    "bg-green-500/60 text-white border-green-500/70 focus:ring-green-400 shadow-green-500/20",
  sold_out:
    "bg-red-500/60 text-white border-red-500/70 focus:ring-red-400 shadow-red-500/20",
  started:
    "bg-yellow-500/60 text-white border-yellow-500/70 focus:ring-yellow-400 shadow-yellow-500/20",
  ended:
    "bg-slate-500/60 text-white border-slate-500/70 focus:ring-slate-400 shadow-slate-500/20",
  cancelled:
    "bg-rose-800/60 text-white border-rose-800/70 focus:ring-rose-400 shadow-rose-800/20 opacity-75 line-through",
};

export function ShowttimeLayout() {
  const isMobile = useIsMobile();
  const { width } = useWindowSize();
  const { showDialog } = useCommonDialog();
  const { currentWarehouse, setting } = useAuthentication();
  const router = useRouter();
  const searchParams = useSearchParams();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const today = new Date();

  // Initialize selectedDate from search params or use today as fallback
  const getInitialDate = useCallback(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      const parsedDate = new Date(dateParam);
      // Validate the parsed date
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    return today;
  }, [searchParams, today]);

  const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate());

  // Update URL when selectedDate changes
  useEffect(() => {
    const currentDate = format(selectedDate, "yyyy-MM-dd");
    const urlParams = new URLSearchParams(searchParams.toString());

    if (urlParams.get("date") !== currentDate) {
      urlParams.set("date", currentDate);
      router.replace(`?${urlParams.toString()}`, { scroll: false });
    }
  }, [selectedDate, searchParams, router]);

  const { data, isLoading, mutate } = useQueryShowtimeList(
    100,
    0,
    undefined,
    Formatter.date(selectedDate) || "",
  );
  const create = useMutationCreateShowtime();
  const update = useMutationUpdateShowtime();
  const deleteShowtime = useMutationDeleteShowtime();

  const onAddShowtimeAction = useCallback(
    (showtime: Showtime) => {
      const date = moment(showtime.showDate).format("YYYY-MM-DD");
      const input = {
        hallId: showtime.hallId || "",
        movieId: showtime.movieId || "",
        showDate: date,
        startTime: showtime.startTime,
        endTime: showtime.endTime,
        availableSeats: showtime.availableSeats || 0,
        totalSeats: showtime.totalSeats || 0,
        basePrice: showtime.variant?.at(0)?.price || 0,
        status: "scheduled" as const,
        priceTemplateId: showtime.priceTemplateId || undefined,
      };

      create
        .trigger(input)
        .then((res) => {
          if (res.success) {
            mutate();
          } else {
            toast.error(`Error creating showtime`);
          }
        })
        .catch(() => {
          toast.error("Error creating showtime");
        });
    },
    [create, mutate],
  );

  const onUpdateShowtimeAction = useCallback(
    (updatedShowtime: Showtime) => {
      const date = moment(updatedShowtime.showDate).format("YYYY-MM-DD");
      const input = {
        showtimeId: updatedShowtime.showtimeId || "",
        hallId: updatedShowtime.hallId || "",
        movieId: updatedShowtime.movieId || "",
        showDate: date,
        startTime: updatedShowtime.startTime,
        endTime: updatedShowtime.endTime,
        availableSeats: updatedShowtime.availableSeats || 0,
        totalSeats: updatedShowtime.totalSeats || 0,
        basePrice: updatedShowtime.variant?.at(0)?.price || 0,
        status: updatedShowtime.status || ("scheduled" as const),
        priceTemplateId: updatedShowtime.priceTemplateId || undefined,
      };
      update
        .trigger(input)
        .then((res) => {
          if (res.success) {
            mutate();
          } else {
            toast.error(`Error updating showtime`);
          }
        })
        .catch(() => {
          toast.error("Error updating showtime");
        });
    },
    [update, mutate],
  );

  const onDeleteShowtimeAction = useCallback(
    (showtimeId: string) => {
      showDialog({
        title: "Delete Showtime",
        content: "Are you sure you want to delete this showtime?",
        destructive: true,
        actions: [
          {
            text: "Yes, Delete",
            onClick: async () => {
              deleteShowtime
                .trigger({ id: showtimeId })
                .then((res) => {
                  if (res.success) {
                    mutate();
                  } else {
                    toast.error("Error deleting showtime");
                  }
                })
                .catch(() => {
                  toast.error("Error deleting showtime");
                });
            },
          },
        ],
      });
    },
    [deleteShowtime, mutate, showDialog],
  );

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-background to-muted/20"
        role="main"
      >
        <div className="container mx-auto p-2 sm:p-4 space-y-4">
          <div className="flex flex-col space-y-4">
            {/* Header Skeleton */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-6 w-60 sm:w-80" />
                    <Skeleton className="h-3 w-48 sm:w-64" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <Skeleton className="h-8 w-48 sm:w-60" />
                <Skeleton className="h-5 w-24 sm:w-32" />
              </div>
            </div>

            {/* Timeline Skeleton */}
            <Card className="border-none shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-3 w-64 sm:w-96" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-md" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const showtimes = data?.result?.data || [];
  const hasError = data && !data.success;

  const todayShowtimes = showtimes.filter(
    (st) =>
      format(new Date(st.showDate), "yyyy-MM-dd") ===
      format(selectedDate, "yyyy-MM-dd"),
  );

  return (
    <div
      className={`max-w-[${isMobile ? width - 20 : width - 300}px]`}
      role="main"
      aria-labelledby="showtime-title"
      style={{
        width: isMobile ? width - 20 : width - 305,
      }}
    >
      <div className="container mx-auto p-2 sm:p-4 lg:p-6 space-y-4 lg:space-y-6">
        <div className="flex flex-col space-y-4 lg:space-y-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg border border-primary/20">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <h1
                    id="showtime-title"
                    className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text"
                  >
                    Cinema Showtime
                  </h1>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Manage movie showtimes
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 sm:gap-3">
              <div className="flex flex-row items-center xs:flex-row xs:items-center gap-2">
                <DatePicker
                  initialValue={selectedDate}
                  onChange={(date) => date && setSelectedDate(date)}
                  format="MMM d, yyyy"
                  label=""
                  className="min-w-[180px] sm:min-w-[220px] text-sm"
                />

                <div
                  className={cn(
                    "px-2 py-1 text-xs font-medium shadow-sm flex flex-row gap-2 items-center rounded-md border border-border bg-secondary-foreground text-secondary",
                  )}
                >
                  <Info className="h-3 w-3 mr-1" />
                  {todayShowtimes.length}

                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      const logo = setting?.data?.result
                        ?.find((f) => f.option === "INVOICE_RECEIPT")
                        ?.value?.split(",")[2];

                      posterPreviewDialog.show({
                        showtimes: todayShowtimes,
                        selectedDate,
                        warehouseName: currentWarehouse?.name || "CAMBO CINEMA",
                        logoUrl: logo || currentWarehouse?.image,
                        phone: currentWarehouse?.phone || "",
                      });
                    }}
                    className="gap-1.5"
                    disabled={todayShowtimes.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Generate Poster</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Error State */}
          {hasError && (
            <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Failed to load showtimes. Please try refreshing the page or
                contact support if the problem persists.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center mt-4 md:mt-8 px-4">
            <div className="space-y-2">
              <div className="text-[8px] md:text-[10px] text-center uppercase tracking-widest text-muted-foreground font-bold">
                LEGEND
              </div>
              <div className="grid grid-cols-2 md:flex md:flex-row gap-2 md:gap-3 text-[10px] md:text-[10px] tracking-widest text-muted-foreground font-bold">
                {Object.keys(SHOWTIME_TYPE).map((key) => {
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-1 md:gap-2 text-[9px] md:text-[10px]"
                    >
                      <div
                        className={cn(
                          "w-2.5 h-2.5 md:w-3 md:h-3 border border-border rounded-sm flex-shrink-0",
                          SHOWTIME_TYPE[key as keyof typeof SHOWTIME_TYPE],
                        )}
                      ></div>
                      <span className="text-[9px] md:text-[10px] font-normal">
                        {key.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
            {todayShowtimes.length === 0 && !hasError && (
              <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 space-y-2">
                <div className="flex items-center gap-2 p-2 sm:p-3 bg-muted/30 rounded-md border border-dashed">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    No showtimes for {format(selectedDate, "MMM d")}.
                    <span className="hidden sm:inline">
                      Click on the timeline to add your first showtime.
                    </span>
                  </p>
                </div>
              </CardHeader>
            )}
            <CardContent className="p-0">
              <div>
                <CalendarViewTimeline
                  showtimes={showtimes}
                  selectedDate={selectedDate}
                  onAddShowtimeAction={onAddShowtimeAction}
                  onUpdateShowtimeAction={onUpdateShowtimeAction}
                  onDeleteShowtimeAction={onDeleteShowtimeAction}
                  onUpdateSuccess={mutate}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
