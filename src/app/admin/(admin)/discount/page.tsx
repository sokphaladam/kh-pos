"use client";

import { LayoutDiscount } from "@/components/gui/discount/layout-discount";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(LayoutDiscount, "discount");
