import {
  table_customer_order,
  table_customer_order_detail,
  table_customer_order_draft,
  table_seat_reservation,
  table_warehouse_slot,
} from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId, generateShortId } from "@/lib/generate-id";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { z } from "zod";
import { InvoiceNumberService } from "../invoice-number";

export const PaymentDraftSchema = z.object({
  warehouseId: z.string(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  orderItems: z.array(
    z.object({
      id: z.string().optional(),
      showtimeId: z.string(),
      variantId: z.string(),
      reservations: z.array(
        z.object({
          seatId: z.string(),
          price: z.number(),
          code: z.string().optional(),
        }),
      ),
    }),
  ),
});

export type PaymentDraftInput = z.infer<typeof PaymentDraftSchema>;

export class CheckoutPaymentService {
  constructor(
    protected tx: Knex,
    protected user: UserInfo,
  ) {}

  async createPaymentOrderCustomer(input: PaymentDraftInput) {
    const tr = await this.tx.transaction(async (trx) => {
      let total = 0;

      const orderId = generateId();

      const orderDetailItems: table_customer_order_detail[] = [];
      const reservationItems: table_seat_reservation[] = [];

      for (const item of input.orderItems) {
        const order_detail_id = item.id || generateId();
        let totalPrice = 0;
        for (const reservation of item.reservations) {
          total += reservation.price || 0;
          totalPrice += reservation.price || 0;
          reservationItems.push({
            reservation_id: generateId(),
            showtime_id: item.showtimeId,
            seat_id: reservation.seatId,
            price: String(reservation.price || "0"),
            code: reservation.code || generateShortId(7),
            created_at: Formatter.getNowDateTime(),
            created_by: this.user.id,
            admitted_at: null,
            admitted_by: null,
            confirmed_at: null,
            confirmed_by: null,
            order_detail_id,
            updated_at: null,
            reservation_status: "pending",
          });
        }

        orderDetailItems.push({
          order_detail_id,
          order_id: orderId,
          variant_id: item.variantId,
          price: String(totalPrice || "0"),
          qty: 1,
          created_at: Formatter.getNowDateTime(),
          created_by: this.user.id,
          discount_amount: "0",
          fulfilled_qty: 1,
          modifer_amount: "0",
          total_amount: String(totalPrice || "0"),
        });
      }

      const order: table_customer_order = {
        order_id: orderId,
        address_lat: input.lat || null,
        address_lng: input.lng || null,
        customer_id: this.user.id,
        delivery_code: null,
        created_at: Formatter.getNowDateTime(),
        created_by: this.user.id,
        delivery_address: null,
        customer: 1,
        invoice_no: null,
        order_status: "DRAFT",
        paid_at: Formatter.getNowDateTime(),
        refund_at: null,
        table_number: null,
        transfer_at: null,
        transfer_by: null,
        total_amount: String(total || "0"),
        print_time: 1,
        served_type: "customer",
        updated_at: null,
        warehouse_id: input.warehouseId,
      };

      const draft: table_customer_order_draft = {
        content: {
          order,
          orderDetails: orderDetailItems,
          reservations: reservationItems,
        },
        amount: String(total || "0"),
        created_by: this.user.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        created_at: Formatter.getNowDateTime() as any,
      };

      const res = await trx.table("customer_order_draft").insert(draft);
      return { draftId: res.at(0) };
    });

    return tr;
  }

  async checkoutPaymentCustomer(draftId: number) {
    const tr = await this.tx.transaction(async (trx) => {
      const draft: table_customer_order_draft = await trx
        .table<table_customer_order_draft>("customer_order_draft")
        .where({ id: draftId, is_paid: 0 })
        .first();

      if (!draft) {
        throw new Error("Draft not found or already paid");
      }

      const {
        order,
        orderDetails,
        reservations,
      }: {
        order: table_customer_order;
        orderDetails: table_customer_order_detail[];
        reservations: table_seat_reservation[];
      } = draft.content;
      const invoiceNumberService = new InvoiceNumberService(trx, this.user);

      const slot = await trx
        .table<table_warehouse_slot>("warehouse_slot")
        .where({
          pos_slot: 1,
          is_deleted: 0,
          warehouse_id: order.warehouse_id,
          slot_status: "ACTIVE",
        })
        .first();

      if (!slot) {
        throw new Error("No active slot found for the warehouse");
      }

      const suggestNumber = await invoiceNumberService.getNextInvoiceNumber(1);

      await trx.table("customer_order").insert({
        ...order,
        invoice_no: suggestNumber.at(0),
        order_status: "COMPLETED",
        updated_at: Formatter.getNowDateTime(),
        paid_at: Formatter.getNowDateTime(),
      });

      await trx.table("customer_order_detail").insert(orderDetails);
      await trx.table("seat_reservation").insert(
        reservations.map((x) => {
          return {
            ...x,
            reservation_status: "confirmed",
            confirmed_at: Formatter.getNowDateTime(),
            confirmed_by: this.user.id,
          };
        }),
      );

      await trx.table("customer_order_draft").where({ id: draftId }).update({
        is_paid: 1,
      });

      return { orderId: order.order_id };
    });

    return tr;
  }
}
