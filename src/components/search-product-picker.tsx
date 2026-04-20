import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { useLazyQuerySearchProduct } from "@/app/hooks/use-query-product";
import { ImageWithFallback } from "@/components/image-with-fallback";
import {
  MaterialInput,
  MaterialInputRef,
  MaterialRenderItemInfo,
} from "@/components/ui/material-input";
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

const ProductItem = ({ item }: { item: ProductSearchResult }) => {
  const { formatForDisplay } = useCurrencyFormat();
  const variant = (
    item.variants as { sku: string; stock: number }[] | undefined
  )?.find((f) => f.sku === String(item.sku));

  const stock = variant?.stock ?? 0;
  const price = formatForDisplay(item.price || 0);

  const trackStock = item.variants?.at(0)?.basicProduct?.trackStock;

  return (
    <div className="w-full flex items-center gap-2 py-1 px-3 border-b border-gray-100 last:border-b-0 cursor-pointer">
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

      {trackStock === true && <StockBadge stock={stock} />}
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

    // Refs
    const innerRef = useRef<MaterialInputRef>(null);
    const valueRef = useRef<string>(value ?? "");
    const lastSearchRef = useRef<string>("");

    const debouncedSearch = useDebouncedValue(search, 800);

    // API parameters
    const params = useMemo(
      () => ({
        ...(warehouse ? { warehouse } : {}),
        search: debouncedSearch,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        replenishment: forReplenishment ?? false,
        compositeOnly,
        includeProductNotForSale: includeProductNotForSale ?? false,
      }),
      [
        warehouse,
        debouncedSearch,
        forReplenishment,
        compositeOnly,
        includeProductNotForSale,
        page,
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
      if (!debouncedSearch.trim()) return;
      setLoading(true);

      if (page !== 0 && status === "searching") setPage(0);
      setAllResults([]);
      setHasMore(true);

      trigger().finally(() => {
        setLoading(false);
        lastSearchRef.current = debouncedSearch;
        setStatus(null);
      });
    }, [debouncedSearch, trigger, page, status]);

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
        <ProductItem item={item} />
      ),
      [],
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
      <div className="relative w-full">
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
            onSelectItem(item as ProductSearchResult);
          }}
          renderItem={renderItem}
          ListFooterComponent={renderFooter()}
          onFocus={onFocus}
          onBlur={onBlur}
          readOnly={disabled}
          placeholder="Type to search products..."
          className="w-full relative"
          variant={variant}
        />
      </div>
    );
  },
);

export default SearchProductPicker;
