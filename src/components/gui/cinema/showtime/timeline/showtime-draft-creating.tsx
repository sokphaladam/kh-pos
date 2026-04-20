"use client";

import { cn } from "@/lib/utils";
import { parse } from "date-fns";
import { CreateShowtimeTimeline } from "./create-showtime-timeline";
import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { ShowtimeCreating } from "./calendar-view-timeline";

interface Props {
  isCreating?: boolean;
  creatingShowtime: ShowtimeCreating | null;
  selectedDate: Date;
  PIXELS_PER_MINUTE: number;
  handleConfirmMovie: (movieId: string) => void;
  handleSaveShowtime: () => void;
  setCreatingShowtimeActions: React.Dispatch<
    React.SetStateAction<ShowtimeCreating | null>
  >;
  movies: ProductSearchResult[];
}

export function ShowtimeDraftCreating(props: Props) {
  if (!props.isCreating) return <></>;

  return (
    <div
      className={cn(
        "absolute h-[85%] w-auto z-40 bg-primary/5 animate-in fade-in zoom-in-95 duration-200",
        props.creatingShowtime?.movieId
          ? "border-primary shadow-[0_0_30px_rgba(var(--primary),0.2)]"
          : "border-muted-foreground/50",
      )}
      style={{
        left: `${
          (parse(
            props.creatingShowtime?.startTime || "00:00",
            "HH:mm",
            props.selectedDate,
          ).getHours() *
            60 +
            parse(
              props.creatingShowtime?.startTime || "00:00",
              "HH:mm",
              props.selectedDate,
            ).getMinutes()) *
          props.PIXELS_PER_MINUTE
        }px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <CreateShowtimeTimeline
        selectedDate={props.selectedDate}
        creatingShowtime={props.creatingShowtime}
        handleConfirmMovie={props.handleConfirmMovie}
        handleSaveShowtime={props.handleSaveShowtime}
        setCreatingShowtimeActions={props.setCreatingShowtimeActions}
        movies={props.movies}
      />
    </div>
  );
}
