import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { PurchaseOrderItem } from "@/classes/purchase-order-service";
import { SlotDetail } from "@/classes/slot";
import { ReceivedItem } from "@/classes/receive-po";
import {
  ReceiveMode,
  ReceiveData,
  ReceiveFormState,
  ItemReceiveStatus,
} from "./types";
import {
  categorizeItemsByStatus,
  sortItemsByName,
  createInitialReceiveData,
  validateReceiveData,
} from "./utils";

export function useReceiveForm(items: PurchaseOrderItem[]) {
  const [receiveMode, setReceiveMode] = useState<ReceiveMode>("full");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [receiveData, setReceiveData] = useState<Record<string, ReceiveData>>(
    {}
  );
  const [globalSlot, setGlobalSlot] = useState<SlotDetail>();
  const [globalExpiry, setGlobalExpiry] = useState<Date>();
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null
  );

  // Sorted items based on sort direction
  const sortedItems = useMemo(
    () => sortItemsByName(items, sortDirection),
    [items, sortDirection]
  );

  // Categorize items by receive status (use original items, not sorted ones)
  const itemsByStatus: ItemReceiveStatus = useMemo(
    () => categorizeItemsByStatus(items),
    [items]
  );

  // Count items that have remaining quantity to receive
  const receivableItemsCount = useMemo(
    () =>
      items.filter((item) => (item.qty || 0) - (item.receivedQty || 0) > 0)
        .length,
    [items]
  );

  // Initialize data when items change
  useEffect(() => {
    if (items.length > 0) {
      const { data, selected } = createInitialReceiveData(items, receiveMode);
      setReceiveData(data);
      setSelectedItems(selected);
    }
  }, [items, receiveMode]);

  // Event handlers
  const handleModeChange = useCallback((mode: ReceiveMode) => {
    setReceiveMode(mode);
  }, []);

  const handleQuickReceive = useCallback(
    (category: keyof ItemReceiveStatus) => {
      let itemsToSelect: PurchaseOrderItem[];

      if (category === "pending") {
        // For "pending", select all items that have remaining quantity (both pending and partial)
        itemsToSelect = items.filter(
          (item) => (item.qty || 0) - (item.receivedQty || 0) > 0
        );
      } else {
        // For other categories, use the categorized items
        itemsToSelect = itemsByStatus[category];
      }

      const newSelected = new Set(selectedItems);

      itemsToSelect.forEach((item) => {
        const maxQty = (item.qty || 0) - (item.receivedQty || 0);
        if (maxQty > 0) {
          newSelected.add(item.id || "");
        }
      });

      setSelectedItems(newSelected);
    },
    [items, itemsByStatus, selectedItems]
  );

  const handleGlobalApply = useCallback(
    (field: keyof ReceivedItem, value: string | number | Date | undefined) => {
      setReceiveData((prev) => {
        const updated = { ...prev };
        items.forEach((item) => {
          const itemId = item.id || "";
          if (updated[itemId]) {
            updated[itemId] = { ...updated[itemId], [field]: value };
          }
        });
        return updated;
      });
    },
    [items]
  );

  const handleGlobalSlotApply = useCallback(
    (slot: SlotDetail) => {
      setReceiveData((prev) => {
        const updated = { ...prev };
        items.forEach((item) => {
          const itemId = item.id || "";
          if (updated[itemId]) {
            updated[itemId] = {
              ...updated[itemId],
              slotId: slot.id,
              slotName: slot.name,
              slotDetail: slot,
            };
          }
        });
        return updated;
      });
    },
    [items]
  );

  const handleItemToggle = useCallback(
    (itemId: string) => {
      const newSelected = new Set(selectedItems);
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
      setSelectedItems(newSelected);
    },
    [selectedItems]
  );

  const handleDataChange = useCallback(
    (
      itemId: string,
      field: string,
      value: string | number | Date | object | undefined
    ) => {
      setReceiveData((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          [field]: value,
        },
      }));
    },
    []
  );

  const handleSubmit = useCallback(() => {
    const { isValid, errors } = validateReceiveData(
      selectedItems,
      receiveData,
      items
    );

    if (!isValid) {
      toast.error(errors[0]);
      return;
    }

    if (selectedItems.size === 0) {
      toast.error("Please select and configure items to receive");
      return;
    }

    const validItems: ReceivedItem[] = Array.from(selectedItems).map(
      (itemId) => {
        const data = receiveData[itemId];
        return {
          purchaseOrderDetailId: data.purchaseOrderDetailId || "",
          slotId: data.slotId!,
          qty: data.qty!,
          costPerUnit: data.costPerUnit || 0,
          expiredAt: data.expiredAt,
          lotNumber: data.lotNumber,
        };
      }
    );

    return validItems;
  }, [selectedItems, receiveData, items]);

  const formState: ReceiveFormState = {
    receiveMode,
    selectedItems,
    receiveData,
    globalSlot,
    globalExpiry,
    showAdvanced,
    sortDirection,
  };

  return {
    // State
    formState,
    sortedItems,
    itemsByStatus,
    receivableItemsCount,

    // Setters
    setReceiveMode,
    setSelectedItems,
    setReceiveData,
    setGlobalSlot,
    setGlobalExpiry,
    setShowAdvanced,
    setSortDirection,

    // Handlers
    handleModeChange,
    handleQuickReceive,
    handleGlobalApply,
    handleGlobalSlotApply,
    handleItemToggle,
    handleDataChange,
    handleSubmit,
  };
}
