import type { ProductSearchResult } from "@/app/api/product/search-product/types";
import type { PromotionSetItem } from "@/lib/promotion-set";

/** One promotion-set slot with the menu products that can fill it. */
export interface PromotionSetChoiceSlot {
  item: PromotionSetItem;
  /** Same visibility / pricing rules as the POS menu search. */
  candidates: ProductSearchResult[];
}
