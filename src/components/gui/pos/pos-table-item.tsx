/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { TableCell, TableRow } from "@/components/ui/table";
import { usePOSContext } from "./context/pos-context";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { produce } from "immer";
import { POSDiscountSheet } from "./pos-discount-sheet";
import { CartProps, OrderProps } from "./types/post-types";
import { Edit, TicketPercent } from "lucide-react";
import { useCallback, useState } from "react";
import { useCommonDialog } from "@/components/common-dialog";
import { usePOSTabContext } from "./context/pos-tab-context";
import { POSItemQty } from "./pos-item-qty";
import { usePermission } from "@/hooks/use-permissions";
import { Order } from "@/classes/order";
import { TicketCarousel } from "../cinema/ticket-reservation/ticket-carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SharedProps {
  loading: boolean | undefined;
  onClickDiscount: () => Promise<void>;
  showDialog: (options: {
    title: string;
    content: string;
    actions: Array<{
      text: string;
      onClick: () => Promise<void>;
    }>;
    destructive: boolean;
  }) => void;
  orders: OrderProps;
  setOrders: (value: OrderProps) => void;
  onDeleteOrderItem?: (id: string) => void;
  title: string;
  sku: string;
  image: string;
  onUpdateOrderItemQty?: (id: string, qty: number) => void;
}

