/* eslint-disable @next/next/no-img-element */
"use client";
import { Button } from "@/components/ui/button";
import { EllipsisVertical, LoaderIcon, UploadCloud } from "lucide-react";
import { useUploadFileMinIO } from "@/app/hooks/use-upload-file";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { produce } from "immer";
import { Formatter } from "@/lib/formatter";
import { toast } from "sonner";
import { ProductImage } from "@/repository/product-image-repository";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useProductForm } from "../context/product-form-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { productDialog } from "@/components/product/dialog-product";
import { generateId } from "@/lib/generate-id";

function DropDownMenuImage(props: {
  onClickDelete?: () => void;
  image?: ProductImage;
  onClickUnbind?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const onOpenChange = useCallback((state: boolean) => {
    if (!state) {
      (document.activeElement as HTMLElement | null)?.blur();
    }
    setOpen(state);
  }, []);

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <div className="cursor-pointer absolute top-1 right-1 hover:bg-muted-foreground hover:text-white hover:rounded-full p-1 hover:shadow-md text-xs z-10 transition-all">
          <EllipsisVertical className="w-4 h-4" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          id="preview-image"
          onClick={(e) => {
            e.preventDefault();
            onOpenChange(false);
            productDialog.show({ image: props.image ? [props.image] : [] });
          }}
        >
          Preview
        </DropdownMenuItem>
        <DropdownMenuItem
          id="unbind-image"
          onClick={(e) => {
            e.preventDefault();
            onOpenChange(false);
            props.onClickUnbind?.();
          }}
        >
          Unbind variant
        </DropdownMenuItem>
        <hr className="my-1 border-t border-gray-200 dark:border-gray-700" />
        <DropdownMenuItem
          id="delete-image"
          onClick={(e) => {
            e.preventDefault();
            onOpenChange(false);
            props.onClickDelete?.();
          }}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProductFormImage() {
  const [draft, setDraft] = useState<ProductImage[]>([]);
  const { product, setProduct } = useProductForm();
  const { trigger, isMutating: isUploading } = useUploadFileMinIO();

  const [isProcessing, setIsProcessing] = useState(false);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const processingQueueRef = useRef<File[]>([]);
  const debounceMs = 500; // Adjust the debounce time as needed
  const [state, setState] = useState({
    total: 0,
    count: 0,
  });

  const processQueuedFiles = useCallback(async () => {
    const filesToProcess = [...processingQueueRef.current];
    processingQueueRef.current = [];

    if (filesToProcess.length === 0) return;

    setIsProcessing(true);

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      try {
        const upload = await trigger({ file });
        if (upload.url) {
          setDraft(
            produce((d) => {
              d.push({
                id: generateId(),
                url: upload.url,
                createdAt: Formatter.getNowDateTime(),
                imageOrder: i,
                productId: product.productId || "",
                updatedAt: Formatter.getNowDateTime(),
                productVariantId: "",
              });
            }),
          );
          setState(
            produce((d) => {
              d.count += 1;
            }),
          );
        } else {
          toast.error("Failed to upload image");
        }
      } catch {
        toast.error("Failed to upload image");
      }
    }

    setIsProcessing(false);
    setState({ total: 0, count: 0 });
  }, [product.productId, trigger]);

  const debouncedProcessFiles = useCallback(
    (files: File[]) => {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Add files to processing queue
      processingQueueRef.current = [...processingQueueRef.current, ...files];
      // Set new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        processQueuedFiles();
      }, debounceMs);
    },
    [processQueuedFiles],
  );

  useEffect(() => {
    if (draft.length > 0) {
      setProduct(
        produce(product, (dr) => {
          dr.productImages =
            product.productImages.length > 0
              ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                [...(product.productImages as any[]), ...draft]
              : draft;
        }),
      );
      setDraft([]);
    }
  }, [draft, product, setProduct]);

  const onUploadFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files: File[] = Array.from(event.target.files || []);
      if (files.length <= 0) return;
      setState({
        total: files.length,
        count: 0,
      });
      debouncedProcessFiles(files);
    },
    [debouncedProcessFiles],
  );

  return (
    <div>
      <div className="pb-1">
        <h3 className="text-md font-semibold text-foreground">Images</h3>
      </div>
      <Button asChild variant="outline" size={"sm"} className="my-2">
        <label htmlFor="upload-image" className="cursor-pointer flex gap-2">
          <UploadCloud />{" "}
          {isProcessing
            ? `Processing ${state.count}/${state.total}`
            : "Upload Images"}
          {isUploading && <LoaderIcon className="h-4 w-4 animate-spin" />}
        </label>
      </Button>
      <div className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {product.productImages.map((image, idx) => {
          const variant = product.productVariants.find(
            (f) => f.id === image.productVariantId,
          )?.name;
          return (
            <ContextMenu key={idx}>
              <ContextMenuTrigger
                className={cn(
                  "border border-dashed text-sm rounded-md overflow-hidden max-w-32 max-h-32 flex items-center justify-center relative",
                  // image.productVariantId ? "hidden" : ""
                )}
              >
                <div className="max-w-32 max-h-32 relative">
                  <img
                    src={image.url}
                    alt={image.id + ""}
                    className="aspect-auto object-contain w-full"
                  />
                </div>
                <DropDownMenuImage
                  onClickDelete={() => {
                    setProduct(
                      produce(product, (dr) => {
                        dr.productImages?.splice(idx, 1);
                      }),
                    );
                  }}
                  image={{
                    id: image.id,
                    url: image.url,
                    createdAt: "",
                    updatedAt: "",
                    imageOrder: image.imageOrder,
                    productId: product.productId || "",
                    productVariantId: image.productVariantId || "",
                  }}
                  onClickUnbind={() => {
                    setProduct(
                      produce(product, (dr) => {
                        dr.productImages[idx].productVariantId = "";
                      }),
                    );
                  }}
                />
                {image.productVariantId && (
                  <div className="bg-foreground p-2 opacity-70 absolute bottom-0 left-0 right-0 text-white text-center overflow-hidden leading-[8px] text-9px]">
                    <div
                      className="whitespace-nowrap"
                      style={{
                        display: "inline-block",
                        minWidth: "100%",
                        animation:
                          variant && variant.length > 20
                            ? "marquee 6s linear infinite"
                            : undefined,
                      }}
                    >
                      {variant}
                    </div>
                    <style jsx>{`
                      @keyframes marquee {
                        0% {
                          transform: translateX(100%);
                        }
                        100% {
                          transform: translateX(-100%);
                        }
                      }
                    `}</style>
                  </div>
                )}
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  inset
                  onClick={() => {
                    setProduct(
                      produce(product, (dr) => {
                        dr.productImages?.splice(idx, 1);
                      }),
                    );
                  }}
                >
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={onUploadFile}
        className="hidden"
        id="upload-image"
        multiple
      />
    </div>
  );
}
