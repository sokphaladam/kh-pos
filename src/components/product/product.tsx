"use client";
import { useDeleteProduct } from "@/app/hooks/use-query-product";
import { ProductV2 } from "@/classes/product-v2";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { Formatter } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Package,
  Tag,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { useAuthentication } from "../../../contexts/authentication-context";
import { BasicMenuAction } from "../basic-menu-action";
import { useCommonDialog } from "../common-dialog";
import { sheetProduct } from "../gui/product/sheet-product";
import { sheetProductStockIn } from "../gui/product/sheet-product-stock-in";
import { sheetProductStockOut } from "../gui/product/sheet-product-stock-out";
import { sheetProductTransaction } from "../gui/product/sheet-product-transaction";
import { sheetSupplierProductPriceList } from "../gui/supplier-product-price/sheet-supplier-product-price-list";
import { ImageWithFallback } from "../image-with-fallback";
import { Button } from "../ui/button";
import { useWindowSize } from "../use-window-size";
import { productDialog } from "./dialog-product";
import { printLabel } from "./print-label";

export function Product({
  product,
  onDelete,
  onCompleted,
  index,
  viewMode = "auto",
}: {
  product: ProductV2;
  onDelete?: (id: string) => void;
  onCompleted?: () => void;
  index: number;
  viewMode?: "mobile" | "desktop" | "auto";
}) {
  const { currentWarehouse, currency } = useAuthentication();
  const { showDialog } = useCommonDialog();
  const { push } = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const deleteProduct = useDeleteProduct();

  // Check if we're in barcode search mode and auto-expand variants
  const isBarcodeSearch = searchParams.get("barcode") !== null;
  const [showStock, setShowStock] = useState(isBarcodeSearch);
  const windowSize = useWindowSize();

  // Determine if mobile view should be used
  const isMobile =
    viewMode === "auto" ? windowSize.width < 768 : viewMode === "mobile";

  const onDeleteProduct = useCallback(
    (id: string) => {
      showDialog({
        title: "Delete user",
        content: `Are your sure want to delete product?`,
        actions: [
          {
            text: "Delete",
            onClick: async () => {
              const res = await deleteProduct?.trigger({ id });
              if (res?.success === true && onDelete) {
                onDelete(id);
              }
            },
          },
        ],
      });
    },
    [deleteProduct, onDelete, showDialog]
  );

  const onClickStockCounting = useCallback(
    async (variant: ProductVariantType) => {
      const res = await sheetProduct.show({
        product,
        variantId: variant.id,
      });
      if (res) {
        onCompleted?.();
      }
    },
    [onCompleted, product]
  );

  const onClickStockIn = useCallback(
    async (variant: ProductVariantType) => {
      const res = await sheetProductStockIn.show({
        product,
        variantId: variant.id,
      });
      if (res) {
        onCompleted?.();
      }
    },
    [product, onCompleted]
  );

  const onClickStockOut = useCallback(
    async (variant: ProductVariantType) => {
      const res = await sheetProductStockOut.show({
        product,
        variantId: variant.id,
      });
      if (res) {
        onCompleted?.();
      }
    },
    [product, onCompleted]
  );

  const price =
    product.productVariants?.length > 0
      ? product.productVariants[0].price || 0
      : 0;

  const hasLowStock =
    product.trackStock &&
    !!product.productVariants?.find(
      (f) => Number(f.stock || 0) < Number(f.lowStockQty || 0)
    );

  let allow = false;
  if (currentWarehouse?.isMain) {
    allow = true;
  }

  const hasConversion =
    product?.productConversions && product.productConversions.length > 0;

  const totalStock = hasConversion
    ? 0
    : product.productVariants?.reduce(
        (acc, variant) => acc + (variant.stock || 0),
        0
      ) || 0;

  // Mobile Card View
  const renderMobileCard = (
    <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-500 card-hover">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-row gap-2">
              <div
                key={product.id}
                className="w-12 h-12 relative cursor-pointer product-image-hover"
                onClick={() => {
                  productDialog.show({
                    image: product.productImages || [],
                  });
                }}
              >
                <ImageWithFallback
                  alt="Product image"
                  className="w-12 h-12 border border-gray-200 rounded-lg object-contain"
                  height={48}
                  src={product.productImages[0]?.url}
                  width={48}
                />
              </div>
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-gray-900 mb-1 truncate max-w-[200px]">
                {product.title}
              </CardTitle>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  <Package className="w-3 h-3 mr-1" />
                  {product.productVariants?.length || 0} variants
                </Badge>
                {hasLowStock && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Low Stock
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {allow && (
            <BasicMenuAction
              resource="product"
              onEdit={() => {
                push(`${pathname}/edit/${product.id}`);
              }}
              onDelete={() => {
                onDeleteProduct(product.id);
              }}
              value={product}
              disabled={deleteProduct?.isMutating}
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
            <span className="text-xs">Stock: </span>
            <span
              className={cn(
                "font-medium ml-1 text-xs",
                hasLowStock ? "text-red-600" : "text-gray-900"
              )}
            >
              {hasConversion ? "N/A" : totalStock}
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="w-4 h-4 mr-2 text-green-600" />
            <span className="text-xs">Price: </span>
            <span className="font-medium ml-1 text-xs text-gray-900">
              {product.productVariants?.every((v) => v.price === price)
                ? `${currency}${price}`
                : "Varies"}
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Tag className="w-4 h-4 mr-2 text-purple-600" />
            <span className="text-xs">Category: </span>
            <span className="font-medium ml-1 text-xs text-gray-900 truncate">
              {product.productCategories?.length > 0
                ? product.productCategories.map((x) => x.title).join(", ")
                : "N/A"}
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-orange-600" />
            <span className="text-xs">Created: </span>
            <span className="font-medium ml-1 text-xs text-gray-900 truncate">
              {product.createdAt
                ? new Date(product.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "2-digit",
                  })
                : "N/A"}
            </span>
          </div>
        </div>

        {product.productVariants?.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowStock(!showStock)}
              className="text-xs transition-all duration-200"
            >
              {showStock ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide Variants
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show Variants ({product.productVariants.length})
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Desktop Table View
  const renderDesktopRow = (
    <TableRow className="hover:bg-gray-50 transition-colors h-12">
      <TableCell className="font-medium text-xs py-2 h-12 w-[140px]">
        <div className="flex flex-row items-center gap-2 h-full">
          <div className="text-xs w-5 text-center text-gray-500">
            {index + 1}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-6 w-6 p-0 transition-transform duration-200",
              product.productVariants?.length > 0 ? "visible" : "invisible"
            )}
            onClick={() => {
              setShowStock(!showStock);
            }}
          >
            {showStock ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
          <div className="flex flex-row gap-1">
            <div
              key={product.id}
              className="w-8 h-8 relative cursor-pointer product-image-hover"
              onClick={() => {
                productDialog.show({ image: product.productImages || [] });
              }}
            >
              <ImageWithFallback
                alt="Product image"
                className="w-8 h-8 border border-gray-200 rounded-md object-contain"
                height={32}
                src={product.productImages[0]?.url}
                width={32}
              />
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="font-medium text-sm w-[180px] max-w-[180px]">
        <div className="flex flex-col">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-medium text-gray-900 truncate cursor-help">
                  {product.title}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{product.title}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {hasLowStock && (
            <Badge variant="destructive" className="w-fit mt-1 text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Low Stock
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm text-center w-[90px]">
        <Badge variant="outline" className="text-xs">
          {product.productVariants?.length || 0}
        </Badge>
      </TableCell>
      <TableCell
        className={cn(
          "text-sm font-medium text-center w-[80px]",
          hasLowStock ? "text-red-600" : "text-gray-900"
        )}
      >
        {hasConversion ? (
          <div className="flex items-center justify-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ArrowLeftRight className="w-3 h-3 text-blue-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Has unit conversion</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : (
          totalStock
        )}
      </TableCell>
      <TableCell className="text-sm font-medium text-center w-[80px]">
        <span className="text-green-600">
          {product.productVariants?.every((v) => v.price === price) ? (
            `${currency}${price}`
          ) : (
            <Badge variant="outline" className="text-xs">
              Varies
            </Badge>
          )}
        </span>
      </TableCell>
      <TableCell className="text-sm w-[140px] max-w-[140px]">
        <div className="flex flex-wrap gap-1">
          {product.productCategories?.length > 0 ? (
            product.productCategories.slice(0, 1).map((category, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {category.title}
              </Badge>
            ))
          ) : (
            <span className="text-gray-400 text-xs">No category</span>
          )}
          {product.productCategories?.length > 1 && (
            <Badge variant="outline" className="text-xs">
              +{product.productCategories.length - 1}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm text-gray-600 w-[100px]">
        {Formatter.date(product.createdAt)}
      </TableCell>
      <TableCell>
        {allow && (
          <BasicMenuAction
            resource="product"
            onEdit={() => {
              push(`${pathname}/edit/${product.id}`);
            }}
            onDelete={() => {
              onDeleteProduct(product.id);
            }}
            value={product}
            disabled={deleteProduct?.isMutating}
          />
        )}
      </TableCell>
    </TableRow>
  );

  const renderProductItem = isMobile ? renderMobileCard : renderDesktopRow;

  return (
    <>
      {renderProductItem}
      {product.productVariants?.length > 0 &&
        !!showStock &&
        product.productVariants.map((variant) => {
          const images = product.productImages.filter(
            (f) => f.productVariantId === variant.id
          );

          if (isMobile) {
            // Mobile variant card
            return (
              <Card
                key={variant.id}
                className="ml-4 mr-4 mb-2 shadow-sm border-l-4 border-l-gray-300 product-variant-expand"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <ImageWithFallback
                        src={images[0]?.url}
                        className="border border-gray-200 object-contain rounded-sm bg-gray-50 product-image-hover"
                        alt="Variant"
                        width={32}
                        height={32}
                      />

                      <div>
                        <div className="text-xs font-medium text-gray-600">
                          {variant.barcode}
                        </div>
                        <div className="text-xs text-gray-500">
                          {variant.optionValues.map((x) => x.value).join(" / ")}
                        </div>
                      </div>
                    </div>
                    <BasicMenuAction
                      resource="product"
                      value={variant}
                      items={[
                        {
                          label: "Transaction",
                          onClick: async () =>
                            await sheetProductTransaction.show({
                              product,
                              variantId: variant.id,
                            }),
                        },
                        {
                          label: "Count",
                          onClick: () => onClickStockCounting(variant),
                        },
                        {
                          label: "Stock In",
                          onClick: () => onClickStockIn(variant),
                        },
                        {
                          label: "Stock Out",
                          onClick: () => onClickStockOut(variant),
                        },
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center text-xs">
                      <BarChart3 className="w-3 h-3 mr-2 text-blue-600" />
                      <span className="text-gray-600">Stock: </span>
                      <span
                        className={cn(
                          "font-medium ml-1",
                          Number(variant.stock || 0) <
                            Number(variant.lowStockQty || 0)
                            ? "text-red-600"
                            : "text-gray-900"
                        )}
                      >
                        {variant.stock}
                      </span>
                    </div>

                    <div className="flex items-center text-xs">
                      <DollarSign className="w-3 h-3 mr-2 text-green-600" />
                      <span className="text-gray-600">Price: </span>
                      <span className="font-medium ml-1 text-gray-900">
                        {currency}
                        {variant.price}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          } else {
            // Desktop variant row
            return (
              <TableRow
                key={variant.id}
                className="bg-gray-50 hover:bg-gray-100 transition-all duration-200 border-l-4 border-l-gray-300 h-10"
              >
                <TableCell className="font-medium text-xs py-1 h-10 w-[140px]">
                  <div className="flex flex-row items-center gap-2 h-full">
                    <div className="text-xs w-5 text-center text-gray-400">
                      ↳
                    </div>
                    <div className="h-6 w-6 p-0"></div>
                    <div className="flex flex-row gap-1">
                      {images?.length > 0 && (
                        <ImageWithFallback
                          src={images[0].url}
                          className="border border-gray-200 object-contain rounded-md bg-white"
                          alt="Variant"
                          width={32}
                          height={32}
                        />
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-medium w-[180px] max-w-[180px]">
                  <div className="flex flex-col">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help truncate block font-medium text-gray-900">
                            {variant.optionValues
                              .map((x) => x.value)
                              .join(" / ")}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            {variant.optionValues
                              .map((x) => x.value)
                              .join(" / ")}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="text-xs text-gray-500">
                      SKU: {variant.barcode || "N/A"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-center w-[90px]">
                  {/* Empty - no variant count display */}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-xs font-medium text-center w-[80px]",
                    Number(variant.stock || 0) <
                      Number(variant.lowStockQty || 0)
                      ? "text-red-600"
                      : "text-gray-900"
                  )}
                >
                  {variant.stock}
                </TableCell>
                <TableCell className="text-xs font-medium text-center text-green-600 w-[80px]">
                  {currency}
                  {variant.price}
                </TableCell>
                <TableCell className="w-[140px]"></TableCell>
                <TableCell className="w-[100px]"></TableCell>
                <TableCell className="w-[80px]">
                  <BasicMenuAction
                    value={variant}
                    items={[
                      {
                        label: "Inventory",
                        onClick: () => {},
                        items: [
                          {
                            label: "Transaction",
                            onClick: async () =>
                              await sheetProductTransaction.show({
                                product,
                                variantId: variant.id,
                              }),
                          },
                          {
                            label: "Count",
                            onClick: () => onClickStockCounting(variant),
                          },
                          {
                            label: "Stock In",
                            onClick: () => onClickStockIn(variant),
                          },
                          {
                            label: "Stock Out",
                            onClick: () => onClickStockOut(variant),
                          },
                        ],
                      },
                      {
                        label: "Supplier",
                        onClick: () => {},
                        items: [
                          {
                            label: "Set Supplier Price",
                            onClick: async () => {
                              await sheetSupplierProductPriceList.show({
                                productVariantId: variant.id,
                                productName: `${product.title} (${variant.name})`,
                                productPrice: Number(variant.price || 0),
                              });
                            },
                          },
                        ],
                      },
                      {
                        label: "Print Label",
                        onClick: () => {
                          printLabel.show({ data: variant });
                        },
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            );
          }
        })}
    </>
  );
}
