import { CinemaHallService } from "@/classes/cinema/hall";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const schemaUpdateHallInput = z.object({
  hallId: z.string(),
  name: z.string(),
  number: z.number(),
  rows: z.number(),
  columns: z.number(),
  features: z.string(),
  status: z.enum(["active", "maintenance", "inactive"]),
  seats: z.array(
    z.object({
      id: z.string(),
      row: z.number(),
      column: z.number(),
      type: z.enum(["standard", "vip", "couple", "wheelchair", "blocked"]),
      groupId: z.string().optional(),
    })
  ),
  parts: z.array(
    z.object({
      id: z.string(),
      range: z.string(),
      description: z.string().optional(),
    })
  ),
});

export type SchemaUpdateHallInputType = z.infer<typeof schemaUpdateHallInput>;

export const updateHall = withAuthApi<
  unknown,
  SchemaUpdateHallInputType,
  ResponseType<unknown>
>(async ({ body, userAuth, db }) => {
  const data = schemaUpdateHallInput.parse(body);

  const cinemaHallService = new CinemaHallService(db, userAuth.admin!);

  const res = await cinemaHallService.updateHall(data.hallId, {
    name: data.name,
    number: data.number,
    rows: data.rows,
    columns: data.columns,
    features: JSON.parse(data.features),
    seats: data.seats,
    parts: data.parts,
    status: data.status,
  });

  return NextResponse.json(
    { success: res, result: res, error: "" },
    { status: 200 }
  );
});
