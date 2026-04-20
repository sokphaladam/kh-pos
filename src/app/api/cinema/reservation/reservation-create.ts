import { CinemaReservationService } from "@/classes/cinema/reservation";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const schemaCinemaReservationInput = z.array(
  z.object({
    showtimeId: z.string().trim().min(1, { message: "Required" }),
    seatId: z.string().trim().min(1, { message: "Required" }),
    orderDetailId: z.string().trim().min(1, { message: "Required" }),
  })
);

export type schemaCinemaReservationInput = z.infer<
  typeof schemaCinemaReservationInput
>;

export const createReservation = withAuthApi<
  unknown,
  schemaCinemaReservationInput,
  ResponseType<unknown>
>(async ({ db, userAuth, body }) => {
  const input = schemaCinemaReservationInput.parse(body);
  const cinemaReservationService = new CinemaReservationService(
    db,
    userAuth.admin!
  );

  await cinemaReservationService.createReservation(
    input.map((x) => {
      return {
        showtimeId: x.showtimeId,
        seatId: x.seatId,
        orderDetailId: x.orderDetailId,
      };
    })
  );

  return NextResponse.json(
    {
      success: true,
      result: true,
      error: "",
    },
    { status: 200 }
  );
});
