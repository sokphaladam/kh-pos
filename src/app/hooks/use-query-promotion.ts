import { CustomerOrderDiscount } from "@/dataloader/discount-by-order-items-loader";
import { ResponseType } from "@/lib/types";
import { useGenericMutation } from "./use-generic";

export function useCreatePromotion(orderId: string) {
  return useGenericMutation<
    { itemId: string; discountId?: string; discountAutoId?: string },
    ResponseType<{
      totalDiscount: number;
      orderItemAmount: number;
      discountLog: CustomerOrderDiscount[];
    }>
  >("POST", `/api/pos/order/${orderId}/promotion`);
}

export function useDeletePromotion(orderId: string) {
  return useGenericMutation<
    { itemId: string; discountId: string },
    ResponseType<{
      totalDiscount: number;
      orderItemAmount: number;
      discountLog: CustomerOrderDiscount[];
    }>
  >("DELETE", `/api/pos/order/${orderId}/promotion`);
}

export function useUpdatePromotion(orderId: string) {
  return useGenericMutation<
    { itemId: string; amount: number; discountType: "PERCENTAGE" | "AMOUNT" }[],
    ResponseType<
      {
        totalDiscount: number;
        orderItemAmount: number;
        discountLog: CustomerOrderDiscount[];
      }[]
    >
  >("PUT", `/api/pos/order/${orderId}/promotion`);
}
