"use client";

import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { useLazyPublicProductList } from "@/app/hooks/use-query-product";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/components/use-debounce";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProductImageDisplay } from "../product/menu/product-image-display";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryCategoryMenu } from "@/app/hooks/use-query-category";
import { TicketReservationLayout } from "../cinema/ticket-reservation/ticket-reservation-layout";
import { usePOSProvider } from "./hooks/use-pos-provider";

interface CartItem {
  variantId?: string;
  qty?: number;
}

interface ProductGridProps {
  warehouse?: string;
  onSelectProduct: (
    product: ProductSearchResult,
    isMovie?: boolean,
    data?: {
      showtimeId: string;
      seatId: string;
      price: number;
      code: string;
    }[],
  ) => void;
  onClose?: () => void;
  disabled?: boolean;
  cartItems?: CartItem[];
}

export function ProductGrid({
  warehouse,
  onSelectProduct,
  onClose,
  disabled,
  cartItems = [],
}: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 500);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [loadingCategory, setLoadingCategory] = useState(true);
  const PAGE_SIZE = 36;
  const [page, setPage] = useState(0);
  const [allProducts, setAllProducts] = useState<ProductSearchResult[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectProduct, setSelectProduct] =
    useState<ProductSearchResult | null>(null);
  const { formatForDisplay } = useCurrencyFormat();
  const { orders } = usePOSProvider();

  // Create a map of cart items for quick lookup
  const cartItemsMap = useMemo(() => {
    const map = new Map<string, number>();
    cartItems.forEach((item) => {
      if (item.variantId) {
        if (map.has(item.variantId)) {
          const existingQty = map.get(item.variantId) || 0;
          map.set(item.variantId, existingQty + (item.qty || 0));
        } else {
          map.set(item.variantId, item.qty || 0);
        }
      }
    });
    return map;
  }, [cartItems]);

  const filter = useMemo(() => {
    return {
      search: debouncedSearchQuery.toLowerCase().trim(),
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      replenishment: false,
      compositeOnly: false,
      categoryKeys: selectedCategory !== "All" ? selectedCategory : "",
      warehouse: warehouse || "",
      type: "pos" as "all" | "pos",
    };
  }, [debouncedSearchQuery, page, selectedCategory, warehouse]);

  const [triggerSearch, { data, isLoading }] = useLazyPublicProductList(filter);
  const [
    triggerCategory,
    { data: categoryData, isLoading: isLoadingCategories },
  ] = useQueryCategoryMenu(warehouse || "", false);

  // Sort categories with movies-category-id at the top
  const sortedCategories = useMemo(() => {
    if (!categoryData?.result?.data) return [];

    const categories = [...categoryData.result.data];
    return categories
      .filter((f) => (f.forSaleCount || 0) > 0)
      .sort((a, b) => {
        if (a.id === "movies-category-id") return -1;
        if (b.id === "movies-category-id") return 1;
        return 0;
      });
  }, [categoryData?.result?.data]);

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

  const handleProductClick = useCallback(
    async (item: ProductSearchResult) => {
      if (disabled) return;
      if (!!item.variants?.at(0)?.movie) {
        setSelectProduct(item);
      } else {
        onSelectProduct(item);
      }
    },
    [disabled, onSelectProduct],
  );

  const onConfirmReservation = useCallback(
    async (
      data: {
        showtimeId: string;
        seatId: string;
        price: number;
        code: string;
      }[],
    ) => {
      if (selectProduct) {
        onSelectProduct?.(selectProduct, true, data);
      }
    },
    [selectProduct, onSelectProduct],
  );

  return (
    <div className="w-full h-full flex flex-col">
      {/* Fixed Search Header with Close Button */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 p-3 shadow-sm">
        <div className="relative flex items-center gap-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-primary focus:ring-primary rounded-lg"
            disabled={disabled}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="flex-shrink-0 h-10 w-10"
            disabled={disabled}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex",
          selectProduct ? "overflow-auto" : "overflow-hidden",
        )}
      >
        {/* Desktop Sidebar Categories - Hidden on mobile */}
        <div className="hidden md:block w-48 lg:w-56 border-r border-gray-200 bg-gray-50">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-1">
              <Button
                key="all"
                variant={selectedCategory === "All" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setSelectedCategory("All");
                  setSelectProduct(null);
                }}
                disabled={disabled}
                className={cn(
                  "w-full justify-start text-sm font-medium",
                  selectedCategory === "All"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-gray-100",
                )}
              >
                All Categories
              </Button>
              {loadingCategory || isLoadingCategories
                ? Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="h-9 bg-gray-200 animate-pulse rounded-md"
                    />
                  ))
                : sortedCategories.map((category) => {
                    const isMovieCategory =
                      category.id === "movies-category-id";
                    return (
                      <Button
                        key={category.id}
                        variant={
                          selectedCategory === category.id ? "default" : "ghost"
                        }
                        size="sm"
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setSelectProduct(null);
                        }}
                        disabled={disabled}
                        className={cn(
                          "w-full justify-start text-sm font-medium relative",
                          selectedCategory === category.id
                            ? "bg-primary text-primary-foreground"
                            : isMovieCategory
                              ? "hover:bg-orange-50 border border-orange-200 bg-orange-50/50 text-orange-800 font-semibold"
                              : "hover:bg-gray-100",
                        )}
                      >
                        {category.title}
                        {isMovieCategory && " 🎬"}
                      </Button>
                    );
                  })}
            </div>
          </ScrollArea>
        </div>

        {/* Main Products Area */}
        {selectProduct ? (
          <div className="px-4 flex-1 flex flex-col overflow-hidden">
            <TicketReservationLayout
              movieId={selectProduct.variants?.at(0)?.id || ""}
              onConfirm={onConfirmReservation}
              currentSelected={
                orders?.carts.find(
                  (f) => f.variantId === selectProduct.variants?.at(0)?.id,
                )?.reservation || []
              }
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile Category Tabs - Visible only on mobile */}
            <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-3 py-2">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 min-w-fit">
                  <Button
                    key="all"
                    variant={selectedCategory === "All" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory("All")}
                    disabled={disabled}
                    className={cn(
                      "whitespace-nowrap flex-shrink-0 text-xs",
                      selectedCategory === "All"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-gray-50",
                    )}
                  >
                    All
                  </Button>
                  {sortedCategories.map((category) => {
                    const isMovieCategory =
                      category.id === "movies-category-id";
                    return (
                      <Button
                        key={category.id}
                        variant={
                          selectedCategory === category.id
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        disabled={disabled}
                        className={cn(
                          "whitespace-nowrap flex-shrink-0 text-xs relative",
                          selectedCategory === category.id
                            ? "bg-primary text-primary-foreground"
                            : isMovieCategory
                              ? "hover:bg-orange-50 border-orange-300 bg-orange-50/50 text-orange-800 font-semibold"
                              : "hover:bg-gray-50",
                        )}
                      >
                        {category.title}
                        {isMovieCategory && " 🎬"}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <ScrollArea className="flex-1">
              <div className="p-2 sm:p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 pb-4">
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
                  : displayProducts.map((item: ProductSearchResult, index) => {
                      const variant = (
                        item.variants as ProductVariantType[]
                      )?.find((f) => f.id === item.variantId);
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

                      const cartQty =
                        cartItemsMap.get(item.variantId || "") || 0;
                      const inCart = cartQty > 0;

                      return (
                        <Card
                          key={`${item.variantId}-${index}`}
                          className={cn(
                            "overflow-hidden border shadow-sm transition-all duration-200 bg-white rounded-lg h-full flex flex-col relative group",
                            disabled
                              ? "cursor-not-allowed opacity-60"
                              : "cursor-pointer hover:shadow-lg hover:border-primary/50 active:scale-95",
                            inCart && "border-primary ring-2 ring-primary/20",
                          )}
                          onClick={() => handleProductClick(item)}
                        >
                          {inCart && (
                            <div className="absolute top-1 right-1 z-10 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md">
                              {cartQty}
                            </div>
                          )}
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
                <div className="flex justify-center p-4">
                  <Button
                    onClick={loadMoreProducts}
                    disabled={isLoadingMore || isLoading || disabled}
                    variant="outline"
                    size="sm"
                    className="px-6 py-2"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Load More
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Empty State */}
              {!loading && !isLoading && displayProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Search className="h-12 w-12 text-gray-400 mb-3" />
                  <h3 className="text-base font-medium text-gray-900 mb-1">
                    No products found
                  </h3>
                  <p className="text-sm text-gray-500 text-center">
                    {searchQuery
                      ? `No products match "${searchQuery}"`
                      : "No products available"}
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
