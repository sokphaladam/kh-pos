"use client";

import type { PublicInvoiceResult } from "@/app/api/public/invoice/[id]/route";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { Formatter } from "@/lib/formatter";
import { Printer } from "lucide-react";
import moment from "moment-timezone";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

function formatDateTime(value?: string | null) {
  if (!value) return "";
  const m = moment(value, [
    "YYYY-MM-DD HH:mm:ss",
    "YYYY-MM-DD HH:mm",
    moment.ISO_8601,
  ]);
  return m.isValid() ? m.format("DD MMM YYYY · HH:mm") : "";
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: PublicInvoiceResult };

/* ── layout atoms ─────────────────────────────────────────────── */

function Perforation() {
  return <div className="inv-perf" aria-hidden />;
}

function LeaderRow({
  label,
  value,
  strong,
  muted,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={`inv-leader${strong ? " is-strong" : ""}`}>
      <span className="inv-leader-label">{label}</span>
      <span className="inv-leader-dots" aria-hidden />
      <span className={`inv-num${muted ? " is-muted" : ""}`}>{value}</span>
    </div>
  );
}

/* ── screen ───────────────────────────────────────────────────── */

export function PublicInvoice() {
  const params = useSearchParams();
  const orderId = params.get("order") || "";
  const warehouse = params.get("warehouse") || "";
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!orderId || !warehouse) {
      setState({ status: "error", message: "This invoice link is incomplete." });
      return;
    }
    let cancelled = false;
    fetch(
      `/api/public/invoice/${encodeURIComponent(orderId)}?warehouse=${encodeURIComponent(
        warehouse,
      )}`,
    )
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json?.success || !json?.result) {
          setState({
            status: "error",
            message: json?.message || "We couldn't find this invoice.",
          });
          return;
        }
        setState({ status: "ready", data: json.result as PublicInvoiceResult });
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            status: "error",
            message: "Something went wrong loading this invoice.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, warehouse]);

  const model = useMemo(() => {
    if (state.status !== "ready") return null;
    return buildInvoiceModel(state.data);
  }, [state]);

  return (
    <div className="inv-page">
      <Styles />

      {state.status === "loading" && (
        <div className="inv-card inv-status">
          <div className="inv-spinner" aria-hidden />
          <p>Loading your invoice…</p>
        </div>
      )}

      {state.status === "error" && (
        <div className="inv-card inv-status">
          <p className="inv-status-title">Invoice unavailable</p>
          <p className="inv-status-msg">{state.message}</p>
        </div>
      )}

      {state.status === "ready" && model && (
        <>
          <article className="inv-card">
            {/* Letterhead */}
            <header className="inv-head">
              <div className="inv-head-org">
                <h1 className="inv-shop">{model.shopName || "Invoice"}</h1>
                <p className="inv-org-meta">
                  {[model.address, model.phone].filter(Boolean).join("  ·  ")}
                  {model.tin ? (
                    <>
                      <br />
                      <span className="inv-khmer">អ ត ប</span> {model.tin}
                    </>
                  ) : null}
                </p>
              </div>
              <div className="inv-head-doc">
                <span className="inv-kicker">Invoice</span>
                <span className="inv-khmer inv-doc-kh">វិក្កយបត្រ</span>
                <span
                  className={`inv-status-pill ${model.paid ? "is-paid" : "is-open"}`}
                >
                  {model.paid ? "Paid" : "Open"}
                </span>
              </div>
            </header>

            <Perforation />

            {/* Parties + details */}
            <section className="inv-meta">
              <div className="inv-meta-col">
                <span className="inv-eyebrow">Billed to</span>
                <p className="inv-meta-primary">{model.customerName}</p>
                {model.customerPhone && (
                  <p className="inv-meta-line">{model.customerPhone}</p>
                )}
                {model.contextLine && (
                  <p className="inv-meta-line">{model.contextLine}</p>
                )}
                {model.deliveryCode && (
                  <p className="inv-meta-line">
                    Delivery code {model.deliveryCode}
                  </p>
                )}
              </div>

              <div className="inv-meta-col">
                <span className="inv-eyebrow">Details</span>
                <dl className="inv-defs">
                  <div>
                    <dt>Invoice no.</dt>
                    <dd className="inv-num">{model.invoiceLabel}</dd>
                  </div>
                  <div>
                    <dt>Issued</dt>
                    <dd>{model.issued || "—"}</dd>
                  </div>
                  {model.paidAt && (
                    <div>
                      <dt>Paid</dt>
                      <dd>{model.paidAt}</dd>
                    </div>
                  )}
                  {model.cashier && (
                    <div>
                      <dt>Cashier</dt>
                      <dd>{model.cashier}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </section>

            <Perforation />

            {/* Items */}
            <section className="inv-items">
              <div className="inv-items-head">
                <span>Item</span>
                <span className="inv-num">Qty</span>
                <span className="inv-num">Price</span>
                <span className="inv-num">Amount</span>
              </div>

              <ul className="inv-items-body">
                {model.items.map((it, i) => (
                  <li className="inv-item" key={i}>
                    <div className="inv-item-main">
                      <span className="inv-item-name">{it.name}</span>
                      <span className="inv-num">{it.qty}</span>
                      <span className="inv-num">{it.price}</span>
                      <span className="inv-num">{it.amount}</span>
                    </div>

                    {it.seats.map((s, si) => (
                      <div className="inv-item-sub" key={`s${si}`}>
                        <span>{s}</span>
                      </div>
                    ))}

                    {it.modifiers.map((m, mi) => (
                      <div className="inv-item-sub" key={`m${mi}`}>
                        <span>{m.label}</span>
                        {m.amount && (
                          <span className="inv-num is-muted">{m.amount}</span>
                        )}
                      </div>
                    ))}

                    {it.discounts.map((d, di) => (
                      <div className="inv-item-sub is-discount" key={`d${di}`}>
                        <span>{d.label}</span>
                        <span className="inv-num">−{d.amount}</span>
                      </div>
                    ))}
                  </li>
                ))}
              </ul>
            </section>

            <Perforation />

            {/* Summary */}
            <section className="inv-summary">
              <LeaderRow label="Subtotal" value={model.subtotal} />
              {model.hasDiscount && (
                <LeaderRow
                  label="Discount"
                  value={<>−{model.discount}</>}
                />
              )}
              <div className="inv-total">
                <span className="inv-eyebrow">Total</span>
                <div className="inv-total-figures">
                  <span className="inv-total-num">{model.total}</span>
                  {model.totalApprox && (
                    <span className="inv-total-alt">≈ {model.totalApprox}</span>
                  )}
                </div>
              </div>
            </section>

            {model.payments.length > 0 && (
              <>
                <Perforation />
                <section className="inv-pay">
                  <span className="inv-eyebrow">Payment</span>
                  {model.payments.map((p, i) => (
                    <LeaderRow key={i} label={p.method} value={p.amount} />
                  ))}
                  <LeaderRow label="Change" value={model.change} muted />
                </section>
              </>
            )}

            <Perforation />

            <footer className="inv-foot">
              <p className="inv-foot-thanks">Thank you for your visit.</p>
              <p className="inv-foot-note">
                Digital copy of your receipt
                {model.shopName ? ` · ${model.shopName}` : ""}
                {model.phone ? ` · ${model.phone}` : ""}
              </p>
              {model.reissued && (
                <span className="inv-reissue">Reissued</span>
              )}
            </footer>
          </article>

          <div className="inv-actions">
            <button
              type="button"
              className="inv-print"
              onClick={() => window.print()}
            >
              <Printer size={15} strokeWidth={2} />
              Print receipt
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── model ────────────────────────────────────────────────────── */

function buildInvoiceModel(data: PublicInvoiceResult) {
  const { orderInfo, orderDetail, payments, warehouse, settings, timeIn, timeOut } =
    data;

  const setting = (opt: string) =>
    settings.find((s) => s.option === opt)?.value ?? "";

  const currencyCode = setting("CURRENCY") || "USD";
  const symbol = getCurrencySymbol(currencyCode);
  const isBaseUSD = symbol === "$";
  const decimals = currencyCode === "KHR" ? 0 : 2;
  const exchangeRate = Number(setting("EXCHANGE_RATE") || "4100") || 4100;

  const money = (n: number | string) =>
    formatCurrency(n, currencyCode, {
      showSymbol: true,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  const approx = (n: number) =>
    isBaseUSD
      ? Formatter.formatCurrencyKH(n * exchangeRate)
      : `$${(n / exchangeRate).toFixed(2)}`;

  const shopName = (setting("INVOICE_RECEIPT").split(",")[1] || "").trim() ||
    warehouse?.name ||
    "";
  const tin = setting("RTB");

  const isTable = !!orderInfo.tableNumber;

  const lineQty = (x: any) =>
    Number(
      isTable ? x.status?.reduce((a: number, b: any) => a + b.qty, 0) ?? 0 : x.qty,
    );

  const items = orderDetail.map((x: any) => {
    const qty = lineQty(x);
    const itemTotal = isTable ? Number(x.price) * qty : Number(x.totalAmount);
    const discountAmount = Number(x.discountAmount || 0);

    // Cinema seat bookings, grouped by hall — kept from the printed receipt.
    const seatGroups: Record<string, { hall: any; seats: string[] }> = {};
    (x.reservation || []).forEach((b: any) => {
      if (!b.seat || !b.seat.hall) return;
      const key = b.seat.hall.id;
      seatGroups[key] ??= { hall: b.seat.hall, seats: [] };
      seatGroups[key].seats.push(
        `${String(b.seat.row).toUpperCase()}${b.seat.column}`,
      );
    });
    const seats = Object.values(seatGroups).map(
      (g) => `${g.hall.name}: ${g.seats.join(" | ")}`,
    );

    const modifiers: { label: string; amount: string }[] = (
      x.orderModifiers || []
    ).map((mod: any) => {
      const resolved = x.productVariant?.basicProduct?.modifiers
        ?.flatMap((m: any) => m.items)
        ?.find((f: any) => f?.id === mod.modifierItemId);
      const label = mod.notes ? mod.notes : resolved?.name || "Modifier";
      const add = Number(mod.price) > 0 ? Number(mod.price) * Number(x.qty) : 0;
      return { label: String(label), amount: add > 0 ? `+${money(add)}` : "" };
    });

    const namedDiscounts = (x.discounts || []).filter(
      (d: any) => Number(d.amount) > 0,
    );
    const discounts: { label: string; amount: string }[] =
      namedDiscounts.length > 0
        ? namedDiscounts.map((d: any) => ({
            label: String(d.name || "Discount"),
            amount: money(Number(d.amount)),
          }))
        : discountAmount > 0
          ? [{ label: "Discount", amount: money(discountAmount) }]
          : [];

    return {
      name: x.title,
      qty: String(qty),
      price: money(Number(x.price)),
      amount: money(itemTotal - discountAmount),
      seats,
      modifiers,
      discounts,
    };
  });

  const total = orderDetail.reduce((a: number, x: any) => {
    if (isTable) {
      return a + Number(x.price) * lineQty(x) + Number(x.modiferAmount || 0);
    }
    return a + Number(x.price) * Number(x.qty);
  }, 0);
  const totalDiscount = orderDetail.reduce(
    (a: number, x: any) => a + Number(x.discountAmount || 0),
    0,
  );
  const totalAfterDiscount = total - totalDiscount;

  const receive = payments.reduce((a: number, b: any) => {
    if (b.currency === "KHR" && isBaseUSD) {
      return a + Number(b.amount) / Number(b.exchangeRate);
    }
    return a + Number(b.amountUsd);
  }, 0);
  const change = receive <= 0 ? 0 : receive - totalAfterDiscount;

  const invoiceNoStr = String(orderInfo.invoiceNo ?? "");
  const invoiceLabel =
    "POS" + (invoiceNoStr.length > 8 ? invoiceNoStr.slice(8) : invoiceNoStr);

  const hasTable = !!(orderInfo.tableName || orderInfo.tableNumber);
  const servedType =
    orderInfo.servedType === "food_delivery"
      ? "Delivery"
      : orderInfo.servedType === "take_away"
        ? "Take away"
        : hasTable
          ? "Dine in"
          : "";
  const customerCount = orderInfo.customer || 1;
  const contextLine = [
    servedType,
    orderInfo.tableName ? `Table ${orderInfo.tableName}` : null,
    hasTable || customerCount > 1
      ? `${customerCount} ${customerCount > 1 ? "guests" : "guest"}`
      : null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  return {
    shopName,
    address: warehouse?.address ?? "",
    phone: warehouse?.phone ?? "",
    tin,
    paid: !!(timeOut || orderInfo.paidAt),
    invoiceLabel,
    issued: formatDateTime(timeIn || orderInfo.createdAt),
    paidAt: timeOut ? formatDateTime(timeOut) : "",
    cashier:
      payments[0]?.createdBy?.fullname || orderInfo.createdBy?.fullname || "",
    customerName: orderInfo.customerLoader?.customerName || "Walk-in",
    customerPhone: orderInfo.customerLoader?.phone || "",
    contextLine,
    deliveryCode: orderInfo.deliveryCode || "",
    reissued: (orderInfo.printCount || 0) > 1,
    items,
    subtotal: money(total),
    hasDiscount: totalDiscount > 0,
    discount: money(totalDiscount),
    total: money(totalAfterDiscount),
    totalApprox: approx(totalAfterDiscount),
    payments: payments.map((p: any) => {
      const amt =
        p.currency === "KHR" && isBaseUSD
          ? Number(p.amount) / Number(p.exchangeRate)
          : Number(p.amountUsd);
      return { method: p.paymentMethod || "Payment", amount: money(amt) };
    }),
    change: money(change),
  };
}

/* ── styles ───────────────────────────────────────────────────── */

function Styles() {
  return (
    <style jsx global>{`
      .inv-page {
        --paper: #eef0f2;
        --card: #ffffff;
        --ink: #17181a;
        --muted: #71767e;
        --line: #e6e8eb;
        --accent: #0e6c42;
        --radius: 6px;

        min-height: 100vh;
        background: var(--paper);
        color: var(--ink);
        padding: clamp(16px, 5vw, 56px) 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        font-family: var(--font-geist-sans), var(--font-kantumruy-pro),
          ui-sans-serif, system-ui;
        -webkit-font-smoothing: antialiased;
      }

      .inv-num,
      .inv-kicker,
      .inv-eyebrow,
      .inv-total-num,
      .inv-reissue {
        font-family: var(--font-geist-mono), ui-monospace, monospace;
        font-variant-numeric: tabular-nums;
      }
      .inv-khmer {
        font-family: var(--font-kantumruy-pro), var(--font-geist-sans),
          sans-serif;
      }

      .inv-card {
        width: 100%;
        max-width: 460px;
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: clamp(22px, 6vw, 34px);
        box-shadow:
          0 1px 2px rgba(23, 24, 26, 0.04),
          0 12px 32px -12px rgba(23, 24, 26, 0.12);
      }

      /* letterhead */
      .inv-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }
      .inv-shop {
        margin: 0;
        font-size: 17px;
        font-weight: 600;
        letter-spacing: -0.01em;
        line-height: 1.3;
      }
      .inv-org-meta {
        margin: 6px 0 0;
        font-size: 11px;
        line-height: 1.55;
        color: var(--muted);
      }
      .inv-head-doc {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
        flex-shrink: 0;
      }
      .inv-kicker {
        font-size: 11px;
        letter-spacing: 0.34em;
        text-transform: uppercase;
        color: var(--ink);
      }
      .inv-doc-kh {
        font-size: 12px;
        color: var(--muted);
      }
      .inv-status-pill {
        margin-top: 6px;
        font-family: var(--font-geist-mono), ui-monospace, monospace;
        font-size: 10px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        padding: 3px 9px;
        border-radius: 999px;
        border: 1px solid transparent;
      }
      .inv-status-pill.is-paid {
        color: var(--accent);
        background: rgba(14, 108, 66, 0.08);
        border-color: rgba(14, 108, 66, 0.24);
      }
      .inv-status-pill.is-open {
        color: #9a6a00;
        background: rgba(154, 106, 0, 0.08);
        border-color: rgba(154, 106, 0, 0.24);
      }

      /* perforation */
      .inv-perf {
        height: 0;
        margin: 17px 0;
        border-top: 1.5px dotted #d7dade;
      }

      /* meta */
      .inv-meta {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      .inv-eyebrow {
        display: block;
        font-size: 10px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--muted);
        margin-bottom: 8px;
      }
      .inv-meta-primary {
        margin: 0;
        font-size: 13px;
        font-weight: 550;
      }
      .inv-meta-line {
        margin: 3px 0 0;
        font-size: 12px;
        line-height: 1.5;
        color: var(--muted);
      }
      .inv-defs {
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .inv-defs > div {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        font-size: 12px;
      }
      .inv-defs dt {
        color: var(--muted);
      }
      .inv-defs dd {
        margin: 0;
        text-align: right;
      }

      /* items */
      .inv-items-head,
      .inv-item-main {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 1.8rem 4rem 4.6rem;
        gap: 6px;
        align-items: baseline;
      }
      .inv-items-head {
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--muted);
        padding-bottom: 10px;
        border-bottom: 1px solid var(--line);
      }
      .inv-items-head .inv-num,
      .inv-item-main .inv-num {
        text-align: right;
      }
      .inv-items-body {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .inv-item {
        padding: 11px 0;
        border-bottom: 1px solid var(--line);
      }
      .inv-item-name {
        font-size: 13px;
        line-height: 1.4;
      }
      .inv-item-main .inv-num {
        font-size: 12px;
      }
      .inv-item-sub {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin-top: 4px;
        padding-left: 10px;
        font-size: 11px;
        color: var(--muted);
      }
      .inv-item-sub.is-discount {
        color: var(--accent);
      }

      /* summary */
      .inv-summary {
        display: flex;
        flex-direction: column;
        gap: 9px;
      }
      .inv-leader {
        display: flex;
        align-items: baseline;
        gap: 8px;
        font-size: 12px;
      }
      .inv-leader-label {
        color: var(--muted);
        white-space: nowrap;
      }
      .inv-leader.is-strong .inv-leader-label {
        color: var(--ink);
      }
      .inv-leader-dots {
        flex: 1;
        border-bottom: 1px dotted var(--line);
        transform: translateY(-3px);
      }
      .inv-leader .inv-num {
        font-size: 12px;
        white-space: nowrap;
      }
      .inv-num.is-muted {
        color: var(--muted);
      }
      .inv-total {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-top: 6px;
        padding-top: 12px;
        border-top: 2px solid var(--ink);
      }
      .inv-total .inv-eyebrow {
        margin: 0;
        align-self: center;
      }
      .inv-total-figures {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }
      .inv-total-num {
        font-size: 21px;
        font-weight: 600;
        letter-spacing: -0.01em;
      }
      .inv-total-alt {
        font-size: 11px;
        color: var(--muted);
        margin-top: 2px;
      }

      /* payment */
      .inv-pay {
        display: flex;
        flex-direction: column;
        gap: 9px;
      }
      .inv-pay .inv-eyebrow {
        margin-bottom: 2px;
      }

      /* footer */
      .inv-foot {
        text-align: center;
      }
      .inv-foot-thanks {
        margin: 0;
        font-size: 12px;
      }
      .inv-foot-note {
        margin: 5px 0 0;
        font-size: 10px;
        color: var(--muted);
        line-height: 1.5;
      }
      .inv-reissue {
        display: inline-block;
        margin-top: 10px;
        font-size: 9px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--muted);
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 3px 10px;
      }

      /* actions */
      .inv-actions {
        width: 100%;
        max-width: 460px;
        display: flex;
        justify-content: center;
      }
      .inv-print {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        font-weight: 550;
        color: var(--ink);
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 9px 18px;
        cursor: pointer;
        transition:
          border-color 0.15s ease,
          box-shadow 0.15s ease;
      }
      .inv-print:hover {
        border-color: #c9cdd2;
        box-shadow: 0 2px 10px -4px rgba(23, 24, 26, 0.18);
      }
      .inv-print:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }

      /* status card */
      .inv-status {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        text-align: center;
        color: var(--muted);
        font-size: 13px;
        padding: 44px 28px;
      }
      .inv-status-title {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--ink);
      }
      .inv-status-msg {
        margin: 0;
      }
      .inv-spinner {
        width: 22px;
        height: 22px;
        border-radius: 999px;
        border: 2px solid var(--line);
        border-top-color: var(--accent);
        animation: inv-spin 0.7s linear infinite;
      }
      @keyframes inv-spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .inv-spinner {
          animation-duration: 2s;
        }
      }

      @media (max-width: 360px) {
        .inv-meta {
          grid-template-columns: 1fr;
        }
      }

      @media print {
        .inv-page {
          background: #fff;
          padding: 0;
        }
        .inv-actions {
          display: none;
        }
        .inv-card {
          max-width: none;
          border: none;
          box-shadow: none;
          padding: 0;
        }
        .inv-perf {
          margin-left: 0;
          margin-right: 0;
        }
      }
      @page {
        margin: 14mm;
      }
    `}</style>
  );
}
