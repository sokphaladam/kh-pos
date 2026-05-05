import { DiscountProps } from "@/components/gui/pos/types/post-types";

type stackType = { discountAmount: number } & DiscountProps;
export function applyStackDiscount(price: number, discounts: DiscountProps[]) {
  const stackDiscount: stackType[] = [];
  let finalPrice = price;

  if (discounts.length === 0) return { stackDiscount, finalPrice };

  discounts.forEach((discount) => {
    if (discount.discountType === "PERCENTAGE") {
      const discountPrice = parseFloat(
        (finalPrice * (discount.value / 100)).toFixed(2),
      );
      stackDiscount.push({
        ...discount,
        discountAmount: discountPrice,
      });
      finalPrice -= discountPrice;
    } else {
      stackDiscount.push({
        ...discount,
        discountAmount: discount.value,
      });
      finalPrice -= discount.value;
    }
  });

  return { stackDiscount, finalPrice };
}
