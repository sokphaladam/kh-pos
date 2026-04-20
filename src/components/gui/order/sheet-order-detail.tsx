import { createSheet } from "@/components/create-sheet";
import { OrderDetail } from "./order-detail";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";

export const sheetOrderDetail = createSheet<{ order: string }, unknown>(
  ({ order }) => {
    return (
      <>
        <SheetHeader>
          <SheetTitle></SheetTitle>
        </SheetHeader>
        <TooltipProvider>
          <OrderDetail selectOrder={order} />
        </TooltipProvider>
      </>
    );
  },
  { defaultValue: null }
);
