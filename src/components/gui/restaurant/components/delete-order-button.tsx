"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useRestaurant } from "../contexts/restaurant-context";
import { useRestaurantActions } from "../hooks/use-restaurant-actions";

interface DeleteOrderButtonProps {
  tableKey: string;
  permissionKey?: boolean;
}

function generateCode() {
  return String(Math.floor(100 + Math.random() * 900));
}

export function DeleteOrderButton(props: DeleteOrderButtonProps) {
  const { state, loading, isRequest } = useRestaurant();
  const { onRemoveOrder } = useRestaurantActions();
  const currentTable = state.activeTables.find(
    (t) => t.tables?.id === props.tableKey || "",
  );

  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const disabledDelete = useMemo(() => {
    const hasInvoice = !!currentTable?.orders?.invoiceNo;
    const hasItems = (currentTable?.orders?.items?.length ?? 0) > 0;
    return (
      (!hasInvoice && hasItems) ||
      loading ||
      isRequest ||
      (!props.permissionKey && hasInvoice && hasItems)
    );
  }, [currentTable, isRequest, loading, props.permissionKey]);

  const openDialog = useCallback(() => {
    if (currentTable?.tables && currentTable.orders?.orderId) {
      setCode(generateCode());
      setInputValue("");
      setError("");
      setOpen(true);
    }
  }, [currentTable]);

  const handleConfirm = useCallback(async () => {
    if (inputValue !== code) {
      setError("Code does not match. Please try again.");
      return;
    }
    setIsDeleting(true);
    try {
      if (currentTable?.tables) {
        await onRemoveOrder(currentTable.tables);
      }
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setIsDeleting(false);
    }
  }, [inputValue, code, currentTable, onRemoveOrder]);

  return (
    <>
      <Button
        size="sm"
        variant="destructive"
        className="w-full text-sm font-semibold"
        onClick={openDialog}
        disabled={disabledDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!isDeleting) setOpen(v);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500">Remove Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. To confirm, enter the code below.
            </p>
            <div className="flex items-center justify-center">
              <span className="text-3xl font-bold tracking-[0.4em] text-red-500 bg-red-50 border border-red-200 rounded-lg px-6 py-3 select-none">
                {code}
              </span>
            </div>
            <Input
              placeholder="Enter 3-digit code"
              value={inputValue}
              maxLength={3}
              onChange={(e) => {
                setInputValue(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              className={
                error ? "border-red-500 focus-visible:ring-red-500" : ""
              }
              autoFocus
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              variant="destructive"
              disabled={inputValue.length !== 3 || isDeleting}
              onClick={handleConfirm}
            >
              {isDeleting && <Loader className="h-4 w-4 mr-2 animate-spin" />}
              Remove Order
            </Button>
            <Button
              variant="secondary"
              disabled={isDeleting}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
