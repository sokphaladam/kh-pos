"use client";
import { usePOSContext } from "./context/pos-context";
import { POSSearch } from "./pos-search";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { POSCheckoutFooter } from "./pos-checkout-footer";
import { POSTableItem } from "./pos-table-item";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { TicketReservationLayout } from "../cinema/ticket-reservation/ticket-reservation-layout";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { produce } from "immer";
import { usePOSTabContext } from "./context/pos-tab-context";

export function POSTableList() {
  const { orders, setFetching, setOrders, onUpdateOrderItemQty } =
    usePOSContext();
  const { recall } = usePOSTabContext();
  const [movieId, setMovieId] = useState<string | null>(null);

  const currentSelected = orders.carts.find(
    (cart) => cart.variantId === movieId,
  );

  const onSelectProduct = useCallback(
    (
      item: ProductSearchResult,
      isMovie?: boolean,
      data?: {
        showtimeId: string;
        seatId: string;
        price: number;
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
          }
        }),
      );
      setTimeout(() => {
        setFetching?.(false);
        setMovieId(null);
        recall?.();
      }, 300);
    },
    [onUpdateOrderItemQty, orders, setFetching, setOrders, recall],
  );

  return (
    <Card className="flex-1 flex flex-col overflow-x-hidden h-full">
      <CardHeader className="px-2 py-3 flex flex-row items-center">
        <div className="w-full">
          <POSSearch />
        </div>
        {movieId && currentSelected ? (
          <Dialog open={!!movieId} onOpenChange={() => setMovieId(null)}>
            <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 flex flex-col">
              <VisuallyHidden>
                <DialogTitle>Select Products</DialogTitle>
              </VisuallyHidden>
              <div className="w-full h-full flex flex-col">
                <div
                  className={cn(
                    "flex-1 flex",
                    movieId ? "overflow-auto" : "overflow-hidden",
                  )}
                >
                  <div className="px-4 flex-1 flex flex-col">
                    <TicketReservationLayout
                      movieId={movieId}
                      onConfirm={(data) => {
                        const product = currentSelected;
                        onSelectProduct(
                          {
                            productId: product.productId,
                            productTitle: product.productTitle,
                            variantId: product.variantId || "",
                            sku: product.sku || "",
                            warehouseId: product.warehouseId || "",
                            price: product.price || 0,
                            barcode: product.barcode || "",
                            discounts: [],
                            images: product.images || [],
                          },
                          true,
                          data,
                        );
                      }}
                      currentSelected={currentSelected.reservation}
                      variant={currentSelected.variants?.at(0)}
                    />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <></>
        )}
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-x-hidden">
        {/* Mobile List View */}
        <div className="md:hidden">
          {orders && orders.carts && orders.carts.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Cart is empty. Scan a barcode to add items.
            </div>
          ) : (
            <div className="divide-y">
              {orders &&
                orders.carts.map((cart, idx) => {
                  return (
                    <POSTableItem
                      cart={cart}
                      idx={idx}
                      key={idx}
                      isMobile={true}
                      onClickTicketAction={() => {
                        setMovieId(cart.variantId || "");
                      }}
                    />
                  );
                })}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto space-x-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px] text-center text-nowrap text-xs">
                  #
                </TableHead>
                <TableHead className="pl-4 text-nowrap text-xs">
                  Product
                </TableHead>
                <TableHead className="w-[100px] text-right text-nowrap text-xs">
                  Price
                </TableHead>
                <TableHead className="w-[80px] text-center text-nowrap text-xs">
                  Qty
                </TableHead>
                <TableHead className="w-[100px] text-right text-nowrap text-xs">
                  Discount
                </TableHead>
                <TableHead className="w-[100px] text-right text-nowrap text-xs">
                  Total
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders && orders.carts && orders.carts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-[200px] text-center text-muted-foreground"
                  >
                    Cart is empty. Scan a barcode to add items.
                  </TableCell>
                </TableRow>
              ) : (
                orders &&
                orders.carts.map((cart, idx) => {
                  return (
                    <POSTableItem
                      cart={cart}
                      idx={idx}
                      key={idx}
                      isMobile={false}
                      onClickTicketAction={() => {
                        setMovieId(cart.variantId || "");
                      }}
                    />
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex-col p-4 gap-4 block md:hidden">
        <POSCheckoutFooter />
      </CardFooter>
    </Card>
  );
}
