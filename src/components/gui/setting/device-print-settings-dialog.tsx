"use client";
import { useCallback, useState } from "react";
import { createDialog } from "@/components/create-dialog";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MonitorSmartphone,
  Printer as PrinterIcon,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { Printing } from "@/classes/cinema/printing";
import {
  DEFAULT_PRINT_SOCKET_URL,
  getPrintSocketUrl,
  isValidPrintSocketUrl,
  setPrintSocketUrl,
} from "@/lib/print-socket-url";
import {
  ReceiptPrintMethod,
  getReceiptPrintMethod,
  getReceiptPrinterName,
  setReceiptPrintMethod,
  setReceiptPrinterName,
} from "@/lib/receipt-print-method";
import { useQueryPrinters } from "@/app/hooks/use-query-printer";
import { scanPrintSocketDialog } from "./scan-print-socket-dialog";

// Per-device print-server URL. Stored in localStorage (see lib/print-socket-url),
// never in the shared setting - every device points at its own local bridge.
function PrintSocketUrlInput() {
  // settings UI is client-only, so reading localStorage during init is safe
  const [url, setUrl] = useState(getPrintSocketUrl);
  const [saved, setSaved] = useState(getPrintSocketUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const trimmed = url.trim();
  const valid = isValidPrintSocketUrl(trimmed);
  const dirty = trimmed !== saved;

  const handleSave = useCallback(() => {
    if (!isValidPrintSocketUrl(url)) {
      toast.error("Enter a valid ws:// or wss:// URL");
      return;
    }
    setPrintSocketUrl(url);
    const next = getPrintSocketUrl();
    setUrl(next);
    setSaved(next);
    // drop the live connection so the next print reconnects to the new address
    Printing.resetConnection();
    toast.success("Print server URL saved on this device");
  }, [url]);

  const handleReset = useCallback(() => {
    setPrintSocketUrl("");
    setUrl(DEFAULT_PRINT_SOCKET_URL);
    setSaved(DEFAULT_PRINT_SOCKET_URL);
    setTestResult(null);
    Printing.resetConnection();
    toast.success("Print server URL reset to default");
  }, []);

  const handleScan = useCallback(async () => {
    const scanned = await scanPrintSocketDialog.show({});
    if (!scanned) return;
    setUrl(scanned);
    setTestResult(null);
    toast.success("Scanned - review the address, then Save");
  }, []);

  const handleTest = useCallback(async () => {
    if (!isValidPrintSocketUrl(url)) {
      toast.error("Enter a valid ws:// or wss:// URL");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const result = await Printing.testConnection(url.trim());
      setTestResult({ ok: result.ok, message: result.message });
    } finally {
      setTesting(false);
    }
  }, [url]);

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2">
        <MonitorSmartphone className="h-4 w-4 text-gray-500" />
        <h4 className="text-sm font-semibold text-gray-900">
          Print Server (this device)
        </h4>
      </div>
      <p className="text-xs text-gray-500">
        WebSocket address of the local print bridge that talks to the
        printer. Saved only on this device &mdash; each device can point at a
        different PC. Use the LAN address shown on the print app, e.g.{" "}
        <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[11px]">
          ws://192.168.1.20:8181
        </code>
        . If &ldquo;Require token&rdquo; is on, add it:{" "}
        <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[11px]">
          ws://192.168.1.20:8181/?token=SHOP-1234
        </code>
        . You can also scan the QR code on the print app&rsquo;s Device
        Connection card.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          id="print-socket-url"
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setTestResult(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && dirty && valid) handleSave();
          }}
          placeholder={DEFAULT_PRINT_SOCKET_URL}
          className="sm:max-w-md"
          aria-invalid={!valid}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={handleScan}
          >
            <QrCode className="h-4 w-4" />
            Scan
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleTest}
            disabled={testing || !valid}
          >
            {testing ? "Testing…" : "Test"}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!dirty || !valid}>
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            disabled={saved === DEFAULT_PRINT_SOCKET_URL}
          >
            Reset
          </Button>
        </div>
      </div>
      {!valid && trimmed.length > 0 && (
        <p className="text-xs text-red-600">Must start with ws:// or wss://</p>
      )}
      {testResult && (
        <p
          className={
            testResult.ok
              ? "text-xs font-medium text-emerald-600"
              : "text-xs font-medium text-red-600"
          }
        >
          {testResult.ok ? "✓ " : "✕ "}
          {testResult.message}
        </p>
      )}
    </div>
  );
}

// Per-device choice of how receipts (POS invoice, shift handover, ...) get
// printed on this terminal - the browser's print dialog, or straight to a
// printer on the local print-server bridge over WebSocket. Stored in
// localStorage (see lib/receipt-print-method), never in the shared setting.
function ReceiptPrintMethodInput() {
  const { printers } = useQueryPrinters();
  const [method, setMethod] = useState<ReceiptPrintMethod>(
    getReceiptPrintMethod,
  );
  const [printerName, setPrinterNameState] = useState(getReceiptPrinterName);

  const handleMethodChange = useCallback((value: ReceiptPrintMethod) => {
    setMethod(value);
    setReceiptPrintMethod(value);
  }, []);

  const handlePrinterChange = useCallback((value: string) => {
    setPrinterNameState(value);
    setReceiptPrinterName(value);
  }, []);

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2">
        <PrinterIcon className="h-4 w-4 text-gray-500" />
        <h4 className="text-sm font-semibold text-gray-900">
          Receipt Printing (this device)
        </h4>
      </div>
      <p className="text-xs text-gray-500">
        Choose how invoices and shift handover receipts print on this
        terminal: through the browser&rsquo;s print dialog, or sent directly
        to a printer on the print server above.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select value={method} onValueChange={handleMethodChange}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="browser">Browser print</SelectItem>
            <SelectItem value="print_server">
              Print server (WebSocket)
            </SelectItem>
          </SelectContent>
        </Select>

        {method === "print_server" && (
          <Select value={printerName} onValueChange={handlePrinterChange}>
            <SelectTrigger className="sm:w-64">
              <SelectValue placeholder="Select a printer" />
            </SelectTrigger>
            <SelectContent>
              {printers.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-gray-500">
                  No printers configured - add one under Print Server setting
                </div>
              )}
              {printers.map((p) => (
                <SelectItem key={p.id} value={p.printerName}>
                  {p.name} ({p.printerName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {method === "print_server" && !printerName && (
        <p className="text-xs text-red-600">
          Pick a printer, or receipts will fall back to browser print.
        </p>
      )}
    </div>
  );
}

/**
 * Per-device print settings, reachable by any signed-in user regardless of
 * role/permission (opened from the user menu, see NavUser) - unlike the rest
 * of /admin/setting, these two sections only ever touch this browser's own
 * localStorage, never the shared `setting` table, so there's nothing here
 * for a lower-privileged user to affect beyond their own terminal.
 */
export const devicePrintSettingsDialog = createDialog<
  Record<string, never>,
  void
>(({ close }) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <PrinterIcon className="h-5 w-5" />
          Print &amp; Device Settings
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <PrintSocketUrlInput />
        <ReceiptPrintMethodInput />

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => close()}>
            Close
          </Button>
        </div>
      </div>
    </>
  );
}, { defaultValue: undefined, className: "max-w-2xl" });
