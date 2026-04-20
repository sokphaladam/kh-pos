"use client";

import { cn } from "@/lib/utils";
import { Armchair, Clock, MoveHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parse } from "date-fns";
import { Showtime } from "@/classes/cinema/showtime";
import { updateAdvanceShowtime } from "../update-advance-showtime";
import { ImageWithFallback } from "@/components/image-with-fallback";
import moment from "moment-timezone";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { SHOWTIME_TYPE } from "../showtime-layout";
import { useRouter } from "next/navigation";

interface Props {
  isDragging?: boolean;
  isResizing?: boolean;
  showtime: Showtime;
  selectedDate: Date;
  pixelsPerMinute?: number;
  handleDragStartAction: (e: React.MouseEvent, showtime: Showtime) => void;
  handleResizeStartAction: (e: React.MouseEvent, showtime: Showtime) => void;
  handleDeleteAction: (showtimeId: string) => void;
  onUpdateSuccess?: () => void;
}

export function ShowTimeItem({
  isDragging,
  isResizing,
  showtime,
  selectedDate,
  pixelsPerMinute = 1,
  handleDragStartAction,
  handleResizeStartAction,
  handleDeleteAction,
  onUpdateSuccess,
}: Props) {
  const { push } = useRouter();
  // Ensure consistent time format - handle both ISO strings and HH:mm format
  const startTimeStr = moment(showtime.startTime);
  const endTimeStr = moment(showtime.endTime);

  const startTime = parse(startTimeStr.format("HH:mm"), "HH:mm", selectedDate);
  let endTime = parse(endTimeStr.format("HH:mm"), "HH:mm", selectedDate);

  // Handle overnight showtimes where endTime is on the next day
  if (endTime.getTime() <= startTime.getTime()) {
    endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);
  }

  const startOffset = startTime.getHours() * 60 + startTime.getMinutes();
  const duration = Math.floor(
    (endTime.getTime() - startTime.getTime()) / (1000 * 60),
  );

  const PIXELS_PER_MINUTE = pixelsPerMinute;

  const pricingTemplate = showtime.pricingTemplate;

  // Get movie image from the variant's basic product
  const movieImage =
    showtime.variant
      ?.at(0)
      ?.basicProduct?.images?.find(
        (img) => img.productVariantId === showtime.variant?.at(0)?.id,
      ) || showtime.variant?.at(0)?.basicProduct?.images?.[0];

  let classNames = "";

  if (isDragging) {
    classNames =
      "opacity-30 grayscale scale-105 shadow-lg ring-2 ring-primary/50";
  }

  if (isResizing) {
    classNames =
      "opacity-70 border-orange-500 shadow-xl ring-4 ring-orange-500/30 scale-105";
  }

  if (showtime.status === "scheduled") {
    classNames =
      "bg-gradient-to-br from-card/90 to-primary/5 border-primary/30 hover:border-primary/60 hover:shadow-md text-foreground hover:scale-[1.02] hover:-translate-y-0.5";
  } else {
    classNames =
      "bg-gradient-to-br from-muted/40 to-muted/20 border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50";
  }

  return (
    <div
      id={`showtime-item-${showtime.showtimeId}`}
      className={cn(
        "absolute h-[85%] rounded-xl border-2 p-3 flex flex-col justify-between transition-all duration-200 z-10 overflow-hidden group/item backdrop-blur-sm shadow-sm",
        classNames,
        "hover:z-20",
        SHOWTIME_TYPE[showtime.status || "scheduled"],
      )}
      style={{
        left: `${startOffset * PIXELS_PER_MINUTE}px`,
        width: `${duration * PIXELS_PER_MINUTE}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col gap-2 min-h-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div
                className={cn("w-2 h-2 p-1 rounded-full flex-shrink-0 ", {
                  "bg-blue-500 animate-pulse": showtime.status === "scheduled",
                  "bg-green-500 animate-pulse": showtime.status === "selling",
                  "bg-red-500": showtime.status === "sold_out",
                  "bg-yellow-500 animate-pulse": showtime.status === "started",
                  "bg-slate-400": showtime.status === "ended",
                  "bg-rose-800": showtime.status === "cancelled",
                })}
              ></div>
              {/* Movie image */}
              {movieImage && (
                <ImageWithFallback
                  src={movieImage.url}
                  alt={
                    showtime.variant?.at(0)?.basicProduct?.title ||
                    "Movie poster"
                  }
                  width={40}
                  height={40}
                  className="w-[40px] h-[40px] rounded-sm object-cover border border-primary/20"
                />
              )}
              <span className="font-bold text-[11px] truncate uppercase tracking-tight text-primary">
                <div className="text-wrap">
                  {showtime.variant?.at(0)?.basicProduct?.title ||
                    "Unknown Movie"}
                </div>
                <div className="flex flex-row gap-2">
                  <small
                    className={cn(
                      "text-[9px] font-medium px-1 py-0.5 rounded capitalize",
                      {
                        "bg-blue-100 text-blue-700":
                          showtime.status === "scheduled",
                        "bg-green-100 text-green-700":
                          showtime.status === "selling",
                        "bg-red-100 text-red-700":
                          showtime.status === "sold_out",
                        "bg-yellow-100 text-yellow-700":
                          showtime.status === "started",
                        "bg-slate-100 text-slate-700":
                          showtime.status === "ended",
                        "bg-rose-100 text-rose-700":
                          showtime.status === "cancelled",
                      },
                    )}
                  >
                    {showtime.status === "sold_out"
                      ? "Sold Out"
                      : showtime.status === "started"
                        ? "Now Playing"
                        : showtime.status.toLowerCase()}
                  </small>
                  <span className="text-[8px] font-bold text-primary/70">
                    ${(showtime.basePrice || 0).toFixed(2)}
                  </span>
                </div>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[9px] px-1.5 py-0.5 font-medium text-muted-foreground">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span className="whitespace-nowrap">
                {`${startTimeStr.format("HH:mm")} — ${endTimeStr.format("HH:mm")} (${duration}m)`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[9px] px-1.5 py-0.5 font-medium text-muted-foreground">
              <Armchair className="h-3 w-3 flex-shrink-0" />
              <span className="whitespace-nowrap">
                {showtime.totalSeats - showtime.availableSeats} /{" "}
                {showtime.totalSeats}
              </span>
            </div>
          </div>
          {/* <Film className="h-4 w-4 text-primary/60 flex-shrink-0" /> */}
          <div className="absolute top-1 right-2 opacity-0 group-hover/item:opacity-100 rounded-md transition-all cursor-grab active:cursor-grabbing">
            <BasicMenuAction
              value={showtime}
              onDelete={
                showtime.status === "scheduled"
                  ? () => {
                      handleDeleteAction(showtime.showtimeId);
                    }
                  : undefined
              }
              onEdit={() => {
                updateAdvanceShowtime
                  .show({
                    intailShowtime: showtime,
                  })
                  .then((res) => {
                    if (res) {
                      onUpdateSuccess?.();
                    }
                  });
              }}
              size={"sm"}
              className={
                "h-5 w-5 p-0 hover:bg-primary/20 hover:text-primary rounded-md transition-all cursor-grab active:cursor-grabbing"
              }
              items={[
                {
                  label: "Detail",
                  onClick: () => {
                    push(
                      `/admin/cinema/ticket?step=scan&hallId=${showtime.hallId}&showtimeId=${showtime.showtimeId}`,
                    );
                  },
                },
              ]}
            />
          </div>
        </div>
        {pricingTemplate && (
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center gap-1">
              <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                {pricingTemplate.templateName}
              </span>
              <span className="text-[8px] bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                {pricingTemplate.timeSlot?.replace("_", " ")}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-1 left-1 flex items-center justify-between opacity-0 group-hover/item:opacity-100 transition-all duration-200">
        <div className="flex items-center gap-1">
          {["scheduled", "selling"].includes(showtime.status) && (
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 hover:bg-primary/20 hover:text-primary rounded-md transition-all cursor-grab active:cursor-grabbing"
              title="Move showtime (drag to reposition)"
              tabIndex={-1}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleDragStartAction(e, showtime);
              }}
            >
              <MoveHorizontal className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Right resize handle */}
      {["scheduled", "selling"].includes(showtime.status) && (
        <div
          className={cn(
            "resize-handle absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center transition-all duration-200",
            "opacity-0 group-hover/item:opacity-100 hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-orange-500/30 hover:w-4",
            isResizing &&
              "opacity-100 bg-gradient-to-r from-orange-500/20 to-orange-500/40 w-4 shadow-lg",
          )}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleResizeStartAction(e, showtime);
          }}
        >
          <div className="flex flex-col gap-0.5">
            <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
            <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
            <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}
