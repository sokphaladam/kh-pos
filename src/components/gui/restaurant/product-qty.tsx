import { Button } from "@/components/ui/button";
import { MaterialInput } from "@/components/ui/material-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React, { useCallback, useEffect, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce(fn: any, delay: number) {
  let timer: NodeJS.Timeout;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...args: any) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function ProductQty({
  initialQty = 1,
  onQtyChange,
  disabled,
}: {
  initialQty: number;
  onQtyChange: (qty: number) => void;
  disabled?: boolean;
}) {
  const [qty, setQty] = useState(initialQty);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingQty, setPendingQty] = useState<number | null>(null);

  // Sync local state when prop changes (important for existing cart items)
  useEffect(() => {
    setQty(initialQty);
  }, [initialQty]);

  // Debounced function to trigger when user finishes changing qty
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdate = useCallback(
    debounce((value: number) => {
      // If setting quantity to 0, show confirmation dialog
      if (value === 0 && qty > 0) {
        setPendingQty(value);
        setShowConfirmDialog(true);
        return;
      }

      // For non-zero values, proceed normally
      onQtyChange(value); // API or context update
    }, 500),
    [onQtyChange, qty]
  );

  const handleChange = (value: number) => {
    // Prevent negative quantities
    if (value < 0) return;

    // Update local state immediately for UI responsiveness
    setQty(value);

    // Trigger debounced update which will handle confirmation for zero values
    debouncedUpdate(value);
  };

  const handleConfirmZero = () => {
    if (pendingQty !== null) {
      // Call onQtyChange directly since user confirmed
      onQtyChange(pendingQty);
    }
    setShowConfirmDialog(false);
    setPendingQty(null);
  };

  const handleCancelZero = () => {
    // Reset qty back to previous value (before the change to 0)
    if (pendingQty === 0) {
      setQty(initialQty > 0 ? initialQty : 1);
    }
    setShowConfirmDialog(false);
    setPendingQty(null);
  };

  return (
    <>
      <div className="flex items-center bg-gray-50 rounded-lg border">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-gray-100 rounded-l-lg rounded-r-none active:scale-95 transition-transform"
          onClick={() => handleChange(qty - 1)}
          disabled={disabled}
        >
          −
        </Button>
        <MaterialInput
          value={qty}
          className="w-12 h-8 text-center border-0 bg-transparent text-sm font-semibold focus:ring-0"
          onChange={(e) => handleChange(Number(e.target.value))}
          type="number"
          disabled={disabled}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-gray-100 rounded-r-lg rounded-l-none active:scale-95 transition-transform"
          onClick={() => handleChange(qty + 1)}
          disabled={disabled}
        >
          +
        </Button>
      </div>

      {/* Confirmation Dialog for Zero Quantity */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Item?</DialogTitle>
            <DialogDescription>
              Setting quantity to 0 will remove this item from your order. Are
              you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button variant="outline" onClick={handleCancelZero}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmZero}>
              Remove Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
