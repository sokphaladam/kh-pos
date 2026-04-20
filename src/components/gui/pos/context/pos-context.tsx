import { createContext, useContext, useState } from "react";
import { DirectPrint } from "../print/direct-print";
import { OrderProps, POSProps } from "../types/post-types";
import { usePOSProvider } from "../hooks/use-pos-provider";
import { useAuthentication } from "contexts/authentication-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TicketCarousel } from "../../cinema/ticket-reservation/ticket-carousel";
import { Order } from "@/classes/order";

const EMPTY_VALUE: OrderProps = {
  invoiceNo: 0,
  carts: [],
  payments: [
    {
      amount: "0",
      amountUsd: "0",
      currency: "USD",
      paymentMethod: "1",
      exchangeRate: "0",
      used: "0",
    },
  ],
};

export const POSContext = createContext<POSProps>({
  orders: EMPTY_VALUE,
  setOrders: () => {},
});

export function usePOSContext() {
  return useContext(POSContext);
}

export function POSContextProvider({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  const {
    exchangeRate,
    loading,
    onCheckout,
    onCloseTab,
    onScanBarcode,
    orders,
    printingOrder,
    onChangeOrders,
    setPrintingOrder,
    onSaveDraft,
    disabledDraft,
    onPrintPickingList,
    onUpdateOrderItemQty,
    onDeleteOrderItem,
    onCreateOrderItem,
    onUpdateDiscountItem,
    onChangeCustomerId,
    fetching,
    setFetching,
    isPrint,
    setIsPrint,
    isDigitalTicket,
    isPrintTicket,
    setIsDigitalTicket,
    setIsPrintTicket,
  } = usePOSProvider(id);

  const { setting } = useAuthentication();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(
    localStorage.getItem("pos_digital_ticket_order")
      ? JSON.parse(localStorage.getItem("pos_digital_ticket_order") || "")
      : null,
  );

  const template =
    !setting?.isLoading && !setting?.isValidating
      ? setting?.data?.result
          ?.find((f) => f.option === "INVOICE_RECEIPT")
          ?.value?.split(",")[0]
      : "default";

  return (
    <POSContext.Provider
      value={{
        orders: orders!,
        setOrders: onChangeOrders,
        onScanBarcode,
        onCheckout,
        loading,
        exchangeRate,
        onSaveDraft,
        disabledDraft,
        onPrintPickingList,
        onUpdateOrderItemQty,
        onDeleteOrderItem,
        onCreateOrderItem,
        onUpdateDiscountItem,
        onChangeCustomerId,
        fetching,
        setFetching,
        isPrint,
        setIsPrint,
        isDigitalTicket,
        isPrintTicket,
        setIsDigitalTicket,
        setIsPrintTicket,
      }}
    >
      {children}
      {/* Hidden print component */}
      {printingOrder && isPrint && (
        <>
          <DirectPrint
            orderId={printingOrder}
            onPrintComplete={() => {
              setPrintingOrder(null);
              onCloseTab!(id || "", true);
              // onChangeOrders(EMPTY_VALUE);
              // onCleanup?.();
            }}
            type={
              template as unknown as "default" | "template-i" | "template-ch"
            }
          />
        </>
      )}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => {
          setSelectedOrder(null);
          localStorage.removeItem("pos_digital_ticket_order");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Digital Ticket Preview</DialogTitle>
          </DialogHeader>
          <TicketCarousel order={selectedOrder} />
        </DialogContent>
      </Dialog>
    </POSContext.Provider>
  );
}
