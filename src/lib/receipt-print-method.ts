/**
 * Per-device choice of how receipts (POS invoice, shift handover, ...) get
 * printed: through the browser's print dialog (`browser`, the long-standing
 * default) or pushed straight to the local print-server bridge over the
 * print-socket WebSocket (`print_server`, see `print-socket-url.ts`).
 *
 * Stored in localStorage - NOT the shared settings table - because it's a
 * property of this specific terminal, same as the print-socket URL itself.
 */

export type ReceiptPrintMethod = "browser" | "print_server";

const METHOD_KEY = "receipt_print_method";
const PRINTER_KEY = "receipt_printer_name";

export function getReceiptPrintMethod(): ReceiptPrintMethod {
  if (typeof window === "undefined") return "browser";
  try {
    return window.localStorage.getItem(METHOD_KEY) === "print_server"
      ? "print_server"
      : "browser";
  } catch {
    return "browser";
  }
}

export function setReceiptPrintMethod(method: ReceiptPrintMethod): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(METHOD_KEY, method);
  } catch {
    // storage disabled / full - nothing we can do
  }
}

/** The OS-registered printer name (e.g. "XP-80C") the print bridge should target. */
export function getReceiptPrinterName(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(PRINTER_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function setReceiptPrinterName(name: string): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = name.trim();
    if (trimmed) {
      window.localStorage.setItem(PRINTER_KEY, trimmed);
    } else {
      window.localStorage.removeItem(PRINTER_KEY);
    }
  } catch {
    // storage disabled / full - nothing we can do
  }
}
