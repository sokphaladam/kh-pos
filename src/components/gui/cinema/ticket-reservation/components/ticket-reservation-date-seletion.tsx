import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";
import moment from "moment-timezone";

interface Props {
  uniqueShowDates: string[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  setSelectedShowtime: (showtime: string | null) => void;
  setSelectedSeats: (seats: string[]) => void;
  currentSelected?: string[];
}

export function TicketReservationDateSelection(props: Props) {
  const today = moment().format("YYYY-MM-DD");
  return (
    <div className="py-4 px-6">
      <div className="pb-4">
        <div className="flex items-center gap-2 text-lg font-bold">
          <Calendar className="h-5 w-5" />
          Select Date
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {props.uniqueShowDates.map((showDate) => {
          const isSameDay = moment(showDate).isSame(today);
          const isSelected = props.selectedDate === showDate;
          return (
            <Button
              key={showDate}
              variant={isSelected ? "default" : "outline"}
              size="lg"
              className={cn(
                "relative transition-all duration-200 hover:scale-105 p-6",
                isSelected && "ring-2 ring-primary/20 shadow-md",
              )}
              onClick={() => {
                props.setSelectedDate(showDate);
                props.setSelectedShowtime(null);
                // Only clear selected seats if there are no pre-selected seats from props
                if (
                  !props.currentSelected ||
                  props.currentSelected.length === 0
                ) {
                  props.setSelectedSeats([]);
                }
              }}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="font-semibold">
                  {isSameDay ? "Today" : moment(showDate).format("ddd")}
                </div>
                <div className="text-sm opacity-80">
                  {moment(showDate).format("DD MMM")}
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
