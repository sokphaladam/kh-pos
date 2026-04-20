"use client";
import { SlotLayout } from "@/components/gui/slot/slot-layout";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(SlotLayout, "slot");
