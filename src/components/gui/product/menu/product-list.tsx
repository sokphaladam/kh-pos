"use client";

import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { useQueryCategoryMenu } from "@/app/hooks/use-query-category";
import { useLazyPublicProductList } from "@/app/hooks/use-query-product";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/components/use-debounce";
import { useWindowSize } from "@/components/use-window-size";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProductImageDisplay } from "./product-image-display";
import { productDetailsSheet } from "./product-details-sheet";
import { useCart } from "./context/cart-provider";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

export function ProductList() {
  const { isRequest } = useCart();
  const params = useSearchParams();
  const { height } = useWindowSize();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 500);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [loadingCategory, setLoadingCategory] = useState(true);
  const PAGE_SIZE = 24;
  const [page, setPage] = useState(0);
  const [allProducts, setAllProducts] = useState<ProductSearchResult[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { formatForDisplay } = useCurrencyFormat();

  const filter = useMemo(() => {
    return {
      search: debouncedSearchQuery.toLowerCase().trim(),
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      replenishment: false,
      compositeOnly: false,
      categoryKeys: selectedCategory !== "All" ? selectedCategory : "",
      warehouse: params.get("warehouse") || "",
      type: "pos" as "all" | "pos",
    };
  }, [debouncedSearchQuery, page, selectedCategory, params]);

  const [triggerSearch, { data, isLoading }] = useLazyPublicProductList(filter);
  const [
    triggerCategory,
    { data: categoryData, isLoading: isLoadingCategories },
  ] = useQueryCategoryMenu(params.get("warehouse") || "");

  // Reset products when search changes
  useEffect(() => {
    setPage(0);
    setAllProducts([]);
    setHasMore(true);
  }, [debouncedSearchQuery, selectedCategory]);

  // Load initial products and accumulate data
  useEffect(() => {
    if (data?.result) {
      if (page === 0) {
        setAllProducts(data.result);
      } else {
        setAllProducts((prev) => {
          const newProducts = data.result.filter(
            (newProduct) =>
              !prev.some(
                (existingProduct) =>
                  existingProduct.variantId === newProduct.variantId,
              ),
          );
          return [...prev, ...newProducts];
        });
      }
      setHasMore(data.result.length === PAGE_SIZE);
      setIsLoadingMore(false);
      setLoading(false);
    }
  }, [data, page]);

  // Trigger initial search when search changes
  useEffect(() => {
    setLoading(true);
    triggerSearch().finally(() => setLoading(false));
  }, [debouncedSearchQuery, triggerSearch]);

  // Trigger search when page changes
  useEffect(() => {
    if (page > 0) {
      setLoading(true);
      triggerSearch().finally(() => setLoading(false));
    }
  }, [page, triggerSearch]);

  useEffect(() => {
    setLoadingCategory(true);
    triggerCategory().finally(() => setLoadingCategory(false));
  }, [triggerCategory]);

  // Load more products
  const loadMoreProducts = useCallback(async () => {
    if (isLoadingMore || !hasMore || isLoading || loading) return;

    setIsLoadingMore(true);
    setLoading(true);
    setPage((prevPage) => prevPage + 1);
  }, [isLoadingMore, hasMore, isLoading, loading]);

  const displayProducts =
    allProducts.length > 0 ? allProducts : data?.result || [];

  const handleProductClick = useCallback(async (item: ProductSearchResult) => {
    try {
      await productDetailsSheet.show({ product: item });
    } catch (error) {
      // Handle error or user cancellation
      console.log("Product details sheet cancelled", error);
    }
  }, []);

  return (
    <div className="w-full flex flex-col gap-4 relative">
      <div
        className="w-full overflow-x-auto"
        style={{ minHeight: height ? height - 120 : "80vh" }}
      >
        {/* Search Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-3 sm:p-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-primary focus:ring-primary rounded-lg text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="sticky top-[68px] sm:top-[76px] z-10 bg-white/95 border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3">
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-1.5 sm:gap-2 min-w-fit scroll-smooth snap-x snap-mandatory pb-1">
                <Button
                  key="all"
                  variant={selectedCategory === "All" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("All")}
                  className={cn(
                    "whitespace-nowrap transition-all duration-200 snap-start flex-shrink-0 text-base px-2 sm:px-3 py-1 sm:py-2",
                    selectedCategory === "All"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-gray-50 border-gray-300",
                  )}
                >
                  All Categories
                </Button>
                {loadingCategory || isLoadingCategories
                  ? Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={`skeleton-${index}`}
                        className="h-7 w-16 sm:h-8 sm:w-20 bg-gray-200 animate-pulse rounded-md flex-shrink-0"
                      />
                    ))
                  : categoryData?.result?.data?.map((category) => (
                      <Button
                        key={category.id}
                        variant={
                          selectedCategory === category.id
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        className={cn(
                          "whitespace-nowrap transition-all duration-200 snap-start flex-shrink-0 text-base px-2 sm:px-3 py-1 sm:py-2",
                          selectedCategory === category.id
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "hover:bg-gray-50 border-gray-300",
                        )}
                      >
                        {category.title}
                      </Button>
                    ))}
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="p-2 sm:p-4 pt-3 sm:pt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 pb-20 sm:pb-24">
          {(isLoading || loading) &&
          (page === 0 || displayProducts.length === 0)
            ? Array.from({ length: 12 }).map((_, index) => (
                <Card
                  key={`skeleton-${index}`}
                  className="overflow-hidden border-0 shadow-sm bg-white rounded-xl h-full"
                >
                  <div className="aspect-[5/5] w-full bg-muted animate-pulse rounded-t-xl" />
                  <div className="p-1.5 sm:p-2 flex justify-center">
                    <div className="h-3 sm:h-4 bg-muted animate-pulse rounded w-3/4" />
                  </div>
                </Card>
              ))
            : displayProducts.map((item, index) => {
                const variant = (item.variants as ProductVariantType[])?.find(
                  (f) => f.id === item.variantId,
                );
                const imageByVariant = item.images?.find(
                  (f) => f.productVariantId === item.variantId,
                );
                const images = imageByVariant
                  ? [imageByVariant]
                  : [
                      {
                        productVariantId: item.variantId,
                        url: "",
                      },
                    ];

                const stock = variant?.stock || item.stock || 0;
                const isInStock = stock > 0;
                const price = formatForDisplay(
                  variant?.price || item.price || 0,
                );

                return (
                  <Card
                    key={`${item.variantId}-${index}`}
                    className={cn(
                      "overflow-hidden border border-gray-200 shadow-sm transition-all duration-300 bg-white rounded-xl h-full flex flex-col relative",
                      loading || isRequest
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer active:scale-95",
                    )}
                    onClick={() =>
                      !loading && !isRequest && handleProductClick(item)
                    }
                  >
                    <ProductImageDisplay
                      images={images}
                      title={item.productTitle || ""}
                      stockStatus={{
                        stock,
                        isInStock,
                      }}
                      price={price}
                    />
                  </Card>
                );
              })}
        </div>

        {/* Load More Button */}
        {hasMore && displayProducts.length > 0 && (
          <div className="flex justify-center p-6">
            <Button
              onClick={loadMoreProducts}
              disabled={isLoadingMore || isLoading}
              variant="outline"
              size="lg"
              className="px-8 py-3 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all duration-200"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading more...
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Load More Products
                </>
              )}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !isLoading && displayProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-500 text-center max-w-md">
              {searchQuery
                ? `No products match "${searchQuery}". Try adjusting your search terms.`
                : "No products are available at the moment."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
