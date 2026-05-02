import {
  useMutationForceUpdateQtyByStatus,
  useMutationUpdateOrderItemStatusAPI,
} from "@/app/hooks/use-query-order-update-status-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrderItemStatusType } from "@/dataloader/order-status-item.loader";
import { table_restaurant_tables } from "@/generated/tables";
import { usePermission } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import {
  Check,
  ChefHat,
  Clock,
  Edit3,
  HandPlatter,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useRestaurantActions } from "../hooks/use-restaurant-actions";
import { SelectProductItem } from "./restaurant-custom-order";
import { useCommonDialog } from "@/components/common-dialog";

export function RestaurantCustomOrderQty({
  status,
  orderId,
  orderDetailId,
  table,
  onChange,
}: {
  product: SelectProductItem;
  orderId: string;
  orderDetailId: string;
  status?: OrderItemStatusType[];
  table?: table_restaurant_tables;
  onChange?: (status: OrderItemStatusType[] | null) => void;
}) {
  const { showDialog } = useCommonDialog();
  const { updateProductQty, removeProduct } = useRestaurantActions();
  const { trigger: triggerForceUpdateOrderItemStatus, isMutating: isForcing } =
    useMutationForceUpdateQtyByStatus(orderId);
  const { trigger: triggerUpdateOrderItemStatus, isMutating: isConverting } =
    useMutationUpdateOrderItemStatusAPI(orderId || "");
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [editingQty, setEditingQty] = useState<number>(0);
  const [markAsServedDialogOpen, setMarkAsServedDialogOpen] = useState(false);
  const orderPreparationPermissions = usePermission("order-preparation");
  const canUpdateStatus = orderPreparationPermissions.includes("update");
  const canDeleteItem = orderPreparationPermissions.includes("delete");

  const cooking = status?.find((f) => f.status === "cooking")?.qty || 0;
  const served = status?.find((f) => f.status === "served")?.qty || 0;
  const pending = status?.find((f) => f.status === "pending")?.qty || 0;

  const [serveQty, setServeQty] = useState(cooking);

  // Helper function to check if user can edit a specific status
  const canEditStatus = useCallback(
    (statusType: "pending" | "cooking" | "served", newQty: number) => {
      // For cooking and served status changes, require canUpdateStatus
      if (
        (statusType === "cooking" || statusType === "served") &&
        !canUpdateStatus
      ) {
        return false;
      }

      // For setting cooking or served to 0, require canDeleteItem
      if (
        (statusType === "cooking" || statusType === "served") &&
        !canDeleteItem
      ) {
        return false;
      }

      // Calculate what the total quantities would be after this change
      const newPending = statusType === "pending" ? newQty : pending;
      const newCooking = statusType === "cooking" ? newQty : cooking;
      const newServed = statusType === "served" ? newQty : served;
      const totalQty = newPending + newCooking + newServed;

      // Don't allow all statuses to be 0
      if (totalQty === 0) {
        toast.error(
          "At least one item must remain in pending, cooking, or served status",
        );
        return false;
      }

      return true;
    },
    [canUpdateStatus, canDeleteItem, pending, cooking, served],
  );

  const handleQtyChange = useCallback(
    (qty: number, statusType: "pending" | "cooking" | "served") => {
      // Validation 1: If changing cooking or served status, require canUpdateStatus
      if (
        (statusType === "cooking" || statusType === "served") &&
        !canUpdateStatus
      ) {
        toast.error(
          "You don't have permission to update cooking or served quantities",
        );
        return;
      }

      // Validation 2: If changing cooking or served to 0, require canDeleteItem
      if (
        (statusType === "cooking" || statusType === "served") &&
        !canDeleteItem
      ) {
        toast.error(
          "You don't have permission to remove cooking or served items",
        );
        return;
      }

      // Calculate what the total quantities would be after this change
      const newPending = statusType === "pending" ? qty : pending;
      const newCooking = statusType === "cooking" ? qty : cooking;
      const newServed = statusType === "served" ? qty : served;
      const totalQty = newPending + newCooking + newServed;

      // Validation 3: Not allow all statuses to be 0 - at least have 1 qty somewhere
      if (totalQty === 0) {
        toast.error(
          "At least one item must remain in pending, cooking, or served status",
        );
        return;
      }

      const doUpdate = () => {
        triggerForceUpdateOrderItemStatus({
          orderDetailId: orderDetailId,
          status: statusType,
          qty,
        }).then((res) => {
          if (res.success && table) {
            updateProductQty(
              orderDetailId || "",
              totalQty,
              table,
              statusType,
              qty,
              "force",
            );
            onChange?.(
              status?.map((f) => {
                if (f.status === statusType) {
                  return { ...f, qty };
                }
                return f;
              }) || [],
            );
            if (totalQty === 0) {
              removeProduct(orderDetailId, table, "");
              onChange?.(null);
            }
          }
        });
      };

      if (qty < 1 && statusType !== "pending") {
        console.log(
          "Showing confirmation dialog for setting",
          statusType,
          "to",
          qty,
        );
        showDialog({
          title: "Confirm Quantity Change",
          content: `You are setting the quantity of ${statusType} items to ${qty}, which will remove this status from the item. Are you sure?`,
          destructive: true,
          actions: [
            {
              text: "Yes, change it",
              onClick: async () => {
                doUpdate();
              },
            },
          ],
        });
        return;
      }

      doUpdate();
    },
    [
      triggerForceUpdateOrderItemStatus,
      orderDetailId,
      updateProductQty,
      table,
      cooking,
      served,
      pending,
      onChange,
      status,
      removeProduct,
      canUpdateStatus,
      canDeleteItem,
      showDialog,
    ],
  );

  const handleSendToKitchen = useCallback(() => {
    if (pending > 0) {
      triggerUpdateOrderItemStatus([
        {
          orderDetailId: orderDetailId,
          qty: pending,
          fromStatus: "pending",
          toStatus: "cooking",
        },
      ]).then((res) => {
        if (res.success && table) {
          updateProductQty(
            orderDetailId || "",
            cooking + pending + served,
            table,
            "cooking",
            pending,
            "convert",
          );
          onChange?.(
            status?.map((f) => {
              if (f.status === "pending") {
                return { ...f, qty: f.qty - pending };
              }
              if (f.status === "cooking") {
                return { ...f, qty: f.qty + pending };
              }
              return f;
            }) || [],
          );
        }
      });
    }
  }, [
    pending,
    cooking,
    served,
    triggerUpdateOrderItemStatus,
    orderDetailId,
    updateProductQty,
    onChange,
    table,
    status,
  ]);

  const handleMarkAsServed = useCallback(() => {
    if (serveQty > 0 && serveQty <= cooking) {
      triggerUpdateOrderItemStatus([
        {
          orderDetailId: orderDetailId,
          fromStatus: "cooking",
          toStatus: "served",
          qty: serveQty,
        },
      ]).then((res) => {
        if (res.success && table) {
          updateProductQty(
            orderDetailId || "",
            pending + (cooking - serveQty) + (served + serveQty),
            table,
            "served",
            serveQty,
            "convert",
          );
          onChange?.(
            status?.map((f) => {
              if (f.status === "cooking") {
                return { ...f, qty: f.qty - serveQty };
              }
              if (f.status === "served") {
                return { ...f, qty: f.qty + serveQty };
              }
              return f;
            }) || [],
          );
        }
      });
    }
    setMarkAsServedDialogOpen(false);
    setServeQty(1);
  }, [
    serveQty,
    cooking,
    served,
    triggerUpdateOrderItemStatus,
    orderDetailId,
    updateProductQty,
    table,
    pending,
    onChange,
    status,
  ]);

  const handleStartEdit = useCallback(
    (statusType: "pending" | "cooking" | "served", currentQty: number) => {
      setEditingStatus(statusType);
      setEditingQty(currentQty);
    },
    [],
  );

  const handleSubmitEdit = useCallback(() => {
    if (editingStatus && editingQty >= 0) {
      // Apply the same validations as in handleQtyChange

      // Validation 1: If changing cooking or served status, require canUpdateStatus
      if (
        (editingStatus === "cooking" || editingStatus === "served") &&
        !canUpdateStatus
      ) {
        toast.error(
          "You don't have permission to update cooking or served quantities",
        );
        setEditingStatus(null);
        setEditingQty(0);
        return;
      }

      // Validation 2: If changing cooking or served to 0, require canDeleteItem
      if (
        (editingStatus === "cooking" || editingStatus === "served") &&
        !canDeleteItem
      ) {
        toast.error(
          "You don't have permission to remove cooking or served items",
        );
        setEditingStatus(null);
        setEditingQty(0);
        return;
      }

      // Calculate what the total quantities would be after this change
      const newPending = editingStatus === "pending" ? editingQty : pending;
      const newCooking = editingStatus === "cooking" ? editingQty : cooking;
      const newServed = editingStatus === "served" ? editingQty : served;
      const totalQty = newPending + newCooking + newServed;

      // Validation 3: Not allow all statuses to be 0 - at least have 1 qty somewhere
      if (totalQty === 0) {
        toast.error(
          "At least one item must remain in pending, cooking, or served status",
        );
        setEditingStatus(null);
        setEditingQty(0);
        return;
      }

      console.log(
        "All validations passed, updating status:",
        editingStatus,
        "to qty:",
        editingQty,
      );

      handleQtyChange(
        editingQty,
        editingStatus as "pending" | "cooking" | "served",
      );
      setEditingStatus(null);
      setEditingQty(0);
    }
  }, [
    editingStatus,
    editingQty,
    handleQtyChange,
    canUpdateStatus,
    canDeleteItem,
    pending,
    cooking,
    served,
  ]);

  const handleCancelEdit = useCallback(() => {
    setEditingStatus(null);
    setEditingQty(0);
  }, []);

  const statusItems = [
    {
      status: "pending" as const,
      label: "Pending",
      qty: pending,
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: Clock,
      actions: [
        {
          type: "send-kitchen",
          icon: ChefHat,
          label: "Prepare",
          variant: "outline" as const,
          iconOnly: false,
        },
      ],
    },
    {
      status: "cooking" as const,
      label: "Preparing",
      qty: cooking,
      color: "bg-orange-100 text-orange-800 border-orange-200",
      icon: UtensilsCrossed,
      actions: [
        {
          type: "edit",
          icon: Edit3,
          label: "Edit Qty",
          variant: "outline" as const,
          iconOnly: true,
        },
        {
          type: "mark-served",
          icon: HandPlatter,
          label: "Serve",
          variant: "outline" as const,
          iconOnly: false,
        },
      ],
    },
    {
      status: "served" as const,
      label: "Served",
      qty: served,
      color: "bg-green-100 text-green-800 border-green-200",
      icon: Check,
      actions: [
        {
          type: "edit",
          icon: Edit3,
          label: "Edit Qty",
          variant: "outline" as const,
          iconOnly: true,
        },
      ],
    },
  ];

  return (
    <>
      <Card className="border-border">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-sm font-medium">
            Quantity Management
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {statusItems.map((item) => {
            const StatusIcon = item.icon;
            const isEditing = editingStatus === item.status;

            return (
              <div
                key={item.status}
                className="flex items-center justify-between p-2 rounded border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <StatusIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium capitalize">
                      {item.label}
                    </span>
                    {isEditing ? (
                      // Edit mode: show input field in place of badge
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          value={editingQty}
                          onChange={(e) =>
                            setEditingQty(
                              Math.max(0, parseInt(e.target.value) || 0),
                            )
                          }
                          className="w-16 h-6 text-center text-xs px-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSubmitEdit();
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleSubmitEdit}
                          className="px-1 h-6"
                          disabled={!canEditStatus(item.status, editingQty)}
                          title={
                            !canEditStatus(item.status, editingQty)
                              ? "This change is not allowed"
                              : "Save changes"
                          }
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="px-1 h-6"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      // Normal mode: show badge and edit button
                      <>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs px-1.5 py-0.5 h-auto",
                            item.color,
                          )}
                        >
                          {item.qty}
                        </Badge>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(item.status, item.qty)}
                          className="px-1.5 h-6 ml-1"
                          disabled={
                            // Disable if user doesn't have canUpdateStatus for cooking/served
                            (item.status === "cooking" ||
                              item.status === "served") &&
                            !canUpdateStatus
                          }
                          title={
                            (item.status === "cooking" ||
                              item.status === "served") &&
                            !canUpdateStatus
                              ? "You don't have permission to edit this status"
                              : "Edit quantity"
                          }
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.status === "pending" ? (
                    // For pending status, show only non-edit actions
                    <div className="flex items-center gap-1.5">
                      {item.actions
                        .filter((action) => action.type !== "edit")
                        .map((action) => {
                          const ActionIcon = action.icon;
                          return (
                            <Button
                              key={action.type}
                              size="sm"
                              variant={action.variant}
                              onClick={() => {
                                if (action.type === "send-kitchen") {
                                  handleSendToKitchen();
                                } else if (action.type === "mark-served") {
                                  setServeQty(Math.max(1, cooking));
                                  setMarkAsServedDialogOpen(true);
                                }
                              }}
                              disabled={
                                isForcing || isConverting || !canUpdateStatus
                              }
                              className="h-7 w-16 px-2 text-xs"
                            >
                              {action.iconOnly ? (
                                <>
                                  <ActionIcon className="h-3.5 w-3.5" />
                                  <span className="sr-only">
                                    {action.label}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs">{action.label}</span>
                              )}
                            </Button>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {item.actions
                        .filter((action) => action.type !== "edit")
                        .map((action) => {
                          const ActionIcon = action.icon;
                          return (
                            <Button
                              key={action.type}
                              size="sm"
                              variant={action.variant}
                              onClick={() => {
                                if (action.type === "send-kitchen") {
                                  handleSendToKitchen();
                                } else if (action.type === "mark-served") {
                                  setServeQty(Math.max(1, cooking));
                                  setMarkAsServedDialogOpen(true);
                                }
                              }}
                              disabled={isForcing || isConverting}
                              className="h-7 w-16 px-2 text-xs"
                            >
                              {action.iconOnly ? (
                                <>
                                  <ActionIcon className="h-3.5 w-3.5" />
                                  <span className="sr-only">
                                    {action.label}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs">{action.label}</span>
                              )}
                            </Button>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog
        open={markAsServedDialogOpen}
        onOpenChange={setMarkAsServedDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Mark as Served</DialogTitle>
            <DialogDescription>
              How many items would you like to mark as served? (Available:{" "}
              {cooking})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="serve-qty" className="text-right">
                Quantity
              </Label>
              <Input
                id="serve-qty"
                type="number"
                min="1"
                max={cooking}
                value={serveQty}
                onChange={(e) =>
                  setServeQty(
                    Math.max(
                      1,
                      Math.min(cooking, parseInt(e.target.value) || 1),
                    ),
                  )
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMarkAsServedDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkAsServed}
              disabled={serveQty <= 0 || serveQty > cooking}
            >
              Mark as Served
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
