"use client";
import { LayoutMenuAnalysis } from "@/components/gui/report/menu-analysis/layout-menu-analysis";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(LayoutMenuAnalysis, "menu-analysis");
