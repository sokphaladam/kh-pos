/* eslint-disable @typescript-eslint/no-explicit-any */
import { SeatReservation } from "@/classes/cinema/reservation";
import { Showtime } from "@/classes/cinema/showtime";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, MapPin } from "lucide-react";
import moment from "moment-timezone";

interface Props {
  uniqueHalls: any[];
  showtimeGroupByHall: Record<string, Showtime[]>;
  selectedShowtime: Showtime | null;
  setSelectedShowtime: (showtime: Showtime) => void;
  setSelectedSeats: (seats: string[]) => void;
  currentSelected?: SeatReservation[];
}

export function TicketReservationShowtimeHall(props: Props) {
  return (
    <div className="bg-white/70 px-6 py-4">
      <div className="pb-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Clock className="h-5 w-5" />
          Available Showtimes
        </div>
      </div>
      <div>
        <div className="space-y-6">
          {props.uniqueHalls.map((hall) => {
            const featureList = Object.fromEntries(
              Object.entries(hall.features)
                .map(([category, options]) => [
                  category,
                  Object.fromEntries(
                    Object.entries(options as Record<string, any>).filter(
                      ([, value]) => value === true,
                    ),
                  ),
                ])
                .filter(([, obj]) => Object.keys(obj).length > 0),
            );
            const hallShowtimes = props.showtimeGroupByHall[hall.id] || [];

            return (
              <div
                key={hall.id}
                className="p-4 border border-slate-200 rounded-xl bg-white/50 hover:bg-white/70 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-bold">
                        {hall.name
                          .split(" ")
                          .map((word: string) => word.at(0)?.toUpperCase())
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800 capitalize">
                        {hall.name}
                      </h3>
                      <MapPin className="h-4 w-4 text-slate-500" />
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {Object.keys(featureList).length > 0 ? (
                        Object.keys(featureList).map((feature) => (
                          <Badge
                            key={feature}
                            variant="secondary"
                            className="text-xs"
                          >
                            {feature.charAt(0).toUpperCase() + feature.slice(1)}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-xs opacity-60">
                          Standard Features
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-600">
                          Available Times
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {hallShowtimes.map((showtime, index) => {
                          const isSelected =
                            props.selectedShowtime?.showtimeId ===
                            showtime.showtimeId;
                          const availableSeats = showtime.availableSeats || 0;

                          const availableTime = moment(
                            moment(showtime.endTime).format("YYYY-MM-DD HH:mm"),
                          ).isSameOrAfter(moment());

                          return (
                            <Button
                              key={index}
                              size="lg"
                              variant={isSelected ? "default" : "outline"}
                              disabled={!availableTime || availableSeats === 0}
                              className={cn(
                                "relative transition-all duration-200 hover:scale-105 flex flex-col items-center gap-1 h-auto py-3 px-4",
                                isSelected
                                  ? "ring-2 ring-primary/20 shadow-md"
                                  : "",
                                !availableTime
                                  ? "opacity-50 cursor-not-allowed"
                                  : "",
                              )}
                              onClick={() => {
                                props.setSelectedShowtime(showtime);
                                // Only clear selected seats if there are no pre-selected seats from props
                                if (
                                  !props.currentSelected ||
                                  props.currentSelected.length === 0
                                ) {
                                  props.setSelectedSeats([]);
                                }
                                setTimeout(() => {
                                  document
                                    .getElementById("seat-selection")
                                    ?.scrollIntoView({
                                      behavior: "smooth",
                                      block: "start",
                                    });
                                }, 100);
                              }}
                            >
                              <span className="font-semibold">
                                {moment(showtime.startTime).format("HH:mm")}
                              </span>
                              <span className="text-xs opacity-70">
                                {availableSeats} seats
                              </span>
                              {availableSeats < 10 && availableSeats > 0 && (
                                <Badge className="absolute -top-2 -right-2 text-xs bg-orange-500">
                                  Few left
                                </Badge>
                              )}
                              {availableSeats === 0 && (
                                <Badge className="absolute -top-2 -right-2 text-xs bg-red-500">
                                  Full
                                </Badge>
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
