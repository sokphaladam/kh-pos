import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { useQueryCategory } from "@/app/hooks/use-query-category";
import { useLazyQuerySearchProduct } from "@/app/hooks/use-query-product";
import { ImageWithFallback } from "@/components/image-with-fallback";
import {
  MaterialInput,
  MaterialInputRef,
  MaterialRenderItemInfo,
} from "@/components/ui/material-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Badge } from "./ui/badge";
import { useDebouncedValue } from "./use-debounce";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

interface Props {
  warehouse?: string;
  value?: string;
  onChange: (item: ProductSearchResult) => void;
  clearInput?: boolean;
  forReplenishment?: boolean;
  compositeOnly?: boolean;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  variant?: "default" | "standard";
  label?: string;
  includeProductNotForSale?: boolean;
  selectedVariantIds?: string[];
  showCategoryFilter?: boolean;
}

interface ExtendedProductSearchResult extends ProductSearchResult {
  isNoMoreItem?: boolean;
}

const PAGE_SIZE = 15;

// Extracted components for better organization
const ProductImage = ({ item }: { item: ProductSearchResult }) => {
  const image = item.images?.find(
    (img) => img.productVariantId === item.variantId,
  );

  if (image) {
    return (
      <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded border border-gray-200 bg-white">
        <ImageWithFallback
          src={image.url}
          alt={item.productTitle}
          title={item.productTitle}
          className="max-w-full max-h-full object-contain w-auto h-auto p-0.5"
        />
      </div>
    );
  }

  return (
    <div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center text-gray-400 border border-gray-200">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  );
};

const StockBadge = ({ stock }: { stock: number }) => {
  const getStockVariant = () => {
    if (stock <= 0) return "bg-red-50 text-red-600 border-red-200";
    if (stock < 5) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  return (
    <Badge
      variant={stock > 0 ? "secondary" : "outline"}
      className={`text-xs rounded-md h-5 min-w-[50px] px-2 font-medium whitespace-nowrap flex items-center justify-center ${getStockVariant()}`}
    >
      {stock > 0 ? stock : "Out of stock"}
    </Badge>
  );
};

const LoadMoreButton = ({
  loading,
  page,
  onLoadMore,
}: {
  loading: boolean;
  page: number;
  onLoadMore: () => void;
}) => (
  <div
    onMouseDown={(e) => e.preventDefault()}
    onClick={(e) => {
      e.stopPropagation();
      onLoadMore();
    }}
    className="text-center py-2 border-t border-gray-100 bg-gray-50 cursor-pointer"
  >
    <button
      type="button"
      disabled={loading}
      className={`w-[90%] py-1.5 text-sm rounded-md border ${
        loading
          ? "bg-gray-100 text-gray-400 border-gray-200"
          : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
      } transition-colors`}
    >
      {loading && page > 0 ? "Loading..." : "Load more"}
    </button>
  </div>
);

const NoMoreItems = () => (
  <div className="text-center text-gray-500 text-xs py-3 border-t border-gray-100 bg-gray-50">
    No more items
  </div>
);

const ProductItem = ({
  item,
  isSelected,
}: {
  item: ProductSearchResult;
  isSelected?: boolean;
}) => {
  const { formatForDisplay } = useCurrencyFormat();
  const variant = (
    item.variants as { sku: string; stock: number }[] | undefined
  )?.find((f) => f.sku === String(item.sku));

  const stock = variant?.stock ?? 0;
  const price = formatForDisplay(item.price || 0);

  const trackStock = item.variants?.at(0)?.basicProduct?.trackStock;

  return (
    <div
      className={`w-full flex items-center gap-2 py-1 px-3 border-b border-gray-100 last:border-b-0 ${
        isSelected ? "cursor-default opacity-50 bg-gray-50" : "cursor-pointer"
      }`}
    >
      <ProductImage item={item} />

      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-medium text-gray-800">
          {item.productTitle}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500 truncate">
            SKU: {item.sku}
          </span>
          <div className="h-2 w-px bg-gray-300"></div>
          <span className="text-xs font-semibold text-emerald-700">
            {price}
          </span>
        </div>
      </div>

      {isSelected && (
        <span className="text-xs text-blue-600 font-medium whitespace-nowrap">
          Added
        </span>
      )}
      {!isSelected && trackStock === true && <StockBadge stock={stock} />}
    </div>
  );
};

const SearchProductPicker = forwardRef<MaterialInputRef, Props>(
  function SearchProductPicker(
    {
      onChange,
      value,
      clearInput,
      warehouse,
      forReplenishment,
      compositeOnly,
      disabled,
      onFocus: onFocusProps,
      onBlur: onBlurProps,
      variant,
      label,
      includeProductNotForSale,
      selectedVariantIds,
      showCategoryFilter,
    },
    ref,
  ) {
    // State management
    const [search, setSearch] = useState("");
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ProductSearchResult>();
    const [page, setPage] = useState(0);
    const [status, setStatus] = useState<"loadMore" | "searching" | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [allResults, setAllResults] = useState<ProductSearchResult[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
      [],
    );
    const [searchMode, setSearchMode] = useState<"title" | "barcode">("title");

    // Category data
    const { categories } = useQueryCategory(100, 0);

    // Refs
    const innerRef = useRef<MaterialInputRef>(null);
    const valueRef = useRef<string>(value ?? "");
    const lastSearchRef = useRef<string>("");

    const debouncedSearch = useDebouncedValue(search, 800);

    // API parameters
    const params = useMemo(
      () => ({
        ...(warehouse ? { warehouse } : {}),
        ...(searchMode === "title"
          ? { search: debouncedSearch }
          : { barcode: debouncedSearch }),
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        replenishment: forReplenishment ?? false,
        compositeOnly,
        includeProductNotForSale: includeProductNotForSale ?? false,
        ...(selectedCategoryIds.length > 0
          ? { categoryKeys: selectedCategoryIds.join(",") }
          : {}),
      }),
      [
        warehouse,
        debouncedSearch,
        searchMode,
        forReplenishment,
        compositeOnly,
        includeProductNotForSale,
        page,
        selectedCategoryIds,
      ],
    );
    const [trigger, { data }] = useLazyQuerySearchProduct(params);

    useImperativeHandle(ref, () => ({
      ...innerRef.current!,
    }));

    // Handlers
    const handleSearch = useCallback((value: string) => {
      setStatus("searching");
      setSearch(value);
      valueRef.current = value;
    }, []);

    const loadMoreResults = useCallback(() => {
      if (!hasMore || loading) return;
      setStatus("loadMore");
      setPage((prevPage) => prevPage + 1);
      setLoading(true);
      trigger().finally(() => {
        setLoading(false);
        setStatus(null);
      });
    }, [hasMore, loading, trigger]);

    const onSelectItem = useCallback(
      (item: ProductSearchResult) => {
        valueRef.current = clearInput ? "" : item.productTitle;
        setSearch("");
        setSelectedItem(item);
        onChange?.(item);
      },
      [onChange, clearInput],
    );

    // Effects
    useEffect(() => {
      if (!debouncedSearch.trim() && selectedCategoryIds.length === 0) return;
      setLoading(true);

      if (page !== 0 && status === "searching") setPage(0);
      setAllResults([]);
      setHasMore(true);

      trigger().finally(() => {
        setLoading(false);
        lastSearchRef.current = debouncedSearch;
        setStatus(null);
      });
    }, [debouncedSearch, selectedCategoryIds, trigger, page, status]);

    useEffect(() => {
      if (!data?.result) return;

      if (page === 0) {
        setAllResults(data.result);
      } else {
        setAllResults((prev) => [...prev, ...data.result]);
      }

      setHasMore(data.result.length === PAGE_SIZE);
    }, [data?.result, page]);

    // Render functions
    const renderItem = useCallback(
      ({ item }: MaterialRenderItemInfo<ExtendedProductSearchResult>) => (
        <ProductItem
          item={item}
          isSelected={
            !!item.variantId &&
            !!(selectedVariantIds ?? []).includes(item.variantId)
          }
        />
      ),
      [selectedVariantIds],
    );

    const renderFooter = useCallback(() => {
      if (!hasMore) return <NoMoreItems />;

      return (
        <LoadMoreButton
          loading={loading}
          page={page}
          onLoadMore={loadMoreResults}
        />
      );
    }, [hasMore, loading, page, loadMoreResults]);

    const onFocus = useCallback(() => {
      onFocusProps?.();
      if (error) {
        setError(undefined);
      }

      const shouldRefetch =
        debouncedSearch !== lastSearchRef.current || !allResults.length;

      if (shouldRefetch) {
        setLoading(true);
        setPage(0);
        trigger()
          .then(() => {
            setLoading(false);
            lastSearchRef.current = debouncedSearch;
            innerRef.current?.onOpen();
          })
          .catch(() => setLoading(false));
      } else {
        innerRef.current?.onOpen();
      }
    }, [trigger, error, onFocusProps, debouncedSearch, allResults]);

    const onBlur = useCallback(() => {
      onBlurProps?.();
      if (!selectedItem) return;

      // const matched = selectedItem.productTitle === valueRef.current;
      // setError(!matched && valueRef.current ? "Item not found" : undefined);
    }, [selectedItem, onBlurProps]);

    // Extended results with load more functionality
    const extendedResults = useMemo(() => {
      if (!allResults.length) return [];
      // Only add "no more items" indicator when there are no more results
      if (!hasMore) {
        return [
          ...allResults,
          { isNoMoreItem: true } as ExtendedProductSearchResult,
        ];
      }
      // Just return the results, LoadMoreButton will be handled by renderFooter
      return allResults;
    }, [allResults, hasMore]);

    return (
      <div className="relative w-full flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {/* Search mode toggle */}
          <div className="flex rounded-md border border-gray-300 overflow-hidden text-xs font-medium shrink-0">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setSearchMode("title");
                setSearch("");
                valueRef.current = "";
                setAllResults([]);
                setPage(0);
              }}
              className={`px-2.5 py-1 transition-colors ${
                searchMode === "title"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Title
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setSearchMode("barcode");
                setSearch("");
                valueRef.current = "";
                setAllResults([]);
                setPage(0);
              }}
              className={`px-2.5 py-1 border-l border-gray-300 transition-colors ${
                searchMode === "barcode"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Barcode
            </button>
          </div>

          {/* Category filter popover */}
          {showCategoryFilter && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors shrink-0 ${
                    selectedCategoryIds.length > 0
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
                    />
                  </svg>
                  {selectedCategoryIds.length > 0
                    ? `${selectedCategoryIds.length} categor${selectedCategoryIds.length === 1 ? "y" : "ies"}`
                    : "Category"}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 p-2">
                <div className="flex items-center justify-between px-1 pb-1.5">
                  <p className="text-xs font-semibold text-gray-500">
                    Filter by category
                  </p>
                  {selectedCategoryIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategoryIds([]);
                        setPage(0);
                        setAllResults([]);
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto">
                  {categories?.data?.map((cat) => {
                    const checked = selectedCategoryIds.includes(cat.id!);
                    return (
                      <label
                        key={cat.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSelectedCategoryIds((prev) =>
                              checked
                                ? prev.filter((id) => id !== cat.id)
                                : [...prev, cat.id!],
                            );
                            setPage(0);
                            setAllResults([]);
                          }}
                          className="accent-blue-600 w-3.5 h-3.5 shrink-0"
                        />
                        <span
                          className={
                            checked
                              ? "text-blue-700 font-medium"
                              : "text-gray-700"
                          }
                        >
                          {cat.title}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <MaterialInput
          ref={innerRef}
          label={label ? label : "Search Item"}
          data={extendedResults}
          error={error}
          animate="none"
          value={valueRef.current}
          loading={loading}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleSearch(e.target.value)
          }
          onSelectedItem={(item: unknown) => {
            const extendedItem = item as ExtendedProductSearchResult;
            if (extendedItem.isNoMoreItem) return;
            if (
              extendedItem.variantId &&
              (selectedVariantIds ?? []).includes(extendedItem.variantId)
            )
              return;
            onSelectItem(item as ProductSearchResult);
          }}
          renderItem={renderItem}
          ListFooterComponent={renderFooter()}
          onFocus={onFocus}
          onBlur={onBlur}
          readOnly={disabled}
          placeholder={
            searchMode === "barcode"
              ? "Scan or type barcode..."
              : "Type to search by title..."
          }
          className="w-full relative"
          variant={variant}
        />
      </div>
    );
  },
);

export default SearchProductPicker;
