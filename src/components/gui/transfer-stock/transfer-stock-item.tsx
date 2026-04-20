"use client";
import { OrderDetail } from "@/classes/order";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Card, CardContent } from "@/components/ui/card";
import { FindProductInSlotResult } from "@/classes/find-product-in-slot";
import { AlertTriangle, CheckCircle, ArrowRight, Package2 } from "lucide-react";

interface Props {
  item: OrderDetail;
  invoice: number;
  onCompletedTransfer?: () => void;
  slots: FindProductInSlotResult[] | undefined;
}

export function TransferStockItem(props: Props) {
  const images = props.item.productVariant?.basicProduct?.images.find(
    (f) => f.productVariantId === props.item.variantId
  );

  const slotsNeedingTransfer =
    props.slots?.filter((slot) => slot.slot && !slot.slot.posSlot) || [];
  const posReadySlots =
    props.slots?.filter((slot) => slot.slot && slot.slot.posSlot) || [];
  const emptySlots = props.slots?.filter((slot) => !slot.slot) || [];
  const totalQuantity =
    props.slots?.reduce((sum, slot) => sum + (slot.qty || 0), 0) || 0;

  return (
    <Card className="border-l-4 border-l-blue-400 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Product Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <ImageWithFallback
              alt={props.item.title}
              title={props.item.title.charAt(0).toUpperCase()}
              className="w-12 h-12 border rounded-lg object-contain bg-gray-50"
              height={48}
              src={images?.url}
              width={48}
            />
            {totalQuantity > 0 && (
              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalQuantity}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate text-gray-800">
              {props.item.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
              <span>SKU: {props.item.sku}</span>
              <span>•</span>
              <span className="font-medium text-green-600">
                ${props.item.price}
              </span>
            </div>
          </div>
        </div>

        {/* Stock Locations - Simplified */}
        <div className="space-y-2">
          {/* Transfer Required - Simplified */}
          {slotsNeedingTransfer.map((slot, index) => (
            <div
              key={`transfer-${index}`}
              className="flex items-center justify-between bg-orange-50 rounded p-3 text-sm border border-orange-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                <Package2 className="h-4 w-4 text-orange-600" />
                <div>
                  <div className="font-medium text-gray-800">
                    {slot.slot?.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {slot.stock} units available
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-orange-600">
                <ArrowRight className="h-4 w-4" />
                <span className="text-xs font-medium">Transfer</span>
              </div>
            </div>
          ))}

          {/* POS Ready - Simplified */}
          {posReadySlots.map((slot, index) => (
            <div
              key={`pos-${index}`}
              className="flex items-center justify-between bg-green-50 rounded p-3 text-sm border border-green-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <Package2 className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium text-gray-800">
                    {slot.slot?.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {slot.qty} units ready
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Ready</span>
              </div>
            </div>
          ))}

          {/* No Stock - Simplified */}
          {emptySlots.map((slot, index) => (
            <div
              key={`empty-${index}`}
              className="flex items-start gap-3 bg-red-50 rounded p-3 text-sm border border-red-200"
            >
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-red-800">Out of Stock</div>
                <div className="text-xs text-red-600 mt-1">{slot.message}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
