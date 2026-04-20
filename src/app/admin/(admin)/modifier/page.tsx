"use client";
import { ModifierLayout } from "@/components/gui/modifier/modifier-layout";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(ModifierLayout, "modifier");
