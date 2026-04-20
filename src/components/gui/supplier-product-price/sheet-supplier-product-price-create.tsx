"use client";
import { createSheet } from "@/components/create-sheet";
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SupplierProductPriceInput } from "@/lib/types";
import React, { useCallback } from "react";
import { useCreateSupplierProductPrice } from "@/app/hooks/use-query-supplier-product-price";
import { toast } from "sonner";
import { SupplierProductPrice } from "@/classes/supplier-product-price";
import { FormSupplierProductPrice } from "./form/form-supplier-product-price";
import { formSupplierProductPriceType } from "./form/form-supplier-product-price-schema";

export const createSupplierProductPriceSheet = createSheet<
  {
    data: SupplierProductPrice[];
    edit: SupplierProductPriceInput | undefined;
  },
  SupplierProductPriceInput | null
>(
  ({ close, edit }) => {
    const { trigger, isMutating: isCreating } = useCreateSupplierProductPrice();

    const onCreate = useCallback(
      (value: formSupplierProductPriceType) => {
        trigger([
          {
            productVariantId: value.productVariantId,
            supplierId: value.supplierId,
            price: value.price,
          },
        ])
          .then((res) => {
            if (res.success) {
              toast.success("Supplier Product Price created");
              close(value);
            } else {
              toast.error("Field to create Supplier Product Price");
            }
          })
          .catch(() => {
            toast.error("Field to create Supplier Product Price");
          });
      },
      [close, trigger],
    );

    return (
      <>
        <SheetHeader>
          <SheetTitle>
            {edit ? "Edit" : "Create"} Supplier Product Price
          </SheetTitle>
          <SheetDescription>
            Set a new price for a product from a supplier
          </SheetDescription>
        </SheetHeader>
        <div className="my-4">
          <FormSupplierProductPrice onSave={onCreate} loading={isCreating} />
        </div>
      </>
    );
  },
  { defaultValue: null },
);
