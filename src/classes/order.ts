import { CustomerOrderDiscount } from "@/dataloader/discount-by-order-items-loader";
import { LoaderFactory } from "@/dataloader/loader-factory";
import { OrderModifierType } from "@/dataloader/order-modifier-loader";
import { OrderItemStatusType } from "@/dataloader/order-status-item.loader";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import {
  table_customer_order,
  table_customer_order_detail,
  table_discount_log,
  table_order_detail_modifier,
  table_order_item_status,
} from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId, generateShortId } from "@/lib/generate-id";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { z } from "zod";
import { applyDiscountToOrderItem } from "./order-discount";
import { applyModifierToOrderItem } from "./order-modifier";
import { OrderReturn } from "./order-return";
import { Payment, PaymentService } from "./payment";
import { Customer } from "./customer";
import { SeatReservation } from "./cinema/reservation";
import { Logger } from "@/lib/logger";

export interface ReservationItem {
  showtimeId: string;
  seatId: string;
  price: number;
  code?: string;
}

interface CreateOrderOptionItem {
  id: string;
  variantId: string;
  qty: number;
  price: string;
  reservation?: ReservationItem[];
}

interface CreateOrderOption {
  items: CreateOrderOptionItem[];
  invoiceNo: number;
  customerId: string;
  warehouseId: string;
  createdBy: UserInfo;
  status?: table_customer_order["order_status"];
  tableNumber?: string;
  customer?: number;
}

export const orderFilterSchema = z.object({
  orderId: z.string().optional(),
  invoiceNo: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  status: z
    .enum([
      "DRAFT",
      "APPROVED",
      "PROCESSING",
      "COMPLETED",
      "CANCELLED",
      "REFUND",
    ])
    .optional(),
  userId: z.string().optional(),
  shiftId: z.string().optional(),
  customerPhone: z.string().optional(),
  ticketCode: z.string().optional(),
  checkSharedDraft: z.string().optional(),
});

export type OrderFilter = z.infer<typeof orderFilterSchema>;

export interface KitchenLog {
  orderId: string;
  orderDetailId: string;
  itemPrice: string;
  printedAt: string | null;
}

export interface Order {
  orderId: string;
  invoiceNo: number;
  customerId: string;
  orderStatus: string;
  createdAt: string | null;
  paidAt?: string | null;
  createdBy: UserInfo | null;
  totalAmount: string;
  items?: OrderDetail[];
  transferAt?: string | null;
  transferBy?: UserInfo | null;
  tableNumber?: string;
  customer?: number;
  printCount?: number;
  tableName?: string;
  customerLoader?: Customer | null;
  servedType?: "dine_in" | "take_away" | "food_delivery";
  deliveryCode?: string | null;
}

export interface OrderDetail {
  orderDetailId: string;
  variantId: string;
  title: string;
  sku: string;
  barcode: string;
  qty: number;
  price: string;
  discountAmount: string;
  modiferAmount: string;
  totalAmount: string;
  orderReturns?: OrderReturn[];
  productVariant?: ProductVariantType;
  discounts?: CustomerOrderDiscount[];
  orderModifiers?: OrderModifierType[];
  status?: OrderItemStatusType[];
  reservation?: SeatReservation[];
  kitchenLogs?: KitchenLog[];
}

export class OrderService {
  constructor(
    protected tx: Knex,
    protected user?: UserInfo,
  ) {}

  async checkOrderCompleted(orderId: string) {
    const order = await this.tx
      .table("customer_order")
      .where({ order_id: orderId, order_status: "COMPLETED" })
      .first();

    if (order) {
      return true;
    }
    return false;
  }

