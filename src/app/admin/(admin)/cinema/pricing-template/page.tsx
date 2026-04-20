"use client";
import { PricingTemplateList } from "@/components/gui/cinema/pricing-template/pricing-template-list";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(PricingTemplateList, "pricing-template");
