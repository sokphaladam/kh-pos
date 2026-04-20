import {
  CompositeVariant,
  CompositionDraft,
} from "@/classes/composite-variant";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const compositionDraftSchema = z.object({
  variantId: z.string(),
  qty: z.coerce.number().min(1, "Quantity must be at least 1"),
});

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<CompositionDraft[]>,
  { variantId: string; qty: number }
>(async ({ db, userAuth, searchParams }) => {
  const input = compositionDraftSchema.parse(searchParams);

  const compositeVariantService = new CompositeVariant(db, userAuth.admin!);
  const drafts = await compositeVariantService.getCompositionDraft(
    input.variantId,
    Number(input.qty)
  );
  return NextResponse.json(
    {
      success: true,
      result: drafts,
    },
    {
      status: 200,
    }
  );
});
