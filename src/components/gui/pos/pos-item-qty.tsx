import { Button } from "@/components/ui/button";
import { MaterialInput } from "@/components/ui/material-input";
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

export function POSItemQty({
  initialQty = 1,
  onQtyChange,
  disabled,
}: {
  initialQty: number;
  onQtyChange: (qty: number) => void;
  disabled?: boolean;
}) {
  const [qtyInput, setQtyInput] = useState(initialQty);
  const [qty, setQty] = useState(initialQty);

  // Sync local state when prop changes (important for existing cart items)
  useEffect(() => {
    setQty(initialQty);
    setQtyInput(initialQty);
  }, [initialQty]);

  // Debounced function to trigger when user finishes changing qty
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdate = useCallback(
    debounce((value: number) => {
      onQtyChange(value); // API or context update
    }, 500),
    [onQtyChange]
  );

  const handleChange = (value: number) => {
    if (value < 1) value = 1; // Prevent 0 or negative
    setQty(value);
    setQtyInput(value);
    debouncedUpdate(value);
  };

  return (
    <div>
      <div className="md:hidden">
        <div className="flex items-center bg-gray-50 rounded-lg border">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-100 rounded-l-lg rounded-r-none active:scale-95 transition-transform"
            onClick={() => handleChange(qty - 1)}
            disabled={qty === 1 || disabled}
          >
            −
          </Button>
          <MaterialInput
            value={qtyInput}
            className="w-12 h-8 text-center border-0 bg-transparent text-sm font-semibold focus:ring-0"
            onChange={(e) => {
              setQtyInput(Number(e.target.value));
            }}
            type="number"
            disabled={disabled}
            onBlur={() => handleChange(Number(qtyInput))}
            onKeyDown={(e) =>
              e.key === "Enter" && handleChange(Number(qtyInput))
            }
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
      </div>
      <div className="hidden md:flex items-center justify-center">
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6"
          onClick={() => handleChange(qty - 1)}
          disabled={qty === 1 || disabled}
        >
          <span>-</span>
        </Button>
        <MaterialInput
          value={qtyInput}
          className="w-[50px] border-none text-center"
          type="number"
          disabled={disabled}
          onChange={(e) => {
            setQtyInput(Number(e.target.value));
          }}
          onBlur={() => handleChange(Number(qtyInput))}
          onKeyDown={(e) => e.key === "Enter" && handleChange(Number(qtyInput))}
        />
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6"
          onClick={() => handleChange(qty + 1)}
          disabled={disabled}
        >
          <span>+</span>
        </Button>
      </div>
    </div>
  );
}
