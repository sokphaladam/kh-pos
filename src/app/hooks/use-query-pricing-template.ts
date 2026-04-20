import { ResponseType } from "@/lib/types";
import { useGenericMutation, useGenericSWR } from "./use-generic";
import { table_pricing_template } from "@/generated/tables";
import { inputPricingTemplateType } from "../api/cinema/pricing-template/template-create";

export function useQueryPricingTemplate() {
  return useGenericSWR<ResponseType<table_pricing_template[]>>(
    "/api/cinema/pricing-template"
  );
}

export function useCreatePricingTemplate() {
  return useGenericMutation<
    inputPricingTemplateType,
    ResponseType<table_pricing_template>
  >("POST", "/api/cinema/pricing-template");
}

export function useUpdatePricingTemplate() {
  return useGenericMutation<
    inputPricingTemplateType,
    ResponseType<table_pricing_template>
  >("PUT", "/api/cinema/pricing-template");
}

export function useDeletePricingTemplate() {
  return useGenericMutation<{ id: string }, ResponseType<string>>(
    "DELETE",
    "/api/cinema/pricing-template"
  );
}
