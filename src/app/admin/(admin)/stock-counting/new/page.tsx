"use client";
import { StockCountSheet } from "@/components/gui/stock-count/stock-count-sheet";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(StockCountSheet, "stock-counting");
