import { Formatter } from "@/lib/formatter";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const filterSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  warehouseId: z.string().optional(),
});

export type SaleShowtimeListFilter = z.infer<typeof filterSchema>;

export const saleShowtimeList = withAuthApi<
  unknown,
  unknown,
  ResponseType<unknown>,
  SaleShowtimeListFilter
>(async ({ db, searchParams, userAuth }) => {
  const { startDate, endDate, warehouseId } = filterSchema.parse(searchParams);
  const finalWarehouseId = warehouseId || userAuth.admin!.currentWarehouseId;

  const query = db("product")
    .innerJoin(
      "product_categories",
      "product.id",
      "product_categories.product_id",
    )
    .innerJoin("product_variant", "product.id", "product_variant.product_id")
    .innerJoin("showtime", "showtime.movie_id", "product_variant.id")
    .where({
      "product_categories.category_id": "movies-category-id",
      "showtime.deleted_at": null,
    });

  if (startDate && endDate) {
    query.whereBetween("showtime.show_date", [startDate, endDate]);
  }

  if (finalWarehouseId) {
    query
      .innerJoin("cinema_hall", "cinema_hall.hall_id", "showtime.hall_id")
      .where({
        "cinema_hall.warehouse_id": finalWarehouseId,
      });
  }

  const result = await query
    .clone()
    .select(
      "product.id",
      "product.title",
      "showtime.show_date",
      "showtime.start_time",
      "showtime.end_time",
      "showtime.showtime_id",
    );

  const reservations = await db
    .table("seat_reservation")
    .whereIn(
      "showtime_id",
      result.map((r) => r.showtime_id),
    )
    .innerJoin(
      "customer_order_detail",
      "customer_order_detail.order_detail_id",
      "seat_reservation.order_detail_id",
    )
    .whereIn("seat_reservation.reservation_status", ["confirmed", "admitted"])
    .select(
      "seat_reservation.order_detail_id",
      "seat_reservation.showtime_id",
      "seat_reservation.code",
      "seat_reservation.price as seat_price",
      "customer_order_detail.*",
    );

  const images = await db
    .table("product_images")
    .whereIn(
      "product_id",
      result.map((r) => r.id),
    )
    .select("product_id", "image_url");

  const grouped: Record<
    string,
    {
      totals: {
        qty: number;
        totalPrice: number;
        modifier: number;
        discount: number;
        amount: number;
      };
      showtimes: unknown[];
      images: { product_id: string; image_url: string } | undefined;
    }
  > = {};
  const grand = {
    qty: 0,
    totalPrice: 0,
    modifier: 0,
    discount: 0,
    amount: 0,
  };

  result.forEach((show) => {
    const reservationsForShowtime = reservations.filter(
      (r) => r.showtime_id === show.showtime_id,
    );
    const qty = reservationsForShowtime.reduce((sum, r) => sum + r.qty, 0);
    const totalPrice = reservationsForShowtime.reduce(
      (sum, r) => sum + parseFloat(r.seat_price),
      0,
    );
    const modifier = reservationsForShowtime.reduce(
      (sum, r) => sum + parseFloat(r.modifer_amount),
      0,
    );
    const discount = reservationsForShowtime.reduce(
      (sum, r) => sum + parseFloat(r.discount_amount),
      0,
    );
    const amount = reservationsForShowtime.reduce(
      (sum, r) =>
        sum +
        (parseFloat(r.seat_price) +
          parseFloat(r.modifer_amount) -
          parseFloat(r.discount_amount)),
      0,
    );

    grand.qty += qty;
    grand.totalPrice += totalPrice;
    grand.modifier += modifier;
    grand.discount += discount;
    grand.amount += amount;

    if (!grouped[show.title]) {
      grouped[show.title] = {
        totals: {
          qty: 0,
          totalPrice: 0,
          modifier: 0,
          discount: 0,
          amount: 0,
        },
        showtimes: [],
        images: images.find((img) => img.product_id === show.id),
      };
    }

    grouped[show.title].totals.qty += qty;
    grouped[show.title].totals.totalPrice += totalPrice;
    grouped[show.title].totals.modifier += modifier;
    grouped[show.title].totals.discount += discount;
    grouped[show.title].totals.amount += amount;

    grouped[show.title].showtimes.push({
      showDate: Formatter.date(show.show_date),
      startTime: Formatter.dateTime(show.start_time),
      endTime: Formatter.dateTime(show.end_time),
      qty,
      totalPrice,
      modifier,
      discount,
      amount,
    });
  });

  return NextResponse.json({
    success: true,
    message: "Sale showtime list retrieved successfully",
    result: { grand, ...grouped },
  });
});
