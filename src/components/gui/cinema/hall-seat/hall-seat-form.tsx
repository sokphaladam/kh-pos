"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InfoIcon,
  MonitorSpeakerIcon,
  RotateCcwIcon,
  SaveIcon,
} from "lucide-react";
import { SeatLayout } from "../components/seat-layout";
import { HallInformation } from "./form/hall-information";
import { v4 } from "uuid";
import { HallFeature } from "./form/hall-feature";
import { defaultFeatures } from "@/lib/cinema-default-values";
import {
  HallSeatConfiguration,
  SeatPart,
} from "./form/hall-seat-configuration";
import { produce } from "immer";

type SeatType =
  | "standard"
  | "vip"
  | "couple"
  | "wheelchair"
  | "blocked"
  | "reserved"
  | "reserved-selected";

export interface HallSeat {
  row: number;
  column: number;
  type: SeatType;
  id: string;
  groupId?: string;
  disabled?: boolean;
}

// Form validation schema
const formSchemaHall = z.object({
  hallName: z.string().min(1, "Hall name is required"),
  hallNumber: z.number().min(1, "Hall number must be at least 1"),
  status: z.enum(["active", "maintenance", "inactive"]),
  rows: z
    .number()
    .min(1, "Rows must be at least 1")
    .max(50, "Rows cannot exceed 50"),
  columns: z
    .number()
    .min(1, "Columns must be at least 1")
    .max(50, "Columns cannot exceed 50"),
  features: z.object({
    visual: z.object({
      imax: z.boolean(),
      "3d": z.boolean(),
      "4dx": z.boolean(),
      screenx: z.boolean(),
      dolby_cinema: z.boolean(),
      laser_projection: z.boolean(),
    }),
    audio: z.object({
      dolby_atmos: z.boolean(),
      dts_x: z.boolean(),
      thx_certified: z.boolean(),
    }),
    seating: z.object({
      recliners: z.boolean(),
      dbox: z.boolean(),
      beds: z.boolean(),
    }),
    amenities: z.object({
      in_seat_dining: z.boolean(),
      vip_lounge: z.boolean(),
      bar_service: z.boolean(),
    }),
    specialty: z.object({
      kids_cinema: z.boolean(),
      adults_only: z.boolean(),
      art_house: z.boolean(),
    }),
  }),
});

export type FormDataHall = z.infer<typeof formSchemaHall>;

interface Props {
  initialData?: FormDataHall & { seats: HallSeat[]; parts: SeatPart[] };
  onSubmit?: (
    data: FormDataHall & { seats: HallSeat[]; parts: SeatPart[] },
  ) => void;
  loading?: boolean;
}

