"use client";
import { WarehouseLayout } from "@/components/gui/warehouse/warehouse-layout";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(WarehouseLayout, "warehouse");
