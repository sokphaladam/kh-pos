import { PurchaseOrderItem } from "@/classes/purchase-order-service";
import { ItemReceiveStatus, ReceiveData, ReceiveMode } from "./types";

/**
 * Categorizes items by their receive status
 */
export function categorizeItemsByStatus(
  items: PurchaseOrderItem[]
): ItemReceiveStatus {
  return items.reduce(
    (acc, item) => {
      const receivedPercent = item.qty ? (item.receivedQty || 0) / item.qty : 0;

      if (receivedPercent === 0) {
        acc.pending.push(item);
      } else if (receivedPercent < 1) {
        acc.partial.push(item);
      } else {
        acc.completed.push(item);
      }
      return acc;
    },
    { pending: [], partial: [], completed: [] } as ItemReceiveStatus
  );
}

/**
 * Sorts items with pending items on top, partially received in middle, and fully received at bottom
 */
export function sortItemsByName(
  items: PurchaseOrderItem[],
  direction: "asc" | "desc" | null
): PurchaseOrderItem[] {
  // Separate items by receive status
  const pendingItems = items.filter((item) => {
    const receivedPercent = item.qty ? (item.receivedQty || 0) / item.qty : 0;
    return receivedPercent === 0;
  });

  const partialItems = items.filter((item) => {
    const receivedPercent = item.qty ? (item.receivedQty || 0) / item.qty : 0;
    return receivedPercent > 0 && receivedPercent < 1;
  });

  const fullyReceivedItems = items.filter((item) => {
    const receivedPercent = item.qty ? (item.receivedQty || 0) / item.qty : 0;
    return receivedPercent >= 1;
  });

  // Sort function for items by name
  const sortByName = (a: PurchaseOrderItem, b: PurchaseOrderItem) => {
    const aName = a.name || "";
    const bName = b.name || "";
    if (direction === "asc") {
      return aName.localeCompare(bName);
    } else if (direction === "desc") {
      return bName.localeCompare(aName);
    }
    return 0; // No sorting when direction is null
  };

  // Sort each group if direction is specified
  let sortedPending = pendingItems;
  let sortedPartial = partialItems;
  let sortedFullyReceived = fullyReceivedItems;

  if (direction) {
    sortedPending = [...pendingItems].sort(sortByName);
    sortedPartial = [...partialItems].sort(sortByName);
    sortedFullyReceived = [...fullyReceivedItems].sort(sortByName);
  }

  // Order: pending first, then partial, then fully received at bottom
  return [...sortedPending, ...sortedPartial, ...sortedFullyReceived];
}

/**
 * Creates initial receive data for items based on receive mode
 */
export function createInitialReceiveData(
  items: PurchaseOrderItem[],
  receiveMode: ReceiveMode
): { data: Record<string, ReceiveData>; selected: Set<string> } {
  const initialData: Record<string, ReceiveData> = {};
  const selected = new Set<string>();

  items.forEach((item) => {
    const maxQty = (item.qty || 0) - (item.receivedQty || 0);
    if (maxQty > 0) {
      // Auto-select based on mode
      if (receiveMode === "full" || receiveMode === "partial") {
        selected.add(item.id || "");
      }

      // Smart quantity defaults
      let defaultQty = maxQty;
      if (receiveMode === "partial") {
        // For partial mode, default to 50% of remaining or minimum 1
        defaultQty = Math.max(1, Math.floor(maxQty * 0.5));
      }

      initialData[item.id || ""] = {
        purchaseOrderDetailId: item.id || "",
        slotId: "",
        slotName: "",
        qty: defaultQty,
        costPerUnit: Number(item.purchaseCost || 0),
        expiredAt: undefined,
        lotNumber: undefined,
      };
    }
  });

  return { data: initialData, selected };
}

/**
 * Validates receive data before submission
 */
export function validateReceiveData(
  selectedItems: Set<string>,
  receiveData: Record<string, ReceiveData>,
  items: PurchaseOrderItem[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  selectedItems.forEach((itemId) => {
    const data = receiveData[itemId];
    const item = items.find((i) => i.id === itemId);

    if (!data || !item) return;

    if (!data.qty || data.qty <= 0) {
      errors.push(`${item.name}: Quantity must be greater than 0`);
      return;
    }

    if (!data.slotId) {
      errors.push(`${item.name}: Slot is required`);
      return;
    }

    const maxQty = (item.qty || 0) - (item.receivedQty || 0);
    if (data.qty > maxQty) {
      errors.push(`${item.name}: Quantity exceeds available (${maxQty})`);
      return;
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
