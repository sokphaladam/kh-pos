import { Formatter } from "@/lib/formatter";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { v4 } from "uuid";
import { CinemaHallSeat } from "./hall";
import { Showtime } from "./showtime";
import moment from "moment-timezone";
import { LoaderFactory } from "@/dataloader/loader-factory";
import { Printing } from "./printing";

interface ReservationInput {
  showtimeId: string;
  seatId: string;
  orderDetailId: string;
}

export interface SeatReservation {
  id: string;
  showtimeId: string;
  seatId: string;
  orderDetailId: string;
  status: "pending" | "confirmed" | "admitted" | "cancelled" | "expired";
  createdAt: string;
  updatedAt: string;
  price: number;
  confirmedAt?: string;
  admittedAt?: string;
  createdBy?: UserInfo | null;
  confirmedBy?: UserInfo | null;
  admittedBy?: UserInfo | null;
  seat?: CinemaHallSeat | null;
  showtime?: Showtime | null;
  code?: string | null;
}
export class CinemaReservationService {
  constructor(
    protected tx: Knex,
    protected user: UserInfo,
  ) {}

  async createReservation(data: ReservationInput[]) {
    // Implementation for creating a reservation
    const input = data.map((item) => {
      return {
        reservation_id: v4(),
        showtime_id: item.showtimeId,
        seat_id: item.seatId,
        order_detail_id: item.orderDetailId,
        reservation_status: "confirmed",
        created_by: this.user.id,
        created_at: Formatter.getNowDateTime(),
        confirmed_by: this.user.id,
        confirmed_at: Formatter.getNowDateTime(),
      };
    });
    await this.tx.table("seat_reservation").insert(input);
    return true;
  }

