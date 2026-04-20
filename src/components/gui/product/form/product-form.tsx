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

export function ProductForm() {
  const { product, setProduct, isMovie } = useProductForm();

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
            <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-4 md:gap-6 w-full">
              <div className="md:col-span-2 flex items-center gap-2">
                For Sale
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={product.productBasic.isForSale || false}
                    onChange={(e) =>
                      setProduct(
                        produce(product, (draft) => {
                          draft.productBasic.isForSale = e.target.checked;
                        })
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-700 peer-checked:bg-blue-600 transition-all"></div>
                  <div className="absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-all peer-checked:translate-x-3.5"></div>
                </label>
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                Track Stock
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={product.productBasic.trackStock || false}
                    onChange={(e) =>
                      setProduct(
                        produce(product, (draft) => {
                          draft.productBasic.trackStock = e.target.checked;
                        })
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-700 peer-checked:bg-blue-600 transition-all"></div>
                  <div className="absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-all peer-checked:translate-x-3.5"></div>
                </label>
              </div>
            </div>
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
