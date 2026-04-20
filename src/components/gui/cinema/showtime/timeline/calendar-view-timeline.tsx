"use client";

import type React from "react";

import { cn } from "@/lib/utils";
import { isSameDay, format, addMinutes, parse, isToday } from "date-fns";
import { useState, useRef, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useQueryHallList } from "@/app/hooks/cinema/use-query-hall";
import { useAuthentication } from "contexts/authentication-context";
import { useLazyPublicProductList } from "@/app/hooks/use-query-product";
import { ShowTimeItem } from "./show-time-item";
import { v4 } from "uuid";
import { Showtime } from "@/classes/cinema/showtime";
import moment from "moment-timezone";
import { useWindowSize } from "@/components/use-window-size";
import { ShowtimeDraftCreating } from "./showtime-draft-creating";
import { ShowtimeDragging } from "./showtime-dragging";
import { ShowtimeResizing } from "./showtime-resizing";

export interface ShowtimeCreating {
  hall: string;
  startTime: string;
  movieId?: string;
  duration?: number;
  pricingTemplateId?: string;
}

export interface ShowtimeDragging {
  id: string;
  hall: string;
  originalStartTime: string;
  currentStartTime: string;
  duration: number;
  pricingTemplateId?: string;
}

export interface ShowtimeResizing {
  id: string;
  hall: string;
  startTime: string;
  originalDuration: number;
  currentDuration: number;
  pricingTemplateId?: string;
}

