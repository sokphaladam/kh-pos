import { ReceiptPromotionGroup } from "@/lib/receipt-promotion-groups";

// Receipts are printed from an iframe, so these rows use inline styles only.

const cell = {
  borderTopWidth: 0,
  borderBottomWidth: 0,
  fontSize: 11,
} as const;

/** Header printed above the lines of one promotion set. */
export function ReceiptPromotionHeaderRow({
  group,
  colSpan = 5,
}: {
  group: ReceiptPromotionGroup;
  colSpan?: number;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          ...cell,
          paddingTop: 4,
          fontWeight: 700,
          borderTop: "1px dashed #000",
        }}
      >
        ★ PROMOTION: {group.title}
      </td>
    </tr>
  );
}

/** Footer closing a promotion set group with what the customer saved. */
export function ReceiptPromotionFooterRow({
  group,
  formatMoney,
  colSpan = 5,
}: {
  group: ReceiptPromotionGroup;
  formatMoney: (n: number) => string;
  colSpan?: number;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          ...cell,
          textAlign: "right",
          fontStyle: "italic",
          paddingBottom: 4,
          borderBottom: "1px dashed #000",
        }}
      >
        {group.saved > 0
          ? `Promotion saving: -${formatMoney(group.saved)}`
          : "Promotion applied"}
      </td>
    </tr>
  );
}

/** Indent for item names printed inside a promotion group. */
export const promotionMemberIndent = { paddingLeft: 8 } as const;
