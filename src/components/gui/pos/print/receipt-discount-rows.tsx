import { ReceiptDiscountSource } from "@/lib/receipt-discount-breakdown";

// Receipts are printed from an iframe, so these rows use inline styles only.

/**
 * "Discount details" block for the receipt summary: one row per source
 * (promotion, menu, campaign, manual, order). Renders nothing without
 * discounts.
 */
export function ReceiptDiscountRows({
  sources,
  formatMoney,
  colSpan = 5,
}: {
  sources: ReceiptDiscountSource[];
  formatMoney: (n: number) => string;
  /** Total columns of the receipt table. */
  colSpan?: number;
}) {
  if (sources.length === 0) return null;
  return (
    <>
      <tr>
        <td
          colSpan={colSpan}
          style={{
            border: "none",
            padding: "4px 0 0",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          Discount details
        </td>
      </tr>
      {sources.map((s) => (
        <tr key={s.key}>
          <td
            colSpan={colSpan - 1}
            style={{
              border: "none",
              padding: "0 0 0 8px",
              fontSize: 11,
              textAlign: "left",
              whiteSpace: "normal",
              wordBreak: "break-word",
            }}
          >
            · {s.label}
          </td>
          <td
            style={{
              border: "none",
              padding: 0,
              fontSize: 11,
              textAlign: "right",
              whiteSpace: "nowrap",
            }}
          >
            -{formatMoney(s.amount)}
          </td>
        </tr>
      ))}
    </>
  );
}
