/* eslint-disable @next/next/no-img-element */
"use client";
import { CartProps, OrderProps } from "./types/post-types";
import { AlertTriangle, CheckCircle, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createSheet } from "@/components/create-sheet";
import { SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const POSPreviewPickingList = createSheet<
  { orders: OrderProps },
  unknown
>(
  ({ orders, close }) => {
    const getTotalPicked = (item: CartProps) => {
      return item.slot?.reduce((sum, location) => sum + location.qty, 0);
    };

    const getShortage = (item: CartProps) => {
      const totalPicked = getTotalPicked(item) || 0;
      return Math.max(0, item.qty - totalPicked);
    };

    return (
      <>
        <SheetHeader>
          <SheetTitle>Picking List — Order #{orders.invoiceNo}</SheetTitle>
        </SheetHeader>
        <Card className="mt-5">
          <CardContent className="p-0 relative">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-medium text-xs text-nowrap">
                    Product
                  </th>
                  <th className="text-center p-4 font-medium text-xs text-nowrap">
                    Requested
                  </th>
                  <th className="text-center p-4 font-medium text-xs text-nowrap">
                    Pick Qty
                  </th>
                  <th className="text-right p-4 font-medium text-xs text-nowrap">
                    Slot
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.carts.map((item, idx) => {
                  const totalPicked = getTotalPicked(item);
                  const shortage = getShortage(item);

                  const image =
                    (item.images || []).length > 0
                      ? item.images?.find(
                          (f) => f.productVariantId === item.variantId
                        )?.url ?? (item.images || [])[0].url
                      : "";

                  return (
                    <tr key={idx} className="border-b">
                      <td className="p-4 font-medium align-top text-xs text-nowrap">
                        <div className="flex items-center gap-2">
                          {shortage === 0 ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Package className="w-4 h-4 text-gray-400" />
                          )}
                          <img
                            src={image}
                            alt=""
                            className="w-[40px] h-[40px] object-contain aspect-auto"
                          />
                          <div>
                            <div>{item.productTitle}</div>
                            <small>SKU: {item.sku}</small>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-center align-top">
                        <span className="font-medium">{item.qty}</span>
                      </td>

                      <td className="p-4 align-top">
                        <div className="space-y-2">
                          {item.slot?.map((slot, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-center gap-2"
                            >
                              <div className="flex items-center gap-1">
                                <span className="w-8 text-center">
                                  {slot.qty}
                                </span>
                              </div>
                            </div>
                          ))}

                          {(item.slot?.length || 0) > 1 && (
                            <>
                              <div className="border-t pt-2 mt-2">
                                <div className="text-center text-sm font-medium">
                                  {totalPicked} Total
                                </div>
                              </div>
                            </>
                          )}

                          {shortage > 0 && (
                            <div className="flex items-center justify-center gap-1 text-red-600 text-sm">
                              <AlertTriangle className="w-3 h-3" />
                              {shortage} unavailable
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-4 align-top">
                        <div className="space-y-2">
                          {item.slot?.map((location, index) => (
                            <div key={index} className="text-right">
                              <Badge variant="outline" className="font-mono">
                                {location.name}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <SheetFooter className="mt-5">
          <Button
            onClick={() => {
              close(true);
            }}
          >
            Print
          </Button>
        </SheetFooter>
      </>
    );
  },
  { defaultValue: null }
);
