"use client";

import { ProductV2 } from "@/classes/product-v2";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/components/use-debounce";
import { requestDatabase } from "@/lib/api";
import { ResponseType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Command as CommandPrimitive } from "cmdk";
import {
  Check,
  ImageIcon,
  Loader2,
  PackageSearch,
  RotateCw,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const PAGE_SIZE = 20;

interface Props {
  onChange: (item: ProductV2) => void;
  /** Products already chosen: shown as "Added" and not selectable again. */
  selectedIds?: string[];
  /** Keep the typed text after a pick (default clears it for the next search). */
  keepInput?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Product picker backed by `/api/product-v2`. Matches every typed word against
 * the product title and its variants' name, SKU and barcode on the server.
 * Responses that arrive after a newer query are dropped, so the list always
 * reflects what is in the box.
 */
export function ProductSearchPicker({
  onChange,
  selectedIds,
  keepInput,
  disabled,
  placeholder = "Search by name, variant, SKU or barcode…",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const query = useDebouncedValue(input.trim(), 300);
  const [items, setItems] = useState<ProductV2[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);

  const requestSeq = useRef(0);
  const openList = useCallback((next: boolean) => {
    setOpen(next);
    // Refetch on the next open so newly created products show up.
    if (!next) setLoadedQuery(null);
  }, []);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(async (q: string, offset: number) => {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
      ...(q ? { searchTitle: q } : {}),
    });
    const res = await requestDatabase<
      ResponseType<{ data: ProductV2[]; total: number }>
    >(`/api/product-v2?${params}`);
    if (!res?.success || !res.result) throw new Error("Search failed");
    return res.result;
  }, []);

  const runSearch = useCallback(
    (q: string) => {
      const seq = ++requestSeq.current;
      setStatus("loading");
      fetchPage(q, 0)
        .then((result) => {
          if (seq !== requestSeq.current) return;
          setItems(result.data);
          setTotal(Number(result.total) || 0);
          setLoadedQuery(q);
          setStatus("idle");
          listRef.current?.scrollTo({ top: 0 });
        })
        .catch(() => {
          if (seq !== requestSeq.current) return;
          setStatus("error");
        });
    },
    [fetchPage],
  );

  // Search whenever the settled text changes while the list is open.
  useEffect(() => {
    if (!open || query === loadedQuery) return;
    runSearch(query);
  }, [open, query, loadedQuery, runSearch]);

  const hasMore = items.length < total;

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || status !== "idle" || loadedQuery === null)
      return;
    const seq = requestSeq.current;
    setLoadingMore(true);
    fetchPage(loadedQuery, items.length)
      .then((result) => {
        if (seq !== requestSeq.current) return;
        setItems((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...result.data.filter((p) => !seen.has(p.id))];
        });
        setTotal(Number(result.total) || 0);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [hasMore, loadingMore, status, loadedQuery, items.length, fetchPage]);

  const onScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) loadMore();
    },
    [loadMore],
  );

  const onSelect = useCallback(
    (item: ProductV2) => {
      onChange(item);
      if (!keepInput) setInput("");
      inputRef.current?.focus();
    },
    [onChange, keepInput],
  );

  // Typed ahead of the debounce, or the debounced query is still in flight.
  const pending = status === "loading" || input.trim() !== loadedQuery;

  return (
    <Popover open={open && !disabled} onOpenChange={openList}>
      <Command shouldFilter={false} className={cn("overflow-visible", className)}>
        <PopoverAnchor asChild>
          <div
            className={cn(
              "flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <CommandPrimitive.Input
              ref={inputRef}
              value={input}
              onValueChange={(v) => {
                setInput(v);
                if (!open) openList(true);
              }}
              onFocus={() => !open && openList(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") openList(false);
                else if (!open) openList(true);
              }}
              disabled={disabled}
              placeholder={placeholder}
              className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
            />
            {open && pending && status !== "error" ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            ) : input ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setInput("");
                  inputRef.current?.focus();
                }}
                className="rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="w-[--radix-popover-trigger-width] min-w-[320px] p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Clicking the input itself must not close the list.
            if (
              e.target instanceof Node &&
              inputRef.current?.parentElement?.contains(e.target)
            )
              e.preventDefault();
          }}
        >
          <CommandList
            ref={listRef}
            onScroll={onScroll}
            className="max-h-[360px] overflow-y-auto"
          >
            {status === "error" ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm">
                <span className="text-muted-foreground">
                  Couldn&apos;t load products.
                </span>
                <button
                  type="button"
                  onClick={() => runSearch(query)}
                  className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  <RotateCw className="h-3.5 w-3.5" /> Try again
                </button>
              </div>
            ) : items.length === 0 ? (
              pending || loadedQuery === null ? (
                <ResultSkeleton />
              ) : (
                <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                  <PackageSearch className="h-8 w-8 text-muted-foreground/60" />
                  <p className="text-sm font-medium">
                    {loadedQuery
                      ? <>No products match &ldquo;{loadedQuery}&rdquo;</>
                      : "No products yet"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Try fewer words, or search by SKU or barcode.
                  </p>
                </div>
              )
            ) : (
              <CommandGroup
                heading={
                  loadedQuery
                    ? `${total} result${total === 1 ? "" : "s"}`
                    : "Recent products"
                }
                className={cn(pending && "opacity-60 transition-opacity")}
              >
                {items.map((item) => (
                  <ProductRow
                    key={item.id}
                    item={item}
                    query={loadedQuery ?? input}
                    added={!!selectedIds?.includes(item.id)}
                    onSelect={onSelect}
                  />
                ))}
                {hasMore && (
                  <div className="flex justify-center py-2 text-xs text-muted-foreground">
                    {loadingMore ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <button
                        type="button"
                        onClick={loadMore}
                        className="rounded px-2 py-1 hover:bg-muted"
                      >
                        Show more ({total - items.length} left)
                      </button>
                    )}
                  </div>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </PopoverContent>
      </Command>
    </Popover>
  );
}

function ResultSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatPrice(n: number) {
  return `$${n.toFixed(2)}`;
}

function ProductRow({
  item,
  query,
  added,
  onSelect,
}: {
  item: ProductV2;
  query: string;
  added: boolean;
  onSelect: (item: ProductV2) => void;
}) {
  const variants = item.productVariants ?? [];
  const image = item.productImages?.[0];
  const stock = variants.reduce((a, v) => a + Number(v.stock || 0), 0);
  const prices = variants
    .map((v) => Number(v.price))
    .filter((p) => Number.isFinite(p));
  const min = prices.length ? Math.min(...prices) : null;
  const max = prices.length ? Math.max(...prices) : null;
  const price =
    min === null
      ? "—"
      : min === max
        ? formatPrice(min)
        : `${formatPrice(min)} – ${formatPrice(max!)}`;

  // Explain hits that came from a variant rather than the title.
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const title = (item.title ?? "").toLowerCase();
  const matchedVariant = words.some((w) => !title.includes(w))
    ? variants.find((v) =>
        words.some(
          (w) =>
            !title.includes(w) &&
            [v.name, v.sku, v.barcode].some((f) =>
              String(f ?? "")
                .toLowerCase()
                .includes(w),
            ),
        ),
      )
    : undefined;

  return (
    <CommandItem
      value={item.id}
      disabled={added}
      onSelect={() => onSelect(item)}
      className="gap-3 px-2 py-2"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40">
        {image ? (
          <ImageWithFallback
            src={image.url}
            alt={item.title || ""}
            title={item.title || ""}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="text-muted-foreground/60" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{item.title || "Untitled"}</div>
        <div className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          {matchedVariant ? (
            <span className="truncate">
              Match: {matchedVariant.name}
              {matchedVariant.sku ? ` · SKU ${matchedVariant.sku}` : ""}
            </span>
          ) : (
            <span>
              {variants.length} variant{variants.length === 1 ? "" : "s"}
            </span>
          )}
          <span aria-hidden>·</span>
          <span className="font-medium text-foreground/80">{price}</span>
        </div>
      </div>
      {added ? (
        <Badge variant="secondary" className="gap-1 rounded-full font-normal">
          <Check className="h-3 w-3" /> Added
        </Badge>
      ) : (
        <span
          className={cn(
            "shrink-0 text-xs",
            stock <= 0 ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {stock > 0 ? `${stock} in stock` : "Out of stock"}
        </span>
      )}
    </CommandItem>
  );
}
