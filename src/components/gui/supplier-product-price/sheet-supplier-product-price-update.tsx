"use client";
import { createSheet } from "@/components/create-sheet";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SupplierProductPriceInput } from "@/lib/types";
import React, { useCallback } from "react";
import { useUpdateSupplierProductPrice } from "@/app/hooks/use-query-supplier-product-price";
import { toast } from "sonner";
import { Package } from "lucide-react";
import { FormSupplierProductPrice } from "./form/form-supplier-product-price";
import { formSupplierProductPriceType } from "./form/form-supplier-product-price-schema";

export const updateSupplierProductPriceSheet = createSheet<
  {
    id: string;
    edit: formSupplierProductPriceType;
  },
  SupplierProductPriceInput | null
>(
  ({ close, edit, id }) => {
    const { trigger, isMutating: isCreating } = useUpdateSupplierProductPrice();

    // Handle form submission
    const handleSave = useCallback(
      async (value: formSupplierProductPriceType) => {
        try {
          const result = await trigger({
            id: id,
            price: value.price,
            productVariantId: value.productVariantId,
            supplierId: value.supplierId,
            scheduledAt: value.scheduledAt,
            scheduledPrice: value.scheduledPrice,
          });
          // The API returns { success: boolean, result?: any, error?: string }
          if (result && typeof result === "object" && "success" in result) {
            const response = result as { success: boolean; error?: string };
            if (response.success) {
              toast.success(
                edit
                  ? "Supplier product price updated successfully"
                  : "Supplier product price created successfully"
              );
              close(value);
            } else {
              toast.error(
                response.error || "Failed to save supplier product price"
              );
            }
          } else {
            toast.success(
              edit
                ? "Supplier product price updated successfully"
                : "Supplier product price created successfully"
            );
            close(value);
          }
        } catch (error) {
          toast.error("An error occurred while saving");
          console.error(error);
        }
      },
      [trigger, edit, close, id]
    );

    return (
      <>
        <SheetHeader className="space-y-3">
          <SheetTitle className="text-xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {edit ? "Edit" : "Create"} Supplier Product Price
          </SheetTitle>
        </SheetHeader>

        <div className="my-4">
          <FormSupplierProductPrice
            onSave={handleSave}
            loading={isCreating}
            initialData={edit}
            isEdit
          />
        </div>
      </>
    );
  },
  { defaultValue: null }
);
