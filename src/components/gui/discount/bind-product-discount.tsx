import {
  useCreateAppliesDiscountProduct,
  useQueryAppliesDiscountProduct,
} from "@/app/hooks/use-query-discount";
import { ProductV2 } from "@/classes/product-v2";
import { createSheet } from "@/components/create-sheet";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Category } from "@/lib/server-functions/category/create-category";
import { DiscountType } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";
import { ListCategoryDiscount } from "./list-categoryt-discount";
import { DiscountProductList } from "./list-product";

export const BindProductDiscount = createSheet<
  { discount: DiscountType },
  boolean
>(
  ({ discount }) => {
    const [activeTab, setActiveTab] = useState("product");
    const [products, setProducts] = useState<ProductV2[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<Category[]>(
      []
    );
    const { trigger: triggerApplies, isMutating: isMutatingApplies } =
      useCreateAppliesDiscountProduct();
    const queryApplies = useQueryAppliesDiscountProduct({ id: discount.id });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (queryApplies.data?.result && !queryApplies.isLoading && !!loading) {
        const isAppliedAll = (queryApplies.data?.result || []).some(
          (f) => !!f.isAppliedAll
        );
        const mapProducts = (queryApplies.data?.result || [])
          .filter((f) => !!f.productId)
          .map((x) => ({
            ...x.product,
            productVariants: x.productVariants || [],
            productImages: x.product.images || [],
          }));
        const mapCategories = (queryApplies.data?.result || [])
          .filter((f) => !!f.category)
          .map((x) => x.category);
        setProducts(mapProducts);
        setSelectedCategories(mapCategories);
        if (!!isAppliedAll) {
          setActiveTab("all");
        } else {
          setActiveTab(mapProducts.length > 0 ? "product" : "category");
        }
        setLoading(false);
      }
    }, [queryApplies, loading]);

    const handleChangeTab = useCallback(
      (v: string) => {
        // If the current tab active is 'all' and the user switches to another tab,
        // If the current tab active is not 'all' and the user switches to 'all',
        const allow =
          (activeTab === "all" && v !== "all") ||
          (activeTab !== "all" && v === "all");

        if (!!allow) {
          const input = {
            discountId: discount.id,
            productId: undefined,
            isAppliedAll: true,
          };
          triggerApplies({
            data: [
              {
                ...input,
                action: v === "all" ? "insert" : "delete",
              },
            ],
          }).then(() => {
            setProducts([]);
            setSelectedCategories([]);
            queryApplies.mutate();
          });
        }

        setActiveTab(v);
      },
      [activeTab, discount, triggerApplies, queryApplies]
    );

    const handleAddProduct = useCallback(
      (product: ProductV2) => {
        triggerApplies({
          data: [
            {
              discountId: discount.id,
              productId: product.id,
              action: "insert",
            },
          ],
        }).then(() => {
          setProducts([...products, product]);
          setSelectedCategories([]);
          queryApplies.mutate();
        });
      },
      [triggerApplies, discount, products, queryApplies]
    );

    const handleRemoveProduct = useCallback(
      (v: string) => {
        triggerApplies({
          data: [
            {
              discountId: discount.id,
              productId: v,
              action: "delete",
            },
          ],
        }).then(() => {
          setProducts(products.filter((p) => p.id !== v));
          setSelectedCategories([]);
          queryApplies.mutate();
        });
      },
      [triggerApplies, discount, products, queryApplies]
    );

    const handleAddCategory = useCallback(
      (category: Category) => {
        triggerApplies({
          data: [
            {
              discountId: discount.id,
              categoryId: category.id,
              action: "insert",
            },
          ],
        }).then(() => {
          setProducts([]);
          setSelectedCategories([...selectedCategories, category]);
          queryApplies.mutate();
        });
      },
      [triggerApplies, discount, selectedCategories, queryApplies]
    );

    const handleRemoveCategory = useCallback(
      (v: string) => {
        triggerApplies({
          data: [
            {
              discountId: discount.id,
              categoryId: v,
              action: "delete",
            },
          ],
        }).then(() => {
          setProducts([]);
          setSelectedCategories(selectedCategories.filter((c) => c.id !== v));
          queryApplies.mutate();
        });
      },
      [triggerApplies, discount, selectedCategories, queryApplies]
    );

    return (
      <>
        <SheetHeader>
          <SheetTitle>Applies Discount</SheetTitle>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={handleChangeTab}
          className="my-4"
        >
          <TabsList>
            <TabsTrigger value="all">All Products</TabsTrigger>
            <TabsTrigger value="product">Product</TabsTrigger>
            <TabsTrigger value="category">Category</TabsTrigger>
          </TabsList>

          <TabsContent value="product" className="mt-4">
            {!queryApplies.isLoading && (
              <DiscountProductList
                discountId={discount.id}
                productApplied={products}
                loading={isMutatingApplies}
                onAddProduct={handleAddProduct}
                onRemoveProduct={handleRemoveProduct}
              />
            )}
          </TabsContent>

          <TabsContent value="category" className="mt-4">
            <ListCategoryDiscount
              discountId={discount.id}
              category={selectedCategories}
              onAddCategory={handleAddCategory}
              onRemoveCategory={handleRemoveCategory}
            />
          </TabsContent>
        </Tabs>
      </>
    );
  },
  { defaultValue: true }
);
