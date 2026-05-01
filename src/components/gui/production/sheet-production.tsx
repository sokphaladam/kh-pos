import { createSheet } from "@/components/create-sheet";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import React from "react";
import { ProductionForm } from "./production-form";

export const SheetProduction = createSheet<unknown, unknown>(
  ({ close }) => {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Production</SheetTitle>
        </SheetHeader>
        <div className="py-4">
          <ProductionForm
            onSaved={() => {
              close(true);
            }}
          />
        </div>
      </>
    );
  },
  { defaultValue: null },
);
