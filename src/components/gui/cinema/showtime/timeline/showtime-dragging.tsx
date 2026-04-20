"use client";

import { parse } from "date-fns";
import { ShowtimeDragging as InterfaceShowtimeDragging } from "./calendar-view-timeline";

interface Props {
  isDragging?: boolean;
  draggingShowtime: InterfaceShowtimeDragging | null;
  selectedDate: Date;
  PIXELS_PER_MINUTE: number;
}

export function ShowtimeDragging(props: Props) {
  if (!props.isDragging) return <></>;

  return (
    <div
      className="absolute h-[85%] rounded-xl border-2 border-primary bg-gradient-to-br from-primary/20 via-primary/10 to-primary/20 z-50 pointer-events-none shadow-xl backdrop-blur-sm"
      style={{
        left: `${
          (parse(
            props.draggingShowtime?.currentStartTime || "",
            "HH:mm",
            props.selectedDate,
          ).getHours() *
            60 +
            parse(
              props.draggingShowtime?.currentStartTime || "",
              "HH:mm",
              props.selectedDate,
            ).getMinutes()) *
          props.PIXELS_PER_MINUTE
        }px`,
        width: `${(props.draggingShowtime?.duration || 0) * props.PIXELS_PER_MINUTE}px`,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-primary/90 text-primary-foreground px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">
          Moving to {props.draggingShowtime?.currentStartTime}
        </div>
      </div>
    </div>
  );
}
