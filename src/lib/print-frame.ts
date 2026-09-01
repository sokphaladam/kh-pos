/**
 * Helpers for printing receipts through a hidden <iframe>.
 *
 * Why this exists: the old approach injected `<link rel="stylesheet" href="/printing.css">`
 * plus an inline `<script>window.print()</script>` into the iframe. That races the
 * stylesheet load, so the FIRST print (before /printing.css is cached) comes out
 * blank/unstyled, and the inline script is blocked outright under a strict CSP.
 *
 * Instead we:
 *   1. fetch /printing.css once and inline it as a <style> block (no async load), and
 *   2. drive window.print() from the parent after images + fonts have settled.
 */

let cssPromise: Promise<string> | null = null;

/** Fetch /printing.css once per page load and cache the result. */
export function loadPrintingCss(): Promise<string> {
  if (!cssPromise) {
    cssPromise = fetch("/printing.css")
      .then((r) => (r.ok ? r.text() : ""))
      .catch(() => "");
  }
  return cssPromise;
}

/** Wrap receipt body markup in a full HTML document with the print CSS inlined. */
export function buildPrintDocument(bodyHtml: string, css: string): string {
  return (
    `<!DOCTYPE html><html><head><meta charset="utf-8"/>` +
    `<style>${css}\n@page { margin: 0; }</style></head>` +
    `<body>${bodyHtml}</body></html><!-- ${Math.random().toString()} -->`
  );
}

/**
 * Print an already-loaded iframe. Waits for its images and fonts to be ready so
 * the output is never blank, then calls `onComplete` after `afterprint`
 * (with a fallback timeout in case the browser never emits it).
 */
export async function printLoadedIframe(
  frame: HTMLIFrameElement,
  onComplete: () => void,
): Promise<void> {
  const win = frame.contentWindow;
  const docu = frame.contentDocument;
  if (!win || !docu) {
    onComplete();
    return;
  }

  // Wait for every <img> to finish (loaded or errored).
  await Promise.all(
    Array.from(docu.images).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
    ),
  );

  // Wait for web fonts (Khmer font) so glyphs are not missing on first print.
  try {
    const fonts = (docu as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts && fonts.status !== "loaded") {
      await Promise.race([
        fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    }
  } catch {
    // ignore — printing without waiting is still better than hanging
  }

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    onComplete();
  };

  win.onafterprint = finish;
  const fallback = setTimeout(finish, 60000);
  win.addEventListener("afterprint", () => clearTimeout(fallback), {
    once: true,
  });

  // Two frames so the iframe has definitely laid out before we print.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      try {
        win.focus();
        win.print();
      } catch (e) {
        clearTimeout(fallback);

        console.error("[print-frame] window.print() failed", e);
        finish();
      }
    }),
  );
}
