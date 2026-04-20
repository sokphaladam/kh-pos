import { ImageWithFallback } from "@/components/image-with-fallback";
import SearchProductPicker from "@/components/search-product-picker";
import SupplierPicker from "@/components/supplier-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { MaterialInput } from "@/components/ui/material-input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthentication } from "contexts/authentication-context";
import { AlertCircle, Package } from "lucide-react";
import moment from "moment-timezone";
import { useForm } from "react-hook-form";
import {
  formSupplierProductPriceSchema,
  formSupplierProductPriceType,
} from "./form-supplier-product-price-schema";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

interface Props {
  initialData?: formSupplierProductPriceType;
  onSave?: (value: formSupplierProductPriceType) => void;
  isEdit?: boolean;
  loading?: boolean;
  disableProduct?: boolean;
}

export function FormSupplierProductPrice({
  initialData,
  onSave,
  isEdit,
  loading,
  disableProduct,
}: Props) {
  const { getSymbol } = useCurrencyFormat();
  const { user, currency } = useAuthentication();
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<formSupplierProductPriceType>({
    resolver: zodResolver(formSupplierProductPriceSchema),
    defaultValues: {
      supplierId: initialData?.supplierId || "",
      productVariantId: initialData?.productVariantId || "",
      price: initialData?.price || 0,
      effectDate: initialData?.effectDate || undefined,
      scheduledPrice: initialData?.scheduledPrice || undefined,
      scheduledAt: initialData?.scheduledAt || undefined,
      productTitle: initialData?.productTitle || "",
      productImage: initialData?.productImage || "",
      productPrice: initialData?.productPrice || 0,
      productSku: initialData?.productSku || "",
      productStock: initialData?.productStock || 0,
      productBarcode: initialData?.productBarcode || "",
    },
  });

  const productTitle = watch("productTitle");
  const productImage = watch("productImage");
  const productPrice = watch("productPrice");
  const productSku = watch("productSku");
  const productStock = watch("productStock");
  const productBarcode = watch("productBarcode");
  const productVariantId = watch("productVariantId");
  const supplierId = watch("supplierId");
  const priceValue = watch("price");
  const scheduledPriceValue = watch("scheduledPrice");
  const scheduledAtValue = watch("scheduledAt");

  const onSubmit = async (data: formSupplierProductPriceType) => {
    onSave?.(data);
  };

  const hasSelectedProduct = productVariantId && productTitle;

  const getStockStatus = (stock?: number) => {
    if (!stock || stock <= 0)
      return {
        variant: "destructive" as const,
        label: "Out of Stock",
        icon: AlertCircle,
      };
    if (stock < 5)
      return {
        variant: "secondary" as const,
        label: "Low Stock",
        icon: AlertCircle,
      };
    return { variant: "default" as const, label: "In Stock", icon: Package };
  };

  const stockStatus = getStockStatus(productStock);

  if (isEdit && !!disableProduct) {
  } else if (!isEdit && !!disableProduct) {
  }

  // isEdit || disableProduct => true

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {/* Product & Supplier Selection */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-1.5 text-base font-medium">
            <Package className="w-4 h-4" />
            {isEdit ? "Product & Supplier" : "Supplier"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {/* Product Information (Compact) */}
          {hasSelectedProduct && (
            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded border border-gray-200 bg-white">
                  {productImage ? (
                    <ImageWithFallback
                      src={productImage}
                      alt={productTitle}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <Package className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-medium text-gray-900 truncate text-xs"
                    title={productTitle}
                  >
                    {productTitle}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    {productSku && (
                      <span className="font-mono">{productSku}</span>
                    )}
                    {productBarcode && (
                      <span className="font-mono">{productBarcode}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600">Price</div>
                  <div className="text-sm font-semibold text-green-600">
                    {currency}
                    {Number(productPrice || 0).toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600">Stock</div>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant={stockStatus.variant}
                      className="text-xs px-1 py-0"
                    >
                      {productStock || 0}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Product Selection */}
            {!!isEdit || !!disableProduct ? (
              <></>
            ) : (
              <div className="space-y-1.5">
                <SearchProductPicker
                  warehouse={user?.currentWarehouseId}
                  value={productTitle}
                  onChange={(item) => {
                    setValue("productVariantId", item.variantId);
                    setValue("productTitle", item.productTitle);
                    setValue(
                      "productImage",
                      item.images?.find(
                        (f) => f.productVariantId === item.variantId,
                      )?.url || "",
                    );
                    setValue("productPrice", Number(item.price || 0));
                    setValue("productSku", String(item.sku || ""));
                    setValue("productStock", item.stock || 0);
                    setValue("productBarcode", item.barcode || "");
                  }}
                  disabled={loading}
                  includeProductNotForSale
                />
                {errors.productVariantId && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.productVariantId.message}
                  </p>
                )}
              </div>
            )}

            {/* Supplier Selection */}
            <div className="space-y-1.5">
              <SupplierPicker
                value={supplierId}
                onChange={(supplier) => {
                  setValue("supplierId", supplier?.id || "");
                }}
                allowCreateNew={true}
                required={true}
                error={errors.supplierId && errors.supplierId.message}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Information */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-1.5 text-base font-medium">
            <div className="flex flex-row items-center gap-2">
              <div className="text-xl">{getSymbol()}</div>
              <div>Pricing</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Supplier Price */}
            <div className="space-y-1.5">
              <MaterialInput
                type="number"
                value={priceValue?.toString() || ""}
                label="Supplier Price *"
                placeholder="0.00"
                step="0.01"
                min="0"
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || value === null || value === undefined) {
                    setValue("price", 0, { shouldValidate: true });
                  } else {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      setValue("price", numValue, { shouldValidate: true });
                    }
                  }
                }}
                className="h-9"
                error={errors.price && errors.price.message}
                disabled={loading || isSubmitting}
              />
            </div>

            {/* Scheduled Price (only in edit mode) */}
            {isEdit && (
              <>
                <div className="space-y-1.5">
                  <MaterialInput
                    type="number"
                    value={scheduledPriceValue ?? ""}
                    label="Scheduled Price"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (
                        value === "" ||
                        value === null ||
                        value === undefined
                      ) {
                        setValue("scheduledPrice", undefined, {
                          shouldValidate: true,
                        });
                      } else {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          setValue("scheduledPrice", numValue, {
                            shouldValidate: true,
                          });
                        }
                      }
                    }}
                    className="h-9"
                    error={
                      errors.scheduledPrice && errors.scheduledPrice.message
                    }
                    disabled={loading || isSubmitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <DatePicker
                    label="Scheduled Date"
                    onChange={(date) => {
                      if (date) {
                        setValue(
                          "scheduledAt",
                          moment(date).format("YYYY-MM-DD"),
                        );
                      }
                    }}
                    initialValue={
                      scheduledAtValue ? new Date(scheduledAtValue) : undefined
                    }
                    error={errors.scheduledAt && errors.scheduledAt.message}
                    disabled={loading || isSubmitting}
                  />
                </div>
              </>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={
                isSubmitting || loading || !hasSelectedProduct || !supplierId
              }
              size="sm"
              className="min-w-[100px] h-8"
            >
              {isSubmitting || loading ? (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
