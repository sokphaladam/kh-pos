import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useCart } from "./context/cart-provider";
import { useState, useEffect, useCallback, useRef } from "react";
import { useDebouncedValue } from "@/components/use-debounce";

interface CartItemQtyProps {
  qty: number;
  setQty?: (qty: number) => void;
}

export function CartItemQty(props: CartItemQtyProps) {
  const { loading } = useCart();
  const { qty, setQty } = props;
  const [localQty, setLocalQty] = useState(qty);
  const debouncedQty = useDebouncedValue(localQty, 500); // 500ms debounce
  const isInitialMount = useRef(true);
  const lastSyncedQty = useRef(qty);

  // Sync local quantity with parent prop when it changes externally
  useEffect(() => {
    if (qty !== lastSyncedQty.current) {
      setLocalQty(qty);
      lastSyncedQty.current = qty;
    }
  }, [qty]);

  // Handle debounced quantity updates to parent
  useEffect(() => {
    // Skip the initial mount to prevent unnecessary calls
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only update parent if the debounced value is different from what we last synced
    if (debouncedQty !== lastSyncedQty.current && setQty) {
      setQty(debouncedQty);
      lastSyncedQty.current = debouncedQty;
    }
  }, [debouncedQty, setQty]);

  const handleIncrement = useCallback(() => {
    if (loading) return;
    setLocalQty((prev) => prev + 1);
  }, [loading]);

  const handleDecrement = useCallback(() => {
    if (loading) return;
    setLocalQty((prev) => Math.max(0, prev - 1));
  }, [loading]);

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={handleDecrement}
        className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md"
        disabled={loading || localQty <= 0}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="w-8 text-center text-sm font-semibold text-gray-900 min-w-[2rem]">
        {localQty}
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleIncrement}
        disabled={loading}
        className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md"
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}
