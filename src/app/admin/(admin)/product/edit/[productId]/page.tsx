"use client";
import { ProductInput } from "@/app/api/product-v2/create-product";
import { useProduct } from "@/app/hooks/use-query-product";
import { LayoutProductForm } from "@/components/gui/product/layout-product-form";
import { LayoutLoading } from "@/components/layout-loading";
import { useParams } from "next/navigation";
import { useAuthentication } from "../../../../../../../contexts/authentication-context";
import { useMemo } from "react";

export default function ProductPage() {
  const { currentWarehouse } = useAuthentication();
  const params = useParams<{ productId: string }>();
  const { data, isLoading, mutate, isValidating } = useProduct(
    params.productId || "",
  );

  const product = useMemo(() => {
    if (!isLoading && !isValidating && data?.result) {
      return {
        productId: data?.result.basic.id,
        productBasic: {
          title: data?.result.basic.title || "",
          description: data?.result.basic.description || "",
          height: data?.result.basic.height || 0,
          isComposite: data?.result.basic.isComposite || false,
          isForSale: data?.result.basic.isForSale || false,
          length: data?.result.basic.length || 0,
          trackStock: data?.result.basic.trackStock || false,
          useProduction: data?.result.basic.useProduction || false,
          weight: data?.result.basic.weight || 0,
          width: data?.result.basic.width || 0,
          supplierId: data?.result.basic.supplierId || "",
        },
        productCategories: data.result.categories || [],
        productImages: data.result.images || [],
        productVariants:
          data.result.variants.map((x) => ({
            ...x,
            purchasedCost: x.purchasePrice,
            compositeVariants: x.compositeVariants?.map((c) => {
              const image =
                c.componentVariant.basicProduct?.images.find(
                  (img) => img.productVariantId === c.componentVariant.id,
                )?.url || undefined;
              const title = `${c.componentVariant.basicProduct?.title} (${c.componentVariant.name})`;
              return {
                id: c.id,
                variantId: c.componentVariant.id,
                image,
                title,
                quantity: c.qty,
              };
            }),
          })) || [],
        productOption:
          data.result.options.map((x) => {
            return {
              ...x,
              values: x.values.map((v) => ({ ...v, edit: true })),
            };
          }) || [],
        productConversions:
          data.result.conversions?.map((x) => ({
            fromVariantId: x.fromVariant?.id || "",
            toVariantId: x.toVariant?.id || "",
            productId: data?.result?.basic.id || "",
            conversionRate: x.conversionRate,
          })) || [],
        productMovies: data.result.movies || undefined,
      };
    }

    return null;
  }, [data, isLoading, isValidating]);

  if (!currentWarehouse?.isMain) {
    return <></>;
  }

  if (isLoading || isValidating) {
    return <LayoutLoading />;
  }

  return (
    <div className="w-full">
      <LayoutProductForm
        defaultValue={product ? (product as unknown as ProductInput) : null}
        mutate={mutate}
      />
    </div>
  );
}
