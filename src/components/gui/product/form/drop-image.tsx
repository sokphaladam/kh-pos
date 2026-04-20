/* eslint-disable @next/next/no-img-element */
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { produce } from "immer";
import { CheckCircle, Plus } from "lucide-react";
import { useCallback } from "react";
import { useProductForm } from "../context/product-form-context";

interface Props {
  variantId?: string;
}

export function DropImage(props: Props) {
  const { product, setProduct } = useProductForm();

  const imageSelected = product.productImages.filter(
    (f) => f.productVariantId === props.variantId
  );

  const imagesToBind = product.productImages.filter(
    (f) => f.productVariantId === props.variantId || !f.productVariantId
  );

  const onClick = useCallback(
    (id: string) => {
      setProduct(
        produce(product, (draft) => {
          const idx = draft.productImages.findIndex((f) => f.id === id);
          if (idx !== -1) {
            if (draft.productImages[idx].productVariantId === props.variantId) {
              draft.productImages[idx].productVariantId = "";
              return;
            }
            if (imageSelected.length < 2) {
              draft.productImages[idx].productVariantId = props.variantId || "";
            }
          }
        })
      );
    },
    [product, props.variantId, setProduct, imageSelected]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="border gap-1 w-auto border-dotted rounded-md flex flex-row items-center h-[35px] cursor-pointer justify-center">
          {imageSelected.map((x, i) => {
            return (
              <div
                key={i}
                className="relative w-[32px] h-[32px] overflow-hidden"
              >
                <img
                  src={x.url}
                  alt=""
                  className="w-full object-contain aspect-auto rounded-sm"
                />
              </div>
            );
          })}
          {imageSelected.length < 2 && (
            <div className="w-[32px] h-[32px] flex flex-row items-center justify-center">
              <Plus className="h-4 w-4" />
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full max-w-[400px] h-80 overflow-y-auto space-y-2">
        <h4 className="font-medium leading-none">
          Click on image to bind/unbind to variant
        </h4>
        <hr className="my-2" />
        {imagesToBind.length === 0 && (
          <div className="text-xs text-muted-foreground text-center items-center justify-center ">
            No available image to bind. Upload more images to bind to this
            variant.
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          {imagesToBind.map((image, index) => {
            const isSelected = image.productVariantId === props.variantId;

            return (
              <div
                key={index}
                className="relative w-[90px] h-[90px] overflow-hidden cursor-pointer border border-dashed rounded-md hover:scale-105 transition-all"
                onClick={() => {
                  onClick(image.id!);
                }}
              >
                <img
                  src={image.url}
                  alt=""
                  className="w-full object-contain aspect-auto rounded-sm"
                />
                {isSelected && (
                  <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center">
                    <CheckCircle className="text-emerald-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
