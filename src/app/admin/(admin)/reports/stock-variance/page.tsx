"use client";
import { LayoutStockVariance } from "@/components/gui/report/stock-variance/layout-stock-variance";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(LayoutStockVariance, "stock-variance");
