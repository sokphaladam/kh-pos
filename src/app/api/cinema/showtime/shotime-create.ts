import { ShowtimeService } from "@/classes/cinema/showtime";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const schemaShowtimeInput = z.object({
  hallId: z.string(),
  movieId: z.string(),
  showDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  basePrice: z.number(),
  status: z.enum([
    "scheduled",
    "selling",
    "sold_out",
    "started",
    "ended",
    "cancelled",
  ]),
  availableSeats: z.number(),
  totalSeats: z.number(),
  priceTemplateId: z.string().optional(),
});

export type SchemaShowtimeInputType = z.infer<typeof schemaShowtimeInput>;

export const createShowtime = withAuthApi<
  unknown,
  SchemaShowtimeInputType,
  ResponseType<unknown>
>(async ({ db, body, userAuth }) => {
  const data = schemaShowtimeInput.parse(body);

  const showtimeService = new ShowtimeService(db, userAuth.admin!);

  const res = await showtimeService.createShowtime(data);

  return NextResponse.json(
    { success: res, result: res, error: "" },
    { status: 200 }
  );
});