  async getOrderDetail(
    orderId: string,
    user: UserInfo,
  ): Promise<{
    orderInfo: Order;
    orderDetail: OrderDetail[];
    payments: Payment[];
  }> {
    const order = await this.tx
      .table<table_customer_order>("customer_order")
      .where("order_id", orderId)
      .where("warehouse_id", user.currentWarehouseId)
      .first();

    if (!order) {
      throw new Error("Order not found");
    }

    const userLoader = LoaderFactory.userLoader(this.tx);
    const customerLoader = LoaderFactory.customerLoader(this.tx);

    const table = await this.tx("restaurant_tables")
      .where({ id: order.table_number })
      .first();

    // customer order info
    const orderInfo: Order = {
      orderId: order.order_id!,
      invoiceNo: order.invoice_no,
      customerId: order.customer_id,
      orderStatus: order.order_status,
      createdAt: order.created_at ? Formatter.dateTime(order.created_at) : "",
      paidAt: order.paid_at ? Formatter.dateTime(order.paid_at) : null,
      createdBy: order.created_by
        ? await userLoader.load(order.created_by)
        : null,
      totalAmount: order.total_amount,
      tableNumber: order.table_number,
      printCount: order.print_time || 0,
      tableName: table ? table.table_name : undefined,
      servedType: order.served_type,
      deliveryCode: order.delivery_code,
      customerLoader: order.customer_id
        ? await customerLoader.load(order.customer_id)
        : null,
      customer: order.customer,
    };

    // customer order detail

    const orderDetailLoader = LoaderFactory.orderDetailLoader(
      this.tx,
      user.currentWarehouseId || "",
    );

    const orderDetail: OrderDetail[] = await orderDetailLoader.load(orderId);
    // payment info
    const payments = await new PaymentService(this.tx).getPayment(orderId);

    return {
      orderInfo,
      orderDetail,
      payments,
    };
  }

  async getOrderList(
    filter: OrderFilter,
    user: UserInfo,
  ): Promise<{
    totalRows: number;
    orders: Order[];
  }> {
    const setting = await this.tx
      .table("setting")
      .where({ option: "TYPE_POS", warehouse: user.currentWarehouseId })
      .first();
    const type_pos = JSON.parse(setting?.value || "{}") || "";
    const orderQuery = this.tx
      .table<table_customer_order>("customer_order")
      .where({ warehouse_id: user.currentWarehouseId })
      .orderBy("customer_order.created_at", "desc");
    if (filter.orderId) {
      orderQuery.where("customer_order.order_id", filter.orderId);
    }
    if (filter.invoiceNo) {
      orderQuery.whereRaw("customer_order.invoice_no LIKE ?", [
        `%${filter.invoiceNo}`,
      ]);
    }
    if (filter.startDate) {
      orderQuery.whereRaw(
        "COALESCE(customer_order.paid_at, customer_order.created_at) >= ?",
        [filter.startDate],
      );
    }

    if (filter.endDate) {
      orderQuery.whereRaw(
        "COALESCE(customer_order.paid_at, customer_order.created_at) < ?",
        [filter.endDate],
      );
    }

    if (filter.status) {
      orderQuery.where("customer_order.order_status", filter.status);
    }

    if (filter.checkSharedDraft === "1" && !type_pos.shared_order_draft) {
      orderQuery.where("created_by", user.id);
    }

    if (filter.shiftId) {
      orderQuery
        .innerJoin(
          "order_payment",
          "customer_order.order_id",
          "order_payment.order_id",
        )
        .where("order_payment.shift_id", filter.shiftId);
    }

    if (filter.customerPhone) {
      orderQuery
        .innerJoin("customer", "customer.id", "customer_order.customer_id")
        .where({ "customer.phone": filter.customerPhone });
    }

    if (filter.ticketCode) {
      orderQuery
        .innerJoin(
          "customer_order_detail",
          "customer_order_detail.order_id",
          "customer_order.order_id",
        )
        .innerJoin(
          "seat_reservation",
          "seat_reservation.order_detail_id",
          "customer_order_detail.order_detail_id",
        )
        .where({
          "seat_reservation.code": filter.ticketCode,
        })
        .groupBy("customer_order_detail.order_id");
    }

    const totalRows = (await orderQuery
      .clone()
      .countDistinct("customer_order.order_id", { as: "total" })) as number;

    const query = orderQuery
      .distinct("customer_order.*")
      .limit(filter.limit ?? 10)
      .offset(filter.offset ?? 0);

    const orders = await query;

    const userLoader = LoaderFactory.userLoader(this.tx);
    const orderDetailLoader = LoaderFactory.orderDetailLoader(
      this.tx,
      user.currentWarehouseId || "",
    );
    const customerLoader = LoaderFactory.customerLoader(this.tx);

    const result: Order[] = await Promise.all(
      orders.map(async (order) => {
        const items = await orderDetailLoader.load(order.order_id!);
        return {
          orderId: order.order_id!,
          invoiceNo: order.invoice_no,
          customerId: order.customer_id,
          orderStatus: order.order_status,
          createdAt: order.created_at
            ? Formatter.dateTime(order.created_at)
            : "",
          paidAt: order.paid_at ? Formatter.dateTime(order.paid_at) : null,
          createdBy: order.created_by
            ? await userLoader.load(order.created_by)
            : null,
          totalAmount: order.total_amount,
          transferBy: order.transfer_by
            ? await userLoader.load(order.transfer_by)
            : null,
          transferAt: order.transfer_at
            ? Formatter.dateTime(order.transfer_at)
            : "",
          items,
          tableNumber: order.table_number,
          printCount: order.print_time || 0,
          customerLoader: order.customer_id
            ? await customerLoader.load(order.customer_id)
            : null,
          servedType: order.served_type,
          deliveryCode: order.delivery_code,
        };
      }),
    );

    return {
      totalRows,
      orders: result,
    };
  }

