"use client";

import { LayoutProduct } from "@/components/gui/product/layout-product";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(LayoutProduct, "product");
