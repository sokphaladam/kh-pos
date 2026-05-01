import { LoaderFactory } from "@/dataloader/loader-factory";
import { Formatter } from "@/lib/formatter";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { v4 } from "uuid";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { CinemaHall } from "./hall";

export interface Showtime {
  showtimeId: string;
  hallId: string;
  movieId: string;
  showDate: string;
  startTime: string;
  endTime: string;
  basePrice: number;
  status:
    | "scheduled"
    | "selling"
    | "sold_out"
    | "started"
    | "ended"
    | "cancelled";
  availableSeats: number;
  totalSeats: number;
  priceTemplateId?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: UserInfo | null;
  variant?: ProductVariantType[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pricingTemplate?: any;
  hall?: CinemaHall | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reservations?: any;
}

export interface ShowtimeInput {
  hallId: string;
  movieId: string;
  showDate: string;
  startTime: string;
  endTime: string;
  basePrice: number;
  status:
    | "scheduled"
    | "selling"
    | "sold_out"
    | "started"
    | "ended"
    | "cancelled";
  availableSeats: number;
  totalSeats: number;
  priceTemplateId?: string;
}

export class ShowtimeService {
  constructor(
    protected tx: Knex,
    protected user: UserInfo,
  ) {}

  async createShowtime(input: ShowtimeInput) {
    const showtime_id = v4();

    const showtimeInput = {
      showtime_id,
      hall_id: input.hallId,
      movie_id: input.movieId,
      show_date: input.showDate,
      start_time: input.startTime,
      end_time: input.endTime,
      base_price: input.basePrice,
      status: input.status,
      available_seats: input.availableSeats,
      total_seats: input.totalSeats,
      pricing_template_id: input.priceTemplateId,
      created_by: this.user.id,
      created_at: Formatter.getNowDateTime(),
    };

    await this.tx.table("showtime").insert(showtimeInput);
    return true;
  }

  async updateShowtime(showtimeId: string, input: ShowtimeInput) {
    const showtimeInput = {
      hall_id: input.hallId,
      movie_id: input.movieId,
      show_date: input.showDate,
      start_time: input.startTime,
      end_time: input.endTime,
      base_price: input.basePrice,
      status: input.status,
      available_seats: input.availableSeats,
      total_seats: input.totalSeats,
      pricing_template_id: input.priceTemplateId,
      updated_at: Formatter.getNowDateTime(),
    };

    await this.tx
      .table("showtime")
      .where({ showtime_id: showtimeId })
      .update(showtimeInput);
    return true;
  }

  async deleteShowtime(showtimeId: string) {
    await this.tx
      .table("showtime")
      .where({ showtime_id: showtimeId })
      .update({ deleted_at: Formatter.getNowDateTime() });
    return true;
  }

  async getShowtimeById() {
    // To be implemented
  }

  async listShowtimes(
    limit: number,
    offset: number,
    status?: string[],
    showDate?: string,
    movieId?: string,
    warehouseId?: string,
  ) {
    const query = this.tx.table("showtime").where("deleted_at", null);

    if (status && status.length > 0) {
      query.whereIn("status", status);
    }

    if (movieId) {
      query.where({ movie_id: movieId });
      if (showDate) {
        query.where("show_date", ">=", showDate);
      }
    } else {
      if (showDate) {
        query.where("show_date", showDate);
      }
    }

    const effectiveWarehouseId = warehouseId ?? this.user?.currentWarehouseId;
    if (effectiveWarehouseId) {
      query
        .join("user", "user.id", "showtime.created_by")
        .where("user.warehouse_id", effectiveWarehouseId);
    }

    const { total } = await query
      .clone()
      .count("* as total")
      .first<{ total: number }>();

    const showtimes = await query
      .clone()
      .select("showtime.*")
      .limit(limit)
      .offset(offset)
      .orderBy("show_date", "asc")
      .orderBy("start_time", "asc");

    const userLoader = LoaderFactory.userLoader(this.tx);
    const variantLoader = LoaderFactory.productVariantByIdLoader(
      this.tx,
      effectiveWarehouseId || "",
    );
    const pricingTemplateLoader = LoaderFactory.cinemaPricingTemplateLoader(
      this.tx,
    );
    const hallLoader = LoaderFactory.cinemaHallLoader(this.tx);
    const reservationLoader = LoaderFactory.cinemaReservationByShowTimeLoader(
      this.tx,
    );

    const data = await Promise.all(
      showtimes.map(async (showtime) => {
        return {
          showtimeId: showtime.showtime_id,
          hallId: showtime.hall_id,
          movieId: showtime.movie_id,
          showDate: Formatter.date(showtime.show_date),
          startTime: Formatter.dateTime(showtime.start_time),
          endTime: Formatter.dateTime(showtime.end_time),
          basePrice: Number(showtime.base_price),
          status: showtime.status,
          availableSeats: showtime.available_seats,
          totalSeats: showtime.total_seats,
          priceTemplateId: showtime.pricing_template_id,
          createdAt: showtime.created_at
            ? Formatter.dateTime(showtime.created_at)
            : "",
          updatedAt: showtime.updated_at
            ? Formatter.dateTime(showtime.updated_at)
            : "",
          createdBy: showtime.created_by
            ? await userLoader.load(showtime.created_by)
            : null,
          variant: (await variantLoader.load(showtime.movie_id))
            ? [await variantLoader.load(showtime.movie_id)]
            : undefined,
          pricingTemplate: showtime.pricing_template_id
            ? await pricingTemplateLoader.load(
                showtime.pricing_template_id || "",
              )
            : null,
          hall: showtime.hall_id
            ? await hallLoader.load(showtime.hall_id)
            : null,
          reservations: showtime.showtime_id
            ? await reservationLoader.load(showtime.showtime_id)
            : null,
        } as Showtime;
      }),
    );

    return { data, total };
  }
}