  async create(option: CreateOrderOption) {
    return await this.tx.transaction(async (tx) => {
      const now = Formatter.getNowDateTime();
      const orderId = generateId();

      if (!!option.tableNumber) {
        const checkHaveOrderOnTable = await tx
          .table("customer_order")
          .where({ table_number: option.tableNumber, order_status: "DRAFT" })
          .first();

        if (!!checkHaveOrderOnTable) {
          throw new Error("Table already have an active order");
        }
      }

      const total = option.items.reduce((acc, item) => {
        const price = parseFloat(item.price);
        const amount = price * item.qty;
        return acc + amount;
      }, 0);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reservationItems: any[] = [];

      const items = option.items.map((item) => {
        const totalPrice = parseFloat(item.price) * item.qty;
        const order_detail_id = item.id || generateId();

        if (item.reservation && item.reservation.length > 0) {
          item.reservation.forEach((res) => {
            reservationItems.push({
              reservation_id: generateId(),
              order_detail_id: order_detail_id,
              showtime_id: res.showtimeId,
              seat_id: res.seatId,
              price: Number(res.price),
              created_at: now,
              created_by: option.createdBy.id,
              reservation_status: "pending",
              code: res.code ? res.code : generateShortId(7),
            });
          });
        }

        return {
          order_detail_id: order_detail_id,
          created_at: now,
          created_by: option.createdBy.id,
          variant_id: item.variantId,
          discount_amount: "0",
          order_id: orderId,
          price: item.price.toString(),
          total_amount: totalPrice.toString(),
          qty: item.qty,
          fulfilled_qty: 0,
          modifer_amount: "0",
        };
      });

      const order = {
        invoice_no: option.invoiceNo,
        order_id: orderId,
        customer_id: option.customerId,
        order_status: option.status ?? "DRAFT",
        warehouse_id: option.warehouseId,
        updated_at: now,
        created_at: now,
        created_by: option.createdBy.id,
        total_amount: total.toString(),
        table_number: option.tableNumber ?? "",
        customer: option.customer || 1,
      };

      if (items.length > 0) {
        await tx
          .table<table_customer_order_detail>("customer_order_detail")
          .insert(items);

        if (reservationItems.length > 0) {
          await tx.table("seat_reservation").insert(reservationItems);
        }
      }

      await tx.table<table_customer_order>("customer_order").insert(order);

      if (!!option.tableNumber) {
        await tx
          .table("restaurant_tables")
          .where({ id: option.tableNumber })
          .update({ status: "order_taken" });

        // for Restaurant POS, create order item status
        const orderStatus: table_order_item_status[] = items.map((item) => ({
          order_item_id: item.order_detail_id,
          status: "pending",
          qty: item.qty,
          created_by: option.createdBy.id,
          created_at: Formatter.getNowDateTime(),
        }));

        if (orderStatus.length > 0) {
          await tx.table("order_item_status").insert(orderStatus);
        }
      }

      return {
        order,
        items,
      };
    });
  }

