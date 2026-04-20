"use client";
import LayoutCategory from "@/components/gui/category/layout-category";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(LayoutCategory, "category");
