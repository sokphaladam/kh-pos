import {
  ReorderItem,
  reorderParamsSchema,
  ReorderService,
} from "@/classes/reorder";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export type ReorderInput = z.input<typeof reorderParamsSchema>;

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<ReorderItem[]>,
  ReorderInput
>(async ({ db, userAuth, searchParams }) => {
  const params = reorderParamsSchema.parse(searchParams ?? {});
  const result = await new ReorderService(db, userAuth.admin!).suggestions(
    params,
  );
  return NextResponse.json({ success: true, result }, { status: 200 });
});