  async delete(id: string, logger?: Logger) {
    return await this.tx.transaction(async (tx) => {
      const order = await tx
        .table("customer_order")
        .where({ order_id: id, order_status: "DRAFT" })
        .first();

      if (!order) {
        throw new Error("Id not found");
      }

      if (logger) {
        logger.serverLog("customer_order:DELETE", {
          action: "delete",
          table_name: "customer_order",
          key: order.order_id,
          content: order,
        });
      }

      // delete discount log
      await tx
        .table("discount_log")
        .whereRaw(
          `order_detail_id IN (select customer_order_detail.order_detail_id from customer_order_detail where order_id = :order_id)`,
          { order_id: id },
        )
        .delete();

      // delete modifier
      await tx
        .table<table_order_detail_modifier>("order_detail_modifier")
        .whereRaw(
          `order_detail_id IN (select customer_order_detail.order_detail_id from customer_order_detail where order_id = :order_id)`,
          { order_id: id },
        )
        .delete();

      // delete order item status
      await tx
        .table("order_item_status")
        .whereRaw(
          `order_item_id IN (select customer_order_detail.order_detail_id from customer_order_detail where order_id = :order_id)`,
          { order_id: id },
        )
        .delete();

      // delete order
      await tx.table("customer_order").where({ order_id: id }).delete();

      // delete order detail
      const items = await tx
        .table("customer_order_detail")
        .where({ order_id: id })
        .select("order_detail_id");
      await tx.table("customer_order_detail").where({ order_id: id }).delete();

      // delete seat reservation if exists
      if (items.length > 0) {
        const seat_reservations = await tx.table("seat_reservation").whereIn(
          "order_detail_id",
          items.map((i) => i.order_detail_id),
        );

        await tx
          .table("seat_reservation")
          .whereIn(
            "order_detail_id",
            items.map((i) => i.order_detail_id),
          )
          .delete();

        logger?.serverLog("customer_order_detail:DELETE", {
          action: "delete",
          table_name: "customer_order_detail",
          key: items.map((i) => i.order_detail_id).join(","),
          content: { items },
        });

        if (seat_reservations.length > 0) {
          logger?.serverLog("seat_reservation:DELETE", {
            action: "delete",
            table_name: "seat_reservation",
            key: seat_reservations.map((i) => i.reservation_id).join(","),
            content: { seat_reservations },
          });
        }
      }

      return true;
    });
  }

