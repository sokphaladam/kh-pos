import LabelInput from "@/components/label-input";
import { ProductVariant } from "./product-variant";
import { ProductVariantConversion } from "./product-variant-conversion";
import { produce } from "immer";
import { ProductFormImage } from "./product-image-form";
import { MaterialInput } from "@/components/ui/material-input";
import { useProductForm } from "../context/product-form-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Tag, ImageIcon, Settings } from "lucide-react";
import SupplierPicker from "@/components/supplier-picker";
import { ProductCategoryPicker } from "./product-cateory";
import { ProductMovieForm } from "./product-movie-form";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const COMPOSITE_MODES = [
  {
    useProduction: false,
    title: "Made to order",
    description:
      "Each sale deducts the recipe items from stock (dishes, sets, combos).",
  },
  {
    useProduction: true,
    title: "Pre-produced",
    description:
      "Made ahead in Production; each sale deducts this item's own stock.",
  },
];

function SettingSwitch({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border p-3 hover:bg-muted/40">
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {description}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

export function ProductForm() {
  const { product, setProduct, isMovie } = useProductForm();
  const hasRecipe = product.productVariants.some((v) => v.isComposite);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4 md:p-6">
      {/* Basic Information Section */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Package className="h-5 w-5 text-primary" />
            Product Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <MaterialInput
                label="Product Title"
                placeholder="Enter product title"
                value={product.productBasic.title}
                onChange={(e) => {
                  setProduct(
                    produce(product, (draft) => {
                      draft.productBasic.title = e.target.value;
                    })
                  );
                }}
                className="h-10 text-sm"
                required
              />
            </div>
            <div className="gap-2 flex flex-col">
              <SupplierPicker
                value={product.productBasic.supplierId ?? ""}
                onChange={(supplier) => {
                  setProduct(
                    produce(product, (draft) => {
                      draft.productBasic.supplierId = supplier?.id || null;
                    })
                  );
                }}
                allowCreateNew={true}
              />
            </div>
            <div>
              <ProductCategoryPicker
                value={product.productCategories.at(0)?.categoryId || ""}
                onChange={(v) => {
                  setProduct(
                    produce(product, (draft) => {
                      draft.productCategories = v ? [{ categoryId: v.id }] : [];
                      // The category printer is the default for every
                      // variant; each one can still be changed below.
                      if (v) {
                        for (const variant of draft.productVariants) {
                          variant.printerId = v.printerId ?? null;
                        }
                      }
                    })
                  );
                }}
              />
            </div>

            <div className="md:col-span-2">
              <LabelInput
                multiple
                label="Description"
                placeholder="Describe your product..."
                value={product.productBasic.description}
                onChange={(e) => {
                  setProduct(
                    produce(product, (draft) => {
                      draft.productBasic.description = e.target.value;
                    })
                  );
                }}
                className="min-h-[100px] resize-y"
              />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SettingSwitch
                title="For sale"
                description="Show on the POS and menu so it can be sold."
                checked={!!product.productBasic.isForSale}
                onCheckedChange={(checked) =>
                  setProduct(
                    produce(product, (draft) => {
                      draft.productBasic.isForSale = checked;
                    })
                  )
                }
              />
              <SettingSwitch
                title="Track stock"
                description="Count on-hand quantity, alert on low stock and suggest purchase orders."
                checked={!!product.productBasic.trackStock}
                onCheckedChange={(checked) =>
                  setProduct(
                    produce(product, (draft) => {
                      draft.productBasic.trackStock = checked;
                    })
                  )
                }
              />
            </div>
            {hasRecipe && (
              <div className="md:col-span-2 space-y-2">
                <div className="text-sm font-medium">Composite stock</div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {COMPOSITE_MODES.map((mode) => {
                    const active =
                      !!product.productBasic.useProduction === mode.useProduction;
                    return (
                      <button
                        key={mode.title}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          setProduct(
                            produce(product, (draft) => {
                              draft.productBasic.useProduction =
                                mode.useProduction;
                            })
                          )
                        }
                        className={cn(
                          "rounded-lg border p-3 text-left transition-colors",
                          active
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:bg-muted/50"
                        )}
                      >
                        <div className="text-sm font-medium">{mode.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {mode.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Images Section */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <ImageIcon className="h-5 w-5 text-primary" />
            Product Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductFormImage />
        </CardContent>
      </Card>

      {/* Variants Section */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Tag className="h-5 w-5 text-primary" />
            Product Variants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductVariant />
        </CardContent>
      </Card>

      {/* Variant Conversions Section - Hide for movie category */}
      {!isMovie && (
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Settings className="h-5 w-5 text-primary" />
              Variant Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductVariantConversion />
          </CardContent>
        </Card>
      )}

      {/* Movie Form Section - Only show for movie category */}
      {isMovie && <ProductMovieForm />}
    </div>
  );
}
