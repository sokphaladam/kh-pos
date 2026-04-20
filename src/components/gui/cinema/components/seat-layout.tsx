/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { SeatPart } from "../hall-seat/form/hall-seat-configuration";
import { CheckCircle } from "lucide-react";
import { SeatReservation } from "@/classes/cinema/reservation";

interface Props {
  rows: number;
  columns: number;
  seats: {
    id: string;
    row: number;
    column: number;
    type:
      | "standard"
      | "vip"
      | "couple"
      | "wheelchair"
      | "blocked"
      | "reserved"
      | "reserved-selected";
    groupId?: string;
    disabled?: boolean;
  }[];
  handleSeatClickAction: (seatId: string) => void;
  parts?: SeatPart[];
  forReservation?: boolean;
  overwriteType?: {
    label: string;
    color: string;
    description: string;
  }[];
  allReservations?: SeatReservation[];
  admittedReservations?: SeatReservation[];
}

export const SEAT_TYPES = {
  standard: {
    label: "Standard",
    color: "bg-white border-slate-400 text-slate-600 hover:bg-slate-50",
    description: "Regular seating",
  },
  vip: {
    label: "VIP",
    color: "bg-white border-amber-400 text-amber-700 hover:bg-amber-50",
    description: "Premium seating with extra comfort",
  },
  couple: {
    label: "Couple",
    color: "bg-white border-pink-400 text-pink-700 hover:bg-pink-50",
    description: "Double seat for couples",
  },
  wheelchair: {
    label: "Wheelchair",
    color: "bg-white border-blue-500 text-blue-700 hover:bg-blue-50",
    description: "Wheelchair accessible seating",
  },
  blocked: {
    label: "Blocked",
    color: "bg-slate-100 border-slate-300 text-slate-400",
    description: "Not available for booking",
  },
  reserved: {
    label: "Reserved",
    color: "bg-green-50 border-green-500 text-green-800",
    description: "Seat is reserved",
  },
  "reserved-selected": {
    label: "Reserved (Selected)",
    color: "bg-teal-50 border-teal-500 text-teal-800",
    description: "Seat is reserved and selected",
  },
  admitted: {
    label: "Admitted",
    color: "bg-indigo-50 border-indigo-500 text-indigo-800",
    description: "Seat is admitted",
  },
} as const;

