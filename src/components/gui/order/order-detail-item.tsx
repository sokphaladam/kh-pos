/* eslint-disable @typescript-eslint/no-explicit-any */
import { OrderDetail } from "@/classes/order";
import { OrderReturnInput } from "@/classes/order-return";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { produce } from "immer";
import { ChevronDown, Plus, Ticket } from "lucide-react";
import React, { useState } from "react";
import { OrderDetailReturnForm } from "./order-detail-return-form";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { OrderReturnList } from "./order-return-list";
import { OrderDetailModifiers } from "./order-detail-modifiers";

interface Props {
  order: OrderDetail;
  returns: OrderReturnInput[];
  setReturns: (v: OrderReturnInput[]) => void;
  id: string;
}

export function OrderDetailItem({ order, returns, setReturns, id }: Props) {
  const { formatForDisplay } = useCurrencyFormat();
  const [show, setShow] = useState(true);

  const totalReturn = returns
    .filter((f) => f.orderItemId === order.orderDetailId)
    .reduce((a, b) => (a = a + b.quantity), 0);

  const image = order.productVariant?.basicProduct?.images.find(
    (f) => f.productVariantId === order.variantId,
  )?.url;

  const booking =
    order.reservation && order.reservation.length > 0
      ? order.reservation.reduce(
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

  return (
    <React.Fragment key={order.barcode}>
      <TableRow>
        <TableCell className="text-xs text-nowrap">
          <div className="flex flex-row items-center gap-2">
            <div>
              <Button
                size={"sm"}
                variant={"ghost"}
                onClick={() => {
                  setShow(!show);
                }}
                className={
                  (order.orderReturns?.length || 0) > 0 ||
                  (order.orderModifiers?.length || 0) > 0
                    ? "visible"
                    : "invisible"
                }
              >
                <ChevronDown className="h-2 w-2" />
              </Button>
            </div>
            <div className="w-[40px]">
              <ImageWithFallback
                alt=""
                src={image}
                title={
                  order.productVariant?.basicProduct?.title
                    ?.split(" ")
                    .map((x) => x.charAt(0))
                    .join("") || ""
                }
                className="w-[35px] h-[35px] border border-dotted rounded-md object-contain"
                height={35}
                width={35}
              />
            </div>
            <div className="font-medium flex items-center gap-2">
              {order.title}
              {order.orderModifiers && order.orderModifiers.length > 0 && (
                <div className="flex items-center gap-1">
                  <Plus className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600 font-normal">
                    {order.orderModifiers.length} add-on
                    {order.orderModifiers.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="text-right text-xs text-nowrap">
          {formatForDisplay(Number(order.price || 0))}
        </TableCell>
        {booking ? (
          <TableCell className="text-right text-xs text-nowrap">
            {Object.values(booking).map((res: any, index) => {
              return (
                <div
                  key={index}
                  className="flex flex-row gap-2 items-center justify-start"
                >
                  <div>
                    <Ticket className="h-4 w-4" />
                  </div>
                  <div className="capitalize">
                    {res.hall.name}: {res.seats.join(" | ")}
                  </div>
                </div>
              );
            })}
          </TableCell>
        ) : (
          <TableCell className="text-center text-xs text-nowrap">
            {order.qty}
          </TableCell>
        )}
        <TableCell className="text-center text-xs text-nowrap">
          {formatForDisplay(order.discountAmount)}
        </TableCell>

        <TableCell className="text-right text-xs text-nowrap">
          {formatForDisplay(
            Number(
              order.qty * Number(order.price || 0) -
                Number(order.discountAmount),
            ),
          )}
        </TableCell>
        <TableCell className="text-center text-xs text-nowrap">
          {totalReturn < order.qty && (
            <BasicMenuAction
              value={order}
              items={[
                {
                  label: "Return",
                  onClick: () => {
                    setReturns(
                      produce(returns, (draft) => {
                        const price = Number(order.totalAmount) / order.qty;
                        const qty = order.qty - totalReturn;
                        draft.push({
                          orderId: id,
                          orderItemId: order.orderDetailId,
                          quantity: qty,
                          refundAmount: price * qty,
                          status: "stock_in",
                          reason: "",
                        });
                      }),
                    );
                  },
                },
              ]}
            />
          )}
        </TableCell>
      </TableRow>
      {/* Display modifiers if they exist and the row is expanded */}
      {order.orderModifiers && order.orderModifiers.length > 0 && show && (
        <TableRow>
          <TableCell colSpan={6} className="py-2 px-4">
            <OrderDetailModifiers
              orderModifiers={order.orderModifiers}
              quantity={order.qty}
              productModifiers={order.productVariant?.basicProduct?.modifiers}
            />
          </TableCell>
        </TableRow>
      )}
      {returns.map((x, idx) => {
        return (
          <React.Fragment key={idx}>
            <TableRow
              className={cn(
                x.orderItemId !== order.orderDetailId ? "hidden" : "",
              )}
            >
              <TableCell colSpan={6}>
                <OrderDetailReturnForm
                  value={x}
                  setValue={(v) => {
                    setReturns(
                      produce(returns, (draft) => {
                        const price = Number(order.totalAmount) / order.qty;
                        draft[idx] = {
                          ...v,
                          refundAmount: price * v.quantity,
                        };
                      }),
                    );
                  }}
                />
              </TableCell>
            </TableRow>
          </React.Fragment>
        );
      })}
      {(order.orderReturns?.length || 0) > 0 && !!show && (
        <OrderReturnList items={order.orderReturns} show={show} />
      )}
    </React.Fragment>
  );
}
