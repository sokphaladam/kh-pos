"use client";

import { withLayoutPermission } from "@/hoc/with-layout-permission";
import SupplierLayout from "@/components/gui/supplier/supplier-layout";

export default withLayoutPermission(SupplierLayout, "supplier");