interface CalendarViewProps {
  showtimes: Showtime[];
  selectedDate: Date;
  onAddShowtimeAction: (showtime: Showtime) => void;
  onUpdateShowtimeAction: (showtime: Showtime) => void;
  onDeleteShowtimeAction: (showtimeId: string) => void;
  onUpdateSuccess?: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 12 AM to 11 PM (24 hours)
const PIXELS_PER_MINUTE = 2.33; // Visual scale - increased for better visibility

export function CalendarViewTimeline({
  showtimes,
  selectedDate,
  onAddShowtimeAction,
  onUpdateShowtimeAction,
  onDeleteShowtimeAction,
  onUpdateSuccess,
}: CalendarViewProps) {
  const { height } = useWindowSize();
  const { user } = useAuthentication();
  const { data, isLoading } = useQueryHallList(100, 0, ["active"]);
  const [triggerSearch, queryLazyPublicProductList] = useLazyPublicProductList({
    limit: 100,
    offset: 0,
    warehouse: user?.currentWarehouseId,
    categoryKeys: ["movies-category-id"],
  });
  const [loading, setLoading] = useState(true);
  const [creatingShowtime, setCreatingShowtime] =
    useState<ShowtimeCreating | null>(null);

  const [draggingShowtime, setDraggingShowtime] =
    useState<ShowtimeDragging | null>(null);

  const [resizingShowtime, setResizingShowtime] =
    useState<ShowtimeResizing | null>(null);

  const [justFinishedDragging, setJustFinishedDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollDragState = useRef({
    isActive: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    hasMoved: false,
  });
  const [isScrollDragging, setIsScrollDragging] = useState(false);
  const [justFinishedScrollDragging, setJustFinishedScrollDragging] =
    useState(false);

  // Current time state for the red line indicator
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(new Date());
    const interval = setInterval(updateCurrentTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate current time position
  const getCurrentTimePosition = () => {
    if (!isToday(selectedDate)) return null;

    const now = currentTime;
    const minutes = now.getHours() * 60 + now.getMinutes();
    return minutes * PIXELS_PER_MINUTE;
  };

  const currentTimePosition = getCurrentTimePosition();

  useEffect(() => {
    triggerSearch();
  }, [triggerSearch]);

  // Mock movies for selection
  const movies = queryLazyPublicProductList.data?.result || [];

  const filteredShowtimes = useMemo(
    () =>
      showtimes.filter((st) => {
        // Handle both ISO date strings and YYYY-MM-DD format
        const showtimeDate = st.showDate.includes("T")
          ? new Date(st.showDate)
          : new Date(st.showDate + "T00:00:00");
        return isSameDay(showtimeDate, selectedDate);
      }),
    [showtimes, selectedDate],
  );

  useEffect(() => {
    let key = "current-time-indicator-header";
    if (!!loading) {
      if (!queryLazyPublicProductList.isLoading && !isLoading) {
        key = `showtime-item-${filteredShowtimes.at(0)?.showtimeId}`;
      }
      const element = document.getElementById(key);
      element?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "start",
      });
      setLoading(false);
    }
  }, [
    filteredShowtimes,
    isLoading,
    queryLazyPublicProductList.isLoading,
    loading,
  ]);

  const checkCollision = (
    hall: string,
    start: string,
    duration: number,
    excludeId?: string,
  ) => {
    const newStart = parse(start, "HH:mm", selectedDate);
    const newEnd = addMinutes(newStart, duration);

    return filteredShowtimes.some((st) => {
      if (st.hallId !== hall || st.showtimeId === excludeId) return false;

      // Ensure consistent time format parsing
      const existingStartTimeStr = moment(st.startTime);
      const existingEndTimeStr = moment(st.endTime);

      const existingStart = parse(
        existingStartTimeStr.format("HH:mm"),
        "HH:mm",
        selectedDate,
      );
      const existingEnd = parse(
        existingEndTimeStr.format("HH:mm"),
        "HH:mm",
        selectedDate,
      );

      return newStart < existingEnd && newEnd > existingStart;
    });
  };

  const handleScrollMouseDown = (e: React.MouseEvent) => {
    if (draggingShowtime || resizingShowtime || creatingShowtime) return;
    if (!scrollContainerRef.current) return;
    scrollDragState.current = {
      isActive: true,
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: scrollContainerRef.current.scrollLeft,
      scrollTop: scrollContainerRef.current.scrollTop,
      hasMoved: false,
    };
    setIsScrollDragging(true);
  };

  const handleTimelineClick = (hall: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (
      creatingShowtime ||
      draggingShowtime ||
      resizingShowtime ||
      justFinishedDragging ||
      justFinishedScrollDragging
    )
      return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const minutes = Math.floor(x / PIXELS_PER_MINUTE);

    // Prevent creating showtimes before current time if viewing today
    if (currentTimePosition !== null) {
      const currentTimeMinutes = Math.floor(
        currentTimePosition / PIXELS_PER_MINUTE,
      );
      if (minutes < currentTimeMinutes) {
        toast.error("Cannot create showtime in the past!");
        return;
      }
    }

    const totalMinutes = minutes;

    const h = Math.floor(totalMinutes / 60);
    const m = Math.floor((totalMinutes % 60) / 5) * 5; // Snap to 5 mins
    const startTime = `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}`;

    setCreatingShowtime({ hall, startTime });
  };

  const handleConfirmMovie = (movieId: string) => {
    const movie = movies.find((m) => m.variants?.at(0)?.id === movieId);
    if (movie && creatingShowtime) {
      if (
        checkCollision(creatingShowtime.hall, creatingShowtime.startTime, 0)
      ) {
        toast.error("Time slot overlaps with an existing screening");
        return;
      }
      setCreatingShowtime({
        ...creatingShowtime,
        movieId,
        duration: movie.variants?.at(0)?.movie?.durationMinutes,
      });
    }
  };

  const handleSaveShowtime = () => {
    if (!creatingShowtime?.movieId || !creatingShowtime.duration) return;

    const movie = movies.find(
      (m) => m.variants?.at(0)?.id === creatingShowtime.movieId,
    );
    const startDateTime = parse(
      creatingShowtime.startTime,
      "HH:mm",
      selectedDate,
    );
    const endDateTime = addMinutes(startDateTime, creatingShowtime.duration);
    const endTime = moment(endDateTime).format("YYYY-MM-DD HH:mm");
    const startTime = moment(startDateTime).format("YYYY-MM-DD HH:mm");
    const hall = data?.result?.data.find((f) => f.id === creatingShowtime.hall);
    const availableSeats =
      hall?.seats.filter((s) => s.type !== "blocked").length || 0;

    onAddShowtimeAction({
      showtimeId: v4(),
      movieId: creatingShowtime.movieId,
      hallId: hall?.id || "",
      startTime,
      endTime,
      showDate: moment(selectedDate).format("YYYY-MM-DD"),
      status: "scheduled",
      basePrice: movie?.variants?.at(0)?.price || 0,
      totalSeats: availableSeats,
      availableSeats: availableSeats,
      variant: movie?.variants,
      priceTemplateId: creatingShowtime.pricingTemplateId,
    });

    setCreatingShowtime(null);
  };

  const handleDragStart = (e: React.MouseEvent, st: Showtime) => {
    e.stopPropagation();
    // Ensure consistent time format parsing
    const startTime = moment(st.startTime);
    const endTime = moment(st.endTime);

    const start = parse(startTime.format("HH:mm"), "HH:mm", selectedDate);
    let end = parse(endTime.format("HH:mm"), "HH:mm", selectedDate);
    if (end.getTime() <= start.getTime()) {
      end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    }
    const duration = Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60),
    );