  async updateOrderItem(
    id: string,
    itemId: string,
    qty: number,
    reservation?: ReservationItem[],
  ) {
    return await this.tx.transaction(async (trx) => {
      // get existing order item
      const orderItem: table_customer_order_detail = await trx
        .table<table_customer_order_detail>("customer_order_detail")
        .where({ order_id: id, order_detail_id: itemId })
        .first();

      if (!orderItem) {
        throw new Error("Order item not found");
      }

      let price = orderItem.price || "0";

      if (reservation && reservation.length > 0) {
        await trx
          .table("seat_reservation")
          .where({ order_detail_id: itemId })
          .delete();

        price = reservation.reduce((a, b) => a + b.price, 0).toString();

        await updateOrderDetail(
          itemId,
          {
            qty: qty,
            price: price,
          },
          trx,
        );
        orderItem.price = price;

        await trx.table("seat_reservation").insert(
          reservation.map((x) => {
            return {
              reservation_id: generateId(),
              order_detail_id: itemId,
              showtime_id: x.showtimeId,
              price: x.price,
              seat_id: x.seatId,
              reservation_status: "pending",
              created_at: Formatter.getNowDateTime(),
              created_by: this.user?.id,
              code: x.code ? x.code : generateShortId(7),
            };
          }),
        );
      } else {
        await updateOrderDetail(
          itemId,
          {
            qty: qty,
          },
          trx,
        );
      }

      orderItem.qty = qty;

      // recalculate total discount and amount
      await recalculateCustomerOrder(orderItem, trx);
    });
  }

  async deleteOrderItem(id: string, itemId: string) {
    return await this.tx.transaction(async (trx) => {
      await trx
        .table<table_customer_order_detail>("customer_order_detail")
        .where({ order_id: id, order_detail_id: itemId })
        .delete();

      //delete all discount log
      await trx
        .table<table_discount_log>("discount_log")
        .where("order_detail_id", itemId)
        .delete();

      // delete all modifier
      await trx
        .table<table_order_detail_modifier>("order_detail_modifier")
        .where("order_detail_id", itemId)
        .delete();

      // delete all order item status
      await trx
        .table<table_order_item_status>("order_item_status")
        .where("order_item_id", itemId)
        .delete();

      // delete seat reservation if exists
      await trx
        .table("seat_reservation")
        .where("order_detail_id", itemId)
        .delete();

      // recalculate total amount of order
      await updateOrderTotalAmount(id, trx);
    });
  }

  async addOrderItem(
    id: string,
    data: CreateOrderOptionItem,
    user: UserInfo,
    type: "TRANSFER" | "NORMAL" = "NORMAL",
  ) {
    return await this.tx.transaction(async (trx) => {
      const now = Formatter.getNowDateTime();
      const totalPrice = parseFloat(data.price) * data.qty;

      const item: table_customer_order_detail = {
        order_detail_id: data.id,
        created_at: now,
        created_by: user.id,
        variant_id: data.variantId,
        discount_amount: "0",
        order_id: id,
        price: String(data.price),
        total_amount: totalPrice.toString(),
        qty: data.qty,
        fulfilled_qty: 0,
        modifer_amount: "0",
      };

      await trx
        .table<table_customer_order_detail>("customer_order_detail")
        .insert(item);

      if (data.reservation && data.reservation.length > 0) {
        const reservationItems = data.reservation.map((r) => {
          return {
            reservation_id: generateId(),
            order_detail_id: data.id,
            showtime_id: r.showtimeId,
            seat_id: r.seatId,
            reservation_status: "pending",
            created_at: now,
            created_by: user.id,
            price: r.price.toString(),
            code: r.code ? r.code : generateShortId(7),
          };
        });

        await trx.table("seat_reservation").insert(reservationItems);
      }

      if (type === "NORMAL") {
        // for Restaurant POS, create order item status
        const orderStatus: table_order_item_status = {
          order_item_id: item.order_detail_id || "",
          status: "pending",
          qty: Number(item.qty),
          created_by: item.created_by || "",
          created_at: Formatter.getNowDateTime(),
        };

        await trx.table("order_item_status").insert(orderStatus);
      }

      await updateOrderTotalAmount(id, trx);

      return item;
    });
  }

