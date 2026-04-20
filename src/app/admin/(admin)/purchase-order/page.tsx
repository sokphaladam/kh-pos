"use client";
import PurchaseOrderLayout from "@/components/gui/purchase-order/purchase-order-layout";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(PurchaseOrderLayout, "purchase-order");
