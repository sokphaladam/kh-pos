import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addMinutes, format, parse } from "date-fns";
import { Clock, X, Film, CheckCircle, Calendar, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQueryPricingTemplate } from "@/app/hooks/use-query-pricing-template";

interface Props {
  selectedDate: Date;
  creatingShowtime: {
    hall: string;
    startTime: string;
    movieId?: string;
    duration?: number;
    pricingTemplateId?: string;
  } | null;
  setCreatingShowtimeActions: React.Dispatch<
    React.SetStateAction<{
      hall: string;
      startTime: string;
      movieId?: string;
      duration?: number;
      pricingTemplateId?: string;
    } | null>
  >;
  handleSaveShowtime: () => void;
  handleConfirmMovie: (movieId: string) => void;
  movies: ProductSearchResult[];
}

export function CreateShowtimeTimeline({
  creatingShowtime,
  setCreatingShowtimeActions,
  handleSaveShowtime,
  handleConfirmMovie,
  selectedDate,
  movies,
}: Props) {
  {
    const { data, isLoading } = useQueryPricingTemplate();

    if (!creatingShowtime?.movieId) {
      return (
        <div className="flex flex-col gap-3 h-full justify-center bg-gradient-to-br from-card/95 to-primary/5 rounded-lg p-3 border-2 border-dashed border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-bold text-primary">
              <Calendar className="h-4 w-4" />
              <span>{creatingShowtime?.startTime}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
              onClick={() => setCreatingShowtimeActions(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Select Movie
              </label>
              <Select onValueChange={handleConfirmMovie}>
                <SelectTrigger className="h-8 text-[11px] bg-background/95 border-primary/20 hover:border-primary/40 transition-colors">
                  <SelectValue placeholder="Choose a movie..." />
                </SelectTrigger>
                <SelectContent>
                  {movies.map((m) => (
                    <SelectItem
                      key={m.productId}
                      value={m.variants?.at(0)?.id || ""}
                      className="text-xs py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Film className="h-3 w-3 text-primary" />
                        <span className="font-medium">{m.productTitle}</span>
                        <Badge
                          variant="secondary"
                          className="text-[9px] py-0 px-1"
                        >
                          {m.variants?.at(0)?.movie?.durationMinutes}m
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-auto flex flex-col justify-between h-full bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-3 border-2 border-primary/40">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-primary" />
            <span className="font-bold text-[11px] uppercase tracking-tight text-primary">
              {
                movies.find(
                  (m) => m.variants?.at(0)?.id === creatingShowtime?.movieId
                )?.productTitle
              }
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-semibold text-primary/80">
            <Clock className="h-3 w-3" />
            <span>
              {creatingShowtime?.startTime} —{" "}
              {format(
                addMinutes(
                  parse(
                    creatingShowtime?.startTime || "00:00",
                    "HH:mm",
                    selectedDate
                  ),
                  creatingShowtime?.duration || 0
                ),
                "HH:mm"
              )}
            </span>
            <Badge
              variant="outline"
              className="text-[8px] py-0 px-1 border-primary/30"
            >
              {creatingShowtime?.duration}m
            </Badge>
          </div>
        </div>

        <div className="w-auto flex items-center gap-2 mt-auto">
          <div>
            <Select
              value={creatingShowtime?.pricingTemplateId || ""}
              onValueChange={(value) => {
                if (creatingShowtime) {
                  setCreatingShowtimeActions({
                    ...creatingShowtime,
                    pricingTemplateId: value || undefined,
                  });
                }
              }}
            >
              <SelectTrigger className="h-7 text-[11px] bg-background/95 border-primary/20 hover:border-primary/40 transition-colors">
                <SelectValue placeholder="Pricing template..." />
              </SelectTrigger>
              <SelectContent>
                {!isLoading &&
                  data?.result?.map((template) => {
                    const timeSlotLabels: Record<string, string> = {
                      matinee: "Matinee",
                      evening: "Evening",
                      late_night: "Late Night",
                      all_day: "All Day",
                    };
                    const dayTypeLabels: Record<string, string> = {
                      weekday: "Weekday",
                      weekend: "Weekend",
                      holiday: "Holiday",
                      all_days: "All Days",
                    };

                    return (
                      <SelectItem
                        key={template.template_id}
                        value={template.template_id}
                        className="text-xs py-2"
                      >
                        <div className="flex items-center gap-2">
                          <Receipt className="h-3 w-3 text-primary" />
                          <span className="font-medium">
                            {template.template_name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] py-0 px-1"
                          >
                            {timeSlotLabels[template.time_slot]}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-[9px] py-0 px-1"
                          >
                            {dayTypeLabels[template.day_type]}
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                {isLoading && (
                  <SelectItem value="loading" disabled>
                    <span className="text-[11px] text-muted-foreground">
                      Loading templates...
                    </span>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Button
              size="sm"
              className="h-7 flex-1 bg-primary hover:bg-primary/90 text-[10px] font-bold uppercase tracking-wide shadow-sm"
              onClick={handleSaveShowtime}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Schedule
            </Button>
          </div>
          <div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0 border-primary/20 hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setCreatingShowtimeActions(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
