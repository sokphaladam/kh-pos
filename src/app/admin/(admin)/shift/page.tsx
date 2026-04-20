"use client";
import { ShiftLayout } from "@/components/gui/shift/shift-layout";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(ShiftLayout, "shift");
