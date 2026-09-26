import { SeatReservation } from "@/classes/cinema/reservation";
import { Showtime } from "@/classes/cinema/showtime";
import { Button } from "@/components/ui/button";
import { generateShortId } from "@/lib/generate-id";
import moment from "moment-timezone";

interface Props {
  selectedShowtime: Showtime;
  selectedSeats: string[];
  setSelectedSeats: (seats: string[]) => void;
  onConfirm?: (
    data: {
      showtimeId: string;
      seatId: string;
      price: number;
      code: string;
    }[],
  ) => void;
  currentSelected?: SeatReservation[];
}

export function TicketReservationDateSection(props: Props) {
  if (props.selectedSeats.length === 0 || !props.selectedShowtime) return <></>;
  return (
    <div className="py-4 px-6 border-0 shadow-lg border-success/20 sticky bottom-0">
      <div className="py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-success">
              Booking Summary
            </h3>
            <div className="text-sm text-success">
              <p>
                <strong>Hall:</strong> {props.selectedShowtime.hall?.name}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {moment(props.selectedShowtime.startTime).format(
                  "dddd, MMMM Do YYYY, HH:mm A",
                )}
              </p>
              <p>
                <strong>Selected Seats:</strong>{" "}
                {props.selectedSeats
                  .map((seatId) => {
                    const seat = props.selectedShowtime.hall?.seats.find(
                      (s) => s.id === seatId,
                    );
                    return seat ? `${seat.row}${seat.column}` : seatId;
                  })
                  .join(", ")}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                props.setSelectedSeats([]);
              }}
              className="border-success/30 text-success hover:bg-success/10"
            >
              Clear Selection
            </Button>
            <Button
              size="lg"
              disabled={props.selectedSeats.length === 0}
              onClick={() => {
                props.onConfirm?.(
                  props.selectedSeats.map((seatId) => {
                    const seat = props.selectedShowtime.hall?.seats.find(
                      (f) => f.id === seatId,
                    );
                    const pricing = props.selectedShowtime.pricingTemplate
                      ? props.selectedShowtime.pricingTemplate.extraSeatPrices
                      : {
                          standard: 0,
                          wheelchair: 0,
                          vip: 0,
                          couple: 0,
                        };
                    const totalPrice =
                      Number(pricing[seat?.type || ""] || 0) +
                      (props.selectedShowtime.basePrice || 0);

                    const currentSelectedSeat = props.currentSelected?.find(
                      (f) => f.seatId === seatId,
                    );

                    return {
                      showtimeId: props.selectedShowtime?.showtimeId || "",
                      seatId,
                      price: totalPrice,
                      code: currentSelectedSeat
                        ? currentSelectedSeat.code || ""
                        : generateShortId(7),
                    };
                  }),
                );
              }}
              className="bg-success hover:bg-success/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8"
            >
              Confirm Booking ({props.selectedSeats.length} seat
              {props.selectedSeats.length !== 1 ? "s" : ""})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