export function HallSeatForm(props: Props) {
  const [seats, setSeats] = useState<HallSeat[]>(
    props.initialData?.seats || [],
  );
  const [selectedSeatType, setSelectedSeatType] =
    useState<SeatType>("standard");
  const [parts, setParts] = useState<SeatPart[]>(
    props.initialData?.parts || [],
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<FormDataHall>({
    resolver: zodResolver(formSchemaHall),
    defaultValues: {
      hallName: props.initialData?.hallName || "",
      hallNumber: props.initialData?.hallNumber || 0,
      status: props.initialData?.status || "active",
      rows: props.initialData?.rows || 10,
      columns: props.initialData?.columns || 9,
      features: props.initialData?.features || defaultFeatures,
    },
    mode: "onChange",
  });

  const {
    handleSubmit,
    watch,
    formState: { isValid },
    reset,
  } = form;

  const watchedRows = watch("rows");
  const watchedColumns = watch("columns");

  // Generate seats based on rows and columns
  const generateSeats = (rows: number, columns: number) => {
    setIsGenerating(true);

    // Add a small delay for better UX
    setTimeout(() => {
      // Create a map of existing seats by position for quick lookup
      const existingSeatMap = new Map<string, HallSeat>();
      seats.forEach((seat) => {
        const key = `${seat.row}-${seat.column}`;
        existingSeatMap.set(key, seat);
      });

      const newSeats: HallSeat[] = [];

      // Generate seats for the new grid
      for (let row = 1; row <= rows; row++) {
        for (let col = 1; col <= columns; col++) {
          const key = `${row}-${col}`;
          const existingSeat = existingSeatMap.get(key);

          if (existingSeat) {
            // Keep existing seat with its current configuration
            newSeats.push({
              id: existingSeat.id,
              row: existingSeat.row,
              column: existingSeat.column,
              type: existingSeat.type,
              groupId: existingSeat.groupId || "",
            });
          } else {
            // Create new seat with default type
            newSeats.push({
              row,
              column: col,
              type: "standard",
              id: v4(),
              groupId: "",
            });
          }
        }
      }

      // If this is the initial load and we have initial data, use that instead
      if (
        props.initialData?.seats &&
        props.initialData.seats.length > 0 &&
        seats.length === 0 && // Only on first load when no seats exist yet
        watchedRows * watchedColumns === props.initialData.seats.length
      ) {
        setSeats(
          props.initialData.seats.map((s) => {
            return {
              id: s.id,
              row: s.row,
              column: s.column,
              type: s.type,
              groupId: s.groupId || "",
            };
          }),
        );
      } else {
        setSeats(newSeats);
      }

      setShowPreview(true);
      setIsGenerating(false);
    }, 300);
  };

  // Reset form and seats
  const resetConfiguration = () => {
    reset();
    setSeats([]);
    setShowPreview(false);
    setSelectedSeatType("standard");
  };

  // Auto-generate seats when rows or columns change
  useEffect(() => {
    if (
      watchedRows &&
      watchedColumns &&
      watchedRows > 0 &&
      watchedColumns > 0
    ) {
      const timeoutId = setTimeout(() => {
        generateSeats(watchedRows, watchedColumns);
      }, 500); // Debounce to avoid excessive regeneration

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedRows, watchedColumns]);

  // Handle seat type change
  const handleSeatClick = (seatId: string) => {
    setSeats(
      produce((draft) => {
        draft.forEach((s) => {
          if (s.id === seatId) {
            s.type = selectedSeatType;
            if (selectedSeatType === "couple") {
              s.groupId = draft.find(
                (seat) =>
                  seat.id !== seatId &&
                  seat.row === s.row &&
                  seat.column === s.column + 1,
              )?.id;

              // next seat also needs to be updated
              if (!s.groupId) {
                const nextSeat = draft.find((seat) => seat.id === s.groupId);
                if (nextSeat) {
                  nextSeat.type = "couple";
                  nextSeat.groupId = s.id;
                }
              }
            } else {
              if (s.groupId) {
                const nextSeat = draft.find((seat) => seat.id === s.groupId);
                if (nextSeat) {
                  nextSeat.groupId = undefined;
                  nextSeat.type = selectedSeatType;
                }
              }
            }
          }
        });
      }),
    );
  };

  // Handle form submission
  const onSubmit = (data: FormDataHall) => {
    if (seats.length === 0) {
      alert("Please configure seats before saving.");
      return;
    }

    const hallData = {
      ...data,
      seats: seats,
      parts: parts,
      totalSeats: seats.length,
    };
    props.onSubmit?.(hallData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Hall Information Card */}
          <HallInformation form={form} />

          {/* Hall Features */}
          <HallFeature form={form} />

          {/* Seat Configuration Card */}
          {showPreview && (
            <HallSeatConfiguration
              selectedSeatType={selectedSeatType}
              setSelectedSeatTypeAction={(v) => {
                if (v !== "admitted") {
                  setSelectedSeatType(v);
                }
              }}
              parts={parts}
              setPartsAction={setParts}
            />
          )}

          {/* Seat Layout */}
          {seats.length > 0 && showPreview && (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MonitorSpeakerIcon className="h-5 w-5 text-purple-500" />
                    Seat Layout Preview
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-700"
                  >
                    {seats.length} Total Seats
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Interactive layout - Click seats to change their type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-0 pb-4">
                <SeatLayout
                  rows={watchedRows}
                  columns={watchedColumns}
                  seats={seats}
                  handleSeatClickAction={handleSeatClick}
                  parts={parts}
                />
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    disabled={!isValid || seats.length === 0 || props.loading}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2"
                  >
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Save Layout
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => generateSeats(watchedRows, watchedColumns)}
                    disabled={
                      isGenerating ||
                      !watchedRows ||
                      !watchedColumns ||
                      props.loading
                    }
                    className="border-slate-300 hover:bg-slate-50 transition-all duration-200 px-6 py-2"
                  >
                    <RotateCcwIcon
                      className={`h-4 w-4 mr-2 ${
                        isGenerating ? "animate-spin" : ""
                      }`}
                    />
                    {isGenerating ? "Generating..." : "Reset"}
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetConfiguration}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                >
                  🗑️ Clear All
                </Button>
              </div>

              {(!isValid || seats.length === 0) && (
                <Alert className="mt-4 border-amber-200 bg-amber-50/50">
                  <InfoIcon className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700">
                    {!isValid
                      ? "⚠️ Please fill in all required fields correctly."
                      : "⚠️ Please configure the seat layout before saving."}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
