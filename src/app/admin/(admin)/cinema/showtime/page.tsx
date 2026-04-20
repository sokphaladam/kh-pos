"use client";
import { ShowttimeLayout } from "@/components/gui/cinema/showtime/showtime-layout";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(ShowttimeLayout, "showtime");
