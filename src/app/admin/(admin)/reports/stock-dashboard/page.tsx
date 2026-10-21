"use client";
import { LayoutStockDashboard } from "@/components/gui/report/stock-dashboard/layout-stock-dashboard";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(LayoutStockDashboard, "stock-dashboard");
