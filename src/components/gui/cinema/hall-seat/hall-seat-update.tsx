"use client";

import { createSheet } from "@/components/create-sheet";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FormDataHall, HallSeat, HallSeatForm } from "./hall-seat-form";
import { useCallback } from "react";
import { useMutationUpdateHall } from "@/app/hooks/cinema/use-query-hall";
import { toast } from "sonner";
import { SeatPart } from "./form/hall-seat-configuration";

interface Props {
  initialData?: FormDataHall & {
    seats: HallSeat[];
    hallId: string;
    parts: SeatPart[];
  };
}

export const updateHallSeat = createSheet<Props, unknown>(
  ({ initialData, close }) => {
    const { trigger, isMutating } = useMutationUpdateHall();

    const handleSave = useCallback(
      (data: FormDataHall & { seats: HallSeat[]; parts: SeatPart[] }) => {
        trigger({
          hallId: initialData?.hallId || "",
          name: data.hallName,
          number: Number(data.hallNumber),
          rows: data.rows,
          columns: data.columns,
          features: JSON.stringify(data.features),
          seats: data.seats.map((x) => {
            return {
              ...x,
              type: x.type === "reserved" || x.type === "reserved-selected" ? "standard" : x.type,
            };
          }),
          parts: data.parts,
          status: data.status,
        })
          .then((res) => {
            if (res.success) {
              toast.success("Cinema hall updated successfully!");
              close(true);
            } else {
              toast.error("Failed to update cinema hall, please try again!");
            }
          })
          .catch(() => {
            toast.error("Failed to update cinema hall, please try again!");
          });
      },
      [initialData?.hallId, trigger, close]
    );

    return (
      <>
        <SheetHeader>
          <SheetTitle>Update Hall Seat</SheetTitle>
        </SheetHeader>
        {initialData && (
          <HallSeatForm
            onSubmit={handleSave}
            initialData={initialData}
            loading={isMutating}
          />
        )}
      </>
    );
  },
  { defaultValue: null }
);
