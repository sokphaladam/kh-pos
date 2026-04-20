import { useMutationGenerateSettlement } from "@/app/hooks/cinema/use-query-settlement";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format, startOfDay, endOfDay } from "date-fns";
import { Calendar, LoaderIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { createSheet } from "@/components/create-sheet";
import {
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const generateSettlement = createSheet<unknown, unknown>(
  ({ close }) => {
    const { trigger: generateTrigger, isMutating: isGenerating } =
      useMutationGenerateSettlement();

    const now = new Date();
    const [startDate, setStartDate] = useState<Date | undefined>(
      startOfDay(now),
    );
    const [endDate, setEndDate] = useState<Date | undefined>(endOfDay(now));

    const handleGenerate = useCallback(async () => {
      if (!startDate || !endDate) {
        toast.error("Please select start and end dates");
        return;
      }

      try {
        const result = await generateTrigger({
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: `${format(endDate, "yyyy-MM-dd")} 23:59:59`,
        });

        if (result?.success) {
          toast.success("Settlement generated successfully");
          close(result.result);
        } else {
          toast.error(result?.error || "Failed to generate settlement");
        }
      } catch {
        toast.error("Failed to generate settlement");
      }
    }, [startDate, endDate, generateTrigger, close]);

    return (
      <>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Generate Settlement
          </SheetTitle>
          <SheetDescription>
            Select a date range to generate settlements for completed movie
            showtimes.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium">
                Start Date
              </Label>
              <DatePicker
                initialValue={startDate}
                onChange={setStartDate}
                className="w-full"
                label=""
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-medium">
                End Date
              </Label>
              <DatePicker
                initialValue={endDate}
                onChange={setEndDate}
                className="w-full"
                label=""
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            This will generate settlements for all ended showtimes within the
            selected date range.
          </p>

          {startDate && endDate && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="text-sm font-medium mb-2">Selected Period</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>From:</strong> {format(startDate, "MMMM dd, yyyy")}
                </p>
                <p>
                  <strong>To:</strong> {format(endDate, "MMMM dd, yyyy")}
                </p>
              </div>
            </div>
          )}
        </div>

        <SheetFooter>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !startDate || !endDate}
            className="gap-2"
          >
            {isGenerating && <LoaderIcon className="h-4 w-4 animate-spin" />}
            Generate Settlement
          </Button>
        </SheetFooter>
      </>
    );
  },
  { defaultValue: null },
);
