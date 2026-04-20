"use client";

import { createSheet } from "@/components/create-sheet";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProductGroupForm } from "./product-group-form";
import { ProductGroupResult } from "@/classes/product-group";

export const productGroupSheet = createSheet<
  { edit?: ProductGroupResult },
  boolean
>(({ close, edit }) => {
  return (
    <>
      <SheetHeader>
        <SheetTitle>
          {edit ? "Edit Product Group" : "Create Product Group"}
        </SheetTitle>
      </SheetHeader>
      <ProductGroupForm edit={edit} close={close} />
    </>
  );
});
