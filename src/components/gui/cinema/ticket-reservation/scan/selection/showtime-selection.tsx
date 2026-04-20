"use client";

import { CinemaHall } from "@/classes/cinema/hall";
import { Showtime } from "@/classes/cinema/showtime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Calendar, Clock } from "lucide-react";
import moment from "moment-timezone";

interface Props {
  hall: CinemaHall;
  showtimes: Showtime[];
  loading: boolean;
  onShowtimeSelect: (showtime: Showtime) => void;
  onBack: () => void;
}

export function ShowtimeSelection({
  hall,
  showtimes,
  loading,
  onShowtimeSelect,
  onBack,
}: Props) {
  // Filter showtimes for the selected hall
  const hallShowtimes = showtimes.filter(
    (showtime) => showtime.hallId === hall.id,
  );

  if (loading) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                Select Showtime
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-1">
                Showtimes for <span className="font-medium">{hall.name}</span> •
                Today
              </p>
            </div>
            <Button
              variant="outline"
              onClick={onBack}
              className="self-start sm:self-center"
            >
              ← Back to Halls
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-6 border rounded-xl">
                <Skeleton className="h-6 w-48 mb-3" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              Select Showtime
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              Showtimes for <span className="font-medium">{hall.name}</span> •
              Today
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onBack}
            className="self-start sm:self-center"
          >
            ← Back to Halls
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {hallShowtimes.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg">
              No showtimes available
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              No scheduled showtimes found for {hall.name} today
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {hallShowtimes.map((showtime) => (
              <Card
                key={showtime.showtimeId}
                className="group cursor-pointer transition-all duration-200 hover:shadow-lg border-2 hover:border-blue-200 active:scale-95"
                onClick={() => onShowtimeSelect(showtime)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-50 group-hover:bg-blue-100 rounded-lg transition-colors">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg group-hover:text-blue-700 transition-colors">
                            {moment(showtime.startTime).format("HH:mm")}
                            {" - "}
                            {moment(showtime.endTime).format("HH:mm")}
                          </h3>
                          {showtime.variant?.at(0)?.basicProduct?.title && (
                            <p className="text-muted-foreground font-medium">
                              {showtime.variant?.at(0)?.basicProduct?.title}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="font-medium text-green-700">
                            Available Seats
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            {showtime.availableSeats}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="font-medium text-gray-700">
                            Total Seats
                          </div>
                          <div className="text-2xl font-bold text-gray-600">
                            {showtime.totalSeats}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize text-sm",
                          showtime.status === "selling" &&
                            "bg-green-50 text-green-700 border-green-200",
                          showtime.status === "scheduled" &&
                            "bg-blue-50 text-blue-700 border-blue-200",
                          showtime.status === "started" &&
                            "bg-orange-50 text-orange-700 border-orange-200",
                          showtime.status === "sold_out" &&
                            "bg-red-50 text-red-700 border-red-200",
                        )}
                      >
                        {showtime.status.replace("_", " ")}
                      </Badge>
                      <div className="text-xs text-muted-foreground text-right">
                        Tap to select
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
