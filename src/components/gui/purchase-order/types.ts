import { PurchaseOrderItem } from "@/classes/purchase-order-service";
import { ReceivedItem } from "@/classes/receive-po";
import { SlotDetail } from "@/classes/slot";

// Types and constants for purchase order receiving
export type ReceiveMode = "full" | "partial" | "custom";

export interface ReceiveItemsSheetProps {
  purchaseOrderId: string;
  onReceiveItems: (receivedItems: ReceivedItem[]) => void;
  close: () => void;
}

export interface ItemReceiveStatus {
  pending: PurchaseOrderItem[];
  partial: PurchaseOrderItem[];
  completed: PurchaseOrderItem[];
}

export interface ReceiveData extends Partial<ReceivedItem> {
  slotName?: string;
  slotDetail?: SlotDetail;
}

export interface ReceiveFormState {
  receiveMode: ReceiveMode;
  selectedItems: Set<string>;
  receiveData: Record<string, ReceiveData>;
  globalSlot?: SlotDetail;
  globalExpiry?: Date;
  showAdvanced: boolean;
  sortDirection: "asc" | "desc" | null;
}
