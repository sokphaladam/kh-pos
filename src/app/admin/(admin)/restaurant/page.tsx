"use client";
import { RestaurantLayout } from "@/components/gui/restaurant/restaurant-layout";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(RestaurantLayout, "restaurant");
