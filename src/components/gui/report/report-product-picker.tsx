"use client";

import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { useLazyQuerySearchProduct } from "@/app/hooks/use-query-product";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/components/use-debounce";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { useAuthentication } from "contexts/authentication-context";
import { ShoppingBag, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type SearchType = "title" | "sku" | "barcode";

const PAGE_SIZE = 15;

// Product image component
const ProductImage = ({ item }: { item: ProductSearchResult }) => {
  const image = item.images?.find(
    (img) => img.productVariantId === item.variantId
  );

  if (image) {
    return (
      <div className="w-12 h-12 flex items-center justify-center overflow-hidden rounded border border-gray-200 bg-white">
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
    <div className="w-12 h-12 bg-gray-50 rounded flex items-center justify-center text-gray-400 border border-gray-200">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
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

interface Props {
  selectedProductId?: string;
  onSelectionChange?: (productIds: string) => void;
}

export function ReportProductPicker(props: Props) {
  const { formatForDisplay } = useCurrencyFormat();
  const { currentWarehouse } = useAuthentication();
  const warehouse = currentWarehouse?.id || null;
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("title");
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProductSearchResult>();
  const [hasMore, setHasMore] = useState(true);
  const [allResults, setAllResults] = useState<ProductSearchResult[]>([]);
  const [open, setOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 800);

  const params = useMemo(() => {
    const baseParams = {
      ...(warehouse ? { warehouse } : {}),
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      replenishment: false,
      compositeOnly: false,
    };

    // Apply search based on selected type
    if (debouncedSearch.trim()) {
      switch (searchType) {
        case "sku":
          return { ...baseParams, sku: debouncedSearch };
        case "barcode":
          return { ...baseParams, barcode: debouncedSearch };
        case "title":
        default:
          return { ...baseParams, search: debouncedSearch };
      }
    }

    return baseParams;
  }, [warehouse, debouncedSearch, searchType, page]);

  const [trigger, { data }] = useLazyQuerySearchProduct(params);

  // Handle selectedProductId prop
  useEffect(() => {
    if (props.selectedProductId && allResults.length > 0) {
      const product = allResults.find(
        (p) => p.productId === props.selectedProductId
      );
      if (product) {
        setSelectedItem(product);
      }
    } else if (!props.selectedProductId) {
      setSelectedItem(undefined);
    }
  }, [props.selectedProductId, allResults]);

  // Load initial data on mount
  useEffect(() => {
    setLoading(true);
    trigger().finally(() => {
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!debouncedSearch.trim()) return;
    setLoading(true);

    if (page !== 0) setPage(0);
    setAllResults([]);
    setHasMore(true);

    trigger().finally(() => {
      setLoading(false);
    });
  }, [debouncedSearch, searchType, trigger, page]);

  useEffect(() => {
    if (!data?.result) return;

    if (page === 0) {
      setAllResults(data.result);
    } else {
      setAllResults((prev) => [...prev, ...data.result]);
    }

    setHasMore(data.result.length === PAGE_SIZE);
  }, [data?.result, page]);

  const handleSelectProduct = (product: ProductSearchResult) => {
    setSelectedItem(product);
    setOpen(false);
    props.onSelectionChange?.(product.productId);
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem(undefined);
    props.onSelectionChange?.("");
  };

  const getSearchPlaceholder = () => {
    switch (searchType) {
      case "sku":
        return "Search by SKU...";
      case "barcode":
        return "Search by barcode...";
      case "title":
      default:
        return "Search by product title...";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-h-10 h-auto border-t-0 border-x-0 bg-transparent rounded-none border-b-[1px] dark:border-gray-600 focus:border-primary text-base md:text-sm text-gray-900 focus:outline-none dark:text-white dark:focus:border-primary transition-colors duration-200"
        >
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            <ShoppingBag />
            <div className="cursor-pointer">
              {selectedItem ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="font-medium">
                      {selectedItem.productTitle}
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-gray-500">Select a product...</span>
              )}
            </div>
          </div>
          {selectedItem && (
            <div
              onClick={handleClearSelection}
              className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4 text-gray-500" />
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-3 border-b">
          <div className="flex gap-2 mb-3">
            <Select
              value={searchType}
              onValueChange={(value: SearchType) => setSearchType(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="sku">SKU</SelectItem>
                <SelectItem value="barcode">Barcode</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={getSearchPlaceholder()}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Searching..." : "No products found."}
            </CommandEmpty>
            {allResults.map((product, index) => (
              <CommandItem
                key={`report-product-picker-${product.productId}-${index}`}
                value={product.productId}
                onSelect={() => handleSelectProduct(product)}
                className="flex items-center gap-3 p-2 hover:bg-gray-50"
              >
                <ProductImage item={product} />
                <div className="flex-1">
                  <div className="font-medium">{product.productTitle}</div>
                  <div className="text-sm text-gray-500 flex gap-3">
                    <span>SKU: {product.sku}</span>
                    {product.barcode && <span>Barcode: {product.barcode}</span>}
                    {product.price && (
                      <span className="text-green-600 font-semibold">
                        {formatForDisplay(product.price || 0)}
                      </span>
                    )}
                  </div>
                </div>
              </CommandItem>
            ))}
            {hasMore && allResults.length > 0 && (
              <div className="p-2 text-center">
                <button
                  onClick={() => {
                    setPage((prev) => prev + 1);
                    setLoading(true);
                    trigger().finally(() => setLoading(false));
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
