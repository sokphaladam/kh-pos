import { Showtime } from "@/classes/cinema/showtime";
import { table_showtime } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import DataLoader from "dataloader";
import { Knex } from "knex";
import { LoaderFactory } from "./loader-factory";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";

export function createShowtimeLoader(db: Knex, user?: UserInfo) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_showtime[] = await db
      .table<table_showtime>("showtime")
      .whereIn("showtime_id", keys)
      .orderBy("created_at", "asc");

    const userLoader = LoaderFactory.userLoader(db);
    const variantLoader = LoaderFactory.productVariantByIdLoader(
      db,
      user?.currentWarehouseId || "",
    );
    const pricingTemplateLoader = LoaderFactory.cinemaPricingTemplateLoader(db);
    const hallLoader = LoaderFactory.cinemaHallLoader(db);
    const reservationLoader =
      LoaderFactory.cinemaReservationByShowTimeLoader(db);

    return await Promise.all(
      keys.map(async (key) => {
        const row = rows.find((row) => row.showtime_id === key);
        if (!row) {
          return null;
        }

        return {
          availableSeats: row.available_seats,
          basePrice: Number(row.base_price),
          hallId: row.hall_id,
          movieId: row.movie_id,
          showDate: Formatter.date(row.show_date),
          showtimeId: row.showtime_id,
          startTime: Formatter.dateTime(row.start_time),
          endTime: Formatter.dateTime(row.end_time),
          status: row.status,
          createdAt: Formatter.dateTime(row.created_at),
          updatedAt: Formatter.dateTime(row.updated_at),
          totalSeats: row.total_seats,
          createdBy: row.created_by
            ? await userLoader.load(row.created_by)
            : null,
          hall: row.hall_id ? await hallLoader.load(row.hall_id) : null,
          priceTemplateId: row.pricing_template_id,
          pricingTemplate: row.pricing_template_id
            ? await pricingTemplateLoader.load(row.pricing_template_id)
            : null,
          reservations: row.showtime_id
            ? await reservationLoader.load(row.showtime_id)
            : null,
          variant: row.movie_id
            ? [await variantLoader.load(row.movie_id)]
            : undefined,
        } as Showtime;
      }),
    );
  });
}
