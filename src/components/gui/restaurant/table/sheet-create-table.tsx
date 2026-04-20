"use client";
import { createSheet } from "@/components/create-sheet";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import React, { useCallback } from "react";
import TableForm from "./table-form";
import { useState } from "react";
import { RestaurantTable } from "@/app/api/table/table-create";
import {
  useMutationCreateTable,
  useMutationUpdateTable,
} from "@/app/hooks/use-query-table";
import { toast } from "sonner";
import { useRestaurantActions } from "../hooks/use-restaurant-actions";
import { table_restaurant_tables } from "@/generated/tables";

interface DataProps {
  tableNumber: string;
  seatingCapacity: number;
  section: string;
  tableShape?: string;
  locationDescription?: string;
  features?: string[];
  additionalNotes?: string;
}

const EMPTY_VALUE = {
  tableNumber: "",
  seatingCapacity: 1,
  section: "",
  tableShape: "",
  locationDescription: "",
  features: [],
  additionalNotes: "",
};

export const sheetCreateTable = createSheet<
  {
    id?: string;
    data?: DataProps;
  },
  unknown
>(
  ({ close, data, id }) => {
    const { createTable, updateTable } = useRestaurantActions();
    const { trigger: triggerCreate, isMutating: isCreating } =
      useMutationCreateTable();
    const { trigger: triggerUpdate, isMutating: isUpdating } =
      useMutationUpdateTable();
    const [formData, setFormData] = useState(data ? data : EMPTY_VALUE);

    const handleSubmit = useCallback(() => {
      const input: DataProps = {
        ...formData,
        seatingCapacity: Number(formData.seatingCapacity),
      };

      if (!id) {
        triggerCreate(input as RestaurantTable)
          .then((res) => {
            if (res.success) {
              toast.success("Table created successfully");
              createTable(res.result as table_restaurant_tables);
              setFormData(EMPTY_VALUE);
              close(true);
            } else {
              toast.error("Failed to create table");
            }
          })
          .catch(() => {
            toast.error("Failed to create table");
          });
      } else {
        triggerUpdate({
          id: id || "",
          tableNumber: input.tableNumber,
          seatingCapacity: input.seatingCapacity,
          section: input.section,
          tableShape: input.tableShape || "",
          locationDescription: input.locationDescription,
          features: input.features || [],
          additionalNotes: input.additionalNotes,
        })
          .then((res) => {
            if (res.success) {
              toast.success("Table update successfully");
              updateTable(res.result as table_restaurant_tables);
              setFormData(EMPTY_VALUE);
              close(true);
            } else {
              toast.error("Failed to update table");
            }
          })
          .catch(() => {
            toast.error("Failed to update table");
          });
      }
    }, [
      formData,
      triggerCreate,
      triggerUpdate,
      close,
      id,
      createTable,
      updateTable,
    ]);

    return (
      <>
        <SheetHeader>
          <SheetTitle></SheetTitle>
        </SheetHeader>
        <TableForm
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data={formData as any}
          setData={setFormData}
          onSubmit={handleSubmit}
          isLoading={isCreating || isUpdating}
          isEdit={!!id}
        />
      </>
    );
  },
  { defaultValue: null }
);
