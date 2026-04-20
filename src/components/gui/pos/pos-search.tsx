/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MaterialInput } from "@/components/ui/material-input";
import { Check, MoreHorizontal } from "lucide-react";
import { KeyboardEvent, useCallback, useState } from "react";
import { usePOSContext } from "./context/pos-context";
import SearchProductPicker from "@/components/search-product-picker";
import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { produce } from "immer";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { OrderProps } from "./types/post-types";
import { usePOSTabContext } from "./context/pos-tab-context";
import { generateId } from "@/lib/generate-id";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ProductGrid } from "./product-grid";
import { useAuthentication } from "../../../../contexts/authentication-context";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

export function POSSearch() {
  const {
    orders,
    setOrders,
    onScanBarcode,
    onUpdateOrderItemQty,
    onCreateOrderItem,
    loading,
    onSaveDraft,
    setFetching,
  } = usePOSContext();
  const { onFetch } = usePOSTabContext();
  const { currentWarehouse } = useAuthentication();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const type = searchParams.get("search");
  const [searchInput, setSearchInput] = useState("");
  const [showGridDialog, setShowGridDialog] = useState(false);
  const [searchType, setSearchType] = useState<
    "BARCODE" | "SKU" | "TITLE" | "GRID"
  >(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pos-search-type");
      if (stored && ["BARCODE", "SKU", "TITLE", "GRID"].includes(stored)) {
        return stored as "BARCODE" | "SKU" | "TITLE" | "GRID";
      }
    }
    return type ? (type as any) : "BARCODE";
  });

  const onClickSearchType = useCallback(
    (v: "BARCODE" | "SKU" | "TITLE" | "GRID") => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("search", v);
      router.push(`${pathname}?${params.toString()}`, {
        scroll: false,
      });
      localStorage.setItem("pos-search-type", v);
      setSearchType(v);

      // Open dialog when GRID is selected
      if (v === "GRID") {
        setShowGridDialog(true);
      }
    },
    [pathname, router, searchParams],
  );

  const onSelectProduct = useCallback(
    (
      item: ProductSearchResult,
      isMovie?: boolean,
      data?: {
        showtimeId: string;
        seatId: string;
        price: number;
        code: string;
      }[],
    ) => {
      setFetching?.(true);
      setOrders(
        produce(orders, (draft) => {
          const findIndex = draft.carts.findIndex(
            (f) => f.variantId === item.variantId,
          );
          if (findIndex >= 0) {
            const qty = isMovie ? 1 : (draft.carts[findIndex].qty || 1) + 1;
            draft.carts[findIndex].qty = qty;

            if (draft.status === "DRAFT") {
              onUpdateOrderItemQty?.(
                draft.carts[findIndex].id || "",
                qty,
                data,
              );
              setFetching?.(false);
            }
          } else {
            const id = generateId();
            const value = {
              ...item,
              price: isMovie
                ? data?.reduce((a, b) => a + b.price, 0) || 0
                : item.price,
              qty: 1,
              khr: 0,
              usd: 0,
              discounts: [],
              discountValue: 0,
              totalAfterDiscount: 0,
              id,
            };
            draft.carts.push(value);
            if (draft.status === "DRAFT") {
              onCreateOrderItem?.(value, undefined, data);
            } else {
              const dummy: OrderProps = {
                invoiceNo: 0,
                payments: [],
                carts: [
                  {
                    ...value,
                    variantId: value.variantId || "",
                    qty: value.qty || 0,
                    discountValue: value.discountValue,
                    discounts: value.discounts,
                    khr: value.khr || 0,
                    usd: value.usd || 0,
                    productId: value.productId || "",
                    productTitle: value.productTitle || "",
                    totalAfterDiscount: value.totalAfterDiscount,
                    warehouseId: value.warehouseId,
                    price: value.price || 0,
                  },
                ],
                status: "DRAFT",
              };
              onSaveDraft?.(dummy, undefined, data).then(() => {
                onFetch?.();
              });
            }
          }
        }),
      );
      setTimeout(() => {
        setFetching?.(false);
        if (!!isMovie) {
          setShowGridDialog(false);
        }
      }, 300);
    },
    [
      onCreateOrderItem,
      onUpdateOrderItemQty,
      orders,
      setOrders,
      onSaveDraft,
      setFetching,
      onFetch,
    ],
  );

  const onSearchProduct = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.keyCode === 13) {
        if (searchInput.length > 3) {
          onScanBarcode?.(
            searchInput.trim(),
            searchType as "BARCODE" | "SKU" | "TITLE",
            (success) => {
              if (success) {
                setSearchInput("");
              }
            },
          );
        }
      }
    },
    [onScanBarcode, searchInput, searchType],
  );

  return (
    <>
      <div className={cn("relative p-3")}>
        {searchType === "TITLE" ? (
          <div className="pr-10">
            <SearchProductPicker
              clearInput
              onChange={onSelectProduct}
              disabled={loading}
            />
          </div>
        ) : searchType === "GRID" ? (
          <div className="pr-10">
            <MaterialInput
              label="Select Products"
              value=""
              readOnly
              onClick={() => setShowGridDialog(true)}
              className="text-center cursor-pointer"
            />
          </div>
        ) : (
          <MaterialInput
            label={`Search ${searchType.toLowerCase()}`}
            autoFocus
            onFocus={(e) => {
              e.target.select();
            }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={onSearchProduct}
            className="text-center"
            readOnly={loading}
          />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-haspopup="true"
              size="icon"
              variant="ghost"
              className="absolute top-0 right-0"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onClickSearchType("BARCODE")}>
              <Check
                className={`h-4 w-4 ${
                  searchType === "BARCODE" ? "" : "invisible"
                }`}
              />{" "}
              Barcode
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onClickSearchType("SKU")}>
              <Check
                className={`h-4 w-4 ${searchType === "SKU" ? "" : "invisible"}`}
              />{" "}
              SKU
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onClickSearchType("TITLE")}>
              <Check
                className={`h-4 w-4 ${
                  searchType === "TITLE" ? "" : "invisible"
                }`}
              />{" "}
              Title
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onClickSearchType("GRID")}>
              <Check
                className={`h-4 w-4 ${
                  searchType === "GRID" ? "" : "invisible"
                }`}
              />{" "}
              Grid
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Product Grid Dialog */}
      <Dialog open={showGridDialog} onOpenChange={setShowGridDialog}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 flex flex-col">
          <VisuallyHidden>
            <DialogTitle>Select Products</DialogTitle>
          </VisuallyHidden>
          <ProductGrid
            warehouse={currentWarehouse?.id}
            onSelectProduct={onSelectProduct}
            onClose={() => setShowGridDialog(false)}
            disabled={loading}
            cartItems={orders.carts}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
