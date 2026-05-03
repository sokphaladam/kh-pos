import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { useQueryCategoryMenu } from "@/app/hooks/use-query-category";
import { useLazyPublicProductList } from "@/app/hooks/use-query-product";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/components/use-debounce";
import { useWindowSize } from "@/components/use-window-size";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2, Search, Store, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

// Product Image Component
function ProductImageDisplay({
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
  price?: string;
}) {
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
                {price}
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
              {price}
            </span>
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

interface ProductPublicLayoutProps {
  logo?: string;
  warehouseName?: string;
  address?: string;
  menuBanner?: string;
}

export function ProductPublicLayout({
  logo,
  warehouseName,
  address,
  menuBanner,
}: ProductPublicLayoutProps) {
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
  }, [data, page]);

  // Trigger initial search when search changes (only when page is reset to 0)
  useEffect(() => {
    setLoading(true);
    triggerSearch().finally(() => setLoading(false));
  }, [debouncedSearchQuery, triggerSearch]);

  // Trigger search when page changes (for load more only)
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

  // Products to display (either accumulated products or data from current request)
  const displayProducts =
    allProducts.length > 0 ? allProducts : data?.result || [];

  const [bannerOpen, setBannerOpen] = useState(!!menuBanner);

  const handleProductClick = useCallback((item: ProductSearchResult) => {
    // Handle product click - can be customized based on requirements
    console.log("Product clicked:", item);
  }, []);

  return (
    <div className="w-full flex flex-col relative">
      {/* Menu Banner Dialog */}
      {menuBanner && bannerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setBannerOpen(false)}
        >
          <div
            className="relative max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={menuBanner}
              alt="Menu banner"
              className="w-full object-contain"
            />
            <button
              onClick={() => setBannerOpen(false)}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
              aria-label="Close banner"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Sticky header group — must be outside any overflow container */}
      <div className="sticky top-0 z-20 bg-white shadow-sm">
        {/* Store Header */}
        <div className="border-b border-gray-100 px-4 py-4 sm:py-5">
          <div className="flex items-center gap-3 sm:gap-4 max-w-5xl mx-auto">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt={warehouseName || "Store logo"}
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-contain aspect-square flex-shrink-0 border border-gray-100 shadow-sm"
              />
            ) : (
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <Store className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                {warehouseName || "Our Menu"}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {address ||
                  "Welcome to our store! Browse our delicious offerings."}
              </p>
            </div>
          </div>
        </div>

        {/* Search Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-primary focus:ring-primary rounded-lg"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 min-w-fit scroll-smooth snap-x snap-mandatory pb-1">
                <Button
                  key="all"
                  variant={selectedCategory === "All" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("All")}
                  className={cn(
                    "whitespace-nowrap transition-all duration-200 snap-start flex-shrink-0 text-base",
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
                        className="h-8 w-20 bg-gray-200 animate-pulse rounded-md flex-shrink-0"
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
                          "whitespace-nowrap transition-all duration-200 snap-start flex-shrink-0 text-base",
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
            {/* Scroll indicators */}
            <div className="absolute right-0 top-0 bottom-0 w-8 to-transparent pointer-events-none" />
            <div className="absolute left-0 top-0 bottom-0 w-8 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Scrollable content — overflow only wraps product content */}
      <div style={{ minHeight: height ? height - 120 : "80vh" }}>
        {/* Products Grid */}
        <div className="p-2 sm:p-4 pt-4 sm:pt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 pb-20">
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

                const price = formatForDisplay(
                  variant?.price || item.price || 0,
                );

                return (
                  <Card
                    key={`${item.variantId}-${index}`}
                    className={cn(
                      "group overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 bg-white rounded-xl hover:border-gray-300 h-full flex flex-col relative",
                      loading
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer hover:-translate-y-1 active:scale-95",
                    )}
                    onClick={() => !loading && handleProductClick(item)}
                  >
                    {/* Product Image */}
                    <ProductImageDisplay
                      images={images}
                      title={item.productTitle || ""}
                      stockStatus={{
                        stock: variant?.stock || item.stock || 0,
                        isInStock: (variant?.stock || item.stock || 0) > 0,
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
