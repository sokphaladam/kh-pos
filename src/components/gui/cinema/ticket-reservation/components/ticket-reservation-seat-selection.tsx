import { Users } from "lucide-react";
import moment from "moment-timezone";
import { SeatLayout } from "../../components/seat-layout";
import { Showtime } from "@/classes/cinema/showtime";
import { Badge } from "@/components/ui/badge";
import { produce } from "immer";

interface Props {
  selectedShowtime: Showtime | null;
  selectedSeats: string[];
  setSelectedSeats: (seats: string[]) => void;
  seatReserved: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentSelected?: any[];
}

export function TicketReservationSeatSelection(props: Props) {
  return (
    <div id="seat-selection" className="py-4 px-6">
      {props.selectedShowtime ? (
        <div className=" bg-white/70 ">
          <div className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <Users className="h-5 w-5" />
                Select Your Seats
              </div>
              {props.selectedSeats.length > 0 && (
                <Badge className="bg-green-500 text-white">
                  {props.selectedSeats.length} seat
                  {props.selectedSeats.length !== 1 ? "s" : ""} selected
                </Badge>
              )}
            </div>
            <div className="text-sm text-slate-600">
              {props.selectedShowtime.hall?.name} •{" "}
              {moment(props.selectedShowtime.startTime).format("HH:mm A")}
            </div>
          </div>
          <div>
            <SeatLayout
              columns={props.selectedShowtime.hall?.columns || 0}
              rows={props.selectedShowtime.hall?.rows || 0}
              seats={
                props.selectedShowtime.hall?.seats.map((seat) => {
                  const isReserved = props.currentSelected
                    ? props.seatReserved
                        .filter(
                          (s: string) =>
                            !props.currentSelected
                              ?.map((x) => x.seatId)
                              .includes(s),
                        )
                        .includes(seat.id)
                    : props.seatReserved.includes(seat.id);
                  const isSelected = props.selectedSeats.includes(seat.id);
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  let seatType: any = seat.type;

                  if (isReserved) {
                    seatType = "reserved";
                  }
                  if (isSelected) {
                    seatType = "reserved-selected"; // Will be styled as selected in the SeatLayout component
                  }

                  return {
                    id: seat.id,
                    row: String(seat.row).charCodeAt(0) - 64,
                    column: seat.column,
                    type: seatType,
                    groupId: seat.groupId || undefined,
                    disabled: seatType === "reserved",
                  };
                }) || []
              }
              handleSeatClickAction={(seatId) => {
                // if (seatReserved.includes(seatId)) return;

                props.setSelectedSeats(
                  produce(props.selectedSeats, (draft) => {
                    const seat = props.selectedShowtime?.hall?.seats.find(
                      (f) => f.id === seatId,
                    );

                    if (!draft.includes(seatId)) {
                      draft.push(seatId);
                      if (seat && seat.type === "couple" && seat.groupId) {
                        const groupSeat =
                          props.selectedShowtime?.hall?.seats.find(
                            (f) => f.id === seat.groupId,
                          );
                        if (
                          groupSeat &&
                          !props.seatReserved.includes(groupSeat.id)
                        ) {
                          draft.push(seat.groupId);
                        }
                      }
                    } else {
                      const index = draft.indexOf(seatId);
                      if (index > -1) {
                        draft.splice(index, 1);
                      }

                      // Remove couple seat if applicable
                      if (seat && seat.type === "couple" && seat.groupId) {
                        const groupIndex = draft.indexOf(seat.groupId);
                        if (groupIndex > -1) {
                          draft.splice(groupIndex, 1);
                        }
                      }
                    }
                  }),
                );
              }}
              parts={props.selectedShowtime?.hall?.parts}
              forReservation
            />
          </div>
          <div>
            <div className="w-full">
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3 text-slate-700">
                  Pricing Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">
                      Base Price
                    </div>
                    <div className="text-lg font-semibold text-slate-800">
                      ${(props.selectedShowtime?.basePrice || 0).toFixed(2)}
                    </div>
                  </div>
                  {props.selectedShowtime?.pricingTemplate?.extraSeatPrices && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-xs text-slate-500 mb-2">
                        Seat Type Extras
                      </div>
                      <div className="space-y-1">
                        {Object.entries(
                          props.selectedShowtime?.pricingTemplate
                            ?.extraSeatPrices || {},
                        ).map(([type, extraPrice]) => (
                          <div
                            key={type}
                            className="flex justify-between items-center text-xs"
                          >
                            <span className="capitalize text-slate-600">
                              {type}:
                            </span>
                            <span className="font-medium text-slate-800">
                              +${Number(extraPrice || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {props.selectedSeats.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs text-slate-500 mb-2">
                      Selected Seats Breakdown
                    </div>
                    <div className="space-y-1">
                      {props.selectedSeats.map((seatId) => {
                        const seat = props.selectedShowtime?.hall?.seats.find(
                          (f) => f.id === seatId,
                        );
                        const pricing =
                          props.selectedShowtime?.pricingTemplate
                            ?.extraSeatPrices || {};
                        const extraPrice = Number(
                          pricing[seat?.type || ""] || 0,
                        );
                        const basePrice =
                          props.selectedShowtime?.basePrice || 0;
                        const totalPrice = basePrice + extraPrice;

                        return (
                          <div
                            key={seatId}
                            className="flex justify-between items-center text-xs bg-blue-50 rounded px-2 py-1"
                          >
                            <span className="text-slate-600">
                              {seat?.row}
                              {seat?.column} ({seat?.type || "standard"})
                            </span>
                            {extraPrice > 0 ? (
                              <span className="font-medium text-slate-800">
                                ${basePrice.toFixed(2)} + $
                                {extraPrice.toFixed(2)} = $
                                {totalPrice.toFixed(2)}
                              </span>
                            ) : (
                              <span className="font-medium text-slate-800">
                                ${totalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <div className="py-12">
            <div className="text-center text-slate-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a Showtime</h3>
              <p className="text-sm">
                Please select a showtime above to choose your seats
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
