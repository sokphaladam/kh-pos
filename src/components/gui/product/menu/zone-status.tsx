"use client";

import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

interface ZoneStatusProps {
  inZone?: boolean;
}

export function ZoneStatus({ inZone }: ZoneStatusProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium",
        inZone
          ? "bg-success/15 text-success border border-success/20"
          : "bg-warning/15 text-warning border border-warning/20"
      )}
    >
      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
      {inZone ? (
        <>
          <span className="hidden sm:inline">In Delivery Zone</span>
        </>
      ) : (
        <>
          <span className="hidden sm:inline">Outside Delivery Zone</span>
        </>
      )}
    </div>
  );
}
