import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { useCommonDialog } from "@/components/common-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { MaterialInput } from "@/components/ui/material-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQueryPrinters } from "@/app/hooks/use-query-printer";
import { cn } from "@/lib/utils";
import { computeVariantDiscount } from "@/lib/variant-discount";
import { useAuthentication } from "contexts/authentication-context";
import { produce } from "immer";
import { ChevronDown, Eye, EyeOff, Layers } from "lucide-react";
import React, { useState } from "react";
import {
  ProductInputWithCompositeDetails,
  useProductForm,
} from "../context/product-form-context";
import { CompositeCard } from "./composite-card";
import { DropImage } from "./drop-image";

type Variant = ProductInputWithCompositeDetails["productVariants"][number];

const DISCOUNT_TYPES: { value: Variant["discountType"]; label: string }[] = [
  { value: null, label: "No discount" },
  { value: "AMOUNT", label: "Amount" },
  { value: "PERCENTAGE", label: "% off" },
];
const CATEGORY_PRINTER = "category";

const MENU_TAGS: { key: "isPopular" | "isNew" | "isMostOrder"; label: string }[] =
  [
    { key: "isPopular", label: "Popular" },
    { key: "isNew", label: "New" },
    { key: "isMostOrder", label: "Best seller" },
  ];

// Variants open by default only while the list is short enough to scan.
const AUTO_EXPAND_LIMIT = 3;

