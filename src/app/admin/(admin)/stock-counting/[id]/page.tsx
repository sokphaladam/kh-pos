"use client";
import { StockCountDetailView } from "@/components/gui/stock-count/stock-count-detail";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(StockCountDetailView, "stock-counting");