    setDraggingShowtime({
      id: st.showtimeId || "",
      hall: st.hallId,
      originalStartTime: startTime.format("YYYY-MM-DD HH:mm"),
      currentStartTime: startTime.format("YYYY-MM-DD HH:mm"),
      duration: duration,
    });
  };

  const handleResizeStart = (e: React.MouseEvent, st: Showtime) => {
    e.stopPropagation();
    // Find original movie duration to enforce minimum constraint
    const movie = movies.find((m) => m.variants?.at(0)?.id === st.movieId);

    // Ensure consistent time format parsing
    const startTime = moment(st.startTime);
    const endTime = moment(st.endTime);

    const start = parse(startTime.format("HH:mm"), "HH:mm", selectedDate);
    let end = parse(endTime.format("HH:mm"), "HH:mm", selectedDate);
    if (end.getTime() <= start.getTime()) {
      end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    }
    const currentDuration = Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60),
    );

    const originalDuration =
      movie?.variants?.at(0)?.movie?.durationMinutes || currentDuration || 120;

    setResizingShowtime({
      id: st.showtimeId,
      hall: st.hallId,
      startTime: startTime.format("YYYY-MM-DD HH:mm"),
      originalDuration,
      currentDuration: currentDuration,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Handle scroll drag panning
    if (
      scrollDragState.current.isActive &&
      !draggingShowtime &&
      !resizingShowtime &&
      scrollContainerRef.current
    ) {
      const dx = e.clientX - scrollDragState.current.startX;
      const dy = e.clientY - scrollDragState.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        scrollDragState.current.hasMoved = true;
      }
      scrollContainerRef.current.scrollLeft =
        scrollDragState.current.scrollLeft - dx;
      scrollContainerRef.current.scrollTop =
        scrollDragState.current.scrollTop - dy;
      return;
    }

    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    // 160px is the Hall name column width
    const x = e.clientX - rect.left - 160;

    // Handle dragging (moving start time)
    if (draggingShowtime) {
      const minutes = Math.floor(x / PIXELS_PER_MINUTE);
      let totalMinutes = minutes;

      // Prevent moving before current time if viewing today
      if (currentTimePosition !== null) {
        const currentTimeMinutes = Math.floor(
          currentTimePosition / PIXELS_PER_MINUTE,
        );
        totalMinutes = Math.max(currentTimeMinutes, totalMinutes);
      }

      const h = Math.floor(totalMinutes / 60);
      const m = Math.floor((totalMinutes % 60) / 5) * 5;
      const newStartTime = `${Math.max(0, Math.min(23, h))
        .toString()
        .padStart(2, "0")}:${Math.max(0, Math.min(55, m))
        .toString()
        .padStart(2, "0")}`;

      if (newStartTime !== draggingShowtime.currentStartTime) {
        setDraggingShowtime({
          ...draggingShowtime,
          currentStartTime: newStartTime,
        });
      }
    }

    // Handle resizing (changing duration)
    if (resizingShowtime) {
      const startTime = parse(
        moment(resizingShowtime.startTime).format("HH:mm"),
        "HH:mm",
        selectedDate,
      );
      const startOffset = startTime.getHours() * 60 + startTime.getMinutes();
      const requestedDuration =
        Math.floor(
          (x - startOffset * PIXELS_PER_MINUTE) / PIXELS_PER_MINUTE / 5,
        ) * 5;

      // Enforce minimum duration constraint (cannot go below original movie duration)
      const newDurationMinutes = Math.max(
        resizingShowtime.originalDuration,
        requestedDuration,
      );

      // Show warning if user tries to resize below minimum
      if (
        requestedDuration < resizingShowtime.originalDuration &&
        requestedDuration > 0
      ) {
        // Visual feedback that they've hit the minimum - could add a toast here if needed
        console.log(
          `Cannot resize below original duration of ${resizingShowtime.originalDuration} minutes`,
        );
      }

      if (
        newDurationMinutes !== resizingShowtime.currentDuration &&
        newDurationMinutes > 0
      ) {
        setResizingShowtime({
          ...resizingShowtime,
          currentDuration: newDurationMinutes,
        });
      }
    }
  };

  const handleMouseUp = () => {
    // Handle scroll drag end
    if (scrollDragState.current.isActive) {
      scrollDragState.current.isActive = false;
      setIsScrollDragging(false);
      if (scrollDragState.current.hasMoved) {
        setJustFinishedScrollDragging(true);
        setTimeout(() => setJustFinishedScrollDragging(false), 150);
      }
      return;
    }

    // Handle dragging completion
    if (draggingShowtime) {
      // Check if trying to move before current time (today only)
      if (currentTimePosition !== null) {
        const newStartTime = parse(
          draggingShowtime.currentStartTime,
          "HH:mm",
          selectedDate,
        );
        const newStartMinutes =
          newStartTime.getHours() * 60 + newStartTime.getMinutes();
        const currentTimeMinutes = Math.floor(
          currentTimePosition / PIXELS_PER_MINUTE,
        );

        if (newStartMinutes < currentTimeMinutes) {
          toast.error("Cannot move showtime to a past time slot!");
          setDraggingShowtime(null);
          setTimeout(() => {
            setCreatingShowtime(null);
          }, 300);
          return;
        }
      }

      if (
        checkCollision(
          draggingShowtime.hall,
          draggingShowtime.currentStartTime,
          draggingShowtime.duration,
          draggingShowtime.id,
        )
      ) {
        toast.error("Collision detected! Cannot move to this time slot.");
        setDraggingShowtime(null);
        setTimeout(() => {
          setCreatingShowtime(null);
        }, 300);
        return;
      }

      const startDateTime = parse(
        draggingShowtime.currentStartTime,
        "HH:mm",
        selectedDate,
      );
      const endDateTime = addMinutes(startDateTime, draggingShowtime.duration);
      const newStartTime = format(startDateTime, "yyyy-MM-dd HH:mm");
      const endTime = format(endDateTime, "yyyy-MM-dd HH:mm");

      // Update existing showtime using the dedicated update callback
      const existingShowtime = filteredShowtimes.find(
        (s) => s.showtimeId === draggingShowtime.id,
      );
      if (existingShowtime) {
        onUpdateShowtimeAction({
          ...existingShowtime,
          startTime: newStartTime,
          endTime,
        });
      }

      setDraggingShowtime(null);
      setJustFinishedDragging(true);

      // Reset the flag after a short delay to prevent timeline click
      setTimeout(() => {
        setJustFinishedDragging(false);
      }, 100);
      return;
    }

    // Handle resizing completion
    if (resizingShowtime) {
      const startTime = parse(
        moment(resizingShowtime.startTime).format("HH:mm"),
        "HH:mm",
        selectedDate,
      );
      const endTime = format(
        addMinutes(startTime, resizingShowtime.currentDuration),
        "yyyy-MM-dd HH:mm",
      );

      // Check for collisions with the new duration
      if (
        checkCollision(
          resizingShowtime.hall,
          resizingShowtime.startTime,
          resizingShowtime.currentDuration,
          resizingShowtime.id,
        )
      ) {
        toast.error(
          "Cannot extend duration - collision with another showtime.",
        );
        setResizingShowtime(null);
        setTimeout(() => {
          setCreatingShowtime(null);
        }, 300);
        return;
      }

      // Update existing showtime with new duration
      const existingShowtime = filteredShowtimes.find(
        (s) => s.showtimeId === resizingShowtime.id,
      );
      if (existingShowtime) {
        onUpdateShowtimeAction({
          ...existingShowtime,
          startTime: moment(existingShowtime.startTime).format(
            "YYYY-MM-DD HH:mm",
          ),
          endTime,
        });
      }

      setResizingShowtime(null);
      setJustFinishedDragging(true);

      // Reset the flag after a short delay to prevent timeline click
      setTimeout(() => {
        setJustFinishedDragging(false);
      }, 100);

      const durationChange =
        resizingShowtime.currentDuration - resizingShowtime.originalDuration;
      if (durationChange > 0) {
        toast.success(`Duration extended by ${durationChange} minutes`);
      } else {
        toast.success("Duration updated");
      }
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      className={`relative overflow-auto w-full border border-border bg-card custom-scrollbar`}
      style={{
        maxHeight: height / 1.4,
        cursor: isScrollDragging ? "grabbing" : "grab",
        userSelect: isScrollDragging ? "none" : undefined,
      }}
      onMouseDown={handleScrollMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (scrollDragState.current.isActive) {
          scrollDragState.current.isActive = false;
          setIsScrollDragging(false);
        }
      }}
    >
      <div className={cn("min-w-[3600px] w-full relative")} ref={containerRef}>
        {/* Timeline Header */}
        <div className="flex border-b-2 border-border sticky top-0 bg-card/98 backdrop-blur-md z-50 shadow-xl shadow-border/20 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-gradient-to-r after:from-transparent after:via-primary/30 after:to-transparent">
          <div className="w-48 min-w-48 border-r-2 border-border p-6 font-bold text-sm uppercase tracking-wider text-primary bg-gradient-to-br from-card/99 to-primary/5 backdrop-blur-md sticky left-0 z-50 shadow-r-xl flex items-center justify-center border-b-0">
            <div className="text-center">
              <div className="font-black text-lg text-primary mb-1">
                🎬 Cinema
              </div>
              <div className="font-semibold text-xs text-muted-foreground uppercase tracking-widest">
                Screening Halls
              </div>
              <div className="text-[10px] text-primary/60 mt-1">
                {format(selectedDate, "MMM dd, yyyy")}
              </div>
            </div>
          </div>
          <div className="flex-1 flex bg-gradient-to-r from-card/98 to-card/95">
            {HOURS.map((hour, index) => (
              <div
                key={hour}
                className={cn(
                  "w-[140px] p-4 text-center border-r border-border/30 text-sm font-semibold transition-all duration-200 relative backdrop-blur-sm hover:scale-105",
                  hour % 3 === 0
                    ? "border-border/50 bg-gradient-to-b from-primary/12 to-primary/5 text-primary shadow-sm"
                    : "border-border/20 text-muted-foreground hover:bg-gradient-to-b hover:from-muted/20 hover:to-muted/5",
                  index === 0 && "border-l-2 border-border/40",
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg font-bold">{hour % 12 || 12}</span>
                  <span className="text-[10px] font-medium opacity-80 bg-background/80 px-2 py-0.5 rounded-full">
                    {hour >= 12 ? "PM" : "AM"}
                  </span>
                </div>
                {hour % 6 === 0 && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-3 bg-gradient-to-b from-primary/60 to-transparent rounded-b"></div>
                )}
                {hour === 12 && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 text-[8px] text-primary/80 font-semibold bg-primary/10 px-1 py-0.5 rounded">
                    NOON
                  </div>
                )}
                {hour === 0 && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 text-[8px] text-primary/80 font-semibold bg-primary/10 px-1 py-0.5 rounded">
                    MID
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Current Time Line in Header - Show only when viewing today */}
          {currentTimePosition !== null && (
            <div
              className="absolute top-0 bottom-0 z-40 pointer-events-none"
              style={{ left: `${currentTimePosition + 192}px` }}
              id="current-time-indicator-header"
            >
              <div className="relative h-full">
                {/* Top indicator */}
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full shadow-lg border-2 border-white animate-pulse"></div>

                {/* Vertical line in header */}
                <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-[1px] h-full bg-red-500/80 shadow-sm"></div>

                {/* NOW label */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md whitespace-nowrap">
                  {format(currentTime, "HH:mm")}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Halls and Showtimes */}
        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex border-b-2 border-border/50">
                <div className="w-48 min-w-48 border-r-2 border-border p-6 bg-gradient-to-br from-card/99 to-muted/5 backdrop-blur-md sticky left-0 z-40 shadow-r-lg">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-muted animate-pulse rounded-full"></div>
                      <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted/70 animate-pulse rounded w-16"></div>
                      <div className="h-3 bg-muted/70 animate-pulse rounded w-12"></div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 h-40 bg-gradient-to-r from-muted/10 via-muted/5 to-muted/10 animate-pulse">
                  <div className="h-full flex">
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <div
                        key={hour}
                        className="w-[140px] h-full border-r border-border/10 flex-shrink-0"
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : data?.result?.data.length === 0 ? (
          <div className="flex min-h-[500px]">
            <div className="w-48 min-w-48 border-r-2 border-border bg-gradient-to-br from-card/99 to-muted/5 backdrop-blur-md sticky left-0 z-40 shadow-r-lg"></div>
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-muted/5 to-primary/5">
              <div className="text-center space-y-6 p-8 bg-card/80 rounded-xl border border-border shadow-lg backdrop-blur-sm">
                <div className="text-6xl animate-bounce">🎭</div>
                <div>
                  <h3 className="font-bold text-xl mb-3 text-primary">
                    No Cinema Halls Configured
                  </h3>
                  <p className="text-muted-foreground max-w-lg mx-auto text-base leading-relaxed">
                    🏢 Set up your cinema halls in the configuration section to
                    start scheduling showtimes and managing your movie
                    screenings.
                  </p>
                  <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm text-primary font-medium">
                      💡 Tip: You&apos;ll need at least one hall to create
                      showtimes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {data &&
          data?.result?.data.map((hall) => {
            const totalSeatNotVailable = hall.seats.filter(
              (f) => f.type === "blocked",
            ).length;
            return (
              <div
                key={hall.id}
                className="flex border-b-2 border-border/60 group hover:bg-gradient-to-r hover:from-muted/8 hover:to-primary/5 transition-all duration-300 relative"
              >
                <div className="w-48 min-w-48 border-r-2 border-border p-6 flex flex-col justify-center bg-gradient-to-br from-card/99 to-muted/5 backdrop-blur-md sticky left-0 z-40 shadow-r-lg group-hover:bg-gradient-to-br group-hover:from-primary/10 group-hover:to-primary/5 transition-all duration-300 before:absolute before:inset-y-0 before:right-0 before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/80 before:to-transparent">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full animate-pulse shadow-lg",
                          "bg-gradient-to-r from-green-400 to-green-500",
                        )}
                      ></div>
                      <span className="font-bold text-base tracking-tight capitalize text-primary">
                        {hall.name}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium">
                          Capacity:
                        </span>
                        <span className="text-xs font-bold text-primary">
                          {hall.totalSeats - totalSeatNotVailable} seats
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium">
                          Today:
                        </span>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {showtimes.filter((f) => f.hallId === hall.id).length}{" "}
                          shows
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="flex-1 relative h-40 flex items-center cursor-crosshair bg-gradient-to-r from-muted/8 via-transparent to-muted/8 hover:from-primary/8 hover:via-primary/3 hover:to-primary/8 transition-all duration-300 group-hover:shadow-inner min-w-0 border-t border-border/20"
                  onClick={(e) => handleTimelineClick(hall.id, e)}
                  title="💡 Click anywhere to schedule a new showtime for this hall"
                >
                  {/* Hour Grid Lines */}
                  {HOURS.map((hour, index) => (
                    <div
                      key={hour}
                      className={cn(
                        "w-[140px] h-full border-r pointer-events-none relative flex-shrink-0 transition-colors duration-200",
                        hour % 3 === 0
                          ? "border-border/50 bg-gradient-to-b from-transparent to-primary/3"
                          : "border-border/20",
                        index === 0 && "border-l-2 border-border/30",
                      )}
                    >
                      {hour % 3 === 0 && (
                        <div className="absolute top-3 left-3 text-[10px] font-semibold text-muted-foreground/80 bg-background/90 px-2 py-1 rounded-md shadow-sm backdrop-blur-sm border border-border/30">
                          {hour % 12 || 12}
                          <span className="text-[8px] ml-0.5">
                            {hour >= 12 ? "PM" : "AM"}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-border/30 to-transparent" />
                      {/* 15-minute markers for better precision */}
                      <div className="absolute top-1/4 bottom-1/4 left-1/4 w-px bg-border/15" />
                      <div className="absolute top-1/4 bottom-1/4 left-1/2 w-px bg-border/20" />
                      <div className="absolute top-1/4 bottom-1/4 left-3/4 w-px bg-border/15" />
                    </div>
                  ))}

                  {/* Current Time Line - Show only when viewing today */}
                  {currentTimePosition !== null && (
                    <div
                      className="absolute top-0 bottom-0 z-10 pointer-events-none"
                      style={{ left: `${currentTimePosition + 0}px` }} // 160px is the hall name column width
                    >
                      <div className="relative h-full">
                        <div className="absolute top-0 -bottom-0 left-1/2 transform -translate-x-1/2 w-[1px] h-full bg-red-500 shadow-sm z-10"></div>
                      </div>
                    </div>
                  )}

                  {/* Draft Showtime (Creating) */}
                  <ShowtimeDraftCreating
                    PIXELS_PER_MINUTE={PIXELS_PER_MINUTE}
                    creatingShowtime={creatingShowtime}
                    isCreating={creatingShowtime?.hall === hall.id}
                    selectedDate={selectedDate}
                    handleConfirmMovie={handleConfirmMovie}
                    handleSaveShowtime={handleSaveShowtime}
                    setCreatingShowtimeActions={setCreatingShowtime}
                    movies={movies}
                  />

                  <ShowtimeDragging
                    PIXELS_PER_MINUTE={PIXELS_PER_MINUTE}
                    draggingShowtime={draggingShowtime}
                    isDragging={draggingShowtime?.hall === hall.id}
                    selectedDate={selectedDate}
                  />

                  <ShowtimeResizing
                    PIXELS_PER_MINUTE={PIXELS_PER_MINUTE}
                    resizingShowtime={resizingShowtime}
                    selectedDate={selectedDate}
                    isResizing={resizingShowtime?.hall === hall.id}
                  />

                  {/* Existing Showtimes */}
                  {filteredShowtimes
                    .filter((st) => st.hallId === hall.id)
                    .map((st) => {
                      const isDragging = draggingShowtime?.id === st.showtimeId;
                      const isResizing = resizingShowtime?.id === st.showtimeId;
                      return (
                        <ShowTimeItem
                          key={st.showtimeId}
                          isDragging={isDragging}
                          isResizing={isResizing}
                          showtime={st}
                          selectedDate={selectedDate}
                          pixelsPerMinute={PIXELS_PER_MINUTE}
                          handleDragStartAction={handleDragStart}
                          handleResizeStartAction={handleResizeStart}
                          handleDeleteAction={onDeleteShowtimeAction}
                          onUpdateSuccess={onUpdateSuccess}
                        />
                      );
                    })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
