"use client";
import { useState, useMemo } from "react";
import { FindProductInSlotResult } from "@/classes/find-product-in-slot";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRightLeft,
  Package,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ImageWithFallback } from "@/components/image-with-fallback";

// Helper function to get variant proper name
function getVariantProperName(variant: ProductVariantType | null): string {
  if (!variant) return "";
  return variant.name || String(variant.sku) || "";
}

interface CategorizedStock {
  transferItems: FindProductInSlotResult[];
  conversionItems: FindProductInSlotResult[];
  noStockItems: FindProductInSlotResult[];
  availableItems: FindProductInSlotResult[];
}

interface StockActionListProps {
  items: FindProductInSlotResult[];
  onTransfer?: (items: FindProductInSlotResult[]) => void;
  onConvert?: (item: FindProductInSlotResult) => void;
  showAvailable?: boolean;
  showNoStock?: boolean;
  compact?: boolean;
}

export function StockActionList({
  items,
  onTransfer,
  onConvert,
  showAvailable = false,
  showNoStock = false,
  compact = false,
}: StockActionListProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Categorize items based on their status and action needed
  const categorizedStock: CategorizedStock = useMemo(() => {
    return {
      transferItems: items.filter(
        (item) =>
          item.todoType === "TRANSFER" && item.slot && !item.slot.posSlot
      ),
      conversionItems: items.filter((item) =>
        ["BREAK", "REPACK", "MIXED"].includes(item.todoType || "")
      ),
      noStockItems: items.filter(
        (item) =>
          !item.slot &&
          item.qty > 0 &&
          !["BREAK", "REPACK", "MIXED"].includes(item.todoType || "")
      ),
      availableItems: items.filter(
        (item) => item.todoType === "NOTHING" && item.slot?.posSlot
      ),
    };
  }, [items]);

  const totalActionableItems =
    categorizedStock.transferItems.length +
    categorizedStock.conversionItems.length;

  if (totalActionableItems === 0 && !showAvailable && !showNoStock) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
        <p className="text-lg font-medium text-gray-900">
          All items are ready!
        </p>
        <p className="text-sm">No stock transfers or conversions needed.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* Items to Transfer */}
        {categorizedStock.transferItems.length > 0 && (
          <StockCategoryCard
            title="Items to Transfer"
            count={categorizedStock.transferItems.length}
            icon={<ArrowRightLeft className="h-4 w-4" />}
            variant="warning"
            tooltip="Items available in warehouse but need to be moved to POS"
            compact={compact}
            action={
              onTransfer && (
                <Button
                  size="sm"
                  onClick={() => onTransfer(categorizedStock.transferItems)}
                  className="h-7 px-2 text-xs"
                >
                  Transfer All
                </Button>
              )
            }
          >
            <div className="space-y-2">
              {categorizedStock.transferItems.map((item, idx) => (
                <ProductItem key={idx} item={item} showSlot compact={compact} />
              ))}
            </div>
          </StockCategoryCard>
        )}

        {/* Items for Conversion */}
        {categorizedStock.conversionItems.length > 0 && (
          <StockCategoryCard
            title="Items for Conversion"
            count={categorizedStock.conversionItems.length}
            icon={<Package className="h-4 w-4" />}
            variant="info"
            tooltip="Items that need unit conversion from other variants"
            compact={compact}
            action={
              onConvert && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    for (const item of categorizedStock.conversionItems) {
                      try {
                        await onConvert(item);
                      } catch (error) {
                        console.error("Conversion failed:", error);
                      }
                    }
                  }}
                  className="h-7 px-2 text-xs"
                >
                  Convert All
                </Button>
              )
            }
          >
            <div className="space-y-2">
              {categorizedStock.conversionItems.map((item, idx) => (
                <ConversionProductItem
                  key={idx}
                  item={item}
                  index={idx}
                  isExpanded={expandedItems.has(idx)}
                  onToggleExpand={() => {
                    const newExpanded = new Set(expandedItems);
                    if (newExpanded.has(idx)) {
                      newExpanded.delete(idx);
                    } else {
                      newExpanded.add(idx);
                    }
                    setExpandedItems(newExpanded);
                  }}
                  onConvert={onConvert ? () => onConvert(item) : undefined}
                  compact={compact}
                />
              ))}
            </div>
          </StockCategoryCard>
        )}

        {/* No Stock Items */}
        {showNoStock && categorizedStock.noStockItems.length > 0 && (
          <StockCategoryCard
            title="Unavailable Items"
            count={categorizedStock.noStockItems.length}
            icon={<AlertTriangle className="h-4 w-4" />}
            variant="destructive"
            tooltip="Items with insufficient stock across all slots"
            compact={compact}
          >
            <div className="space-y-2">
              {categorizedStock.noStockItems.map((item, idx) => (
                <ProductItem
                  key={idx}
                  item={item}
                  showMessage
                  compact={compact}
                />
              ))}
            </div>
          </StockCategoryCard>
        )}

        {/* Available Items */}
        {showAvailable && categorizedStock.availableItems.length > 0 && (
          <StockCategoryCard
            title="Available Items"
            count={categorizedStock.availableItems.length}
            icon={<CheckCircle className="h-4 w-4" />}
            variant="success"
            tooltip="Items already available in POS slots"
            compact={compact}
          >
            <div className="space-y-2">
              {categorizedStock.availableItems.map((item, idx) => (
                <ProductItem key={idx} item={item} compact={compact} />
              ))}
            </div>
          </StockCategoryCard>
        )}
      </div>
    </TooltipProvider>
  );
}

