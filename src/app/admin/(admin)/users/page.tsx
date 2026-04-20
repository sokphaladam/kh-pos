"use client";
import UsersLayout from "@/components/gui/user/user-layout";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(UsersLayout, "users");
