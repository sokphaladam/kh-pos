/* eslint-disable @next/next/no-img-element */
"use client";

import { Showtime } from "@/classes/cinema/showtime";
import { createSheet } from "@/components/create-sheet";
import { SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLazyPublicProductList } from "@/app/hooks/use-query-product";
import {
  AlertTriangle,
  Calendar,
  Clock,
  DollarSign,
  Film,
  MapPin,
  Pencil,
  Save,
  Search,
  X,
  Info,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { format, parse, isValid } from "date-fns";
import {
  useMutationUpdateShowtime,
  useQueryShowtimeList,
} from "@/app/hooks/cinema/use-query-showtime";
import { useQueryPricingTemplate } from "@/app/hooks/use-query-pricing-template";
import { useQueryHallList } from "@/app/hooks/cinema/use-query-hall";
import { toast } from "sonner";
import { Formatter } from "@/lib/formatter";
import moment from "moment-timezone";
import { useCommonDialog } from "@/components/common-dialog";

interface Props {
  intailShowtime: Showtime;
}

export const updateAdvanceShowtime = createSheet<Props, unknown>(
  ({ close, intailShowtime }) => {
    const [showtime, setShowtime] = useState<Showtime>({
      ...intailShowtime,
      startTime: moment(intailShowtime.startTime).format("HH:mm"),
      endTime: moment(intailShowtime.endTime).format("HH:mm"),
    });
    const [isLoading, setIsLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState<
      Record<string, string>
    >({});
    const [autoCalculateEndTime, setAutoCalculateEndTime] = useState(true);
    const [moviePickerOpen, setMoviePickerOpen] = useState(false);
    const [movieSearchText, setMovieSearchText] = useState("");
    const [triggerMovieSearch, movieSearchResult] = useLazyPublicProductList({
      categoryKeys: "movies-category-id",
      limit: 100,
    });

    useEffect(() => {
      triggerMovieSearch();
    }, [triggerMovieSearch]);

    const { showDialog } = useCommonDialog();
    const updateMutation = useMutationUpdateShowtime();
    const { data: pricingTemplates, isLoading: pricingLoading } =
      useQueryPricingTemplate();
    const { data: halls, isLoading: hallsLoading } = useQueryHallList(100, 0);
    const { data: existingShowtimes } = useQueryShowtimeList(
      100,
      0,
      undefined,
      showtime.showDate,
    );

    const movieDurationMinutes =
      showtime.variant?.[0]?.movie?.durationMinutes || 0;

    const calculateEndTime = (startTime: string) => {
      if (!startTime || movieDurationMinutes <= 0) return "";

      const [hours, minutes] = startTime.split(":").map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);

      // Add movie duration plus 15 minutes buffer for cleanup
      const endDate = new Date(
        startDate.getTime() + (movieDurationMinutes + 15) * 60000,
      );

      return `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;
    };

    const checkTimeConflict = (newStartTime: string, newEndTime: string) => {
      if (
        !showtime.hallId ||
        !showtime.showDate ||
        !existingShowtimes?.result?.data
      ) {
        return null;
      }

      const newStart = moment(`${showtime.showDate} ${newStartTime}`);
      let newEnd = moment(`${showtime.showDate} ${newEndTime}`);
      // Handle cross-midnight: if end is not after start, it falls on the next day
      if (!newEnd.isAfter(newStart)) {
        newEnd = newEnd.clone().add(1, "day");
      }

      for (const existingShowtime of existingShowtimes.result.data.filter(
        (f) => f.hallId === showtime.hallId,
      )) {
        // Skip checking against itself
        if (existingShowtime.showtimeId === showtime.showtimeId) {
          continue;
        }

        // Only check conflicts for the same hall
        if (existingShowtime.hallId !== showtime.hallId) {
          continue;
        }

        // Check for overlap: new showtime starts before existing ends AND new showtime ends after existing starts
        const existingStart = moment(existingShowtime.startTime);
        const existingEnd = moment(existingShowtime.endTime);
        if (newStart.isBefore(existingEnd) && newEnd.isAfter(existingStart)) {
          return {
            conflictingShowtime: existingShowtime,
            message: `Time conflicts ${existingShowtime.hall?.name} with existing showtime "${existingShowtime.variant?.[0]?.basicProduct?.title || "Unknown Movie"}" (${existingStart.format("HH:mm")} - ${existingEnd.format("HH:mm")})`,
          };
        }
      }

      return null;
    };

    const handleStartTimeChange = (newStartTime: string) => {
      const newEndTime = autoCalculateEndTime
        ? calculateEndTime(newStartTime)
        : showtime.endTime;

      setShowtime((prev) => ({
        ...prev,
        startTime: newStartTime,
        endTime: newEndTime,
      }));

      // Clear previous time-related errors
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.startTime;
        delete newErrors.endTime;
        return newErrors;
      });

      // Check if start time is in the past (only for scheduled status)
      if (newStartTime && showtime.showDate && isScheduled) {
        const startDateTime = moment(`${showtime.showDate} ${newStartTime}`);
        const now = moment();

        if (startDateTime.isBefore(now)) {
          setValidationErrors((prev) => ({
            ...prev,
            startTime: "Start time cannot be in the past",
          }));
          return;
        }
      }

      // Check for conflicts if we have both times
      if (newStartTime && newEndTime && showtime.hallId && showtime.showDate) {
        const conflict = checkTimeConflict(newStartTime, newEndTime);
        if (conflict) {
          setValidationErrors((prev) => ({
            ...prev,
            startTime: conflict.message,
          }));
        }
      }
    };

    const handleEndTimeChange = (newEndTime: string) => {
      setShowtime((prev) => ({
        ...prev,
        endTime: newEndTime,
      }));

      // Clear previous time-related errors
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.startTime;
        delete newErrors.endTime;
        return newErrors;
      });

      // Check for conflicts if we have both times
      if (
        showtime.startTime &&
        newEndTime &&
        showtime.hallId &&
        showtime.showDate
      ) {
        const conflict = checkTimeConflict(showtime.startTime, newEndTime);
        if (conflict) {
          setValidationErrors((prev) => ({
            ...prev,
            startTime: conflict.message,
          }));
        }
      }
    };

    const handleHallChange = (newHallId: string) => {
      setShowtime((prev) => ({ ...prev, hallId: newHallId }));

      // Clear time conflict errors when hall changes
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.startTime;
        delete newErrors.hallId;
        return newErrors;
      });
    };

    const handleDateChange = (newDate: string) => {
      setShowtime((prev) => ({ ...prev, showDate: newDate }));

      // Clear time conflict errors when date changes
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.startTime;
        delete newErrors.showDate;
        return newErrors;
      });
    };

    const validateForm = () => {
      const errors: Record<string, string> = {};

      if (!showtime.hallId) errors.hallId = "Hall is required";
      if (!showtime.showDate) errors.showDate = "Show date is required";
      if (!showtime.startTime) errors.startTime = "Start time is required";
      if (!showtime.endTime) errors.endTime = "End time is required";
      if (showtime.basePrice <= 0)
        errors.basePrice = "Base price must be greater than 0";
      if (showtime.totalSeats <= 0)
        errors.totalSeats = "Total seats must be greater than 0";
      if (showtime.availableSeats < 0)
        errors.availableSeats = "Available seats cannot be negative";
      if (showtime.availableSeats > showtime.totalSeats) {
        errors.availableSeats = "Available seats cannot exceed total seats";
      }

      // Validate date format
      if (showtime.showDate && !isValid(new Date(showtime.showDate))) {
        errors.showDate = "Invalid date format";
      }

      // Validate start time is not in the past
      if (showtime.startTime && showtime.showDate) {
        const startDateTime = moment(
          `${showtime.showDate} ${showtime.startTime}`,
        );
        const now = moment();

        if (startDateTime.isBefore(now) && showtime.status === "scheduled") {
          errors.startTime = "Start time cannot be in the past";
        }
      }

      // Validate start time is before end time
      if (
        showtime.startTime &&
        showtime.endTime &&
        showtime.showDate &&
        !errors.startTime
      ) {
        const startDateTime = parse(
          `${showtime.showDate} ${showtime.startTime}`,
          "yyyy-MM-dd HH:mm",
          new Date(),
        );
        let endDateTime = parse(
          `${showtime.showDate} ${showtime.endTime}`,
          "yyyy-MM-dd HH:mm",
          new Date(),
        );
        // Handle cross-midnight: if end time is not after start time, it falls on the next day
        if (endDateTime <= startDateTime) {
          endDateTime = new Date(endDateTime.getTime() + 24 * 60 * 60 * 1000);
        }

        // Check for time conflicts with other showtimes
        const conflict = checkTimeConflict(
          showtime.startTime,
          showtime.endTime,
        );
        if (conflict) {
          errors.startTime = conflict.message;
        }
      }

      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
      if (!validateForm()) {
        toast.error("Please fix validation errors before saving");
        return;
      }

      if (isStarted) {
        showDialog({
          title: "Confirm Changes to Started Showtime",
          content:
            "This showtime has already started. Changing the movie, schedule, or price may affect active tickets and ongoing operations. Are you sure you want to proceed?",
          actions: [
            {
              text: "Confirm & Save",
              icon: Save,
              onClick: () => performSave(true),
            },
          ],
        });
        return;
      }

      await performSave();
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case "scheduled":
          return "bg-blue-100 text-blue-800 border-blue-200";
        case "selling":
          return "bg-green-100 text-green-800 border-green-200";
        case "sold_out":
          return "bg-red-100 text-red-800 border-red-200";
        case "started":
          return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "ended":
          return "bg-gray-100 text-gray-800 border-gray-200";
        case "cancelled":
          return "bg-red-100 text-red-800 border-red-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case "scheduled":
          return <Calendar className="h-3 w-3" />;
        case "selling":
          return <CheckCircle className="h-3 w-3" />;
        case "sold_out":
          return <X className="h-3 w-3" />;
        case "started":
          return <Film className="h-3 w-3" />;
        case "ended":
          return <CheckCircle className="h-3 w-3" />;
        case "cancelled":
          return <AlertCircle className="h-3 w-3" />;
        default:
          return <Info className="h-3 w-3" />;
      }
    };

    const isScheduled = showtime.status === "scheduled";
    const isStarted = showtime.status === "started";

    const filteredMovies = (movieSearchResult.data?.result || []).filter((m) =>
      movieSearchText
        ? m.productTitle.toLowerCase().includes(movieSearchText.toLowerCase())
        : true,
    );

    const handleMovieSelect = (movie: (typeof filteredMovies)[0]) => {
      const variant = movie.variants?.[0];
      if (!variant) return;
      setShowtime((prev) => {
        const duration = variant.movie?.durationMinutes || 0;
        let newEndTime = prev.endTime;
        if (
          (isScheduled || isStarted) &&
          autoCalculateEndTime &&
          prev.startTime &&
          duration > 0
        ) {
          const [hours, minutes] = prev.startTime.split(":").map(Number);
          const startDate = new Date();
          startDate.setHours(hours, minutes, 0, 0);
          const endDate = new Date(
            startDate.getTime() + (duration + 15) * 60000,
          );
          newEndTime = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;
        }
        return {
          ...prev,
          movieId: variant.id,
          variant: [variant],
          endTime: newEndTime,
        };
      });
      setMoviePickerOpen(false);
      setMovieSearchText("");
    };

    const performSave = async (resetStatus?: boolean) => {
      setIsLoading(true);
      try {
        const date = moment(showtime.showDate).format("YYYY-MM-DD");
        const startDateTime = `${date} ${showtime.startTime}`;
        // Handle cross-midnight: if end time is earlier than or equal to start time, it's the next day
        const endDate =
          showtime.endTime <= showtime.startTime
            ? moment(showtime.showDate).add(1, "day").format("YYYY-MM-DD")
            : date;
        const endDateTime = `${endDate} ${showtime.endTime}`;
        const result = await updateMutation.trigger({
          hallId: showtime.hallId,
          movieId: showtime.movieId,
          showDate: date,
          startTime: startDateTime,
          endTime: endDateTime,
          basePrice: showtime.basePrice,
          status: resetStatus ? "scheduled" : showtime.status,
          availableSeats: showtime.availableSeats,
          totalSeats: showtime.totalSeats,
          priceTemplateId: showtime.priceTemplateId || undefined,
          showtimeId: showtime.showtimeId || "",
        });

        if (result?.success) {
          toast.success("Showtime updated successfully!");
          close(true);
        } else {
          throw new Error("Failed to update showtime");
        }
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <>
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between py-6">
            <SheetTitle className="text-2xl font-bold text-gray-900">
              Update Advanced Showtime
            </SheetTitle>
            <Badge
              className={`px-3 py-1 text-sm font-medium border ${getStatusColor(
                showtime.status,
              )}`}
            >
              <span className="flex items-center gap-1">
                {getStatusIcon(showtime.status)}
                {showtime.status?.toUpperCase()}
              </span>
            </Badge>
          </div>
        </SheetHeader>

        {isStarted && (
          <Alert className="mx-0 border-yellow-200 bg-yellow-50 text-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              This showtime is <strong>in progress</strong>. You may update the
              movie, start/end time, and price. A confirmation will be required
              before saving.
            </AlertDescription>
          </Alert>
        )}
        {!isScheduled && !isStarted && (
          <Alert className="mx-0 border-amber-200 bg-amber-50 text-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              This showtime is <strong>{showtime.status}</strong>. Only the
              movie can be changed.
            </AlertDescription>
          </Alert>
        )}

        <ScrollArea className="flex-1">
          <div className="space-y-8 pb-4">
            {/* Movie & Venue Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Film className="h-5 w-5" />
                  Movie & Venue Information
                </CardTitle>
                <CardDescription>
                  View movie information and update hall assignment for this
                  showtime
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Movie</Label>
                      <Popover
                        open={moviePickerOpen}
                        onOpenChange={setMoviePickerOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                          >
                            <Pencil className="h-3 w-3" />
                            Change Movie
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-80 p-0"
                          align="start"
                          side="bottom"
                        >
                          <div className="p-2 border-b">
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                              <Input
                                placeholder="Search movies..."
                                className="pl-7 h-8 text-sm"
                                value={movieSearchText}
                                onChange={(e) =>
                                  setMovieSearchText(e.target.value)
                                }
                              />
                            </div>
                          </div>
                          <ScrollArea className="max-h-72">
                            {movieSearchResult.isLoading ? (
                              <div className="p-4 text-center text-sm text-gray-500">
                                Loading movies...
                              </div>
                            ) : filteredMovies.length === 0 ? (
                              <div className="p-4 text-center text-sm text-gray-500">
                                No movies found
                              </div>
                            ) : (
                              <div className="py-1">
                                {filteredMovies.map((movie) => {
                                  const variant = movie.variants?.[0];
                                  const isSelected =
                                    variant?.id === showtime.movieId;
                                  return (
                                    <button
                                      key={movie.variantId}
                                      className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors ${
                                        isSelected ? "bg-accent" : ""
                                      }`}
                                      onClick={() => handleMovieSelect(movie)}
                                    >
                                      <div className="w-8 h-10 flex-shrink-0 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                                        {variant?.movie?.posterUrl ? (
                                          <img
                                            src={variant.movie.posterUrl}
                                            alt={movie.productTitle}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <Film className="h-4 w-4 text-gray-400" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">
                                          {movie.productTitle}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                          {variant?.movie?.rating && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs px-1 h-4"
                                            >
                                              {variant.movie.rating}
                                            </Badge>
                                          )}
                                          {variant?.movie?.durationMinutes && (
                                            <span className="text-xs text-gray-500 flex items-center gap-0.5">
                                              <Clock className="h-2.5 w-2.5" />
                                              {variant.movie.durationMinutes}m
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {isSelected && (
                                        <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Film className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {showtime.variant?.[0]?.basicProduct?.title ||
                              "Unknown Movie"}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            <div className="flex items-center gap-4 flex-wrap">
                              {showtime.variant?.[0]?.movie
                                ?.durationMinutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {
                                    showtime.variant[0].movie.durationMinutes
                                  }{" "}
                                  minutes
                                </span>
                              )}
                              {showtime.variant?.[0]?.movie?.genre && (
                                <Badge variant="outline" className="text-xs">
                                  {Array.isArray(
                                    showtime.variant[0].movie.genre,
                                  )
                                    ? showtime.variant[0].movie.genre.join(", ")
                                    : showtime.variant[0].movie.genre}
                                </Badge>
                              )}
                              {showtime.variant?.[0]?.movie?.rating && (
                                <Badge variant="outline" className="text-xs">
                                  {showtime.variant[0].movie.rating}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hall" className="text-sm font-medium">
                      Hall <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={showtime.hallId}
                      onValueChange={handleHallChange}
                      disabled={!isScheduled}
                    >
                      <SelectTrigger
                        className={
                          validationErrors.hallId ? "border-red-500" : ""
                        }
                      >
                        <SelectValue placeholder="Select a hall" />
                      </SelectTrigger>
                      <SelectContent>
                        {hallsLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading halls...
                          </SelectItem>
                        ) : (
                          halls?.result?.data?.map((hall) => {
                            const blocks = hall.seats.filter(
                              (f) => f.type === "blocked",
                            ).length;
                            return (
                              <SelectItem key={hall.id} value={hall.id}>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{hall.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {hall.totalSeats - blocks} seats
                                  </Badge>
                                </div>
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                    {validationErrors.hallId && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {validationErrors.hallId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select
                    value={showtime.status}
                    onValueChange={(value) =>
                      setShowtime({
                        ...showtime,
                        status: value as Showtime["status"],
                      })
                    }
                    disabled={!isScheduled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Scheduled
                        </span>
                      </SelectItem>
                      <SelectItem value="selling">
                        <span className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Selling
                        </span>
                      </SelectItem>
                      <SelectItem value="sold_out">
                        <span className="flex items-center gap-2">
                          <X className="h-4 w-4" />
                          Sold Out
                        </span>
                      </SelectItem>
                      <SelectItem value="started">
                        <span className="flex items-center gap-2">
                          <Film className="h-4 w-4" />
                          Started
                        </span>
                      </SelectItem>
                      <SelectItem value="ended">
                        <span className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Ended
                        </span>
                      </SelectItem>
                      <SelectItem value="cancelled">
                        <span className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Cancelled
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Date & Time Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Date & Time Configuration
                </CardTitle>
                <CardDescription>
                  Set the show date and time schedule for this showtime
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="showDate" className="text-sm font-medium">
                    Show Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={Formatter.date(showtime.showDate) || ""}
                    onChange={(e) => handleDateChange(e.target.value)}
                    disabled={!isScheduled}
                    className={
                      validationErrors.showDate ? "border-red-500" : ""
                    }
                  />
                  {validationErrors.showDate && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {validationErrors.showDate}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime" className="text-sm font-medium">
                      Start Time <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="time"
                        step="300"
                        value={showtime.startTime || ""}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        disabled={!isScheduled && !isStarted}
                        className={`pl-10 ${
                          validationErrors.startTime ? "border-red-500" : ""
                        }`}
                        placeholder="HH:MM"
                      />
                    </div>
                    {movieDurationMinutes > 0 && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Movie duration: {movieDurationMinutes} minutes
                      </p>
                    )}
                    {validationErrors.startTime && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {validationErrors.startTime}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="endTime" className="text-sm font-medium">
                        End Time <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="autoCalculate"
                          checked={autoCalculateEndTime}
                          disabled={!isScheduled && !isStarted}
                          onChange={(e) => {
                            setAutoCalculateEndTime(e.target.checked);
                            if (e.target.checked && showtime.startTime) {
                              const newEndTime = calculateEndTime(
                                showtime.startTime,
                              );
                              setShowtime((prev) => ({
                                ...prev,
                                endTime: newEndTime,
                              }));

                              // Check for conflicts with auto-calculated end time
                              if (showtime.hallId && showtime.showDate) {
                                const conflict = checkTimeConflict(
                                  showtime.startTime,
                                  newEndTime,
                                );
                                if (conflict) {
                                  setValidationErrors((prev) => ({
                                    ...prev,
                                    startTime: conflict.message,
                                  }));
                                } else {
                                  // Clear previous errors if no conflict
                                  setValidationErrors((prev) => {
                                    const newErrors = { ...prev };
                                    delete newErrors.startTime;
                                    return newErrors;
                                  });
                                }
                              }
                            }
                          }}
                          className="h-3 w-3"
                        />
                        <label
                          htmlFor="autoCalculate"
                          className="text-xs text-gray-600"
                        >
                          Auto-calculate
                        </label>
                      </div>
                    </div>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="time"
                        step="300"
                        value={showtime.endTime || ""}
                        onChange={(e) => handleEndTimeChange(e.target.value)}
                        disabled={
                          autoCalculateEndTime || (!isScheduled && !isStarted)
                        }
                        className={`pl-10 ${
                          validationErrors.endTime ? "border-red-500" : ""
                        } ${
                          autoCalculateEndTime ? "bg-gray-50 text-gray-500" : ""
                        }`}
                        placeholder="HH:MM"
                      />
                    </div>
                    {autoCalculateEndTime && movieDurationMinutes > 0 && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Auto-calculated (+15 min cleanup time)
                      </p>
                    )}
                    {validationErrors.endTime && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {validationErrors.endTime}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Pricing Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing Configuration
                </CardTitle>
                <CardDescription>
                  Set base pricing and optional pricing template for this
                  showtime
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice" className="text-sm font-medium">
                    Base Price <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={showtime.basePrice}
                      onChange={(e) =>
                        setShowtime({
                          ...showtime,
                          basePrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      disabled={!isScheduled && !isStarted}
                      className={`pl-10 ${
                        validationErrors.basePrice ? "border-red-500" : ""
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {validationErrors.basePrice && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {validationErrors.basePrice}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="pricingTemplate"
                    className="text-sm font-medium"
                  >
                    Pricing Template (Optional)
                  </Label>
                  <Select
                    value={showtime.priceTemplateId || ""}
                    onValueChange={(value) =>
                      setShowtime({
                        ...showtime,
                        priceTemplateId: value === "none" ? undefined : value,
                      })
                    }
                    disabled={!isScheduled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pricing template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Template</SelectItem>
                      {pricingLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading templates...
                        </SelectItem>
                      ) : (
                        pricingTemplates?.result?.map((template) => (
                          <SelectItem
                            key={template.template_id}
                            value={template.template_id}
                          >
                            <div className="flex items-center gap-2">
                              <span>{template.template_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {template.time_slot}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {showtime.priceTemplateId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">
                      Pricing Template Applied
                    </h4>
                    <p className="text-sm text-green-800">
                      Advanced pricing rules will be applied based on the
                      selected template. Individual seat prices may vary from
                      the base price.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <SheetFooter className="border-t pt-4 flex flex-row justify-between items-center">
          <div className="text-xs text-gray-500">
            Last updated:{" "}
            {showtime.updatedAt
              ? format(new Date(showtime.updatedAt), "MMM d, yyyy HH:mm")
              : "Never"}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => close(undefined)}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || !!validationErrors.startTime}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                  Updating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </div>
              )}
            </Button>
          </div>
        </SheetFooter>
      </>
    );
  },
  { defaultValue: undefined },
);
