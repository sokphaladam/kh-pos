"use client";
import { LayoutWaste } from "@/components/gui/waste/layout-waste";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(LayoutWaste, "waste");
