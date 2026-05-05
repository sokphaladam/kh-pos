import { Payment } from "@/classes/payment";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type VoidOrderData = {
  invoice: string;
  orderId: string;
  orderDetailId: string;
  printedAt?: string;
  qtyFromPrintLog: number | null;
  priceFromPrintLog: number;
  actualQty: number;
  actualPrice: number;
  status: string;
  content: any[];
  payments: Payment[] | null;
};

export type VoidOrderReportResponse = {
  success: boolean;
  result: VoidOrderData[];
  error: string;
};