export function SeatLayout({
  rows,
  columns,
  seats,
  handleSeatClickAction,
  parts = [],
  forReservation = false,
  overwriteType,
  admittedReservations,
  allReservations,
}: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const seatSize = isMobile ? "w-8 h-8" : "w-10 h-10";
  const rowLabelSize = isMobile ? "w-6" : "w-8";
  const gapSize = isMobile ? "gap-1" : "gap-2";

  // Parse parts to determine spacing
  const parsePartRange = (range: string) => {
    const [start, end] = range.split(":");
    const startRow = start.charCodeAt(0) - 64; // A=1, B=2, etc.
    const startCol = parseInt(start.slice(1));
    const endRow = end.charCodeAt(0) - 64;
    const endCol = parseInt(end.slice(1));

    // Determine if this is horizontal or vertical spacing:
    // A1:A3 (same row, different columns) = spacing right vertical
    // A1:D1 (same column, different rows) = spacing top horizontal
    const isVerticalSpacing = startRow !== endRow && startCol === endCol; // A1:A3
    const isHorizontalSpacing = startRow === endRow && startCol !== endCol; // A1:D1

    return {
      startRow,
      startCol,
      endRow,
      endCol,
      isHorizontalSpacing,
      isVerticalSpacing,
    };
  };

  // Determine if there should be spacing after a row (for horizontal spacing)
  // Example: A1:D1 means add spacing after row D (spacing top horizontal)
  const shouldAddRowSpacing = (rowIndex: number) => {
    const result = parts.some((part) => {
      const { endRow, isHorizontalSpacing } = parsePartRange(part.range);
      const currentRow = rowIndex + 1;

      // Add spacing after the end row for horizontal spacing parts
      const isEndOfHorizontalSpacing =
        isHorizontalSpacing && currentRow === endRow;
      return isEndOfHorizontalSpacing;
    });
    return result;
  };

  // Determine if there should be spacing after a column (for vertical spacing)
  // Example: A1:A3 means add spacing after column 3 in row A (spacing right vertical)
  const shouldAddColSpacing = (colIndex: number, rowIndex: number) => {
    const result = parts.some((part) => {
      const { startRow, endRow, endCol, isVerticalSpacing } = parsePartRange(
        part.range,
      );
      const currentRow = rowIndex + 1;
      const currentCol = colIndex + 1;

      // Add spacing after the end column for vertical spacing parts
      const isInTargetRow = currentRow >= startRow && currentRow <= endRow;
      const isEndOfVerticalSpacing =
        isVerticalSpacing && isInTargetRow && currentCol === endCol;
      return isEndOfVerticalSpacing;
    });
    return result;
  };

  // Get part info for a specific position
  const getPartInfo = (rowIndex: number, colIndex: number) => {
    const currentRow = rowIndex + 1;
    const currentCol = colIndex + 1;

    for (const part of parts) {
      const { startRow, startCol, endRow, endCol } = parsePartRange(part.range);
      if (
        currentRow >= startRow &&
        currentRow <= endRow &&
        currentCol >= startCol &&
        currentCol <= endCol
      ) {
        return part;
      }
    }
    return null;
  };

  return (
    <TooltipProvider>
      {/* Cinema Screen */}
      <div className="flex justify-center mb-4 md:mb-8 px-4">
        <div className="w-full max-w-xs md:max-w-md h-1.5 md:h-2 bg-gradient-to-b from-primary/20 to-transparent rounded-full relative">
          <span className="absolute -bottom-5 md:-bottom-6 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            Screen
          </span>
        </div>
      </div>

      {/* Seat Grid Container with Horizontal Scroll */}
      <div className="w-full overflow-x-auto">
        <div className="flex justify-center min-w-fit px-4">
          <div className="inline-block p-3 md:p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-inner">
            {/* Parts Information Display */}
            {parts.length > 0 && !forReservation && (
              <div className="mb-4 text-center">
                <div className="text-xs text-slate-600 mb-2">Layout Parts:</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {parts.map((part) => (
                    <span
                      key={part.id}
                      className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full border border-purple-200"
                    >
                      {part.range}
                      {part.description && ` - ${part.description}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {/* Seats with row labels and part spacing */}
              {Array.from({ length: rows }, (_, rowIndex) => {
                const shouldAddSpacing = shouldAddRowSpacing(rowIndex);

                return (
                  <React.Fragment key={`row-${rowIndex}`}>
                    <div
                      className={cn(
                        "flex items-center",
                        gapSize,
                        shouldAddSpacing ? "mb-6 md:mb-8 pb-6" : "",
                      )}
                    >
                      {/* Row Label */}
                      <div
                        className={cn(
                          "flex items-center justify-center text-xs font-bold text-muted-foreground",
                          rowLabelSize,
                        )}
                      >
                        {String.fromCharCode(64 + rowIndex + 1)}
                      </div>

                      {/* Seats in this row */}
                      <div className={cn("flex", gapSize)}>
                        {Array.from({ length: columns }, (_, colIndex) => {
                          const seat = seats.find(
                            (s) =>
                              s.row === rowIndex + 1 &&
                              s.column === colIndex + 1,
                          );
                          const seatPartInfo = getPartInfo(rowIndex, colIndex);
                          const hasColSpacing = shouldAddColSpacing(
                            colIndex,
                            rowIndex,
                          );
                          const hasGroup =
                            seat?.type === "couple" && seat?.groupId;
                          const groupInfo = hasGroup
                            ? seats.findIndex((s) => s.id === seat.groupId)
                            : -1;

                          // Only apply group styling if we found a valid group partner
                          const hasValidGroup = hasGroup && groupInfo !== -1;

                          if (!seat) {
                            return (
                              <div
                                key={`empty-${rowIndex + 1}-${colIndex + 1}`}
                                className={cn(
                                  seatSize,
                                  hasColSpacing
                                    ? "mr-4 md:mr-6 pr-2 md:pr-3"
                                    : "",
                                )}
                              />
                            );
                          }

                          let seatTypeInfo: any = SEAT_TYPES[seat.type];

                          if (allReservations && admittedReservations) {
                            if (
                              allReservations.find((f) => f.seatId === seat.id)
                            ) {
                              seatTypeInfo = SEAT_TYPES.reserved;
                            }

                            if (
                              admittedReservations.find(
                                (f) => f.seatId === seat.id,
                              )
                            ) {
                              seatTypeInfo = SEAT_TYPES.admitted;
                            }
                          }

                          let disabled = seat.disabled;

                          if (forReservation && seat.type === "blocked") {
                            disabled = true;
                          }

                          return (
                            <div
                              key={seat.id}
                              className={cn(
                                "relative",
                                hasColSpacing
                                  ? "mr-4 md:mr-6 pr-2 md:pr-3"
                                  : "",
                                // groupOutside,
                              )}
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() =>
                                      handleSeatClickAction(seat.id)
                                    }
                                    className={cn(
                                      "relative rounded-t-lg border-t-4 border-l border-r border-b text-xs font-semibold transition-all duration-200 ease-out",
                                      disabled
                                        ? "cursor-not-allowed opacity-50"
                                        : "transform hover:scale-110 hover:z-10 hover:shadow-md active:scale-95",
                                      "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current",
                                      "touch-manipulation",
                                      seatSize,
                                      seatTypeInfo.color,
                                      {
                                        "opacity-40 saturate-0":
                                          seat.type === "blocked",
                                        "hover:scale-105": isMobile,
                                        "ring-2 ring-offset-1 ring-purple-400":
                                          hasValidGroup,
                                      },
                                    )}
                                    aria-label={`Row ${seat.row}, Seat ${
                                      seat.column
                                    } - ${seatTypeInfo.label}${
                                      seatPartInfo
                                        ? ` (Part: ${seatPartInfo.range})`
                                        : ""
                                    }`}
                                  >
                                    <span className="leading-none text-[10px] md:text-xs">
                                      {String.fromCharCode(64 + rowIndex + 1)}
                                      {seat.column}
                                    </span>
                                    {(seat.type as any) ===
                                    "reserved-selected" ? (
                                      <span className="absolute -top-1 -right-1 md:-top-1.5 md:-right-1.5rounded-full p-0.5 md:p-1 ">
                                        <CheckCircle className="h-4 w-4" />
                                      </span>
                                    ) : (
                                      <></>
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium text-sm">
                                    Row {String.fromCharCode(64 + seat.row)}
                                    {seat.column} - {seatTypeInfo.label}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {seatTypeInfo.description}
                                  </p>
                                  {seatPartInfo && (
                                    <p className="text-xs text-purple-600 font-medium">
                                      Part: {seatPartInfo.range}
                                      {seatPartInfo.description &&
                                        ` - ${seatPartInfo.description}`}
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend - Responsive Layout */}
      <div className="flex justify-center mt-4 md:mt-8 px-4">
        <div className="space-y-2">
          <div className="text-[8px] md:text-[10px] text-center uppercase tracking-widest text-muted-foreground font-bold">
            LEGEND
          </div>
          {overwriteType && overwriteType?.length > 0 ? (
            <div className="grid grid-cols-2 md:flex md:flex-row gap-3 md:gap-4">
              {overwriteType.map((type) => {
                return (
                  <div
                    key={type.label}
                    className="flex items-center gap-1.5 md:gap-2"
                  >
                    <div
                      className={cn(
                        "w-3 h-3.5 md:w-3.5 md:h-4 rounded-t-sm flex-shrink-0 border-t-4 border-l border-r border-b",
                        type.color,
                      )}
                    />
                    <span className="text-[9px] md:text-[10px] font-normal text-muted-foreground">
                      {type.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:flex md:flex-row gap-3 md:gap-4">
              {Object.values(SEAT_TYPES)
                .filter((f) =>
                  !forReservation
                    ? f.label !== "Reserved" &&
                      f.label !== "Reserved (Selected)" &&
                      f.label !== "Admitted"
                    : true,
                )
                .map((type) => {
                  return (
                    <div
                      key={type.label}
                      className="flex items-center gap-1.5 md:gap-2"
                    >
                      <div
                        className={cn(
                          "w-3 h-3.5 md:w-3.5 md:h-4 rounded-t-sm flex-shrink-0 border-t-4 border-l border-r border-b",
                          type.color,
                        )}
                      />
                      <span className="text-[9px] md:text-[10px] font-normal text-muted-foreground">
                        {type.label}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
