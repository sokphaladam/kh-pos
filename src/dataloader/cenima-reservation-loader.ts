import { table_seat_reservation } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import DataLoader from "dataloader";
import { Knex } from "knex";
import { LoaderFactory } from "./loader-factory";
import { SeatReservation } from "@/classes/cinema/reservation";

export function createCinemaReservationByShowtimeLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_seat_reservation[] = await db
      .table<table_seat_reservation>("seat_reservation")
      .whereIn("showtime_id", keys)
      .orderBy("created_at", "asc");

    return await Promise.all(
      keys.map(async (key) => {
        const row = rows.filter((row) => row.showtime_id === key);
        if (row.length === 0) {
          return [];
        }
        return row.map((reservation) => {
          return {
            id: reservation.reservation_id,
            showtimeId: reservation.showtime_id,
            seatId: reservation.seat_id,
            orderDetailId: reservation.order_detail_id,
            status: reservation.reservation_status as
              | "pending"
              | "confirmed"
              | "cancelled",
            createdAt: Formatter.dateTime(reservation.created_at),
            updatedAt: Formatter.dateTime(reservation.updated_at),
            price: reservation.price ? Number(reservation.price) : 0,
          };
        });
      }),
    );
  });
}

export function createCinemaReservationByOrderDetailLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_seat_reservation[] = await db
      .table<table_seat_reservation>("seat_reservation")
      .whereIn("order_detail_id", keys)
      .orderBy("created_at", "asc");

    const seatLoader = LoaderFactory.cinemaSeatLoader(db);
    const showtimeLoader = LoaderFactory.showtimeLoader(db);
    const userLoader = LoaderFactory.userLoader(db);

    return await Promise.all(
      keys.map(async (key) => {
        const row = rows.filter((row) => row.order_detail_id === key);
        if (!row) {
          return null;
        }
        return await Promise.all(
          row.map(async (reservation) => {
            const seat = await seatLoader.load(reservation.seat_id);

            return {
              id: reservation.reservation_id,
              showtimeId: reservation.showtime_id,
              seatId: reservation.seat_id,
              orderDetailId: reservation.order_detail_id,
              status: reservation.reservation_status as
                | "pending"
                | "confirmed"
                | "cancelled",
              createdAt: Formatter.dateTime(reservation.created_at),
              updatedAt: Formatter.dateTime(reservation.updated_at),
              seat,
              showtime: await showtimeLoader.load(reservation.showtime_id),
              price: reservation.price ? Number(reservation.price) : 0,
              confirmedAt: reservation.confirmed_at
                ? Formatter.dateTime(reservation.confirmed_at)
                : undefined,
              admittedAt: reservation.admitted_at
                ? Formatter.dateTime(reservation.admitted_at)
                : undefined,
              createdBy: reservation.created_by
                ? await userLoader.load(reservation.created_by)
                : null,
              confirmedBy: reservation.confirmed_by
                ? await userLoader.load(reservation.confirmed_by)
                : null,
              admittedBy: reservation.admitted_by
                ? await userLoader.load(reservation.admitted_by)
                : null,
              code: reservation.code || undefined,
            } as SeatReservation;
          }),
        );
      }),
    );
  });
}