// Mobile Card Component - Optimized for Touch Screen
function POSTableItemMobile({
  cart,
  idx,
  sharedProps,
  booking,
  onClickTicketAction,
  onClickDigitalTicketAction,
}: {
  cart: CartProps;
  idx: number;
  sharedProps: SharedProps;
  onClickTicketAction: () => void;
  onClickDigitalTicketAction: () => void;
  booking: Record<
    string,
    {
      hall: any;
      seats: string[];
    }
  > | null;
}) {
  const permission = usePermission("pos");
  const {
    onClickDiscount,
    showDialog,
    orders,
    setOrders,
    onDeleteOrderItem,
    title,
    sku,
    image,
    onUpdateOrderItemQty,
  } = sharedProps;

  return (
    <div className="p-4 border-b bg-white">
      {/* First Row: Image with Index Overlay | Product Name, SKU, Price | Three Dots */}
      <div className="flex items-start gap-3 mb-4">
        {/* Product Image with Index Overlay */}
        <div className="flex-shrink-0 relative">
          <ImageWithFallback
            src={image}
            alt={title}
            width={56}
            height={56}
            className="object-contain rounded border"
          />
          {/* Index Overlay */}
          <div className="absolute -top-1 -left-1 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
            <span className="text-xs font-bold">{idx + 1}</span>
          </div>
        </div>

        {/* Product Name, SKU, Price */}
        <div className="flex-1 min-w-0 h-14 flex flex-col justify-between">
          <div className="relative">
            <h3 className="font-semibold text-base leading-tight overflow-hidden whitespace-nowrap">
              {title}
            </h3>
            <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
          </div>
          <p className="text-sm text-muted-foreground">
            {cart.sku} • {sku.replace(")", "")}
          </p>
          <p className="text-sm font-medium">
            ${Number(cart.price || 0).toFixed(2)}
          </p>
        </div>

        {/* Three Dots Menu */}
        <div className="flex-shrink-0">
          <BasicMenuAction
            value={cart}
            onDelete={
              permission.includes("delete")
                ? () => {
                    showDialog({
                      title: "Confirmation",
                      content: `You have ${cart.qty} of this item in your order. Do you want to remove it?`,
                      actions: [
                        {
                          text: "Delete",
                          onClick: async () => {
                            if (orders.status === "DRAFT") {
                              onDeleteOrderItem?.(cart.id || "");
                            }
                            setOrders(
                              produce(orders, (draft: OrderProps) => {
                                draft.carts.splice(idx, 1);
                              }),
                            );
                          },
                        },
                      ],
                      destructive: true,
                    });
                  }
                : undefined
            }
            items={[
              {
                label: "Discount",
                onClick: onClickDiscount,
              },
              ...(cart.reservation && cart.reservation.length > 0
                ? [
                    {
                      label: "Digital Ticket",
                      onClick: onClickDigitalTicketAction,
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>

      {/* Second Row: Qty Controls | Total Amount */}
      <div className="flex items-center justify-between mb-3">
        {booking ? (
          Object.values(booking).map((res: any, index) => {
            return (
              <div
                key={index}
                className="flex flex-row gap-2 items-center justify-start"
              >
                <div className="cursor-pointer" onClick={onClickTicketAction}>
                  <Edit className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-start justify-center">
                  <div className="capitalize">{res.hall.name}</div>
                  <div className="capitalize">{res.seats.join(" | ")}</div>
                </div>
              </div>
            );
          })
        ) : (
          <POSItemQty
            initialQty={cart.qty}
            onQtyChange={(qty) => {
              onUpdateOrderItemQty?.(cart.id || "", qty);
            }}
          />
        )}

        <div className="text-right">
          {cart.discountValue > 0 ? (
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm text-muted-foreground line-through">
                ${(Number(cart.price || 0) * cart.qty).toFixed(2)}
              </span>
              <span className="font-bold text-xl text-green-600">
                ${Number(cart.totalAfterDiscount).toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="font-bold text-xl">
              ${Number(cart.totalAfterDiscount).toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Desktop Table Row Component
function POSTableItemDesktop({
  cart,
  idx,
  sharedProps,
  onClickTicketAction,
  booking,
  onClickDigitalTicketAction,
}: {
  cart: CartProps;
  idx: number;
  sharedProps: SharedProps;
  onClickTicketAction: () => void;
  onClickDigitalTicketAction: () => void;
  booking: Record<
    string,
    {
      hall: any;
      seats: string[];
    }
  > | null;
}) {
  const permission = usePermission("pos");
  const {
    onClickDiscount,
    showDialog,
    orders,
    setOrders,
    onDeleteOrderItem,
    title,
    sku,
    image,
    onUpdateOrderItemQty,
  } = sharedProps;

  return (
    <TableRow>
      <TableCell className="text-center text-nowrap text-xs">
        <span className="font-semibold text-muted-foreground">{idx + 1}</span>
      </TableCell>
      <TableCell className="pl-4 text-nowrap text-xs truncate text-ellipsis overflow-hidden">
        <div className="flex flex-row gap-2 items-center">
          <ImageWithFallback
            src={image}
            alt={title}
            width={40}
            height={40}
            className="object-contain aspect-auto"
          />
          <div>
            <div className="font-medium">{title}</div>
            <div className="text-[9px] text-muted-foreground">
              SKU: {cart.sku}
            </div>
            <div className="text-[9px] text-muted-foreground">
              {sku.replace(")", "")}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right text-nowrap text-xs">
        ${Number(cart.price || 0).toFixed(2)}
      </TableCell>
      <TableCell className="text-center text-nowrap text-xs">
        {booking ? (
          Object.values(booking).map((res: any, index) => {
            return (
              <div
                key={index}
                className="flex flex-row gap-2 items-center justify-start"
              >
                <div className="cursor-pointer" onClick={onClickTicketAction}>
                  <Edit className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-start justify-center">
                  <div className="capitalize">{res.hall.name}</div>
                  <div className="capitalize">{res.seats.join(" | ")}</div>
                </div>
              </div>
            );
          })
        ) : (
          <POSItemQty
            initialQty={cart.qty}
            onQtyChange={(qty) => {
              onUpdateOrderItemQty?.(cart.id || "", qty);
            }}
          />
        )}
      </TableCell>
      <TableCell className="text-right text-nowrap text-xs">
        <div className="flex flex-row gap-1 items-center justify-end">
          <div>${(cart.discountValue || 0).toFixed(2)}</div>
          <div className="group cursor-pointer" onClick={onClickDiscount}>
            <TicketPercent className="h-4 w-4 group-hover:scale-110 transition-all" />
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right font-medium text-nowrap text-xs">
        ${Number(cart.totalAfterDiscount).toFixed(2)}
      </TableCell>
      <TableCell className="text-nowrap text-xs">
        <BasicMenuAction
          value={cart}
          onDelete={
            permission.includes("delete")
              ? () => {
                  showDialog({
                    title: "Confirmation",
                    content: `You have ${cart.qty} of this item in your order. Do you want to remove it?`,
                    actions: [
                      {
                        text: "Delete",
                        onClick: async () => {
                          if (orders.status === "DRAFT") {
                            onDeleteOrderItem?.(cart.id || "");
                          }
                          setOrders(
                            produce(orders, (draft: OrderProps) => {
                              draft.carts.splice(idx, 1);
                            }),
                          );
                        },
                      },
                    ],
                    destructive: true,
                  });
                }
              : undefined
          }
          items={[
            {
              label: "Discount",
              onClick: onClickDiscount,
            },
            ...(cart.reservation && cart.reservation.length > 0
              ? [
                  {
                    label: "Digital Ticket",
                    onClick: onClickDigitalTicketAction,
                  },
                ]
              : []),
          ]}
        />
      </TableCell>
    </TableRow>
  );
}

export function POSTableItem({
  cart,
  idx,
  isMobile = false,
  onClickTicketAction,
}: {
  cart: CartProps;
  idx: number;
  isMobile?: boolean;
  onClickTicketAction: () => void;
}) {
  const {
    orders,
    setOrders,
    onDeleteOrderItem,
    onUpdateOrderItemQty,
    loading,
  } = usePOSContext();
  const { tabs, recall, onCloseTab } = usePOSTabContext();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { showDialog } = useCommonDialog();
  const [title, sku] = cart.productTitle.split("(");
  const image =
    (cart.images || []).length > 0
      ? (cart.images?.find((f) => f.productVariantId === cart.variantId)?.url ??
        (cart.images || [])[0].url)
      : "";

  const onClickDiscount = useCallback(async () => {
    const id = tabs.find((f) => !!f.active)?.id;
    const res = await POSDiscountSheet.show({
      cart,
      orderId: id || "",
    }).finally(() => recall?.());

    if (res === "checkout") {
      onCloseTab?.(id || "", true);
      return;
    }
  }, [tabs, cart, recall, onCloseTab]);

  const sharedProps = {
    loading,
    onClickDiscount,
    showDialog,
    orders,
    setOrders,
    onDeleteOrderItem,
    title,
    sku,
    image,
    onUpdateOrderItemQty,
  };

  const booking =
    cart.reservation && cart.reservation.length > 0
      ? cart.reservation.reduce(
          (acc, booking) => {
            if (!booking.seat || !booking.seat.hall) {
              return acc;
            }

            const key = booking.seat.hall.id;

            if (!acc[key]) {
              acc[key] = {
                hall: booking.seat.hall,
                seats: [] as string[],
              };
            }

            acc[key].seats.push(`${booking.seat.row}${booking.seat.column}`);
            return acc;
          },
          {} as Record<string, { hall: any; seats: string[] }>,
        )
      : null;

  const handleSelectOrder = useCallback(() => {
    setSelectedOrder({
      createdAt: "",
      createdBy: null,
      customerId: "",
      invoiceNo: 0,
      orderId: "",
      orderStatus: "DRAFT",
      totalAmount: "0",
      customer: 0,
      items: [
        {
          ...cart,
          orderDetailId: cart.id || "",
          title: title,
          sku: cart.sku || "",
          barcode: cart.barcode || "",
          price: String(cart.price || 0),
          discountAmount: String(cart.discountValue || 0),
          modiferAmount: "0",
          totalAmount: String(cart.totalAfterDiscount || 0),
          reservation: cart.reservation?.map((x) => {
            return {
              ...x,
            };
          }),
          discounts: [],
        },
      ],
    });
  }, [cart, title]);

  return (
    <>
      {isMobile ? (
        <POSTableItemMobile
          cart={cart}
          idx={idx}
          sharedProps={sharedProps}
          booking={booking}
          onClickTicketAction={onClickTicketAction}
          onClickDigitalTicketAction={handleSelectOrder}
        />
      ) : (
        <POSTableItemDesktop
          cart={cart}
          idx={idx}
          sharedProps={sharedProps}
          onClickTicketAction={onClickTicketAction}
          booking={booking}
          onClickDigitalTicketAction={handleSelectOrder}
        />
      )}
      {selectedOrder && selectedOrder && (
        <Dialog
          open={!!selectedOrder}
          onOpenChange={() => {
            setSelectedOrder(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Digital Ticket Preview</DialogTitle>
            </DialogHeader>
            <TicketCarousel order={selectedOrder} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
