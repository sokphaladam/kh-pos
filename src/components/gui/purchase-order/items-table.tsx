import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { MaterialInput } from "@/components/ui/material-input";
import SearchSlotPicker from "@/components/search-slot-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { PurchaseOrderItem } from "@/classes/purchase-order-service";
import { ReceiveData } from "./types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

interface ItemsTableProps {
  items: PurchaseOrderItem[];
  selectedItems: Set<string>;
  receiveData: Record<string, ReceiveData>;
  showAdvanced: boolean;
  sortDirection: "asc" | "desc" | null;
  onSelectAll: (checked: boolean) => void;
  onSortChange: () => void;
  onItemToggle: (itemId: string) => void;
  onDataChange: (
    itemId: string,
    field: string,
    value: string | number | Date | object | undefined,
  ) => void;
}

// Product hover card component
function ProductHoverCard({ item }: { item: PurchaseOrderItem }) {
  const { formatForDisplay } = useCurrencyFormat();
  const maxQty = (item.qty || 0) - (item.receivedQty || 0);
  const isFullyReceived = maxQty <= 0;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 cursor-pointer">
            <ImageWithFallback
              src={item.image || undefined}
              alt={item.name || "Product"}
              title="Image"
              width={32}
              height={32}
              className="w-8 h-8 flex-shrink-0"
              fallbackClassName="w-8 h-8 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-medium text-sm line-clamp-1",
                    isFullyReceived ? "text-gray-500" : "text-gray-900",
                  )}
                >
                  {item.name}
                </span>
              </div>
              <div className="text-xs text-gray-500">{item.sku}</div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-sm p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <ImageWithFallback
                src={item.image || undefined}
                alt={item.name || "Product"}
                title="Product Image"
                width={80}
                height={80}
                className="w-20 h-20 flex-shrink-0 rounded-md border"
                fallbackClassName="w-20 h-20 flex-shrink-0 rounded-md border"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                  {item.name}
                </h4>
                <p className="text-xs text-gray-500 mb-2">SKU: {item.sku}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Ordered:</span>
                <span className="ml-1 font-medium">{item.qty || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Received:</span>
                <span className="ml-1 font-medium">
                  {item.receivedQty || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Unit Cost:</span>
                <span className="ml-1 font-medium">
                  {formatForDisplay(item.purchaseCost ?? 0)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Remaining:</span>
                <span className="ml-1 font-medium">{maxQty}</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Mobile product card component
function MobileProductCard({ item }: { item: PurchaseOrderItem }) {
  const { formatForDisplay } = useCurrencyFormat();
  const maxQty = (item.qty || 0) - (item.receivedQty || 0);
  const isFullyReceived = maxQty <= 0;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 mb-2 cursor-pointer">
            <ImageWithFallback
              src={item.image || undefined}
              alt={item.name || "Product"}
              title="Image"
              width={40}
              height={40}
              className="w-10 h-10 flex-shrink-0"
              fallbackClassName="w-10 h-10 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-medium text-sm line-clamp-2",
                    isFullyReceived ? "text-gray-500" : "text-gray-900",
                  )}
                >
                  {item.name}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">{item.sku}</div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <ImageWithFallback
                src={item.image || undefined}
                alt={item.name || "Product"}
                title="Product Image"
                width={80}
                height={80}
                className="w-20 h-20 flex-shrink-0 rounded-md border"
                fallbackClassName="w-20 h-20 flex-shrink-0 rounded-md border"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                  {item.name}
                </h4>
                <p className="text-xs text-gray-500 mb-2">SKU: {item.sku}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Ordered:</span>
                <span className="ml-1 font-medium">{item.qty || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Received:</span>
                <span className="ml-1 font-medium">
                  {item.receivedQty || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Unit Cost:</span>
                <span className="ml-1 font-medium">
                  {formatForDisplay(item.purchaseCost ?? 0)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Remaining:</span>
                <span className="ml-1 font-medium">{maxQty}</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ItemsTable({
  items,
  selectedItems,
  receiveData,
  showAdvanced,
  sortDirection,
  onSelectAll,
  onSortChange,
  onItemToggle,
  onDataChange,
}: ItemsTableProps) {
  const { formatForDisplay, getSymbol } = useCurrencyFormat();
  const allSelected =
    items.filter((item) => (item.qty || 0) - (item.receivedQty || 0) > 0)
      .length === selectedItems.size && selectedItems.size > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Items to Receive</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Mobile Card Layout */}
        <div className="block md:hidden space-y-4 p-4">
          {items.map((item) => {
            const isSelected = selectedItems.has(item.id || "");
            const data = receiveData[item.id || ""];
            const maxQty = (item.qty || 0) - (item.receivedQty || 0);
            const isFullyReceived = maxQty <= 0;
            const progressPercent = item.qty
              ? ((item.receivedQty || 0) / item.qty) * 100
              : 0;

            return (
              <div
                key={item.id}
                className={cn(
                  "border rounded-lg p-4 space-y-3 transition-colors",
                  isFullyReceived && "opacity-60 bg-gray-50",
                )}
              >
                {/* Header with checkbox and product info */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() =>
                      !isFullyReceived && onItemToggle(item.id || "")
                    }
                    disabled={isFullyReceived}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <MobileProductCard item={item} />

                    {/* Progress and status */}
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                      <span>
                        {item.receivedQty || 0} / {item.qty || 0}
                      </span>
                      <span
                        className={cn(
                          "font-medium",
                          maxQty === 0 ? "text-green-600" : "text-gray-900",
                        )}
                      >
                        {maxQty} remaining
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                      <div
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          progressPercent === 100
                            ? "bg-green-500"
                            : "bg-blue-500",
                        )}
                        style={{
                          width: `${Math.min(100, progressPercent)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Input fields when selected */}
                {isSelected && (
                  <div className="space-y-3 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">
                          Quantity
                        </label>
                        <MaterialInput
                          value={data?.qty?.toString() || ""}
                          onChange={(e) => {
                            const qty = Math.max(
                              0,
                              Math.min(parseInt(e.target.value) || 0, maxQty),
                            );
                            onDataChange(item.id || "", "qty", qty);
                          }}
                          type="number"
                          min="0"
                          max={maxQty}
                          className="w-full h-8 text-sm"
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">
                          Cost ()
                        </label>
                        <MaterialInput
                          value={data?.costPerUnit?.toString() || ""}
                          onChange={(e) =>
                            onDataChange(
                              item.id || "",
                              "costPerUnit",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          type="number"
                          step="0.01"
                          className="w-full h-8 text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">
                        Slot
                      </label>
                      <SearchSlotPicker
                        value={data?.slotName || ""}
                        selectedSlot={data?.slotDetail}
                        onChange={(slot) => {
                          onDataChange(item.id || "", "slotId", slot?.id || "");
                          onDataChange(
                            item.id || "",
                            "slotName",
                            slot?.name || "",
                          );
                          onDataChange(item.id || "", "slotDetail", slot);
                        }}
                      />
                    </div>

                    {showAdvanced && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-700">
                            Lot #
                          </label>
                          <MaterialInput
                            value={data?.lotNumber || ""}
                            onChange={(e) =>
                              onDataChange(
                                item.id || "",
                                "lotNumber",
                                e.target.value,
                              )
                            }
                            type="text"
                            className="w-full h-8 text-sm"
                            placeholder="LOT"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-700">
                            Expiry
                          </label>
                          <DatePicker
                            initialValue={
                              data?.expiredAt
                                ? new Date(data.expiredAt)
                                : undefined
                            }
                            onChange={(date) =>
                              onDataChange(
                                item.id || "",
                                "expiredAt",
                                date?.toISOString(),
                              )
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden md:block border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-8">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={onSelectAll}
                  />
                </TableHead>
                <TableHead className="w-56">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={onSortChange}
                  >
                    Product
                    {sortDirection === "asc" ? (
                      <ArrowUp className="ml-2 h-4 w-4" />
                    ) : sortDirection === "desc" ? (
                      <ArrowDown className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="w-24">Progress</TableHead>
                <TableHead className="w-20">Remaining</TableHead>
                {selectedItems.size > 0 && (
                  <>
                    <TableHead className="w-24">Quantity</TableHead>
                    <TableHead className="w-32">Slot</TableHead>
                    <TableHead className="w-24">Cost</TableHead>
                    {showAdvanced && (
                      <>
                        <TableHead className="w-24">Lot #</TableHead>
                        <TableHead className="w-40">Expiry</TableHead>
                      </>
                    )}
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const isSelected = selectedItems.has(item.id || "");
                const data = receiveData[item.id || ""];
                const maxQty = (item.qty || 0) - (item.receivedQty || 0);
                const isFullyReceived = maxQty <= 0;
                const progressPercent = item.qty
                  ? ((item.receivedQty || 0) / item.qty) * 100
                  : 0;

                return (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "transition-colors",
                      isFullyReceived && "opacity-60 bg-gray-50",
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() =>
                          !isFullyReceived && onItemToggle(item.id || "")
                        }
                        disabled={isFullyReceived}
                      />
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <ProductHoverCard item={item} />
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600">
                          {item.receivedQty || 0} / {item.qty || 0}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={cn(
                              "h-1.5 rounded-full transition-all",
                              progressPercent === 100
                                ? "bg-green-500"
                                : "bg-blue-500",
                            )}
                            style={{
                              width: `${Math.min(100, progressPercent)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          maxQty === 0 ? "text-green-600" : "text-gray-900",
                        )}
                      >
                        {maxQty}
                      </span>
                    </TableCell>

                    {isSelected && (
                      <>
                        <TableCell>
                          <MaterialInput
                            value={data?.qty?.toString() || ""}
                            onChange={(e) => {
                              const qty = Math.max(
                                0,
                                Math.min(parseInt(e.target.value) || 0, maxQty),
                              );
                              onDataChange(item.id || "", "qty", qty);
                            }}
                            type="number"
                            min="0"
                            max={maxQty}
                            className="w-20 h-8 text-sm"
                            placeholder="0"
                          />
                        </TableCell>

                        <TableCell>
                          <SearchSlotPicker
                            value={data?.slotName || ""}
                            selectedSlot={data?.slotDetail}
                            onChange={(slot) => {
                              onDataChange(
                                item.id || "",
                                "slotId",
                                slot?.id || "",
                              );
                              onDataChange(
                                item.id || "",
                                "slotName",
                                slot?.name || "",
                              );
                              onDataChange(item.id || "", "slotDetail", slot);
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-gray-500">
                              {getSymbol()}
                            </span>
                            <MaterialInput
                              value={data?.costPerUnit?.toString() || ""}
                              onChange={(e) =>
                                onDataChange(
                                  item.id || "",
                                  "costPerUnit",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              type="number"
                              step="0.01"
                              className="w-16 h-8 text-sm"
                              placeholder="0.00"
                            />
                          </div>
                        </TableCell>

                        {showAdvanced && (
                          <>
                            <TableCell>
                              <MaterialInput
                                value={data?.lotNumber || ""}
                                onChange={(e) =>
                                  onDataChange(
                                    item.id || "",
                                    "lotNumber",
                                    e.target.value,
                                  )
                                }
                                type="text"
                                className="w-20 h-8 text-sm"
                                placeholder="LOT"
                              />
                            </TableCell>

                            <TableCell>
                              <DatePicker
                                initialValue={
                                  data?.expiredAt
                                    ? new Date(data.expiredAt)
                                    : undefined
                                }
                                onChange={(date) =>
                                  onDataChange(
                                    item.id || "",
                                    "expiredAt",
                                    date?.toISOString(),
                                  )
                                }
                              />
                            </TableCell>
                          </>
                        )}
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {selectedItems.size > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Table>
              <TableBody>
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell className="w-8"></TableCell>
                  <TableCell className="w-56 p-1">
                    <span className="font-medium text-blue-900">
                      {selectedItems.size} items selected
                    </span>
                  </TableCell>
                  <TableCell className="w-24 p-1"></TableCell>
                  <TableCell className="w-20 p-1"></TableCell>
                  <TableCell className="w-24 p-1 text-center">
                    <div className="text-sm">
                      <div className="font-medium text-gray-700">
                        Total Quantity
                      </div>
                      <div className="font-semibold text-blue-900">
                        {Array.from(selectedItems).reduce((sum, itemId) => {
                          const data = receiveData[itemId];
                          return sum + (data?.qty || 0);
                        }, 0)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="w-32 p-1"></TableCell>
                  <TableCell className="w-24 p-1 text-center">
                    <div className="text-sm">
                      <div className="font-medium text-gray-700">
                        Total Cost
                      </div>
                      <div className="font-semibold text-blue-900">
                        {formatForDisplay(
                          Array.from(selectedItems).reduce((sum, itemId) => {
                            const data = receiveData[itemId];
                            return (
                              sum + (data?.qty || 0) * (data?.costPerUnit || 0)
                            );
                          }, 0),
                        )}
                      </div>
                    </div>
                  </TableCell>
                  {showAdvanced && (
                    <>
                      <TableCell className="w-24 p-1"></TableCell>
                      <TableCell className="w-40 p-1"></TableCell>
                    </>
                  )}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
