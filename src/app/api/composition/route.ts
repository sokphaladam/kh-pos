import {
  ComposeVariantProps,
  CompositeVariant,
} from "@/classes/composite-variant";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { z } from "zod";
import { NextResponse } from "next/server";
import { inputStockinSchema } from "../inventory/stockin/type";

const composeVariantSchema = z.object({
  composedVariant: inputStockinSchema,
  componentVariants: z.array(
    z.object({
      id: z.string(),
      stockSlots: z
        .array(
          z.object({
            slotId: z.string(),
            qty: z.number(),
          })
        )
        .default([]),
    })
  ),
});

export type ComposeVariantInput = z.infer<typeof composeVariantSchema>;

export const POST = withAuthApi<
  unknown,
  ComposeVariantProps,
  ResponseType<boolean>
>(async ({ db, userAuth, body }) => {
  const input = composeVariantSchema.parse(body);
  const compositeVariantService = new CompositeVariant(db, userAuth.admin!);
  const result = await compositeVariantService.composeVariant({
    composedVariant: input.composedVariant,
    componentVariants: input.componentVariants,
  });
  return NextResponse.json(
    {
      success: true,
      result,
    },
    { status: 200 }
  );
});
