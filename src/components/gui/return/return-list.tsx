/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQueryReturn } from "@/app/hooks/use-query-return";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Pagination } from "@/components/pagination";
import SkeletonTableList from "@/components/skeleton-table-list";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Formatter } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { sheetOrderDetail } from "../order/sheet-order-detail";
import { sheetReturnStockIn } from "./sheet-return-stock-in";

export function ReturnList() {
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const offset = Number(searchParams.get("offset") || 0);
  const limit = Number(searchParams.get("limit") || 30);
  const status = searchParams.get("status") || "returned";
  const { data, isLoading, mutate } = useQueryReturn(
    offset,
    limit,
    status as any
  );

  if (isLoading) {
    return <SkeletonTableList />;
  }

  const renderList = (
    <Card>
      <CardHeader>
        <CardTitle>Order Return</CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-nowrap text-xs">#</TableHead>
              <TableHead className="text-nowrap text-xs">
                Order Invoice
              </TableHead>
              <TableHead className="text-nowrap text-xs">Product</TableHead>
              <TableHead className="text-nowrap text-xs">Quantity</TableHead>
              <TableHead className="text-nowrap text-xs">
                Refund Amount
              </TableHead>
              <TableHead className="text-nowrap text-xs">Reason</TableHead>
              <TableHead className="text-nowrap text-xs">Staus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.result?.data.map((x, idx) => {
              const image = x.productVariant?.basicProduct?.images.find(
                (f) => f.productVariantId === x.productVariant?.id
              )?.url;
              const menu = [
                {
                  label: "Order Detail",
                  onClick: async () => {
                    await sheetOrderDetail.show({ order: x.orderId });
                  },
                },
              ];

              menu.push({
                label: "Stock info",
                onClick: async () => {
                  const res = await sheetReturnStockIn.show({ id: x.id });
                  if (!!res) {
                    mutate();
                  }
                },
              });

              return (
                <TableRow key={idx}>
                  <TableCell className="text-nowrap text-xs">
                    RTN-{(idx + 1).toString().padStart(5, "0")}
                  </TableCell>
                  <TableCell className="text-nowrap text-xs">
                    {x.orderInvoiceNumber}
                  </TableCell>
                  <TableCell className="text-nowrap text-xs">
                    <div className="flex flex-row gap-2 items-center">
                      <div className="w-[40px]">
                        <ImageWithFallback
                          alt=""
                          src={image}
                          title={
                            x.productVariant?.basicProduct?.title
                              ?.split(" ")
                              .map((x) => x.charAt(0))
                              .join("") || ""
                          }
                          className="w-[35px] h-[35px] border border-dotted rounded-md object-contain"
                          height={35}
                          width={35}
                        />
                      </div>
                      <div>
                        {x.productVariant?.basicProduct?.title} (
                        {x.productVariant?.name})
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-nowrap text-xs">
                    {x.quantity}
                  </TableCell>
                  <TableCell className="text-nowrap text-xs">
                    ${x.refundAmount}
                  </TableCell>
                  <TableCell className="text-nowrap text-xs">
                    {x.reason && <i>{`"${x.reason}"`}</i>}
                  </TableCell>
                  <TableCell className="text-nowrap text-xs">
                    <Tooltip delayDuration={1000}>
                      <TooltipTrigger>
                        <Badge
                          variant={"outline"}
                          className={cn(
                            "text-xs",
                            x.status === "stock_in"
                              ? "bg-emerald-200 border-emerald-400"
                              : "bg-amber-200 border-amber-400"
                          )}
                        >
                          {x.status === "stock_in" ? "Stock In" : "Returned"}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div>
                          {x.returnedAt && (
                            <div className="flex flex-row items-center justify-between">
                              <div className="border-r-[1px] w-[75px] p-1">
                                Returned
                              </div>
                              <div className="border-r-[1px] w-[125px] text-nowrap text-center mr-4 p-1">
                                {Formatter.dateTime(x.returnedAt)}
                              </div>
                              <div className="text-right p-1">
                                {x.returnedBy?.fullname}
                              </div>
                            </div>
                          )}
                          {x.stockInAt && (
                            <div className="flex flex-row items-center justify-between border-t-[1px]">
                              <div className="border-r-[1px] w-[75px] p-1">
                                Stock In
                              </div>
                              <div className="border-r-[1px] w-[125px] text-nowrap text-center mr-4 p-1">
                                {Formatter.dateTime(x.stockInAt)}
                              </div>
                              <div className="text-right p-1">
                                {x.stockInBy?.fullname}
                              </div>
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <BasicMenuAction value={x} items={menu} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      {data?.result && (
        <CardFooter>
          <Pagination
            limit={limit}
            offset={offset}
            total={data.result.totalRows || 0}
            totalPerPage={data?.result?.data.length || 0}
            text="returns"
          />
        </CardFooter>
      )}
    </Card>
  );

  return (
    <div>
      <Tabs
        value={status}
        onValueChange={(v) => {
          const params = new URLSearchParams({
            limit: limit + "",
            offset: "0",
            status: v,
          });
          push(`${pathname}?${params.toString()}`);
        }}
      >
        <TabsList>
          <TabsTrigger value="returned">Returned</TabsTrigger>
          <TabsTrigger value="stock_in">Stock In</TabsTrigger>
        </TabsList>
        <TabsContent value="returned">{renderList}</TabsContent>
        <TabsContent value="stock_in">{renderList}</TabsContent>
      </Tabs>
    </div>
  );
}
