"use client";
import { useQueryOrderList } from "@/app/hooks/use-query-order";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebouncedValue } from "@/components/use-debounce";
import { cn } from "@/lib/utils";
import { useAuthentication } from "contexts/authentication-context";
import { Search } from "lucide-react";
import { useState } from "react";
import { SheetTransferStock } from "./sheet-transfer-stock";

export function TransferStockList() {
  const { currency } = useAuthentication();
  const [searchTerm, setSearchTerm] = useState("");
  const searchDebounce = useDebouncedValue(searchTerm, 500);
  const { data, isLoading, mutate } = useQueryOrderList({
    offset: 0,
    limit: 30,
    status: "DRAFT",
    invoiceNo: searchDebounce as string,
  });

  return (
    <div className="flex flex-col lg:flex-row bg-gray-50">
      <div className="flex-1 lg:w-2/3 p-4 lg:p-6 bg-white lg:border-r">
        <div className="mb-4 lg:mb-6">
          <h1 className="text-2xl font-bold mb-2">Stock Finding</h1>
          <p className="text-gray-600">
            Look for the draft order product in non-POS slots and move it to the
            POS slot for checkout.
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 mb-4 lg:mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search invoice no..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              className="pl-10 h-10 lg:h-9"
            />
          </div>
        </div>

        {/* Products List */}
        <div className="hidden lg:block verflow-x-auto space-x-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-nowrap text-xs">
                  Invoice No.
                </TableHead>
                <TableHead className="text-nowrap text-xs">Date</TableHead>
                <TableHead className="text-nowrap text-xs">Items</TableHead>
                <TableHead className="text-nowrap text-xs">Total</TableHead>
                <TableHead className="text-nowrap text-xs">
                  Transfer By
                </TableHead>
                <TableHead className="text-nowrap text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.result?.orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-[200px] text-center text-muted-foreground"
                  ></TableCell>
                </TableRow>
              ) : (
                data?.result?.orders.map((order) => {
                  return (
                    <TableRow key={order.orderId}>
                      <TableCell className="text-nowrap text-xs">
                        <span className="font-medium">#{order.invoiceNo}</span>
                      </TableCell>
                      <TableCell className="text-nowrap text-xs">
                        <div className="text-sm text-muted-foreground mb-2 mt-2">
                          {order.createdAt}
                        </div>
                      </TableCell>
                      <TableCell className="text-nowrap text-xs">
                        <span className="text-sm">
                          {order.items?.reduce((a, b) => (a = a + b.qty), 0)}{" "}
                          items
                        </span>
                      </TableCell>
                      <TableCell className="text-nowrap text-xs">
                        <span className="font-medium">
                          {currency}
                          {order.totalAmount}
                        </span>
                      </TableCell>
                      <TableCell className="text-nowrap text-xs">
                        {order.transferBy?.fullname || ""}
                      </TableCell>
                      <TableCell className="text-nowrap text-xs">
                        <BasicMenuAction
                          value={order}
                          items={[
                            {
                              label: "Detail",
                              onClick: async () => {
                                await SheetTransferStock.show({
                                  item: order,
                                })
                                  .then()
                                  .catch()
                                  .finally(mutate);
                              },
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <ScrollArea className="h-[calc(100vh-200px)] lg:h-[calc(100vh-200px)] block lg:hidden">
          {isLoading ? (
            <div></div>
          ) : (
            <div className="space-y-3 lg:space-y-4">
              {data?.result?.orders.map((x, i) => {
                return (
                  <div key={i}>
                    <Card
                      className={cn("hover:shadow-md transition-shadow my-2")}
                      onClick={() => {
                        SheetTransferStock.show({ item: x });
                      }}
                    >
                      <CardContent className="p-3 lg:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-row justify-between">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3 className="font-semibold text-sm lg:text-base truncate">
                                  Invoice: #{x.invoiceNo}
                                </h3>
                              </div>
                              <div>
                                {x.transferBy && (
                                  <Badge className="bg-emerald-600">
                                    Transferred
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-xs lg:text-sm text-gray-600 space-y-1">
                              <div>
                                <p>Date: {x.createdAt}</p>
                              </div>
                              <div className="flex flex-wrap gap-4">
                                <p>Product: {x.items?.length}</p>
                                <p>
                                  Qty: {x.items?.reduce((a, b) => a + b.qty, 0)}
                                </p>
                                <p>
                                  Total: {currency}
                                  {x.totalAmount}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
