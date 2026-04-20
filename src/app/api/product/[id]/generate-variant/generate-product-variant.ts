import { ProductOption, ProductVariant } from "../option/types";

export function generateVariant(
  productOptions: ProductOption[]
): ProductVariant[] {
  const variants: ProductVariant[] = [];
  const optionValues = productOptions.map((option) => ({
    optionName: option.name,
    values: option.values,
  }));

  const generate = (index: number, variant: ProductVariant) => {
    if (index === optionValues.length) {
      variants.push(variant);
      return;
    }
    for (const value of optionValues[index].values) {
      generate(index + 1, {
        ...variant,
        name: variant.name + (variant.name ? " / " : "") + value.value,
        optionValues: [...variant.optionValues, value],
      });
    }
  };
  generate(0, {
    name: "",
    optionValues: [],
    available: true,
    isDefault: false,
    id: "",
    sku: "",
    purchasedCost: 0,
    visible: true,
  });
  return variants;
}
