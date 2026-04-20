import { forceUpdateQtyByStatus } from "./force-update-qty";
import { updateOrderItemStatusAPI } from "./update-order-item-status";

export const POST = updateOrderItemStatusAPI;

export const PUT = forceUpdateQtyByStatus;
