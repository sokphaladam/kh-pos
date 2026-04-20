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
          ? "bg-green-100 text-green-800 border border-green-200"
          : "bg-amber-100 text-amber-800 border border-amber-200"
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
