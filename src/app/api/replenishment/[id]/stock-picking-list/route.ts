import {
  FindProductInSlotResult,
  FindProductProps,
} from "@/classes/find-product-in-slot";
import { ReplenishmentService } from "@/classes/replenishment";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const inputSchema = z.object({
  id: z.string(),
});

export const GET = withAuthApi<
  { id: string },
  unknown,
  ResponseType<FindProductInSlotResult[]>,
  { items?: string; forReplenishment?: string; needConversion?: string }
>(async ({ db, userAuth, params, searchParams }) => {
  const parsedParams = inputSchema.parse(params);

  const replenishmentId = parsedParams.id;
  const items = searchParams?.items ? JSON.parse(searchParams.items) : null;
  const forReplenishment = searchParams?.forReplenishment
    ? Boolean(Number(searchParams.forReplenishment))
    : true;
  const needConversion = searchParams?.needConversion
    ? Boolean(Number(searchParams.needConversion))
    : false;
  const replenishmentService = new ReplenishmentService(db, userAuth.admin!);
  const replenishmentPickingList =
    await replenishmentService.getSuggestedReplenishmentPickingList(
      replenishmentId,
      items
        ? items.map((x: FindProductProps) => {
            return {
              variantId: x.variantId || "",
              toFindQty: x.toFindQty || 0,
            };
          })
        : [],
      forReplenishment,
      needConversion,
    );

  return NextResponse.json(
    { result: replenishmentPickingList, success: true },
    { status: 200 },
  );
});

const updatePickingListSchema = z.array(
  z.object({
    variantId: z.string(),
    slotId: z.string(),
    qty: z.number(),
    lotId: z.string(),
  }),
);

export type UpdatePickingList = z.infer<typeof updatePickingListSchema>;

export const PUT = withAuthApi<
  { id: string },
  UpdatePickingList,
  ResponseType<boolean>,
  unknown
>(async ({ db, userAuth, params, body }) => {
  const input = updatePickingListSchema.parse(body);
  const parsedParams = inputSchema.parse(params);
  const replenishmentId = parsedParams.id;
  const replenishmentService = new ReplenishmentService(db, userAuth.admin!);

  await replenishmentService.updateReplenishmentPickingList({
    replenishmentId,
    pickingList: input,
  });

  return NextResponse.json({ success: true, result: true }, { status: 200 });
});

export const POST = withAuthApi<
  { id: string },
  { lotId: string },
  ResponseType<boolean>
>(async ({ db, params, body }) => {
  const parsedParams = inputSchema.parse(params);
  const replenishmentId = parsedParams.id;

  await db
    .table("replenishment_picking_list")
    .where({ replenishment_id: replenishmentId, lot_id: body?.lotId || "" })
    .update({ status: "verified" });

  return NextResponse.json({ success: true, result: true }, { status: 200 });
});
