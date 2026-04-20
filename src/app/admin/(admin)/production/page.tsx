"use client";
import { ProductionLayout } from "@/components/gui/production/production-layout";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(ProductionLayout, "production");
