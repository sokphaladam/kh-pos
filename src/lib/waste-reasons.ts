// Waste log reasons. WASTE counts as loss; NON_SALE (staff meal, comps,
// tastings) also leaves stock without a sale but is reported apart from waste.
// Labels live in the "waste" translation namespace under reasons.<code>.

export type WasteType = "WASTE" | "NON_SALE";

export const WASTE_REASONS = [
  { code: "SPOILED", type: "WASTE" },
  { code: "PREP_TRIM", type: "WASTE" },
  { code: "OVERPRODUCTION", type: "WASTE" },
  { code: "COOKING_ERROR", type: "WASTE" },
  { code: "DROPPED", type: "WASTE" },
  { code: "CUSTOMER_RETURN", type: "WASTE" },
  { code: "STORAGE_DAMAGE", type: "WASTE" },
  { code: "OTHER", type: "WASTE" },
  { code: "STAFF_MEAL", type: "NON_SALE" },
  { code: "COMPLIMENTARY", type: "NON_SALE" },
  { code: "TASTING", type: "NON_SALE" },
] as const satisfies readonly { code: string; type: WasteType }[];

export type WasteReason = (typeof WASTE_REASONS)[number]["code"];

export const WASTE_REASON_CODES = WASTE_REASONS.map((r) => r.code) as [
  WasteReason,
  ...WasteReason[],
];

export function wasteTypeOf(reason: WasteReason): WasteType {
  return WASTE_REASONS.find((r) => r.code === reason)?.type ?? "WASTE";
}
