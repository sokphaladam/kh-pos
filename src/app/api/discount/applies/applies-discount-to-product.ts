/* eslint-disable @typescript-eslint/no-explicit-any */
import { table_product_discount } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const AppliesDiscountInputSchema = z.array(
  z.object({
    productId: z.string().optional(),
    discountId: z.string(),
    action: z.enum(["delete", "insert"]),
    isAppliedAll: z.boolean().optional(),
    categoryId: z.string().optional(),
  })
);

export type AppliesDiscountInput = z.infer<typeof AppliesDiscountInputSchema>;

export const appliesDiscountToProduct = withAuthApi<
  unknown,
  { data: AppliesDiscountInput },
  ResponseType<AppliesDiscountInput>
>(async ({ db, userAuth, body, logger }) => {
  try {
    const schema = AppliesDiscountInputSchema.parse(body?.data);
    const user = userAuth.admin!;

    await db.transaction(async (trx) => {
      const dataShouldInsert =
        schema.filter((item) => item.action === "insert") || [];
      const dataShouldDelete =
        schema.filter((item) => item.action === "delete") || [];

      const queryDelete = db
        .table<table_product_discount>("product_discount")
        .where({ discount_id: schema[0].discountId });

      // is applied all
      if (!!schema[0].isAppliedAll) {
        await queryDelete.clone().delete().transacting(trx);

        await db
          .table<table_product_discount>("product_discount")
          .insert({
            discount_id: schema[0].discountId,
            created_at: Formatter.getNowDateTime(),
            created_by: userAuth.admin!.id,
            is_applied_all: schema[0].action === "insert" ? 1 : 0,
          })
          .transacting(trx);

        return NextResponse.json(
          { success: true, result: schema },
          { status: 200 }
        );
      }

      // is category id
      if (!!schema[0].categoryId) {
        await queryDelete
          .clone()
          .whereNull("category_id")
          .delete()
          .transacting(trx);
        if (dataShouldInsert.length > 0) {
          await db
            .table<table_product_discount>("product_discount")
            .insert(
              dataShouldInsert.map((item) => {
                return {
                  discount_id: item.discountId,
                  created_at: Formatter.getNowDateTime(),
                  created_by: user.id,
                  category_id: item.categoryId,
                };
              })
            )
            .transacting(trx);

          for (const item of dataShouldInsert) {
            logger.serverLog("appliesDiscountToProduct:POST", {
              action: "create",
              table_name: "product_discount",
              key: item.discountId,
              content: item as any,
            });
          }
        }

        if (dataShouldDelete.length > 0) {
          for (const item of dataShouldDelete) {
            await db
              .table<table_product_discount>("product_discount")
              .where({
                category_id: item.categoryId,
                discount_id: item.discountId,
              })
              .delete()
              .transacting(trx);
            logger.serverLog("appliesDiscountToProduct:POST", {
              action: "delete",
              table_name: "product_discount",
              key: item.discountId,
              content: item as any,
            });
          }
        }
        return NextResponse.json(
          { success: true, result: schema },
          { status: 200 }
        );
      }

      await queryDelete
        .clone()
        .whereRaw("(category_id IS NOT NULL OR is_applied_all = 1)")
        .delete()
        .transacting(trx);

      // is specific product
      if (dataShouldInsert.length > 0) {
        await db
          .table<table_product_discount>("product_discount")
          .insert(
            dataShouldInsert.map((item) => {
              return {
                product_id: item.productId,
                discount_id: item.discountId,
                created_at: Formatter.getNowDateTime(),
                created_by: user.id,
              };
            })
          )
          .transacting(trx);
        for (const item of dataShouldInsert) {
          logger.serverLog("appliesDiscountToProduct:POST", {
            action: "create",
            table_name: "product_discount",
            key: item.discountId,
            content: item as any,
          });
        }
      }

      if (dataShouldDelete.length > 0) {
        for (const item of dataShouldDelete) {
          await db
            .table<table_product_discount>("product_discount")
            .where({ product_id: item.productId, discount_id: item.discountId })
            .delete()
            .transacting(trx);
          logger.serverLog("appliesDiscountToProduct:POST", {
            action: "delete",
            table_name: "product_discount",
            key: item.discountId,
            content: item as any,
          });
        }
      }
    });

    return NextResponse.json(
      { success: true, result: schema },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { success: false, result: error as any },
      { status: 500 }
    );
  }
});
