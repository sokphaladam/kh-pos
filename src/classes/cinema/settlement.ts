import { LoaderFactory } from "@/dataloader/loader-factory";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { table_producer_settlement } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { Showtime } from "./showtime";

export interface ProducerSettlement {
  id: string;
  movieId: string | null;
  totalAmount: number;
  shareAmount: number;
  createdAt: string | null;
  settledAt: string | null;
  proofLink: string | null;
  createdBy: UserInfo | null;
  settledBy: UserInfo | null;
  productVariant: ProductVariantType | null;
}

export class SettlementService {
  constructor(protected tx: Knex) {}

  async generateSettlement(
    {
      startDate,
      endDate,
    }: {
      startDate: string;
      endDate: string;
    },
    user: UserInfo,
  ) {
    const now = Formatter.getNowDateTime();
    const transaction = await this.tx.transaction(async (trx) => {
      const result = await trx
        .table("showtime")
        .join(
          "seat_reservation",
          "seat_reservation.showtime_id",
          "showtime.showtime_id",
        )
        .join("movie", "movie.movie_id", "showtime.movie_id")
        .join("product_variant", "product_variant.id", "movie.movie_id")
        .join("product", "product.id", "product_variant.product_id")
        .where({
          "showtime.deleted_at": null,
          "showtime.status": "ended",
          "showtime.settlement_id": null,
        })
        .where("movie.producer_share", ">", 0)
        .whereBetween("show_date", [startDate, endDate])
        .whereIn("reservation_status", ["confirmed", "admitted"])
        .select(
          "showtime.showtime_id",
          "showtime.movie_id",
          "showtime.show_date",
          "seat_reservation.reservation_status",
          "seat_reservation.price",
          "movie.producer_share",
          "product.title",
          "movie.tax_rate",
        );

      if (result.length === 0) {
        return {
          recordsProcessed: 0,
        };
      }

      const rows = [];

      for (const showtime of result) {
        const findIndex = rows.findIndex(
          (row) => row.movie_id === showtime.movie_id,
        );

        if (findIndex === -1) {
          const amount = Number(showtime.price) / 1.1;
          rows.push({
            id: generateId(),
            movie_id: showtime.movie_id,
            total_amount: amount,
            share_amount: amount * (Number(showtime.producer_share) / 100),
            created_at: now,
            created_by: user.id,
          });
        } else {
          const amount =
            rows[findIndex].total_amount + Number(showtime.price) / 1.1;
          const shareAmount = amount * (Number(showtime.producer_share) / 100);
          rows[findIndex].total_amount = amount;
          rows[findIndex].share_amount = shareAmount;
        }
      }

      // insert rows into producer_settlement table
      await trx.table("producer_settlement").insert(rows);

      // update showtime table with settlement_id
      for (const row of rows) {
        await trx
          .table("showtime")
          .where({
            movie_id: row.movie_id,
            "showtime.deleted_at": null,
            "showtime.status": "ended",
            "showtime.settlement_id": null,
          })
          .andWhere("settlement_id", null)
          .andWhereBetween("show_date", [startDate, endDate])
          .update({
            settlement_id: row.id,
          });
      }

      return {
        recordsProcessed: rows.length,
      };
    });

    return transaction;
  }

