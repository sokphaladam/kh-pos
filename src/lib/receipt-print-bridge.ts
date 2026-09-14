import { Printing } from "@/classes/cinema/printing";

let cachedCss: Promise<string> | null = null;

// `printing.css` (the same stylesheet the browser-print path links to) has
// to be inlined here: the bridge loads the receipt as a bare data: URL with
// no origin to resolve a relative <link href="/printing.css"> against.
function loadPrintingCss(): Promise<string> {
  if (!cachedCss) {
    cachedCss = fetch("/printing.css")
      .then((res) => (res.ok ? res.text() : ""))
      .catch(() => "");
  }
  return cachedCss;
}

/**
 * Sends a receipt to the local print-server bridge (l-print-electron) as
 * self-contained HTML over the per-device print-socket WebSocket, instead of
 * opening the browser's print dialog. The bridge renders it in a hidden
 * window and prints silently to the named printer - same HTML/CSS as the
 * browser-print path, so layout, Khmer fonts and QR codes come out
 * identical, with no PDF conversion step in between.
 */
// An "80mm" thermal receipt printer's real printable width is narrower than
// the nominal paper width - the print head is a fixed 576 dots @ 203dpi,
// which is ~72mm, not 80mm; the rest of the roll's width is unprintable
// margin. Confirmed directly against a real device here: Windows' driver
// properties for an XP-80C (Device Settings -> Manual Paper Feed) show its
// "80mm" form as "80(72.1) x 297mm" - 72.1mm of actual printable area. The
// print bridge (l-print-electron) applies its own smaller correction
// (nominal - 5mm) before the OS driver clips further on top of that, so
// sizing the receipt to the nominal (or even the bridge-corrected) width
// still overflows the real printable area by a few mm. Size to a width
// safely under the smallest plausible printable area for each paper class
// instead, so it can never overflow regardless of the exact printer/driver.
const SAFE_PRINTABLE_WIDTH_MM: Record<string, number> = {
  "80mm": 70,
  "78mm": 68,
  "76mm": 66,
  "58mm": 46,
  "57mm": 45,
  "44mm": 34,
};

export async function sendHtmlReceiptToPrintServer(params: {
  innerHtml: string;
  printerName: string;
  pageSize?: string;
}): Promise<void> {
  const css = await loadPrintingCss();
  const pageSize = params.pageSize || "80mm";
  const safeWidthMm = SAFE_PRINTABLE_WIDTH_MM[pageSize];
  const safeWidth = safeWidthMm ? `${safeWidthMm}mm` : undefined;
  const widthOverride = safeWidth
    ? `<style>html,body{width:${safeWidth};max-width:${safeWidth};margin:0;overflow-x:hidden;box-sizing:border-box;}</style>`
    : "";
  const html =
    `<!DOCTYPE html><html><head><meta charset="utf-8">` +
    `<style>${css}</style>${widthOverride}</head>` +
    `<body class="noto-sans-khmer">${params.innerHtml}</body></html>`;

  const printer = new Printing();
  printer.send(
    JSON.stringify({
      content: [html],
      printer_info: {
        printer_name: params.printerName,
        type: "data:text/html",
        page_size: pageSize,
      },
    }),
  );
}
