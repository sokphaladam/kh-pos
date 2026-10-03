import { ProductService } from "@/classes/product-service";
import { PromotionSetService } from "@/classes/promotion-set";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { PromotionSetChoiceSlot } from "../../types";

/** Cap for "any item in a category" slots; the picker is not a full menu. */
const MAX_CANDIDATES = 60;

/**
 * For each slot of a promotion set, the sellable menu variants that can fill
 * it. The restaurant POS and the customer table menu use this to add a whole
 * set to the cart in one tap (asking only when a slot has more than one
 * option). Customers get the menu of the branch they are seated at.
 */
export const GET = withAuthApi<
  { id: string },
  unknown,
  ResponseType<PromotionSetChoiceSlot[]>
>(async ({ db, params, userAuth }) => {
  const promotion = await new PromotionSetService(db).get(params?.id || "");
  if (!promotion) {
    return NextResponse.json(
      { success: false, error: "notFound" },
      { status: 404 },
    );
  }

  // Walk-in customers run as the branch's system admin while in its zone.
  if (!userAuth.admin) {
    return NextResponse.json(
      { success: false, error: "unauthorized" },
      { status: 403 },
    );
  }
  const warehouse =
    userAuth.customer?.warehouseId || userAuth.admin.currentWarehouseId || "";
  const result = await db.transaction(async (trx) => {
    const products = new ProductService(trx, userAuth.admin);
    const slots: PromotionSetChoiceSlot[] = [];
    for (const item of promotion.items) {
      const candidates = await products.searchProduct({
        warehouse,
        type: "pos",
        limit: MAX_CANDIDATES,
        offset: 0,
        replenishment: false,
        includeProductNotForSale: false,
        compositeOnly: false,
        ...(item.matchType === "VARIANT"
          ? { variantIds: [item.matchId] }
          : item.matchType === "PRODUCT"
            ? { productId: item.matchId }
            : { categoryKeys: [item.matchId] }),
      });
      slots.push({ item, candidates });
    }
    return slots;
  });

  return NextResponse.json({ success: true, result });
}, ["ADMIN", "CUSTOMER"]);
