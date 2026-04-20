import { OrderService } from "@/classes/order";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const removeOrderItem = withAuthApi<
  { id: string },
  { item_id: string },
  ResponseType<unknown>
>(
  async ({ db, params, body }) => {
    const startTime = Date.now();
    
    try {
      const orderId = params?.id || "";
      const itemId = body?.item_id ?? "";

      console.log(`[removeOrderItem] Starting - Order: ${orderId}, Item: ${itemId}`);

      if (!orderId || !itemId) {
        return NextResponse.json(
          { success: false, error: "Missing order ID or item ID" },
          { status: 400 }
        );
      }

      const order = new OrderService(db);

      // Check order status first
      console.log(`[removeOrderItem] Checking order completion status...`);
      const isCompleted = await order.checkOrderCompleted(orderId);
      if (isCompleted) {
        console.log(`[removeOrderItem] Order already completed`);
        return NextResponse.json(
          { success: false, error: "Order already checkout" },
          { status: 400 }
        );
      }

      // Delete the order item
      console.log(`[removeOrderItem] Deleting order item...`);
      await order.deleteOrderItem(orderId, itemId);

      const endTime = Date.now();
      console.log(`[removeOrderItem] Success - Duration: ${endTime - startTime}ms`);
      
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      const endTime = Date.now();
      console.error(`[removeOrderItem] Error after ${endTime - startTime}ms:`, error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : "Failed to remove item" 
        },
        { status: 500 }
      );
    }
  },
  ["ADMIN", "CUSTOMER"],
);
