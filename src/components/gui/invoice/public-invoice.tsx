"use client";

import type { PublicInvoiceResult } from "@/app/api/public/invoice/[id]/route";
import {
  DefaultPrint,
  type DefaultPrintAuthOverride,
} from "@/components/gui/pos/print/default-print";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import moment from "moment-timezone";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function formatDateTime(value?: string | null) {
  if (!value) return "";
  const m = moment(value, [
    "YYYY-MM-DD HH:mm:ss",
    "YYYY-MM-DD HH:mm",
    moment.ISO_8601,
  ]);
  return m.isValid() ? m.format("DD/MM/YYYY HH:mm:ss") : "";
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: PublicInvoiceResult };

export function PublicInvoice() {
  const params = useSearchParams();
  const orderId = params.get("order") || "";
  const warehouse = params.get("warehouse") || "";
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!orderId || !warehouse) {
      setState({ status: "error", message: "Invalid invoice link" });
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
            message: json?.message || "Invoice not found",
          });
          return;
        }
        setState({ status: "ready", data: json.result as PublicInvoiceResult });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: "error", message: "Failed to load invoice" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, warehouse]);

  const authOverride = useMemo<DefaultPrintAuthOverride | null>(() => {
    if (state.status !== "ready") return null;
    const { settings, warehouse: wh, orderInfo } = state.data;
    const currencyCode =
      settings.find((s) => s.option === "CURRENCY")?.value || "USD";
    const decimals = currencyCode === "KHR" ? 0 : 2;

    return {
      user: { fullname: orderInfo.createdBy?.fullname },
      currency: getCurrencySymbol(currencyCode),
      currentWarehouse: { address: wh?.address ?? null },
      setting: {
        isLoading: false,
        isValidating: false,
        data: {
          result: settings.map((s) => ({ option: s.option, value: s.value })),
        },
      },
      formatForDisplay: (amount) =>
        formatCurrency(amount, currencyCode, {
          showSymbol: true,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }),
    };
  }, [state]);

  if (state.status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500">
        Loading invoice…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500">
        {state.message}
      </div>
    );
  }

  const { orderInfo, orderDetail, payments, timeIn, timeOut } = state.data;

  const invoiceNoStr = String(orderInfo.invoiceNo ?? "");
  const invoiceLabel = "POS" + (invoiceNoStr.length > 8 ? invoiceNoStr.slice(8) : invoiceNoStr);
  const cashier =
    payments[0]?.createdBy?.fullname || orderInfo.createdBy?.fullname || "";
  const customerName = orderInfo.customerLoader?.customerName || "Walk In";
  const customerCount = orderInfo.customer || 1;

  const infoRows = [
    ...(orderInfo.tableName
      ? [{ label: "Table", value: orderInfo.tableName }]
      : []),
    { label: "Invoice No", value: invoiceLabel },
    { label: "Time In", value: formatDateTime(timeIn || orderInfo.createdAt) },
    ...(timeOut
      ? [{ label: "Time Out", value: formatDateTime(timeOut) }]
      : []),
    { label: "Cashier", value: cashier },
    { label: `Customer (${customerCount})`, value: customerName },
  ];

  return (
    <div className="min-h-screen bg-slate-200 py-6 px-4 flex justify-center">
      <div className="bg-white w-[calc(80mm+3rem)] max-w-full shrink-0 rounded-lg shadow-md py-6 px-6 flex justify-center">
        <div className="w-[80mm] max-w-full">
          <DefaultPrint
            order={{ orderInfo, orderDetail, payments }}
            authOverride={authOverride ?? undefined}
            hidePaymentMethod
            infoRows={infoRows}
          />
        </div>
      </div>
    </div>
  );
}