  async checkout(orderId: string, user: UserInfo) {
    const now = Formatter.getNowDateTime();
    return await this.tx.transaction(async (trx) => {
      const order: table_customer_order = await trx
        .table<table_customer_order>("customer_order")
        .where({ order_id: orderId })
        .whereNotIn("order_status", ["COMPLETED", "CANCELLED", "REFUND"])
        .first();

      if (!order) {
        throw new Error("Order not found or already checked out");
      }

      if (order.table_number) {
        await trx
          .table("restaurant_tables")
          .where({ id: order.table_number })
          .update({ status: "cleaning" });
      }

      await trx.table("customer_order").where({ order_id: orderId }).update({
        order_status: "COMPLETED",
        updated_at: now,
        paid_at: now,
      });

      const orderItems: table_customer_order_detail[] = await trx
        .table<table_customer_order_detail>("customer_order_detail")
        .where({ order_id: orderId })
        .select();

      if (orderItems.length === 0) {
        throw new Error("No items found for this order");
      }

      const items = orderItems.map((item) => {
        return {
          order_detail_id: item.order_detail_id,
          created_at: now,
          created_by: user.id,
          variant_id: item.variant_id,
          discount_amount: item.discount_amount,
          order_id: item.order_id,
          price: item.price,
          total_amount: item.total_amount,
          qty: item.qty || 0,
          fulfilled_qty: 0,
          modifer_amount: "0",
        };
      });

      return { order, items };
    });
  }

  async orderPrintTime(orderId: string) {
    return await this.tx.transaction(async (trx) => {
      const order = await trx
        .table("customer_order")
        .where({ order_id: orderId })
        .first();

      if (order.order_status === "COMPLETED") {
        await trx
          .table("customer_order")
          .where({ order_id: orderId })
          .increment("print_time", 1);
      }
      if (order.order_status === "DRAFT") {
        await trx
          .table("customer_order")
          .where({ order_id: orderId })
          .update({ print_time: 1 });
      }
      return true;
    });
  }
}

export async function recalculateCustomerOrder(
  orderItem: table_customer_order_detail,
  knex: Knex,
): Promise<{
  totalDiscount: number;
  orderItemAmount: number;
  discountLog: CustomerOrderDiscount[];
}> {
  // initial order item value
  orderItem.total_amount = (
    Number(orderItem.price || 0) * Number(orderItem.qty || 0)
  ).toString();

  orderItem.discount_amount = "0";
  orderItem.modifer_amount = "0";

  return await knex.transaction(async (trx) => {
    await applyModifierToOrderItem(orderItem, trx);

    await applyDiscountToOrderItem(orderItem, trx);

    await updateOrderDetail(
      orderItem.order_detail_id!,
      {
        total_amount: orderItem.total_amount,
        discount_amount: orderItem.discount_amount,
        modifer_amount: orderItem.modifer_amount,
      },
      trx,
    );

    // recalculate total amount of order
    await updateOrderTotalAmount(orderItem.order_id!, trx);

    return {
      totalDiscount: Number(orderItem.discount_amount),
      orderItemAmount: Number(orderItem.total_amount),
      discountLog: [],
    };
  });
}

async function updateOrderTotalAmount(orderId: string, trx: Knex) {
  await trx.raw(
    `
      UPDATE customer_order
      SET total_amount = (
        SELECT SUM(COALESCE(total_amount, 0)) FROM customer_order_detail WHERE order_id = :order_id
      )
      WHERE order_id = :order_id
    `,
    { order_id: orderId },
  );
}

export async function updateOrderDetail(
  orderDetailId: string,
  data: Partial<table_customer_order_detail>,
  knex: Knex,
) {
  await knex
    .table<table_customer_order_detail>("customer_order_detail")
    .where({ order_detail_id: orderDetailId })
    .update(data);
}

export async function getOrderDetail(
  orderDetailId: string,
  trx: Knex,
): Promise<table_customer_order_detail | undefined> {
  return await trx
    .table<table_customer_order_detail>("customer_order_detail")
    .where({ order_detail_id: orderDetailId })
    .first();
}
