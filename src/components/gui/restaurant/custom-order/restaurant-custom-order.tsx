import { createSheet } from "@/components/create-sheet";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  ProductModifierType,
  ProductVariantType,
} from "@/dataloader/product-variant-loader";
import { RestaurantCustomOrderInfo } from "./restaurant-custom-order-info";
import { RestaurantCustomOrderQty } from "./restaurant-custom-order-qty";
import { useMemo, useState } from "react";
import { RestaurantCustomOrderModifier } from "./restaurant-custom-order-modifier";
import { RestaurantCustomOrderComment } from "./restaurant-custom-order-comment";
import { OrderItemStatusType } from "@/dataloader/order-status-item.loader";
import { table_restaurant_tables } from "@/generated/tables";
import { RestaurantCustomDiscount } from "./restaurant-custom-discount";
import { RestaurantOrderItem } from "../contexts/restaurant-context";
import { OrderModifierType } from "@/dataloader/order-modifier-loader";

export interface SelectProductItem extends Omit<ProductVariantType, "price"> {
  quantity: number;
  notes?: OrderModifierType;
  modifiers?: ProductModifierType[];
  selectedModifiers: string[];
  price?: number | null;
  discount?: {
    discountType: "AMOUNT" | "PERCENTAGE";
    value: number;
    discountAmount: number;
  };
}

interface Props {
  selectedMenuItem: SelectProductItem;
  orderItem: RestaurantOrderItem;
  productId?: string;
  allowDiscount?: boolean;
  orderId?: string;
  orderDetailId?: string;
  status?: OrderItemStatusType[];
  table?: table_restaurant_tables;
}

export const restaurantCustomOrder = createSheet<Props, unknown>(
  ({
    selectedMenuItem,
    orderDetailId,
    orderId,
    status,
    table,
    orderItem,
    close,
  }) => {
    const [statusInput, setStatusInput] = useState<OrderItemStatusType[]>(
      status ? status : []
    );
    const [selectedModifiers, setSelectedModifiers] = useState<string[]>(
      selectedMenuItem.selectedModifiers || []
    );
    const [notes, setNotes] = useState<OrderModifierType>(
      selectedMenuItem.notes ?? {
        modifierItemId: "",
        orderDetailId: orderDetailId || "",
        notes: "",
        price: 0,
      }
    );

    const manualDiscount = useMemo(
      () => orderItem.discounts?.find((f) => f.discountId === "manual"),
      [orderItem]
    );
    const promotion = useMemo(
      () =>
        orderItem.discounts
          ?.filter((f) => f.discountId !== "manual")
          .map((d) => {
            return {
              ...d,
              id: d.id || "",
              discountId: d.discountId || "",
              name: d.name,
              amount: d.amount?.toString() ?? "0",
              discountType: d.discountType || "AMOUNT",
              orderDetailId: d.orderDetailId || "",
              productId: selectedMenuItem.productId || "",
              title: d.name || "",
              description: "",
              warehouseId: "",
              updatedAt: "",
              value: d.value || 0,
              createdAt: d.createdAt || "",
            };
          }) || [],
      [orderItem, selectedMenuItem]
    );

    const [discount, setDiscount] = useState([
      {
        ...manualDiscount,
        id: manualDiscount?.id || "",
        discountId: manualDiscount?.discountId || "",
        amount: manualDiscount?.amount?.toString() ?? "0",
        discountType: manualDiscount?.discountType || "AMOUNT",
        productId: orderItem.productVariant?.basicProduct?.id || "",
        title: manualDiscount?.name || "",
        description: "",
        updatedAt: "",
        value: manualDiscount?.value || 0,
        createdAt: manualDiscount?.createdAt || "",
        warehouseId: "",
      },
      ...promotion,
    ]);

    return (
      <>
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl font-bold text-foreground">
            Customize Your Order
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-6 overflow-y-auto">
          {/* Product Information */}
          <RestaurantCustomOrderInfo product={selectedMenuItem} />
          {/* Product Quantity */}
          <RestaurantCustomOrderQty
            product={selectedMenuItem}
            status={statusInput}
            orderId={orderId || ""}
            orderDetailId={orderDetailId || ""}
            table={table}
            onChange={(v) => {
              if (v) {
                setStatusInput(v);
              } else {
                close(null);
              }
            }}
          />
          {/* Modifiers Section */}
          <RestaurantCustomOrderModifier
            product={selectedMenuItem}
            selectedModifiers={selectedModifiers}
            setSelectedModifiers={setSelectedModifiers}
            orderDetailId={orderDetailId || ""}
            orderId={orderId || ""}
            table={table}
          />
          {/* Special Instructions */}
          <RestaurantCustomOrderComment
            notes={notes}
            setNotes={setNotes}
            orderId={orderId || ""}
            orderDetailId={orderDetailId || ""}
            table={table}
          />
          {/* Discount Section */}
          <RestaurantCustomDiscount
            orderId={orderId}
            cart={{
              id: orderItem.orderDetailId,
              discountValue: Number(orderItem.discountAmount),
              khr: 0,
              productId: orderItem.productVariant?.productId || "",
              productTitle: orderItem.title,
              totalAfterDiscount: Number(orderItem.totalAmount),
              usd: Number(orderItem.totalAmount),
              warehouseId: "",
              qty: orderItem.status?.reduce((a, b) => a + b.qty, 0) || 0,
              variantId: orderItem.productVariant?.id || "",
              discounts: discount,
            }}
            table={table}
            onDiscountChange={setDiscount}
          />
        </div>
      </>
    );
  },
  { defaultValue: null }
);
