import { useLazyQuerySearchCateogryList } from "@/app/hooks/use-query-category";
import { ImageWithFallback } from "@/components/image-with-fallback";
import {
  MaterialInput,
  MaterialInputRef,
  MaterialRenderItemInfo,
} from "@/components/ui/material-input";
import { useDebouncedValue } from "@/components/use-debounce";
import { Category } from "@/lib/server-functions/category/create-category";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Props {
  value?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onChange: (item: Category) => void;
  clearInput?: boolean;
  disabled?: boolean;
}

interface ExtendedCategorySearchResult extends Category {
  isLoadMoreItem?: boolean;
  isNoMoreItem?: boolean;
}

export function DiscountSearchCategory(props: Props) {
  const {
    onFocus: onFocusProps,
    onBlur: onBlurProps,
    value,
    onChange,
    clearInput,
    disabled,
  } = props;
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string>();
  const [allResults, setAllResults] = useState<Category[]>([]);
  const [selectedItem, setSelectedItem] = useState<Category>();

  const innerRef = useRef<MaterialInputRef>(null);
  const valueRef = useRef<string>(value ?? "");
  const lastSearchRef = useRef<string>("");

  const PAGE_SIZE = 15;
  const debouncedSearch = useDebouncedValue(search, 500);

  const param = useMemo(
    () => ({
      offset: page * PAGE_SIZE,
      limit: PAGE_SIZE,
      searchTitle: search,
    }),
    [search, PAGE_SIZE, page]
  );

  const [trigger, { data }] = useLazyQuerySearchCateogryList(
    param.limit,
    param.offset,
    param.searchTitle
  );

  const loadMoreResults = useCallback(() => {
    if (!hasMore || loading) return;
    setPage((prevPage) => prevPage + 1);
    setLoading(true);
    trigger().finally(() => setLoading(false));
  }, [hasMore, loading, trigger]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    valueRef.current = value;
  }, []);

  useEffect(() => {
    if (!debouncedSearch.trim()) return;
    setLoading(true);
    // Reset pagination when search changes
    if (page !== 0) setPage(0);
    setAllResults([]);
    setHasMore(true);

    trigger().finally(() => {
      setLoading(false);
      // Update last search reference when search is triggered by text change
      // lastSearchRef.current = debouncedSearch;
    });
  }, [debouncedSearch, trigger, page]);

  useEffect(() => {
    if (!data?.result) return;

    if (page === 0) {
      setAllResults(data.result.data);
    } else {
      setAllResults((prev) => [...prev, ...(data.result?.data || [])]);
    }

    // If fewer results than page size, we've reached the end
    setHasMore(data.result.data.length === PAGE_SIZE);
  }, [data?.result, page, PAGE_SIZE]);

  const renderItem = useCallback(
    ({ item }: MaterialRenderItemInfo<ExtendedCategorySearchResult>) => {
      const renderLoadMoreButton = () => {
        return (
          <div
            onClick={(e) => {
              e.stopPropagation(); // Prevent closing the dropdown
              loadMoreResults();
            }}
            className="text-center py-3 border-t border-gray-100 bg-gray-50 cursor-pointer"
          >
            <button
              type="button"
              disabled={loading}
              className={`w-[90%] py-2 text-sm rounded-md border ${
                loading
                  ? "bg-gray-100 text-gray-400 border-gray-200"
                  : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
              } transition-colors duration-150`}
            >
              {loading && page > 0
                ? "Loading more items..."
                : "Load more items"}
            </button>
          </div>
        );
      };

      const renderNoMoreItems = () => {
        return (
          <div className="text-center text-gray-500 text-sm py-4 border-t border-gray-100 bg-gray-50 font-medium">
            No more items to load
          </div>
        );
      };

      // Check if this is our special Load More button item
      if (item.isLoadMoreItem) {
        return renderLoadMoreButton();
      }

      // Check if this is our No More Items indicator
      if (item.isNoMoreItem) {
        return renderNoMoreItems();
      }

      // Regular item rendering
      const image = item.imageUrl;

      return (
        <div
          className="flex flex-row justify-between items-center gap-3 py-2 px-4 border-b border-gray-100 last:border-b-0
            hover:bg-blue-50 transition-colors duration-150 cursor-pointer"
        >
          {image ? (
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
              <ImageWithFallback
                src={image}
                alt={item.title || ""}
                title={item.title || ""}
                className="max-w-full max-h-full object-contain w-auto h-auto p-0.5"
                height={40}
                width={40}
              />
            </div>
          ) : (
            <div className="w-10 h-10 bg-gray-50 rounded-md flex items-center justify-center text-gray-400 border border-gray-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
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
          )}
          <div className="text-sm flex-1 min-w-0 flex flex-col">
            <span className="truncate font-medium text-gray-800">
              {item.title || ""}
            </span>
          </div>
        </div>
      );
    },
    [loading, page, loadMoreResults]
  );

  const onFocus = useCallback(() => {
    onFocusProps?.();
    if (error) {
      setError(undefined);
    }

    // Only trigger API call if search text has changed or there's no previous result
    const shouldRefetch =
      debouncedSearch !== lastSearchRef.current || !allResults.length;

    if (shouldRefetch) {
      setLoading(true);
      // Reset pagination when doing a new search
      setPage(0);
      trigger()
        .then(() => {
          setLoading(false);
          lastSearchRef.current = debouncedSearch; // Store current search query
          innerRef.current?.onOpen();
        })
        .catch(() => setLoading(false));
    } else {
      // Just open dropdown with existing results
      innerRef.current?.onOpen();
    }
  }, [trigger, error, onFocusProps, debouncedSearch, allResults]);

  const onBlur = useCallback(() => {
    onBlurProps?.();
    if (!selectedItem) return;
    const matched = selectedItem.title === valueRef.current;
    setError(!matched && valueRef.current ? "Item not found" : undefined);
  }, [selectedItem, onBlurProps]);

  // Create a modified list with a Load More button at the end
  const extendedResults = useMemo(() => {
    if (!allResults.length) return [];

    // Create a special "load-more" item that we'll handle differently in renderItem
    if (hasMore) {
      return [
        ...allResults,
        { isLoadMoreItem: true } as ExtendedCategorySearchResult,
      ];
    }

    // Add a "no more results" item at the end
    return [
      ...allResults,
      { isNoMoreItem: true } as ExtendedCategorySearchResult,
    ];
  }, [allResults, hasMore]);

  const onSelectItem = useCallback(
    (item: Category) => {
      valueRef.current = clearInput ? "" : item.title || "";
      setSearch("");
      setSelectedItem(item);
      onChange?.(item);
    },
    [onChange, clearInput]
  );

  return (
    <div className="relative w-full search-product-picker">
      <style jsx>{`
        /* Custom styling for dropdown container */
        .search-product-picker div[role="combobox"] + div {
          max-height: 350px !important; /* Set max height */
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 #f7fafc;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border-radius: 0 0 6px 6px;
        }

        /* Scrollbar styling for WebKit browsers */
        .search-product-picker div[role="combobox"] + div::-webkit-scrollbar {
          width: 6px;
        }

        .search-product-picker
          div[role="combobox"]
          + div::-webkit-scrollbar-track {
          background: #f7fafc;
        }

        .search-product-picker
          div[role="combobox"]
          + div::-webkit-scrollbar-thumb {
          background-color: #cbd5e0;
          border-radius: 6px;
        }
      `}</style>
      <MaterialInput
        ref={innerRef}
        label="Search Category"
        data={extendedResults}
        error={error}
        animate="none"
        value={valueRef.current}
        loading={loading}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handleSearch(e.target.value)
        }
        onSelectedItem={(item: unknown) => {
          // Don't select load more or no more results items
          const extendedItem = item as ExtendedCategorySearchResult;
          if (extendedItem.isLoadMoreItem || extendedItem.isNoMoreItem) return;
          onSelectItem(item as Category);
        }}
        renderItem={renderItem}
        onFocus={onFocus}
        onBlur={onBlur}
        readOnly={disabled}
        placeholder="Type to search categories..."
        className="w-full relative"
      />
    </div>
  );
}
