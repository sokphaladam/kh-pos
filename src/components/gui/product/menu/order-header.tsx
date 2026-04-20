/* eslint-disable @next/next/no-img-element */
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
import { useCallback } from "react";
import { customerWalkInCartSheet } from "./cart-sheet";
import { useCart } from "./context/cart-provider";
import { ZoneStatus } from "./zone-status";
import { useQuerySetting } from "@/app/hooks/use-setting";

interface OrderHeaderProps {
  inZone?: boolean;
}

export function OrderHeader({ inZone }: OrderHeaderProps) {
  const { state, isRequest } = useCart();
  const setting = useQuerySetting();

  const logo = setting?.data?.result
    ?.find((f) => f.option === "INVOICE_RECEIPT")
    ?.value?.split(",")[2];

  const totalItems =
    state.orders?.items.reduce((acc, item) => {
      const itemQty =
        item.status?.reduce((sum, status) => sum + status.qty, 0) || 0;
      return acc + itemQty;
    }, 0) || 0;

  const handleCartClick = useCallback(async () => {
    await customerWalkInCartSheet.show({});
  }, []);

  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {logo ? (
              <img src={logo} alt="" className="size-8 object-cover" />
            ) : (
              <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            )}
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold truncate">
                {state.currentWarehouse?.name || "Walk-in Order"}
              </h1>
            </div>
          </div>
          <div className="hidden sm:block">
            <ZoneStatus inZone={inZone} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="sm:hidden">
            <ZoneStatus inZone={inZone} />
          </div>
          <Button
            onClick={handleCartClick}
            variant="outline"
            size="sm"
            className="relative flex-shrink-0"
            disabled={isRequest}
          >
            {state.tables?.table_name}
            <span className="hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center rounded-full text-xs"
              >
                {totalItems > 99 ? "99+" : totalItems}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