function numberOrNull(value: string) {
  return value === "" || isNaN(Number(value)) ? null : Number(value);
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h4>
        {description && (
          <p className="text-xs text-muted-foreground/80 mt-0.5">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

export function ProductVariantList() {
  const { product, setProduct } = useProductForm();
  const { showDialog } = useCommonDialog();

  const updateVariant = (idx: number, update: (variant: Variant) => void) => {
    setProduct(
      produce(product, (draft) => {
        update(draft.productVariants[idx]);
      }),
    );
  };

  const confirmToggle = (
    title: string,
    content: string,
    onConfirm: () => void,
  ) => {
    showDialog({
      title,
      content,
      actions: [{ text: "Confirm", onClick: async () => onConfirm() }],
    });
  };

  if (product.productVariants.length === 0) {
    return <></>;
  }

  return (
    <div className="space-y-3">
      {product.productVariants.map((variant, idx) => (
        <VariantCard
          key={variant.id || idx}
          variant={variant}
          defaultOpen={product.productVariants.length <= AUTO_EXPAND_LIMIT}
          trackStock={!!product.productBasic.trackStock}
          madeToOrder={!!variant.isComposite && !product.productBasic.useProduction}
          onChange={(update) => updateVariant(idx, update)}
          onToggleComposite={(checked) =>
            confirmToggle(
              checked ? "Use a recipe" : "Remove recipe",
              checked
                ? "This variant will be made from other items. Add its recipe below."
                : "This variant will no longer use its recipe. Continue?",
              () => updateVariant(idx, (v) => void (v.isComposite = checked)),
            )
          }
          onToggleVisible={(checked) =>
            confirmToggle(
              checked ? "Show variant" : "Hide variant",
              `Are you sure you want to ${checked ? "show" : "hide"} this variant on the POS and menu?`,
              () => updateVariant(idx, (v) => void (v.visible = checked)),
            )
          }
          onDelete={() =>
            setProduct(
              produce(product, (draft) => {
                draft.productVariants.splice(idx, 1);
              }),
            )
          }
        />
      ))}
    </div>
  );
}

function VariantCard({
  variant,
  defaultOpen,
  trackStock,
  madeToOrder,
  onChange,
  onToggleComposite,
  onToggleVisible,
  onDelete,
}: {
  variant: Variant;
  defaultOpen: boolean;
  trackStock: boolean;
  madeToOrder: boolean;
  onChange: (update: (variant: Variant) => void) => void;
  onToggleComposite: (checked: boolean) => void;
  onToggleVisible: (checked: boolean) => void;
  onDelete: () => void;
}) {
  const { currency } = useAuthentication();
  const { printers } = useQueryPrinters();
  const [open, setOpen] = useState(defaultOpen);

  const displayName =
    variant.name && variant.name !== "ns" ? variant.name : "Default";
  const recipeCount = variant.compositeVariants?.length || 0;
  const stockLevelsEnabled = trackStock && !madeToOrder;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn(
        "rounded-lg border bg-card transition-colors",
        !variant.visible && "bg-muted/40",
      )}
    >
      {/* Header: identity + quick summary, always visible */}
      <div className="flex items-center gap-3 p-3">
        <DropImage variantId={variant.id} />
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex flex-1 min-w-0 items-center gap-3 text-left"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold">
                  {displayName}
                </span>
                {variant.isDefault && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    Default
                  </Badge>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span className="font-medium text-success">
                  {currency}
                  {Number(variant.price || 0)}
                </span>
                {variant.barcode && <span>#{variant.barcode}</span>}
                {variant.isComposite && (
                  <span className="inline-flex items-center gap-1 text-info">
                    <Layers className="h-3 w-3" />
                    Recipe · {recipeCount} item{recipeCount === 1 ? "" : "s"}
                  </span>
                )}
                {!variant.visible && (
                  <span className="inline-flex items-center gap-1">
                    <EyeOff className="h-3 w-3" />
                    Hidden
                  </span>
                )}
              </div>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>
        <BasicMenuAction value={variant} onDelete={onDelete} />
      </div>

      <CollapsibleContent>
        <div className="space-y-6 border-t px-4 py-4">
          <Section title="Pricing">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MaterialInput
                label={`Selling price (${currency})`}
                type="number"
                min={0}
                step={0.1}
                className="h-9"
                value={Number(variant.price || 0).toString()}
                onChange={(e) =>
                  onChange((v) => void (v.price = Number(e.target.value)))
                }
              />
              <MaterialInput
                label={`Purchase cost (${currency})`}
                type="number"
                min={0}
                step="any"
                className="h-9"
                value={Number(variant.purchasedCost || 0).toString()}
                onChange={(e) =>
                  onChange(
                    (v) => void (v.purchasedCost = numberOrNull(e.target.value) ?? 0),
                  )
                }
              />
              <MaterialInput
                label="Barcode"
                className="h-9"
                value={variant.barcode || ""}
                onChange={(e) =>
                  onChange((v) => void (v.barcode = e.target.value))
                }
              />
            </div>
            <DiscountField
              variant={variant}
              currency={currency || "$"}
              onChange={onChange}
            />
          </Section>

          <Section
            title="Stock levels"
            description={
              madeToOrder
                ? "Made to order: stock is kept on the recipe items, so set their levels instead."
                : trackStock
                  ? "Used for low-stock alerts and purchase order suggestions."
                  : "Turn on Track stock above to use stock levels."
            }
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MaterialInput
                label="Low stock alert at"
                type="number"
                min={0}
                className="h-9"
                disabled={!stockLevelsEnabled}
                value={variant.lowStockQty ?? ""}
                onChange={(e) =>
                  onChange(
                    (v) => void (v.lowStockQty = numberOrNull(e.target.value)),
                  )
                }
              />
              <MaterialInput
                label="Ideal stock"
                type="number"
                min={0}
                className="h-9"
                disabled={!stockLevelsEnabled}
                value={variant.idealStockQty ?? ""}
                onChange={(e) =>
                  onChange(
                    (v) => void (v.idealStockQty = numberOrNull(e.target.value)),
                  )
                }
              />
            </div>
          </Section>

          <Section title="Menu & kitchen">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">Menu tags</span>
                <div className="flex flex-wrap gap-2">
                  {MENU_TAGS.map((tag) => {
                    const active = !!variant[tag.key];
                    return (
                      <button
                        key={tag.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          onChange((v) => void (v[tag.key] = !active))
                        }
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">
                  Kitchen printer
                </span>
                <Select
                  value={variant.printerId ?? CATEGORY_PRINTER}
                  onValueChange={(value) =>
                    onChange(
                      (v) =>
                        void (v.printerId =
                          value === CATEGORY_PRINTER ? null : value),
                    )
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CATEGORY_PRINTER} className="text-xs">
                      Category default
                    </SelectItem>
                    {printers.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.name} ({p.printerName})
                      </SelectItem>
                    ))}
                    {!!variant.printerId &&
                      !printers.some((p) => p.id === variant.printerId) && (
                        <SelectItem
                          value={variant.printerId}
                          className="text-xs"
                        >
                          Unknown printer
                        </SelectItem>
                      )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
              <Switch
                checked={!!variant.visible}
                onCheckedChange={onToggleVisible}
              />
              <span className="inline-flex items-center gap-1">
                {variant.visible ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
                Visible on POS and menu
              </span>
            </label>
          </Section>

          <Section
            title="Recipe (composite)"
            description="Use when this variant is made from other stock items, e.g. a set or a dish. Quantities are per 1 sold, in each item's stock unit."
          >
            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
              <Switch
                checked={!!variant.isComposite}
                onCheckedChange={onToggleComposite}
              />
              Made from other items
            </label>
            {variant.isComposite && (
              <CompositeCard
                variant={variant.compositeVariants?.map((cv) => ({
                  id: cv.id || undefined,
                  variantId: cv.variantId,
                  image: cv.image,
                  title: cv.title,
                  quantity: cv.quantity,
                }))}
                onAddComponent={(item: ProductSearchResult, qty: number) =>
                  onChange((v) => {
                    const components = v.compositeVariants || [];
                    const existing = components.find(
                      (cv) => cv.variantId === item.variantId,
                    );
                    if (existing) {
                      existing.quantity = qty;
                      return;
                    }
                    v.compositeVariants = [
                      ...components,
                      {
                        variantId: item.variantId,
                        quantity: qty,
                        image:
                          item.images?.find(
                            (img) => img.productVariantId === item.variantId,
                          )?.url || undefined,
                        title: item.productTitle || "",
                      },
                    ];
                  })
                }
                onRemoveComponent={(compIdx) =>
                  onChange(
                    (v) =>
                      void (v.compositeVariants = v.compositeVariants.filter(
                        (_, i) => i !== compIdx,
                      )),
                  )
                }
              />
            )}
          </Section>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function DiscountField({
  variant,
  currency,
  onChange,
}: {
  variant: Variant;
  currency: string;
  onChange: (update: (variant: Variant) => void) => void;
}) {
  const price = Number(variant.price || 0);
  // Same function the POS and order engine use, so the preview matches the till.
  const discounted = computeVariantDiscount(
    price,
    variant.discountType,
    variant.discountValue,
  );

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-foreground/80">Menu discount</span>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <div
          role="radiogroup"
          aria-label="Discount type"
          className="flex h-9 items-center rounded-md border bg-muted/40 p-0.5"
        >
          {DISCOUNT_TYPES.map((type) => {
            const active = (variant.discountType ?? null) === type.value;
            return (
              <button
                key={type.label}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() =>
                  onChange((v) => {
                    v.discountType = type.value;
                    if (!type.value) v.discountValue = null;
                  })
                }
                className={cn(
                  "h-full rounded px-3 text-xs font-medium transition-colors",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {type.value === "AMOUNT" ? `${currency} off` : type.label}
              </button>
            );
          })}
        </div>
        {variant.discountType && (
          <div className="w-[140px]">
            <MaterialInput
              label={
                variant.discountType === "PERCENTAGE"
                  ? "Discount (%)"
                  : `Discount (${currency})`
              }
              type="number"
              min={0}
              step={variant.discountType === "PERCENTAGE" ? 1 : 0.1}
              className="h-9"
              value={variant.discountValue?.toString() ?? ""}
              onChange={(e) =>
                onChange(
                  (v) => void (v.discountValue = numberOrNull(e.target.value)),
                )
              }
            />
          </div>
        )}
        {variant.discountType && (
          <div className="pb-2 text-xs text-muted-foreground">
            Price after discount:{" "}
            {discounted ? (
              <>
                <span className="line-through">
                  {currency}
                  {price}
                </span>{" "}
                <span className="font-semibold text-success">
                  {currency}
                  {discounted.discountedUnitPrice}
                </span>
              </>
            ) : (
              <span>enter a value</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
