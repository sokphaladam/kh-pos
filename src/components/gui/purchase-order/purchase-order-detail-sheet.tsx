"use client";
import {
  useQueryPurchaseOrderDetails,
  useUpdatePurchaseOrder,
} from "@/app/hooks/use-query-purchase-order";
import { createSheet } from "@/components/create-sheet";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Formatter } from "@/lib/formatter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthentication } from "../../../../contexts/authentication-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import LoadingBar from "@/components/loading-bar-animation";
import React, { useCallback, useMemo } from "react";
import { LoaderIcon } from "lucide-react";
import { toast } from "sonner";
import { SupplierPurchaseOrderInput } from "@/classes/purchase-order-service";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

export const purchaseOrderDetailSheet = createSheet<{ id: string }, undefined>(
  ({ id, close }) => {
    const { formatForDisplay } = useCurrencyFormat();
    const { data, isLoading, mutate, isValidating } =
      useQueryPurchaseOrderDetails(id);

    const { trigger: update, isMutating: updateMutating } =
      useUpdatePurchaseOrder();

    const { user } = useAuthentication();

    const isOwner = data?.createdBy?.id === user?.id;

    const additionalCosts = useMemo(() => {
      return data?.additionalCosts ?? [];
    }, [data]);

    const items = useMemo(() => {
      if (!data?.items) {
        return [];
      }
      return data.items;
    }, [data]);

    const onApprove = useCallback(() => {
      const orderInput: SupplierPurchaseOrderInput = {
        id: data?.id,
        supplierId: data?.supplierId,
        status: "approved",
        createdAt: data?.createdAt ? Formatter.date(data?.createdAt) : null,
        updatedAt: data?.updatedAt ? Formatter.date(data?.updatedAt) : null,
        purchasedAt: data?.purchasedAt
          ? Formatter.date(data?.purchasedAt)
          : null,
        expectedAt: data?.expectedAt ? Formatter.date(data?.expectedAt) : null,
        note: data?.note,
        items: data?.items,
        warehouseId: data?.warehouseId,
        additionalCosts: data?.additionalCosts,
      };
      update(orderInput)
        .then((r) => {
          if (r.success) {
            toast.success("Purchase order updated status successfully");
            close(undefined);
            mutate();
          } else {
            toast.error("Failed to update purchase order status");
          }
        })
        .catch(() => {
          toast.error("Failed to update purchase order");
        });
    }, [data, update, close, mutate]);

    if (isLoading || isValidating) {
      return <LoadingBar className="top-0" />;
    }

    const totalReceived =
      data?.items?.reduce(
        (a, b) => a + Number(b.receivedQty) * Number(b.purchaseCost),
        0,
      ) || 0;
    const totalAddional =
      data?.additionalCosts?.reduce((a, b) => a + Number(b.cost), 0) || 0;

    return (
      <>
        {/* Modern Header */}
        <SheetHeader className="border-b border-gray-100 pb-6 mt-6">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-2xl font-bold text-gray-900 mb-2">
                Purchase Order Details
              </SheetTitle>
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-gray-700">
                  {data?.poIncrement}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "px-3 py-1 text-sm font-medium uppercase tracking-wide",
                    data?.status === "approved" &&
                      "bg-blue-50 text-blue-700 border-blue-200",
                    data?.status === "draft" &&
                      "bg-gray-50 text-gray-700 border-gray-200",
                    data?.status === "completed" &&
                      "bg-green-50 text-green-700 border-green-200",
                    data?.status === "closed" &&
                      "bg-red-50 text-red-700 border-red-200",
                  )}
                >
                  {data?.status}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Progress</div>
              <div className="text-lg font-semibold text-gray-900">
                {data?.received ?? "0"} of {data?.totalQty}
              </div>
              <div className="w-24 bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      ((data?.received || 0) / (data?.totalQty || 1)) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Main Content */}
        <div className="flex-1 mt-6 space-y-6">
          {/* Order Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information Card */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600">
                    Date:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {Formatter.date(data?.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600">
                    Expected Date:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {data?.expectedAt
                      ? Formatter.date(data?.expectedAt)
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600">
                    Ordered By:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {isOwner ? "Owner" : data?.createdBy?.username}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600">
                    Store:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {data?.warehouse?.name}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Supplier Information Card */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Supplier Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">
                    Company
                  </div>
                  <div className="text-base font-semibold text-gray-900">
                    {data?.supplier?.name}
                  </div>
                </div>
                {data?.supplier?.contactName && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      Contact Person
                    </div>
                    <div className="text-sm text-gray-900">
                      {data?.supplier?.contactName}
                    </div>
                  </div>
                )}
                {data?.supplier?.contactPhone && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      Phone
                    </div>
                    <div className="text-sm text-gray-900">
                      {data?.supplier?.contactPhone}
                    </div>
                  </div>
                )}
                {data?.supplier?.contactEmail && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      Email
                    </div>
                    <div className="text-sm text-gray-900">
                      {data?.supplier?.contactEmail}
                    </div>
                  </div>
                )}
                {data?.supplier?.address && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      Address
                    </div>
                    <div className="text-sm text-gray-900">
                      {data?.supplier?.address}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes Section */}
          {data?.note && (
            <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700 leading-relaxed bg-white p-4 rounded-lg border border-amber-100">
                  {data?.note}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Items Section - Keep as requested */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-auto text-nowrap text-sm font-semibold text-gray-900">
                      Item
                    </TableHead>
                    <TableHead className="w-[100px] text-right text-nowrap text-sm font-semibold text-gray-900">
                      Quantity
                    </TableHead>
                    <TableHead className="w-[120px] text-right text-nowrap text-sm font-semibold text-gray-900">
                      Purchase cost
                    </TableHead>
                    <TableHead className="w-[100px] text-right text-nowrap text-sm font-semibold text-gray-900">
                      Amount
                    </TableHead>
                    <TableHead className="w-[50px] text-right text-nowrap text-sm">
                      <span className="sr-only">Action</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    return (
                      <TableRow
                        key={item.id}
                        className="px-0 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <TableCell className="table-cell text-nowrap text-sm py-4">
                          <div className="flex gap-2">
                            <ImageWithFallback
                              src={item.image || undefined}
                              alt={item.name || "Product"}
                              title=""
                              width={40}
                              height={40}
                              className="w-12 h-12 flex-shrink-0"
                              fallbackClassName="w-18 h-18 flex-shrink-0"
                            />
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900">
                                {item.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.sku}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="table-cell text-right text-nowrap text-sm py-4">
                          <div className="space-y-1">
                            <div className="font-medium">
                              <span className="text-green-600">
                                {item.receivedQty || 0}
                              </span>
                              <span className="text-gray-400">/</span>
                              <span className="text-gray-900">
                                {item.qty || 0}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="table-cell text-right text-nowrap text-sm py-4 font-medium">
                          {formatForDisplay(item.purchaseCost ?? 0)}
                        </TableCell>
                        <TableCell className="table-cell text-right text-nowrap text-sm py-4">
                          <div className="space-y-1">
                            <div className="font-semibold text-green-600">
                              {formatForDisplay(
                                Number(item.receivedQty) *
                                  Number(item.purchaseCost),
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatForDisplay(item.amount ?? 0)}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {additionalCosts.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Additional Costs
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-auto text-nowrap text-sm font-semibold text-gray-900">
                          Additional Cost
                        </TableHead>
                        <TableHead className="w-[120px] text-right text-nowrap text-sm font-semibold text-gray-900">
                          Amount
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {additionalCosts.map((item) => {
                        return (
                          <TableRow
                            key={item.id}
                            className="hover:bg-gray-50 transition-colors duration-150"
                          >
                            <TableCell className="table-cell h-12 text-nowrap text-sm py-4 font-medium text-gray-900">
                              {item.name}
                            </TableCell>
                            <TableCell className="table-cell h-12 text-right text-nowrap text-sm py-4 font-semibold">
                              {formatForDisplay(item.cost ?? 0)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>

            {/* Modern Summary Footer */}
            <CardFooter className="bg-gray-50 border-t border-gray-100 p-6">
              <div className="w-full">
                <div className="flex justify-end">
                  <div className="space-y-4 min-w-[300px]">
                    <div className="flex justify-between items-center text-base">
                      <span className="font-medium text-gray-700">
                        Order Total:
                      </span>
                      <span className="font-bold text-gray-900 text-lg">
                        {formatForDisplay(data?.total ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-base border-t border-gray-200 pt-4">
                      <span className="font-medium text-gray-700">
                        Total Received:
                      </span>
                      <span className="font-bold text-green-600 text-lg">
                        {formatForDisplay(totalReceived + totalAddional)}
                      </span>
                    </div>
                    {totalReceived + totalAddional <
                      (Number(data?.total) || 0) && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-600">
                          Remaining:
                        </span>
                        <span className="font-semibold text-orange-600">
                          {formatForDisplay(
                            (Number(data?.total) || 0) -
                              (totalReceived + totalAddional),
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Professional Action Footer */}
        <SheetFooter className="border-t border-gray-100 pt-6 mt-6 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-row gap-4 justify-end w-full">
            {data?.status === "draft" && (
              <Button
                onClick={onApprove}
                disabled={updateMutating}
                className="bg-blue-600 hover:bg-blue-700 font-medium shadow-sm hover:shadow-md transition-all duration-200 px-6"
              >
                Approve Order
                {updateMutating && (
                  <LoaderIcon className="w-4 h-4 animate-spin ml-2" />
                )}
              </Button>
            )}
          </div>
        </SheetFooter>
      </>
    );
  },
);
