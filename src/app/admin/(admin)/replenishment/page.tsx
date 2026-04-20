"use client";
import ReplenishmentList from "@/components/gui/replenishment/replenishment-list";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(ReplenishmentList, "replenishment");
