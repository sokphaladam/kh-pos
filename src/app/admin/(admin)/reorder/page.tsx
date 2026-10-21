"use client";
import { LayoutReorder } from "@/components/gui/reorder/layout-reorder";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(LayoutReorder, "reorder");