  async getSettlements(
    {
      limit,
      offset,
      startDate,
      endDate,
      isSettled,
    }: {
      limit: number;
      offset: number;
      startDate?: string;
      endDate?: string;
      isSettled?: boolean;
    },
    user: UserInfo,
  ) {
    const query = this.tx
      .table("producer_settlement")
      .orderBy("settled_at", "asc")
      .orderBy("created_at", "desc");

    if (startDate && endDate) {
      query.whereBetween("created_at", [startDate, endDate]);
    }

    if (isSettled !== undefined) {
      if (isSettled) {
        query.whereNotNull("settled_at");
      } else {
        query.whereNull("settled_at");
      }
    }

    const total = await query.clone().count("id as count").first();
    const rows: table_producer_settlement[] = await query
      .clone()
      .limit(limit)
      .offset(offset)
      .select("*");

    const userLoader = LoaderFactory.userLoader(this.tx);
    const variantLoader = LoaderFactory.productVariantByIdLoader(
      this.tx,
      user.currentWarehouseId!,
    );

    const data: ProducerSettlement[] = await Promise.all(
      rows.map(async (row) => {
        return {
          id: row.id,
          movieId: row.movie_id || null,
          totalAmount: Number(row.total_amount),
          shareAmount: Number(row.share_amount),
          createdAt: row.created_at ? Formatter.dateTime(row.created_at) : null,
          settledAt: row.settled_at ? Formatter.dateTime(row.settled_at) : null,
          proofLink: row.proof_link,
          createdBy: row.created_by
            ? await userLoader.load(row.created_by)
            : null,
          settledBy: row.settled_by
            ? await userLoader.load(row.settled_by)
            : null,
          productVariant: row.movie_id
            ? await variantLoader.load(row.movie_id)
            : null,
        };
      }),
    );

    return {
      total: total?.count || 0,
      data,
    };
  }

  async settleProducerSettlement(
    {
      settlementId,
      proofLink,
    }: {
      settlementId: string;
      proofLink: string;
    },
    user: UserInfo,
  ) {
    const now = Formatter.getNowDateTime();

    await this.tx.transaction(async (trx) => {
      const producerSettlement: table_producer_settlement = await trx
        .table("producer_settlement")
        .where("id", settlementId)
        .first();

      await trx.table("producer_settlement").where("id", settlementId).update({
        settled_at: now,
        proof_link: proofLink,
        settled_by: user.id,
      });

      const account = await trx
        .table("chart_of_account")
        .where({ account_name: "Producer Settlement" })
        .first();

      const accountId = account ? account.id : generateId();

      if (!account) {
        await trx.table("chart_of_account").insert({
          id: accountId,
          account_name: "Producer Settlement",
          created_at: now,
          created_by: user.id,
          account_type: "expense",
        });
      }

      const product = await trx
        .table("product")
        .join("product_variant", "product.id", "product_variant.product_id")
        .join("movie", "movie.movie_id", "product_variant.id")
        .where("movie.movie_id", producerSettlement.movie_id)
        .first()
        .select("product.title");

      await trx.table("account_booking").insert({
        id: generateId(),
        account_id: accountId,
        created_by: user.id,
        created_at: now,
        description: `Producer Settlement for ${product?.title || "Unknown Product"}`,
        amount: String(producerSettlement.share_amount),
      });
    });

    return "Settlement marked as settled";
  }

  async getSettlementDetails(settlementId: string, user: UserInfo) {
    const item: table_producer_settlement = await this.tx
      .table("producer_settlement")
      .where("producer_settlement.id", settlementId)
      .first();

    const showtimes = await this.tx
      .table("showtime")
      .where("settlement_id", settlementId);

    const servationRows = LoaderFactory.cinemaReservationByShowTimeLoader(
      this.tx,
    );
    const userLoader = LoaderFactory.userLoader(this.tx);
    const variantLoader = LoaderFactory.productVariantByIdLoader(
      this.tx,
      user.currentWarehouseId!,
    );
    const hallLoader = LoaderFactory.cinemaHallLoader(this.tx);

    const result = {
      id: item.id,
      movieId: item.movie_id || null,
      totalAmount: Number(item.total_amount),
      shareAmount: Number(item.share_amount),
      createdAt: item.created_at ? Formatter.dateTime(item.created_at) : null,
      settledAt: item.settled_at ? Formatter.dateTime(item.settled_at) : null,
      proofLink: item.proof_link,
      createdBy: item.created_by
        ? await userLoader.load(item.created_by)
        : null,
      settledBy: item.settled_by
        ? await userLoader.load(item.settled_by)
        : null,
      productVariant: item.movie_id
        ? await variantLoader.load(item.movie_id)
        : null,
      showtimes: await Promise.all(
        showtimes.map(
          async (showtime) =>
            ({
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
              reservations: showtime.showtime_id
                ? await servationRows.load(showtime.showtime_id)
                : null,
              hall: showtime.hall_id
                ? await hallLoader.load(showtime.hall_id)
                : null,
            }) as Showtime,
        ),
      ),
    };

    return result;
  }
}
