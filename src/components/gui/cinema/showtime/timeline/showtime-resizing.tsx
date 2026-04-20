"use client";

import { parse } from "date-fns";
import { ShowtimeResizing as InterfaceShowtimeResizing } from "./calendar-view-timeline";
import moment from "moment-timezone";

interface Props {
  isResizing?: boolean;
  resizingShowtime: InterfaceShowtimeResizing | null;
  selectedDate: Date;
  PIXELS_PER_MINUTE: number;
}

export function ShowtimeResizing(props: Props) {
  if (!props.isResizing || !props.resizingShowtime) return <></>;

  return (
    <div
      className="absolute h-[85%] rounded-xl border-2 border-orange-500 bg-gradient-to-br from-orange-500/20 via-orange-400/10 to-orange-500/20 z-50 pointer-events-none shadow-xl backdrop-blur-sm"
      style={{
        left: `${
          (parse(
            moment(props.resizingShowtime.startTime).format("HH:mm"),
            "HH:mm",
            props.selectedDate,
          ).getHours() *
            60 +
            parse(
              moment(props.resizingShowtime.startTime).format("HH:mm"),
              "HH:mm",
              props.selectedDate,
            ).getMinutes()) *
          props.PIXELS_PER_MINUTE
        }px`,
        width: `${
          props.resizingShowtime.currentDuration * props.PIXELS_PER_MINUTE
        }px`,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-orange-800">
        <div className="bg-orange-500/90 text-white px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">
          {props.resizingShowtime.currentDuration}m
          {props.resizingShowtime.currentDuration ===
            props.resizingShowtime.originalDuration && (
            <span className="ml-1 text-[8px] opacity-80">(minimum)</span>
          )}
        </div>
      </div>
      {/* Show original duration marker with animated pulse */}
      <div
        className="absolute top-1 bottom-1 border-l-2 border-dashed border-orange-600/80 animate-pulse"
        style={{
          left: `${
            props.resizingShowtime.originalDuration * props.PIXELS_PER_MINUTE -
            1
          }px`,
        }}
      >
        <div className="absolute -top-1 left-0 w-2 h-2 bg-orange-600 rounded-full transform -translate-x-1/2"></div>
      </div>
    </div>
  );
}