  async sendReservationTicketToPrinter(reservationIds: string[]) {
    try {
      const setting = await this.tx
        .table("setting")
        .where({ option: "PRINT_SOCKET" })
        .first();

      const items = await this.tx("seat_reservation")
        .select(
          "seat_reservation.code",
          "seat_reservation.reservation_id",
          "showtime.show_date",
          "showtime.start_time",
          "showtime.end_time",
          "cinema_seat.row_label",
          "cinema_seat.seat_number",
          "cinema_seat.seat_type",
          "product.title",
          "cinema_hall.hall_name",
        )
        .innerJoin(
          "showtime",
          "showtime.showtime_id",
          "seat_reservation.showtime_id",
        )
        .innerJoin(
          "cinema_seat",
          "cinema_seat.seat_id",
          "seat_reservation.seat_id",
        )
        .innerJoin("product_variant", "product_variant.id", "showtime.movie_id")
        .innerJoin("product", "product.id", "product_variant.product_id")
        .innerJoin("cinema_hall", "cinema_hall.hall_id", "showtime.hall_id")
        .whereIn("seat_reservation.reservation_id", reservationIds);

      const data = [];

      for (const reservation of items) {
        data.push([
          {
            type: "text",
            value: `${reservation.title}`,
            style: {
              fontSize: "20px",
              fontFamily: "Hanuman, 'Courier New', Courier, monospace",
              fontWeight: "bold",
              textAlign: "left",
            },
          },
          {
            type: "text",
            value: `Cinema: ${this.user.warehouse?.name}`,
            style: {
              fontSize: "16px",
              fontFamily: "Hanuman, 'Courier New', Courier, monospace",
              fontWeight: "bold",
              textAlign: "left",
            },
          },
          {
            type: "text",
            value: `Hall: ${reservation.hall_name}`,
            style: {
              fontSize: "16px",
              fontFamily: "Hanuman, 'Courier New', Courier, monospace",
              fontWeight: "bold",
              textAlign: "left",
            },
          },
          {
            type: "text",
            value: `Seat: ${reservation.row_label}${reservation.seat_number} (${reservation.seat_type})`,
            style: {
              fontSize: "16px",
              fontFamily: "Hanuman, 'Courier New', Courier, monospace",
              fontWeight: "bold",
              textAlign: "left",
            },
          },
          {
            type: "text",
            value: `Date: ${moment(reservation.show_date).format(
              "ddd, DD MMM YYYY",
            )}`,
            style: {
              fontSize: "16px",
              fontFamily: "Hanuman, 'Courier New', Courier, monospace",
              fontWeight: "bold",
              textAlign: "left",
            },
          },
          {
            type: "text",
            value: `Time: ${moment(reservation.start_time).format(
              "HH:mm a",
            )} - ${moment(reservation.end_time).format("HH:mm a")}`,
            style: {
              fontSize: "16px",
              fontFamily: "Hanuman, 'Courier New', Courier, monospace",
              fontWeight: "bold",
              textAlign: "left",
              fontStyle: "uppercase",
            },
          },
          {
            type: "text",
            value: "--------------------------------",
            style: {
              fontSize: "20px",
              fontFamily: "Hanuman, 'Courier New', Courier, monospace",
              fontWeight: "bold",
              textAlign: "center",
            },
          },
          {
            type: "qrCode",
            value: `${reservation.code ? reservation.code : ""}`, // QR content
            height: "150", // size in px
            width: "150",
            position: "center",
            style: {
              margin: "0 0 0 0",
            },
            displayValue: true,
          },
          {
            type: "text",
            value: `${reservation.code}`,
            style: {
              fontSize: "16px",
              fontFamily: "Hanuman, 'Courier New', Courier, monospace",
              fontWeight: "bold",
              textAlign: "center",
            },
          },
        ]);
      }

      const valueSetting = setting ? JSON.parse(setting.value) : {};

      const dataPayload = {
        content: data,
        printer_info: setting
          ? valueSetting.printers
          : {
              id: "4782906b-492f-4ff9-a1ee-04efd181733d",
              ip: "127.0.0.1",
              name: "Print to Chasier1",
              port: 9100,
              printer_name: "Print to Chasier1",
              print_server_ip: "192.168.1.100:8080",
            },
      };

      const printing = new Printing();
      printing.send(JSON.stringify(dataPayload));
      const res = { success: true, result: "Sent to printer", error: "" };

      return res;
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  }

  async changeReservationStatus(
    showtimeId: string,
    code: string,
    status: "pending" | "confirmed" | "admitted" | "cancelled" | "expired",
  ) {
    const item = await this.tx
      .table("seat_reservation")
      .where({ showtime_id: showtimeId, code })
      .first();

    if (status === "admitted" && item.reservation_status == "confirmed") {
      await this.tx
        .table("seat_reservation")
        .where({ showtime_id: showtimeId, code })
        .update({
          reservation_status: "admitted",
          admitted_at: Formatter.getNowDateTime(),
          admitted_by: this.user.id,
        });

      return {
        success: true,
        result: true,
        error: "",
      };
    }

    return {
      success: false,
      result: true,
      error: `Cannot change reservation with status ${item.reservation_status} to ${status}`,
    };
  }

  async reservationList({
    limit,
    offset,
    date,
    status,
    showtimeId,
  }: {
    limit: number;
    offset: number;
    date?: string;
    status?: string[];
    showtimeId?: string;
  }) {
    const query = this.tx("seat_reservation");

    if (date) {
      query.whereRaw("DATE(created_at) = ?", [date]);
    }

    if (status && status.length > 0) {
      query.whereIn("reservation_status", status);
    }

    if (showtimeId) {
      query.where("showtime_id", showtimeId);
    }

    const { total } = await query
      .clone()
      .count("* as total")
      .first<{ total: number }>();

    const items = await query
      .clone()
      .select("*")
      .limit(limit)
      .offset(offset)
      .orderBy("created_at", "desc");

    const seatLoader = LoaderFactory.cinemaSeatLoader(this.tx);
    const showtimeLoader = LoaderFactory.showtimeLoader(this.tx);
    const userLoader = LoaderFactory.userLoader(this.tx);

    const result = await Promise.all(
      items.map(async (reservation) => {
        return {
          id: reservation.reservation_id,
          showtimeId: reservation.showtime_id,
          seatId: reservation.seat_id,
          orderDetailId: reservation.order_detail_id,
          status: reservation.reservation_status as
            | "pending"
            | "confirmed"
            | "admitted"
            | "cancelled"
            | "expired",
          price: reservation.price ? Number(reservation.price) : 0,
          confirmedAt: reservation.confirmed_at
            ? Formatter.dateTime(reservation.confirmed_at)
            : undefined,
          admittedAt: reservation.admitted_at
            ? Formatter.dateTime(reservation.admitted_at)
            : undefined,
          createdAt: Formatter.dateTime(reservation.created_at),
          updatedAt: Formatter.dateTime(reservation.updated_at),
          createdBy: reservation.created_by
            ? await userLoader.load(reservation.created_by)
            : null,
          confirmedBy: reservation.confirmed_by
            ? await userLoader.load(reservation.confirmed_by)
            : null,
          admittedBy: reservation.admitted_by
            ? await userLoader.load(reservation.admitted_by)
            : null,
          seat: await seatLoader.load(reservation.seat_id),
          showtime: await showtimeLoader.load(reservation.showtime_id),
          code: reservation.code,
        } as SeatReservation;
      }),
    );

    return {
      data: result,
      total,
    };
  }

  async getReservationByCode({
    code,
    customerPhone,
  }: {
    code?: string;
    customerPhone?: string;
  }) {
    const query = this.tx("seat_reservation").where({
      reservation_status: "confirmed",
    });

    if (code) {
      query.where({ code });
    }

    if (customerPhone) {
      // Join with order_detail and customer_order to filter by customer phone
      query
        .innerJoin(
          "customer_order_detail",
          "customer_order_detail.order_detail_id",
          "seat_reservation.order_detail_id",
        )
        .innerJoin(
          "customer_order",
          "customer_order.order_id",
          "customer_order_detail.order_id",
        )
        .innerJoin("customer", "customer.id", "customer_order.customer_id")
        .where("customer.phone", customerPhone);
    }

    const reservation = await query
      .clone()
      .select("seat_reservation.*")
      .orderBy("confirmed_at", "desc");

    const userLoader = LoaderFactory.userLoader(this.tx);
    const seatLoader = LoaderFactory.cinemaSeatLoader(this.tx);
    const showtimeLoader = LoaderFactory.showtimeLoader(this.tx);

    if (!reservation) {
      return null;
    }

    return await Promise.all(
      reservation.map(async (reservation) => {
        return {
          id: reservation.reservation_id,
          showtimeId: reservation.showtime_id,
          seatId: reservation.seat_id,
          orderDetailId: reservation.order_detail_id,
          status: reservation.reservation_status as
            | "pending"
            | "confirmed"
            | "admitted"
            | "cancelled"
            | "expired",
          price: reservation.price ? Number(reservation.price) : 0,
          confirmedAt: reservation.confirmed_at
            ? Formatter.dateTime(reservation.confirmed_at)
            : undefined,
          admittedAt: reservation.admitted_at
            ? Formatter.dateTime(reservation.admitted_at)
            : undefined,
          createdAt: Formatter.dateTime(reservation.created_at),
          updatedAt: Formatter.dateTime(reservation.updated_at),
          code: reservation.code,
          createdBy: reservation.created_by
            ? await userLoader.load(reservation.created_by)
            : null,
          confirmedBy: reservation.confirmed_by
            ? await userLoader.load(reservation.confirmed_by)
            : null,
          admittedBy: reservation.admitted_by
            ? await userLoader.load(reservation.admitted_by)
            : null,
          seat: await seatLoader.load(reservation.seat_id),
          showtime: await showtimeLoader.load(reservation.showtime_id),
        } as SeatReservation;
      }),
    );
  }
}
