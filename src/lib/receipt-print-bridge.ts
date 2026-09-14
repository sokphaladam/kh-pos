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
export async function sendHtmlReceiptToPrintServer(params: {
  innerHtml: string;
  printerName: string;
  pageSize?: string;
}): Promise<void> {
  const css = await loadPrintingCss();
  const html =
    `<!DOCTYPE html><html><head><meta charset="utf-8">` +
    `<style>${css}</style></head>` +
    `<body class="noto-sans-khmer">${params.innerHtml}</body></html>`;

  const printer = new Printing();
  printer.send(
    JSON.stringify({
      content: [html],
      printer_info: {
        printer_name: params.printerName,
        type: "data:text/html",
        page_size: params.pageSize || "80mm",
      },
    }),
  );
}
