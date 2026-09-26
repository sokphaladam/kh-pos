"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Clock,
  ChefHat,
  CheckCircle,
  Settings,
  RotateCcw,
  Zap,
  Users,
  Info,
} from "lucide-react";
import { useCallback, useState } from "react";
import { SelectProductItem } from "./custom-order/restaurant-custom-order";
import { createSheet } from "@/components/create-sheet";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  useMutationForceUpdateQtyByStatus,
  useMutationUpdateOrderItemStatusAPI,
} from "@/app/hooks/use-query-order-update-status-item";
import { OrderItemStatusType } from "@/dataloader/order-status-item.loader";

type OrderStatus = "pending" | "cooking" | "served";

interface UpdateStatusData {
  mode: "force" | "convert";
  targetStatus: OrderStatus;
  quantity: number;
  currentStatus?: OrderStatus;
}

interface Props {
  selectedItem: SelectProductItem;
  currentStatus: OrderStatus;
  currentQuantity: number;
  orderId: string;
  orderDetailId: string;
  status: OrderItemStatusType[];
}

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-warning",
    bgColor: "bg-warning/15",
    borderColor: "border-warning/30",
    description: "Item is waiting to be prepared",
  },
  cooking: {
    label: "Cooking",
    icon: ChefHat,
    color: "text-warning",
    bgColor: "bg-warning/15",
    borderColor: "border-warning/30",
    description: "Item is being prepared in kitchen",
  },
  served: {
    label: "Served",
    icon: CheckCircle,
    color: "text-success",
    bgColor: "bg-success/15",
    borderColor: "border-success/30",
    description: "Item has been served to customer",
  },
};

export const restaurantUpdateStatus = createSheet<
  Props,
  UpdateStatusData | null
