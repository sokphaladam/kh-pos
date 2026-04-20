import { ShowtimeService } from "@/classes/cinema/showtime";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const schemaUpdateShowtimeInput = z.object({
  showtimeId: z.string(),
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

export type SchemaUpdateShowtimeInputType = z.infer<
  typeof schemaUpdateShowtimeInput
>;

export const updateShowtime = withAuthApi<
  unknown,
  SchemaUpdateShowtimeInputType,
  ResponseType<unknown>
>(async ({ db, body, userAuth }) => {
  const { showtimeId, ...rest } = schemaUpdateShowtimeInput.parse(body);

  const showtimeService = new ShowtimeService(db, userAuth.admin!);

  const res = await showtimeService.updateShowtime(showtimeId, rest);

  return NextResponse.json(
    { success: res, result: res, error: "" },
    { status: 200 }
  );
});
