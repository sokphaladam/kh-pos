import {
  PromotionSetInput,
  PromotionSetResponse,
  PromotionSetService,
  promotionSetInputSchema,
} from "@/classes/promotion-set";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

function validationError(err: unknown) {
  const message =
    err instanceof ZodError
      ? err.issues[0]?.message || "Invalid promotion set"
      : err instanceof Error
        ? err.message
        : "Invalid promotion set";
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<{ data: PromotionSetResponse[]; total: number }>
>(async ({ db, req, userAuth }) => {
  const params = req.nextUrl.searchParams;
  const limit = parseInt(params.get("limit") || "30", 10);
  const offset = parseInt(params.get("offset") || "0", 10);

  const { items, total } = await new PromotionSetService(db).list(
    userAuth.admin!.currentWarehouseId || null,
    limit,
    offset,
  );

  return NextResponse.json({ success: true, result: { data: items, total } });
});

function saveHandler(isNew: boolean) {
  return withAuthApi<unknown, PromotionSetInput, ResponseType<PromotionSetInput>>(
    async ({ db, body, userAuth, logger }) => {
      let input: PromotionSetInput;
      try {
        input = promotionSetInputSchema.parse(body);
      } catch (err) {
        return validationError(err);
      }

      try {
        await new PromotionSetService(db).save(
          input,
          userAuth.admin!.id,
          isNew,
        );
      } catch (err) {
        return validationError(err);
      }

      logger.serverLog(`promotion_set:${isNew ? "POST" : "PUT"}`, {
        action: isNew ? "create" : "update",
        table_name: "promotion_set",
        key: input.id,
        content: input,
      });

      return NextResponse.json({ success: true, result: input });
    },
  );
}

export const POST = saveHandler(true);
export const PUT = saveHandler(false);

export const DELETE = withAuthApi<
  unknown,
  { id: string },
  ResponseType<{ message: string }>
>(async ({ db, body, userAuth, logger }) => {
  const id = body?.id || "";
  await new PromotionSetService(db).delete(id, userAuth.admin!.id);
  logger.serverLog("promotion_set:DELETE", {
    action: "delete",
    table_name: "promotion_set",
    key: id,
  });
  return NextResponse.json({
    success: true,
    result: { message: "Promotion set deleted" },
  });
});