>(
  ({
    currentStatus,
    currentQuantity,
    close,
    orderId,
    orderDetailId,
    status,
  }) => {
    const [mode, setMode] = useState<"force" | "convert">("convert");
    const [targetStatus, setTargetStatus] = useState<OrderStatus>("cooking");
    const [quantity, setQuantity] = useState<number>(currentQuantity);
    const [convertQuantity, setConvertQuantity] = useState<number>(1);
    const [convertFromStatus, setConvertFromStatus] =
      useState<OrderStatus>(currentStatus);
    const { trigger: triggerForceUpdate } =
      useMutationForceUpdateQtyByStatus(orderId);
    const { trigger: triggerUpdateStatus } =
      useMutationUpdateOrderItemStatusAPI(orderId);

    const handleSubmit = useCallback(() => {
      const data: UpdateStatusData = {
        mode,
        targetStatus,
        quantity: mode === "force" ? quantity : convertQuantity,
        ...(mode === "convert" && { currentStatus: convertFromStatus }),
      };

      if (mode === "force") {
        triggerForceUpdate({
          orderDetailId: orderId,
          qty: convertQuantity,
          status: targetStatus,
        }).then((res) => {
          if (res.success) {
            close(data);
          }
        });
      }

      if (mode === "convert") {
        // Type guard to ensure valid status transitions for the API
        const validFromStatuses = ["pending", "cooking"] as OrderStatus[];
        const validToStatuses = ["cooking", "served"] as OrderStatus[];

        if (
          validFromStatuses.includes(convertFromStatus) &&
          validToStatuses.includes(targetStatus)
        ) {
          triggerUpdateStatus([
            {
              orderDetailId,
              fromStatus: convertFromStatus as "pending" | "cooking",
              toStatus: targetStatus as "cooking" | "served",
              qty: convertQuantity,
            },
          ]).then((res) => {
            if (res.success) {
              close(data);
            }
          });
        }
      }
    }, [
      mode,
      targetStatus,
      quantity,
      convertQuantity,
      convertFromStatus,
      close,
      triggerForceUpdate,
      orderId,
      triggerUpdateStatus,
      orderDetailId,
    ]);

    const getStatusIcon = (status: OrderStatus) => {
      const Icon = statusConfig[status].icon;
      return <Icon className="h-4 w-4" />;
    };

    const currentStatusQty = status.find((f) => f.status === convertFromStatus);
    const qtyAllowed = (currentStatusQty?.qty ?? 0) > 0;
    const isPendingToCooking =
      convertFromStatus === "pending" && targetStatus === "cooking";
    const isCookingToServed =
      convertFromStatus === "cooking" && targetStatus === "served";

    return (
      <>
        <SheetHeader className="pb-6 border-b">
          <SheetTitle className="text-2xl font-bold flex items-center gap-3 text-foreground">
            <div className="p-2 bg-info/15 rounded-lg">
              <Settings className="h-6 w-6 text-info" />
            </div>
            Update Order Status
          </SheetTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Manage the preparation status of this order item
          </p>
        </SheetHeader>

        <div className="space-y-6">
          {/* Update Mode Selection */}
          <Card className="border-2 border-border">
            <CardHeader className="pb-4 bg-muted/40 rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                Choose Update Method
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Select how you want to update the order status
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <RadioGroup
                value={mode}
                onValueChange={(value) => setMode(value as "force" | "convert")}
                className="space-y-4"
              >
                <div
                  className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all ${
 mode === "convert"
 ? "border-info/30 bg-info/10"
 : "border-border bg-card hover:bg-muted/40"
 }`}
                >
                  <RadioGroupItem
                    value="convert"
                    id="convert"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="convert"
                      className="cursor-pointer flex items-center gap-2 font-semibold"
                    >
                      <RotateCcw className="h-4 w-4 text-info" />
                      Convert Status (Recommended)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Move a specific quantity from one status to another. Use
                      this for partial updates.
                    </p>
                  </div>
                </div>
                <div
                  className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all ${
 mode === "force"
 ? "border-warning/30 bg-warning/10"
 : "border-border bg-card hover:bg-muted/40"
 }`}
                >
                  <RadioGroupItem value="force" id="force" className="mt-1" />
                  <div className="flex-1">
                    <Label
                      htmlFor="force"
                      className="cursor-pointer flex items-center gap-2 font-semibold"
                    >
                      <Zap className="h-4 w-4 text-warning" />
                      Force Update (Override)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Directly set the exact status and quantity. Use this to
                      override everything.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Convert Mode Settings */}
          {mode === "convert" && (
            <Card className="border-2 border-info/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-info">
                  <RotateCcw className="h-5 w-5" />
                  Convert Status
                </CardTitle>
                <p className="text-sm text-info">
                  Move <strong>{convertQuantity}</strong> item
                  {convertQuantity !== 1 ? "s" : ""} from{" "}
                  <strong>
                    {statusConfig[convertFromStatus].label.toLowerCase()}
                  </strong>{" "}
                  to{" "}
                  <strong>
                    {statusConfig[targetStatus].label.toLowerCase()}
                  </strong>
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="space-y-2">
                    <Label
                      htmlFor="from-status"
                      className="text-sm font-semibold text-foreground/80"
                    >
                      From Status
                    </Label>
                    <Select
                      value={convertFromStatus}
                      onValueChange={(value) =>
                        setConvertFromStatus(value as OrderStatus)
                      }
                    >
                      <SelectTrigger className="border-2 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(
                          ([status, config]) => (
                            <SelectItem key={status} value={status}>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(status as OrderStatus)}
                                <span className="font-medium">
                                  {config.label}
                                </span>
                              </div>
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="p-3 bg-card rounded-full border-2 border-info/30 shadow-sm">
                      <ArrowRight className="h-6 w-6 text-info" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="to-status"
                      className="text-sm font-semibold text-foreground/80"
                    >
                      To Status
                    </Label>
                    <Select
                      value={targetStatus}
                      onValueChange={(value) =>
                        setTargetStatus(value as OrderStatus)
                      }
                    >
                      <SelectTrigger className="border-2 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(
                          ([status, config]) => (
                            <SelectItem key={status} value={status}>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(status as OrderStatus)}
                                <span className="font-medium">
                                  {config.label}
                                </span>
                              </div>
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!qtyAllowed ? (
                  <div className="bg-card p-4 rounded-lg border-2 border-info/20">
                    <p className="text-sm text-muted-foreground">
                      No items available for conversion.
                    </p>
                  </div>
                ) : (
                  <div className="bg-card p-4 rounded-lg border-2 border-info/20">
                    {isCookingToServed || isPendingToCooking ? (
                      <>
                        <Label
                          htmlFor="convert-quantity"
                          className="text-sm font-semibold text-foreground/80 flex items-center gap-2"
                        >
                          <Users className="h-4 w-4" />
                          Quantity to Convert
                        </Label>
                        <div className="mt-2 flex items-center gap-3">
                          <Input
                            id="convert-quantity"
                            type="number"
                            min="1"
                            max={currentStatusQty?.qty}
                            value={convertQuantity}
                            onChange={(e) => {
                              const q = Number(e.target.value);

                              if (q <= Number(currentStatusQty?.qty)) {
                                setConvertQuantity(Number(e.target.value));
                              }
                            }}
                            className="w-24 text-center text-lg font-bold border-2"
                          />
                          <span className="text-sm text-muted-foreground">
                            out of <strong>{currentStatusQty?.qty}</strong>{" "}
                            available items
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-info bg-info/15 p-2 rounded">
                          <Info className="h-3 w-3" />
                          <span>
                            This will move {convertQuantity} item
                            {convertQuantity !== 1 ? "s" : ""} to{" "}
                            {statusConfig[targetStatus].label.toLowerCase()}{" "}
                            status
                          </span>
                        </div>
                      </>
                    ) : (
                      <></>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Force Mode Settings */}
          {mode === "force" && (
            <Card className="border-2 border-warning/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-warning">
                  <Zap className="h-5 w-5" />
                  Force Update
                </CardTitle>
                <p className="text-sm text-warning">
                  Override the current status and set exactly{" "}
                  <strong>{quantity}</strong> item{quantity !== 1 ? "s" : ""} to{" "}
                  <strong>
                    {statusConfig[targetStatus].label.toLowerCase()}
                  </strong>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-card p-4 rounded-lg border-2 border-warning/20">
                  <Label
                    htmlFor="target-status"
                    className="text-sm font-semibold text-foreground/80"
                  >
                    Target Status
                  </Label>
                  <Select
                    value={targetStatus}
                    onValueChange={(value) =>
                      setTargetStatus(value as OrderStatus)
                    }
                  >
                    <SelectTrigger className="mt-2 border-2 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([status, config]) => (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(status as OrderStatus)}
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {config.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {config.description}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-card p-4 rounded-lg border-2 border-warning/20">
                  <Label
                    htmlFor="quantity"
                    className="text-sm font-semibold text-foreground/80 flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Set Exact Quantity
                  </Label>
                  <div className="mt-2 flex items-center gap-3">
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={currentQuantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-24 text-center text-lg font-bold border-2"
                    />
                    <span className="text-sm text-muted-foreground">
                      maximum available: <strong>{currentQuantity}</strong>
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-warning bg-warning/15 p-2 rounded">
                    <Info className="h-3 w-3" />
                    <span>
                      This will override all current statuses and set exactly{" "}
                      {quantity} item{quantity !== 1 ? "s" : ""} to{" "}
                      {statusConfig[targetStatus].label.toLowerCase()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              onClick={handleSubmit}
              className={`flex-1 text-base font-semibold ${
 mode === "convert"
 ? "bg-info hover:bg-info/90"
 : "bg-warning hover:bg-warning/90"
 }`}
              disabled={
                (mode === "force" &&
                  (quantity < 1 || quantity > currentQuantity)) ||
                (mode === "convert" &&
                  (convertQuantity < 1 || convertQuantity > currentQuantity)) ||
                qtyAllowed === false
              }
            >
              {mode === "convert"
                ? `Convert ${convertQuantity} Item${
                    convertQuantity !== 1 ? "s" : ""
                  }`
                : `Force Set ${quantity} Item${quantity !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </>
    );
  },
  { defaultValue: null }
);
