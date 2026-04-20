import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { SeatReservation } from "@/classes/cinema/reservation";
import { Customer } from "@/classes/customer";
import { ReservationItem } from "@/classes/order";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { DiscountType } from "@/lib/types";

export interface PaymentProps {
  amount: string;
  paymentMethod: string;
  currency: "USD" | "KHR";
  amountUsd: string;
  exchangeRate: string;
  used: string;
}

export interface DiscountProps extends DiscountType {
  productId: string;
  isManualDiscount?: boolean;
  discountId: string;
  amount: string;
}

export interface SlotProps {
  slotId: string;
  qty: number;
  name: string;
}

export interface CartProps extends Omit<ProductSearchResult, "discounts"> {
  qty: number;
  khr: number;
  usd: number;
  discounts: DiscountProps[];
  discountValue: number;
  totalAfterDiscount: number;
  slot?: SlotProps[];
  id?: string;
  reservation?: SeatReservation[];
}

export interface OrderProps {
  invoiceNo: number;
  carts: CartProps[];
  payments: PaymentProps[];
  status?: string;
  by?: UserInfo | null;
  customerId?: string;
  customer?: Customer | null;
}

export interface POSProps {
  orders: OrderProps;
  setOrders: (carts: OrderProps) => void;
  onScanBarcode?: (
    barcode: string,
    by: "BARCODE" | "SKU" | "TITLE",
    callback: (success: boolean) => void,
  ) => void;
  onCheckout?: (
    payments?: PaymentProps[],
    option?: {
      isPrint: boolean;
      printTicket: boolean;
      printDigitalTicket: boolean;
    },
  ) => void;
  loading?: boolean;
  exchangeRate?: number;
  onSaveDraft?: (
    items?: OrderProps,
    discountAutoId?: string,
    reservationData?: ReservationItem[],
  ) => Promise<void>;
  disabledDraft?: boolean;
  onPrintPickingList?: () => void;
  onUpdateOrderItemQty?: (
    itemId: string,
    qty: number,
    reservationData?: ReservationItem[],
  ) => void;
  onDeleteOrderItem?: (itemId: string) => void;
  onCreateOrderItem?: (
    data: CartProps,
    discountAutoId?: string,
    reservationData?: ReservationItem[],
  ) => void;
  onUpdateDiscountItem?: (
    itemId: string,
    discountAmount: string,
    discount: DiscountProps[],
  ) => void;
  onChangeCustomerId?: (customerId: string) => void;
  fetching?: boolean;
  setFetching?: (fetching: boolean) => void;
  isPrint?: boolean;
  setIsPrint?: (isPrint: boolean) => void;
  isPrintTicket?: boolean;
  setIsPrintTicket?: (isPrintTicket: boolean) => void;
  isDigitalTicket?: boolean;
  setIsDigitalTicket?: (isDigitalTicket: boolean) => void;
}