// Helper Components
interface StockCategoryCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  variant: "warning" | "info" | "destructive" | "success";
  tooltip: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  compact?: boolean;
}

function StockCategoryCard({
  title,
  count,
  icon,
  variant,
  tooltip,
  action,
  children,
  compact = false,
}: StockCategoryCardProps) {
  const variantStyles = {
    warning: "border-yellow-200 bg-yellow-50",
    info: "border-blue-200 bg-blue-50",
    destructive: "border-red-200 bg-red-50",
    success: "border-green-200 bg-green-50",
  };

  return (
    <Card className={`${variantStyles[variant]} border`}>
      <CardHeader className={compact ? "pb-2" : "pb-3"}>
        <CardTitle
          className={`flex items-center justify-between ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          <div className="flex items-center gap-2">
            {icon}
            <span>{title}</span>
            <Badge
              variant="secondary"
              className={`${compact ? "h-4 text-xs" : "h-5 text-xs"}`}
            >
              {count}
            </Badge>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          {action}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

interface ProductItemProps {
  item: FindProductInSlotResult;
  showSlot?: boolean;
  showMessage?: boolean;
  compact?: boolean;
}

function ProductItem({
  item,
  showSlot,
  showMessage,
  compact = false,
}: ProductItemProps) {
  const image = item.variant?.basicProduct?.images?.find(
    (img) => img.productVariantId === item.variant?.id
  );

  return (
    <div
      className={`flex items-center gap-3 ${
        compact ? "p-2" : "p-2"
      } bg-white rounded border`}
    >
      <ImageWithFallback
        alt={item.variant?.basicProduct?.title || ""}
        title={(item.variant?.basicProduct?.title || "")
          .charAt(0)
          .toUpperCase()}
        className={`${compact ? "w-6 h-6" : "w-8 h-8"} object-contain rounded`}
        height={compact ? 24 : 32}
        src={image?.url}
        width={compact ? 24 : 32}
      />
      <div className="flex-1 min-w-0">
        <p
          className={`${compact ? "text-xs" : "text-sm"} font-medium truncate`}
        >
          {item.variant?.basicProduct?.title}
        </p>
        <div
          className={`flex items-center gap-2 ${
            compact ? "text-xs" : "text-xs"
          } text-muted-foreground`}
        >
          <span>{getVariantProperName(item.variant)}</span>
          {showSlot && item.slot && (
            <>
              <span>•</span>
              <span className="text-blue-600">{item.slot.name}</span>
            </>
          )}
        </div>
        {showMessage && item.message && (
          <p className={`${compact ? "text-xs" : "text-xs"} text-red-600 mt-1`}>
            {item.message}
          </p>
        )}
      </div>
      <div className="text-right">
        <div className={`${compact ? "text-xs" : "text-sm"} font-semibold`}>
          {item.qty}
        </div>
        {item.stock > 0 && (
          <div
            className={`${
              compact ? "text-xs" : "text-xs"
            } text-muted-foreground`}
          >
            Stock: {item.stock}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConversionProductItemProps {
  item: FindProductInSlotResult;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onConvert?: (item: FindProductInSlotResult) => void;
  compact?: boolean;
}

function ConversionProductItem({
  item,
  isExpanded,
  onToggleExpand,
  onConvert,
  compact = false,
}: ConversionProductItemProps) {
  const image = item.variant?.basicProduct?.images?.find(
    (img) => img.productVariantId === item.variant?.id
  );

  const getConversionInfo = () => {
    if (item.todoType === "MIXED") {
      const breakdownCount = item.breakdownStockInfo?.length || 0;
      const repackCount = item.repackStockInfo?.length || 0;
      return `${breakdownCount} breakdown + ${repackCount} repack sources`;
    } else if (item.todoType === "BREAK") {
      const count = item.breakdownStockInfo?.length || 0;
      return `${count} breakdown source(s)`;
    } else if (item.todoType === "REPACK") {
      const count = item.repackStockInfo?.length || 0;
      return `${count} repack source(s)`;
    }
    return "";
  };

  const hasConversionDetails =
    (item.breakdownStockInfo && item.breakdownStockInfo.length > 0) ||
    (item.repackStockInfo && item.repackStockInfo.length > 0);

  return (
    <div className="space-y-2">
      <div
        className={`flex items-center gap-3 ${
          compact ? "p-2" : "p-2"
        } bg-white rounded border`}
      >
        <ImageWithFallback
          alt={item.variant?.basicProduct?.title || ""}
          title={(item.variant?.basicProduct?.title || "")
            .charAt(0)
            .toUpperCase()}
          className={`${
            compact ? "w-6 h-6" : "w-8 h-8"
          } object-contain rounded`}
          height={compact ? 24 : 32}
          src={image?.url}
          width={compact ? 24 : 32}
        />
        <div className="flex-1 min-w-0">
          <p
            className={`${
              compact ? "text-xs" : "text-sm"
            } font-medium truncate`}
          >
            {item.variant?.basicProduct?.title}
          </p>
          <div
            className={`flex items-center gap-2 ${
              compact ? "text-xs" : "text-xs"
            } text-muted-foreground`}
          >
            <span>{getVariantProperName(item.variant)}</span>
            <span>•</span>
            <Badge
              variant="outline"
              className={`${compact ? "h-3 text-xs" : "h-4 text-xs"}`}
            >
              {item.todoType}
            </Badge>
          </div>
          <div className="flex items-center gap-1 mt-1">
            {hasConversionDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
                className={`${
                  compact ? "h-4" : "h-5"
                } p-0 text-blue-600 hover:text-blue-800 text-xs`}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronRight className="h-3 w-3 mr-1" />
                )}
                {getConversionInfo()}
              </Button>
            )}
            {!hasConversionDetails && (
              <p className={`${compact ? "text-xs" : "text-xs"} text-blue-600`}>
                {getConversionInfo()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className={`${compact ? "text-xs" : "text-sm"} font-semibold`}>
              {item.qty}
            </div>
          </div>
          {onConvert && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onConvert(item)}
              className={`${compact ? "h-6 w-6" : "h-7 w-7"} p-0`}
            >
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Expanded conversion details */}
      {isExpanded && hasConversionDetails && (
        <div
          className={`${
            compact ? "ml-8" : "ml-11"
          } space-y-2 pl-3 border-l-2 border-gray-200`}
        >
          {/* Breakdown sources */}
          {item.breakdownStockInfo && item.breakdownStockInfo.length > 0 && (
            <div>
              <p
                className={`${
                  compact ? "text-xs" : "text-xs"
                } font-medium text-gray-700 mb-1`}
              >
                Breakdown sources:
              </p>
              {item.breakdownStockInfo.map((source, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 ${
                    compact ? "text-xs" : "text-xs"
                  } text-gray-600 py-1`}
                >
                  <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                  <span className="font-medium">{source.qty}x</span>
                  <span>{getVariantProperName(source.variant)}</span>
                  {source.slot && (
                    <>
                      <span>•</span>
                      <span className="text-blue-600">{source.slot.name}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Repack sources */}
          {item.repackStockInfo && item.repackStockInfo.length > 0 && (
            <div>
              <p
                className={`${
                  compact ? "text-xs" : "text-xs"
                } font-medium text-gray-700 mb-1`}
              >
                Repack sources:
              </p>
              {item.repackStockInfo.map((source, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 ${
                    compact ? "text-xs" : "text-xs"
                  } text-gray-600 py-1`}
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="font-medium">{source.qty}x</span>
                  <span>{getVariantProperName(source.variant)}</span>
                  {source.slot && (
                    <>
                      <span>•</span>
                      <span className="text-blue-600">{source.slot.name}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
