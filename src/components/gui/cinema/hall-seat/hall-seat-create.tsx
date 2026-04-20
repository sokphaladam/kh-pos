"use client";

import { createSheet } from "@/components/create-sheet";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FormDataHall, HallSeat, HallSeatForm } from "./hall-seat-form";
import { useMutationCreateHall } from "@/app/hooks/cinema/use-query-hall";
import { useCallback } from "react";
import { toast } from "sonner";
import { SeatPart } from "./form/hall-seat-configuration";

export const createHallSeat = createSheet<unknown, unknown>(
  ({ close }) => {
    const { trigger, isMutating } = useMutationCreateHall();

    const handleSave = useCallback(
      (data: FormDataHall & { seats: HallSeat[]; parts: SeatPart[] }) => {
        trigger({
          name: data.hallName,
          number: Number(data.hallNumber),
          rows: data.rows,
          columns: data.columns,
          features: JSON.stringify(data.features),
          seats: data.seats.map((x) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { disabled, ...seat } = x;
            return {
              ...seat,
              type:
                x.type === "reserved" || x.type === "reserved-selected"
                  ? "standard"
                  : x.type,
            };
          }),
          parts: data.parts,
          status: data.status,
        })
          .then((res) => {
            if (res.success) {
              toast.success("Cinema hall created successfully!");
              close(true);
            } else {
              toast.error("Failed to create cinema hall, please try again!");
            }
          })
          .catch(() => {
            toast.error("Failed to create cinema hall, please try again!");
          });
      },
      [trigger, close],
    );

    return (
      <>
        <SheetHeader>
          <SheetTitle>Create Hall Seat</SheetTitle>
        </SheetHeader>
        <HallSeatForm onSubmit={handleSave} loading={isMutating} />
      </>
    );
  },
  { defaultValue: null },
);
