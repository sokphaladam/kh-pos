import React, { useState } from "react";
import { ProductForm } from "./form/product-form";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import {
  ProductFormContextProvider,
  useProductForm,
} from "./context/product-form-context";
import { ProductInput } from "@/app/api/product-v2/create-product";
import { KeyedMutator } from "swr";
import { ResponseType } from "@/lib/types";
import { ProductDetail } from "@/app/api/product-v2/[id]/get-product-detail";

function ProductFormContent({
  mutate,
}: {
  mutate?: KeyedMutator<ResponseType<ProductDetail>>;
}) {
  const params = useParams<{ productId: string }>();
  const { onSave, canSave } = useProductForm();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
      await mutate?.();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col flex-1 relative -mt-4">
      <div className="py-4 flex flex-row items-center justify-between sticky top-16 left-0 right-0 z-[49] bg-white px-6 -mx-4">
        <h2 className="text-lg font-semibold text-foreground">
          {params.productId ? "Edit" : "Create"} Product
        </h2>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!canSave || isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
      <div className="relative">
        <ProductForm />
      </div>
    </div>
  );
}

export function LayoutProductForm({
  defaultValue,
  mutate,
}: {
  defaultValue?: ProductInput | null;
  mutate?: KeyedMutator<ResponseType<ProductDetail>>;
}) {
  return (
    <ProductFormContextProvider defaultValue={defaultValue}>
      <ProductFormContent mutate={mutate} />
    </ProductFormContextProvider>
  );
}
