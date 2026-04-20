"use client";
import { PaymentList } from "@/components/gui/setting/payment/payment-list";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(PaymentList, "payment");
