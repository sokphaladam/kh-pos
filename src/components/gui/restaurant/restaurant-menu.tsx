"use client";
import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { useLazyQuerySearchProduct } from "@/app/hooks/use-query-product";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDebouncedValue } from "@/components/use-debounce";
import { useWindowSize } from "@/components/use-window-size";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import { cn } from "@/lib/utils";
import { useAuthentication } from "contexts/authentication-context";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { ChevronDown, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRestaurant } from "./contexts/restaurant-context";
import { useAdvancedFlyingAnimation } from "./hooks/use-advanced-flying-animation";
import { useRestaurantActions } from "./hooks/use-restaurant-actions";
import { RestaurantCategory } from "./restaurant-category";
import { RestaurantFilter } from "./restaurant-filter";
import { RestaurantSummary } from "./restaurant-summary";

// Product Image Slideshow Component
function ProductImageSlideshow({
  images,
  title,
  className = "",
  stockStatus,
  price,
}: {
  images: { url: string }[];
  title: string;
  className?: string;
  stockStatus?: {
    stock: number;
    isInStock: boolean;
  };
  price?: number;
}) {
  const { formatForDisplay } = useCurrencyFormat();
  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col h-full">
        {/* Image Container with Portrait Ratio */}
        <div
          className={cn(
            "bg-gray-100 flex items-center justify-center rounded-t-xl aspect-[5/5] w-full relative",
            className,
          )}
        >
          <span className="text-gray-400 text-xs sm:text-sm">No Image</span>

          {/* Price and Stock Status Overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            {price !== undefined && (
              <span className="text-xs sm:text-sm font-semibold text-white bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm">
                {formatForDisplay(price)}
              </span>
            )}
            {stockStatus && (
              <div
                className={cn(
                  "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border border-white shadow-sm",
                  stockStatus.isInStock ? "bg-green-500" : "bg-red-500",
                )}
              />
            )}
          </div>
        </div>
        {/* Product Info */}
        <div className="flex-1 p-1.5 sm:p-2 flex flex-col justify-center">
          <h3 className="text-xs sm:text-sm font-medium text-gray-800 leading-tight line-clamp-2 text-center">
            {title}
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Image Container with Portrait Ratio */}
      <div
        className={cn(
          "relative overflow-hidden group aspect-[5/5] w-full rounded-t-xl",
          className,
        )}
      >
        {images[0].url ? (
          <div className="w-full h-full p-1.5 sm:p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0].url}
              alt={title}
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs sm:text-sm">
            No Image
          </div>
        )}

        {/* Price and Stock Status Overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          {price !== undefined && (
            <span className="text-xs sm:text-sm font-semibold text-white bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm">
              {formatForDisplay(price)}
            </span>
          )}
          {stockStatus && (
            <div
              className={cn(
                "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border border-white shadow-sm",
                stockStatus.isInStock ? "bg-green-500" : "bg-red-500",
              )}
            />
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="flex-1 p-1.5 sm:p-2 flex flex-col justify-center">
        <h3 className="text-xs sm:text-sm font-medium text-gray-800 leading-tight line-clamp-2 text-center">
          {title}
        </h3>
      </div>
    </div>
  );
}

export function RestaurantMenu(props: WithLayoutPermissionProps) {
  const { currentWarehouse } = useAuthentication();
  const { height, width } = useWindowSize();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 500);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { state, loading, setLoading, isRequest } = useRestaurant();
  const { selectProduct } = useRestaurantActions();
  const params = useSearchParams();
  const id = params.get("table");
  const PAGE_SIZE = 30;
  const [page, setPage] = useState(0);
  const [allProducts, setAllProducts] = useState<ProductSearchResult[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Advanced animation system
  const isDesktop = width >= 768;
  const { flyingAnimation, triggerFlyingAnimation } =
    useAdvancedFlyingAnimation(isDesktop, width, height);

  const filter = useMemo(() => {
    return {
      search: debouncedSearchQuery.toLocaleLowerCase().trim(),
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      replenishment: false,
      compositeOnly: false,
      categoryKeys: selectedCategory !== "All" ? selectedCategory : "",
      warehouse: currentWarehouse?.id || "",
      type: "pos" as "all" | "pos",
    };
  }, [debouncedSearchQuery, page, selectedCategory, currentWarehouse]);

  const [triggerSearch, { data, isLoading }] =
    useLazyQuerySearchProduct(filter);

  const current = state.activeTables.find((f) => f.tables?.id === id);
  // Reset products when search or category changes
  useEffect(() => {
    setPage(0);
    setAllProducts([]);
    setHasMore(true);
  }, [debouncedSearchQuery, selectedCategory]);

  // Load initial products and accumulate data
  useEffect(() => {
    if (data?.result) {
      if (page === 0) {
        // First load - replace all products
        setAllProducts(data.result);
      } else {
        // Load more - append to existing products, but avoid duplicates
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
  }, [data, page, setLoading]);

  // Trigger initial search when search/category changes (only when page is reset to 0)
  useEffect(() => {
    setLoading(true);
    triggerSearch().finally(() => setLoading(false));
  }, [debouncedSearchQuery, selectedCategory, triggerSearch, setLoading]);

  // Trigger search when page changes (for load more only)
  useEffect(() => {
    if (page > 0) {
      setLoading(true);
      triggerSearch().finally(() => setLoading(false));
    }
  }, [page, triggerSearch, setLoading]);

  // Load more products
  const loadMoreProducts = useCallback(async () => {
    if (isLoadingMore || !hasMore || isLoading || loading) return;

    setIsLoadingMore(true);
    setLoading(true);
    setPage((prevPage) => prevPage + 1);
  }, [isLoadingMore, hasMore, isLoading, loading, setLoading]);

  // Products to display (either accumulated products or data from current request)
  const displayProducts =
    allProducts.length > 0 ? allProducts : data?.result || [];

  // Helper function to get quantity of a product in current order
  const getProductQuantityInOrder = useCallback(
    (variantId: string) => {
      if (!current?.orders?.items) return 0;
      const orderItem = current.orders.items.find(
        (item) => item.productVariant?.id === variantId,
      );
      return orderItem?.status?.reduce((a, b) => a + b.qty, 0) || 0;
    },
    [current?.orders?.items],
  );

  const handleClick = useCallback(
    async (
      variant: ProductVariantType | undefined,
      item: ProductSearchResult,
      event: React.MouseEvent<HTMLDivElement>,
    ) => {
      if (!props.allowCreate) return;
      if (!loading && !isRequest) {
        // Trigger flying animation
        const clickedElement = event.currentTarget;
        const imageByVariant = item.images?.find(
          (f) => f.productVariantId === item.variantId,
        );
        const productImage = imageByVariant?.url || "";
        const productTitle = item.productTitle || "";

        triggerFlyingAnimation(clickedElement, productImage, productTitle);
        const data = {
          ...variant,
          id: variant?.id || "",
          productId: variant?.productId || "",
          name: variant?.name || "",
          sku: variant?.sku || "",
          barcode: variant?.barcode || "",
          price: variant?.price ?? null,
          quantity: 1,
          modifiers: item?.modifiers ? item.modifiers : [],
          createdAt: "",
          idealStockQty: variant?.idealStockQty || 0,
          lowStockQty: variant?.lowStockQty || 0,
          optionValues: variant?.optionValues || [],
          purchasePrice: variant?.purchasePrice || 0,
          stock: variant?.stock || 0,
          updatedAt: "",
          visible: variant?.visible || true,
          movie: variant?.movie ?? null,
        };
        if (current?.tables) {
          selectProduct(data, current?.tables);
        }
      }
    },
    [current, selectProduct, loading, isRequest, triggerFlyingAnimation, props],
  );

  return (
    <div className="flex-1 -m-4 relative flex">
      {/* Desktop Layout with Sidebar */}
      <div className="hidden md:flex w-full">
        {/* Left Sidebar for Categories */}
        <RestaurantCategory
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          variant="sidebar"
          className="w-64 flex-shrink-0"
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col" style={{ height: height - 100 }}>
          <RestaurantFilter
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            {...props}
          />

          {/* Menu Items Grid */}
          <div
            className="flex-1 overflow-y-auto p-4 bg-gray-50"
            // style={{ height: height - 400 }}
          >
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-4">
              {(isLoading || loading) &&
              (page === 0 || displayProducts.length === 0)
                ? // Loading skeleton
                  Array.from({ length: 12 }).map((_, index) => (
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

                    const quantityInOrder = getProductQuantityInOrder(
                      item.variantId || "",
                    );

                    return (
                      <Card
                        key={`${item.variantId}-${index}`}
                        className={cn(
                          "group overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 bg-white rounded-xl hover:border-gray-300 h-full flex flex-col relative",
                          loading || isRequest
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer hover:-translate-y-1 active:scale-95",
                          props.allowCreate
                            ? ""
                            : "cursor-not-allowed opacity-50",
                        )}
                        onClick={(event) => handleClick(variant, item, event)}
                      >
                        {/* Quantity Badge */}
                        {quantityInOrder > 0 && (
                          <div className="absolute top-2 right-2 z-10">
                            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200">
                              {quantityInOrder}
                            </div>
                          </div>
                        )}

                        {/* Image Slideshow */}
                        <ProductImageSlideshow
                          images={images}
                          title={item.productTitle || ""}
                          stockStatus={{
                            stock: variant?.stock || 0,
                            isInStock: (variant?.stock || 0) > 0,
                          }}
                          price={variant?.price || 0}
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
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden w-full">
        <div
          className={cn("w-full overflow-x-auto")}
          style={{ height: height - 70 }}
        >
          <RestaurantFilter
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            {...props}
          />

          <RestaurantCategory
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            variant="horizontal"
          />

          {/* Menu Items Grid */}
          <div className="p-2 sm:p-4 pt-4 sm:pt-6 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 pb-20 lg:pb-0">
            {(isLoading || loading) &&
            (page === 0 || displayProducts.length === 0)
              ? // Loading skeleton
                Array.from({ length: 12 }).map((_, index) => (
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

                  const quantityInOrder = getProductQuantityInOrder(
                    item.variantId || "",
                  );

                  return (
                    <Card
                      key={`${item.variantId}-${index}`}
                      className={cn(
                        "group overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 bg-white rounded-xl hover:border-gray-300 h-full flex flex-col relative",
                        loading || isRequest
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer hover:-translate-y-1 active:scale-95",
                        props.allowCreate
                          ? ""
                          : "cursor-not-allowed opacity-50",
                      )}
                      onClick={(event) => handleClick(variant, item, event)}
                    >
                      {/* Quantity Badge */}
                      {quantityInOrder > 0 && (
                        <div className="absolute top-2 right-2 z-10">
                          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200">
                            {quantityInOrder}
                          </div>
                        </div>
                      )}

                      {/* Image Slideshow */}
                      <ProductImageSlideshow
                        images={images}
                        title={item.productTitle || ""}
                        stockStatus={{
                          stock: variant?.stock || 0,
                          isInStock: (variant?.stock || 0) > 0,
                        }}
                        price={variant?.price || 0}
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
        </div>
      </div>

      <RestaurantSummary {...props} />

      {/* Advanced Flying Animation */}
      {flyingAnimation.isActive && flyingAnimation.startRect && (
        <>
          <div
            className="fixed pointer-events-none z-50"
            style={{
              left: flyingAnimation.startRect.left,
              top: flyingAnimation.startRect.top,
              width: flyingAnimation.startRect.width,
              height: flyingAnimation.startRect.height,
            }}
          >
            <div
              className="relative w-full h-full"
              style={{
                animation: `${flyingAnimation.animationName} ${flyingAnimation.duration}ms cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards`,
              }}
            >
              <div className="absolute inset-0 bg-white rounded-xl border shadow-2xl overflow-hidden">
                {flyingAnimation.productImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={flyingAnimation.productImage}
                    alt={flyingAnimation.productTitle}
                    className="w-full h-3/4 object-contain"
                  />
                ) : (
                  <div className="w-full h-3/4 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No Image</span>
                  </div>
                )}
                <div className="h-1/4 p-1 flex items-center justify-center">
                  <span className="text-xs font-medium text-center line-clamp-2">
                    {flyingAnimation.productTitle}
                  </span>
                </div>
              </div>

              {/* Enhanced Glow effect with pulse */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/40 to-blue-400/40 rounded-xl animate-pulse" />
              <div className="absolute inset-0 bg-green-400/20 rounded-xl animate-ping" />
            </div>
          </div>

          {/* Inject Dynamic CSS Animation */}
          <style
            dangerouslySetInnerHTML={{
              __html: flyingAnimation.animationCSS,
            }}
          />
        </>
      )}
    </div>
  );
}
