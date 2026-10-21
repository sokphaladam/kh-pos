"use client";
import { LayoutStockCount } from "@/components/gui/stock-count/layout-stock-count";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(LayoutStockCount, "stock-counting");
