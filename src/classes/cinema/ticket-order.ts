import {
  table_cinema_hall,
  table_cinema_seat,
  table_customer,
  table_customer_order,
  table_customer_order_detail,
  table_movie,
  table_order_payment,
  table_seat_reservation,
  table_shift,
  table_showtime,
} from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId, generateShortId } from "@/lib/generate-id";
import { Logger } from "@/lib/logger";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { z } from "zod";
import { InvoiceNumberService } from "../invoice-number";
import moment from "moment-timezone";

export const TicketOrderSchema = z.array(
  z.object({
    movieId: z.string(),
    showdate: z.string(),
    hallId: z.string(),
    basePrice: z.number(),
    showtimes: z.array(
      z.object({
        datetime: z.string(),
        ticket: z.number(),
      }),
    ),
  }),
);

export type TicketOrderSchemaType = z.infer<typeof TicketOrderSchema>;

export class TicketOrderService {
  constructor(
    protected tx: Knex,
    protected user: UserInfo,
    protected logger?: Logger,
  ) {}

  async uploadManualTicketOrders(input: TicketOrderSchemaType) {
    return await this.tx.transaction(async (trx) => {
      const invoiceNumberService = new InvoiceNumberService(trx, this.user);
      const setting = await trx
        .table("setting")
        .where({ option: "EXCHANGE_RATE" })
        .first();
      const exchangeRate = setting ? setting.value : "4000";
      const defaultCustomer: table_customer = await trx
        .table("customer")
        .where({
          customer_name: "Walk In",
          is_active: true,
          pos_warehouse_id: this.user.currentWarehouseId,
        })
        .first();

      const orders: table_customer_order[] = [];
      const orderItems: table_customer_order_detail[] = [];
      const orderPayments: table_order_payment[] = [];
      const orderSeats: table_seat_reservation[] = [];

      let invoicesNo: {
        showdate: string;
        invoices: number[];
        length: number;
      }[] = [];

      const totalOrders = input.length;
      const totalTickets = input.reduce(
        (sum, o) => sum + o.showtimes.reduce((s, st) => s + st.ticket, 0),
        0,
      );
      console.log(
        `[Progress] Starting upload: ${totalOrders} movie(s), ${totalTickets} total ticket(s)`,
      );

      let orderIndex = 0;
      for (const order of input) {
        orderIndex++;
        console.log(
          `[Progress] Processing movie ${orderIndex}/${totalOrders} (movieId: ${order.movieId}, date: ${order.showdate})`,
        );

        // query cinema hall info
        const hall: table_cinema_hall = await trx
          .table("cinema_hall")
          .where({ hall_id: order.hallId })
          .first();

        const seats: table_cinema_seat[] = await trx
          .table<table_cinema_seat>("cinema_seat")
          .where({ hall_id: hall.hall_id })
          .whereNot("seat_type", "blocked");

        const shift: table_shift = await trx
          .table("shift")
          .where({ opened_by: this.user.id })
          .andWhereRaw("DATE(opened_at) = ?", [Formatter.date(order.showdate)])
          .first();

        let showtimeIndex = 0;
        for (const showtime of order.showtimes) {
          showtimeIndex++;
          console.log(
            `[Progress] Processing showtime ${showtimeIndex}/${order.showtimes.length}: ${showtime.datetime} (${showtime.ticket} ticket(s))`,
          );

          // process showtime acton
          const existingShowtime = await trx
            .table<table_showtime>("showtime")
            .where({
              movie_id: order.movieId || "",
              hall_id: order.hallId || "",
              show_date: Formatter.date(order.showdate) || "",
              start_time: Formatter.dateTime(showtime.datetime) || "",
            })
            .first();

          const movie: table_movie = await trx
            .table("movie")
            .where({ movie_id: order.movieId })
            .first();

          const startTime = moment(Formatter.dateTime(showtime.datetime));
          const endTime = startTime.add(movie.duration_minutes, "minutes");

          const itemShowtime: table_showtime = existingShowtime
            ? existingShowtime
            : {
                available_seats:
                  seats.length > 0
                    ? Number(seats.length) - Number(showtime.ticket)
                    : 0,
                base_price: order.basePrice.toString(),
                hall_id: order.hallId,
                movie_id: order.movieId,
                show_date: Formatter.date(order.showdate) || "",
                start_time: Formatter.dateTime(showtime.datetime) || "",
                end_time: Formatter.dateTime(endTime) || "",
                showtime_id: generateId(),
                created_at: Formatter.getNowDateTime(),
                created_by: this.user.id,
                total_seats: seats.length > 0 ? Number(seats.length) : 0,
                status: "ended",
                booking_id: null,
                deleted_at: null,
                settlement_id: null,
                pricing_template_id: null,
                updated_at: null,
              };

          if (!existingShowtime) {
            await trx.table<table_showtime>("showtime").insert(itemShowtime);
          }

          // map ticket order to showtime
          const tickets = Array.from({ length: showtime.ticket });

          for (const [ticketIdx] of tickets.entries()) {
            console.log(
              `[Progress] Building ticket ${ticketIdx + 1}/${showtime.ticket} for showtime ${showtime.datetime}`,
            );
            const orderId = generateId();
            const orderDetailId = generateId();
            orders.push({
              order_id: orderId,
              address_lat: null,
              address_lng: null,
              created_at: Formatter.dateTime(showtime.datetime),
              created_by: this.user.id,
              customer_id: defaultCustomer.id || "",
              delivery_address: null,
              delivery_code: null,
              invoice_no: null,
              order_status: "COMPLETED",
              paid_at: Formatter.dateTime(showtime.datetime),
              refund_at: null,
              table_number: null,
              total_amount: order.basePrice.toString(),
              transfer_at: null,
              transfer_by: null,
              updated_at: null,
              warehouse_id: this.user.currentWarehouseId || "",
              customer: 1,
              print_time: 0,
              served_type: "dine_in",
            });
            orderItems.push({
              order_id: orderId,
              created_at: Formatter.dateTime(showtime.datetime),
              created_by: this.user.id,
              discount_amount: "0",
              fulfilled_qty: 1,
              modifer_amount: "0",
              order_detail_id: orderDetailId,
              price: order.basePrice.toString(),
              qty: 1,
              total_amount: order.basePrice.toString(),
              variant_id: order.movieId,
            });

            const seatAvailable = seats.filter(
              (f) =>
                !orderSeats
                  .filter((o) => o.showtime_id === itemShowtime.showtime_id)
                  .map((s) => s.seat_id)
                  .includes(f.seat_id),
            );

            orderSeats.push({
              reservation_id: generateId(),
              admitted_at: null,
              admitted_by: null,
              code: generateShortId(7),
              confirmed_at: Formatter.dateTime(showtime.datetime),
              confirmed_by: this.user.id,
              created_at: Formatter.dateTime(showtime.datetime),
              created_by: this.user.id,
              order_detail_id: orderDetailId,
              seat_id:
                seatAvailable.length > 0
                  ? seatAvailable.at(0)?.seat_id || ""
                  : "",
              showtime_id: itemShowtime.showtime_id,
              reservation_status: "confirmed",
              price: order.basePrice.toString(),
              updated_at: null,
            });

            orderPayments.push({
              payment_id: generateId(),
              amount: order.basePrice.toString(),
              amount_usd: order.basePrice.toString(),
              amount_used: order.basePrice.toString(),
              currency: "USD",
              exchange_rate: exchangeRate,
              order_id: orderId,
              created_at: Formatter.dateTime(showtime.datetime),
              created_by: this.user.id,
              deleted_at: null,
              deleted_by: null,
              shift_id: shift ? shift.shift_id : null,
              updated_at: null,
              updated_by: null,
              payment_method: "1",
            });
          }
        }
        const findInvoice = invoicesNo.findIndex(
          (f) => f.showdate === order.showdate,
        );
        if (findInvoice < 0) {
          invoicesNo.push({
            showdate: order.showdate,
            length: order.showtimes.reduce((a, b) => a + b.ticket, 0),
            invoices: [],
          });
        } else {
          invoicesNo[findInvoice].length += order.showtimes.reduce(
            (a, b) => a + b.ticket,
            0,
          );
        }
      }

      for (const invoiceInfo of invoicesNo) {
        const suggestedNumbers =
          await invoiceNumberService.getNextInvoiceNumber(
            invoiceInfo.length,
            true,
            invoiceInfo.showdate,
          );
        invoiceInfo.invoices = suggestedNumbers;
      }

      console.log(
        `[Progress] Prepared ${orders.length} order(s), ${orderItems.length} item(s), ${orderPayments.length} payment(s), ${orderSeats.length} seat(s). Starting DB inserts...`,
      );

      if (orders.length > 0) {
        console.log(`[Progress] Inserting ${orders.length} order(s)...`);
        for (const [idx, order] of orders.entries()) {
          const invoice = Number(
            invoicesNo
              .find(
                (f) =>
                  Formatter.date(f.showdate) ===
                  Formatter.date(order.created_at),
              )
              ?.invoices.at(0)
              ?.toString(),
          );
          await trx.table<table_customer_order>("customer_order").insert({
            ...order,
            invoice_no: invoice,
          });
          console.log(
            `[Progress] Order ${idx + 1}/${orders.length} inserted (id: ${order.order_id}, invoice: ${invoice})`,
          );
          invoicesNo = invoicesNo.map((inv) => {
            return {
              ...inv,
              invoices: inv.invoices.filter((i) => i !== invoice),
            };
          });
        }
      }

      if (orderItems.length > 0) {
        console.log(
          `[Progress] Inserting ${orderItems.length} order item(s)...`,
        );
        for (const [idx, item] of orderItems.entries()) {
          await trx
            .table<table_customer_order_detail>("customer_order_detail")
            .insert(item);
          console.log(
            `[Progress] Order item ${idx + 1}/${orderItems.length} inserted (id: ${item.order_detail_id})`,
          );
        }
      }

      if (orderPayments.length > 0) {
        console.log(
          `[Progress] Inserting ${orderPayments.length} payment(s)...`,
        );
        for (const [idx, payment] of orderPayments.entries()) {
          await trx.table<table_order_payment>("order_payment").insert(payment);
          console.log(
            `[Progress] Payment ${idx + 1}/${orderPayments.length} inserted (id: ${payment.payment_id})`,
          );
        }
      }

      if (orderSeats.length > 0) {
        console.log(
          `[Progress] Inserting ${orderSeats.length} seat reservation(s)...`,
        );
        for (const [idx, seat] of orderSeats.entries()) {
          await trx
            .table<table_seat_reservation>("seat_reservation")
            .insert(seat);
          console.log(
            `[Progress] Seat reservation ${idx + 1}/${orderSeats.length} inserted (id: ${seat.reservation_id})`,
          );
        }
      }

      console.log(
        `[Progress] Upload complete: ${orders.length} order(s), ${orderItems.length} item(s), ${orderPayments.length} payment(s), ${orderSeats.length} seat(s) inserted.`,
      );

      if (this.logger) {
        this.logger.serverLog("Manual ticket order uploaded", {
          action: "create",
          key: "manual_ticket_order",
          table_name: "",
          content: { orders, orderItems, orderPayments, orderSeats },
        });
      }

      return true;
    });
  }
}
