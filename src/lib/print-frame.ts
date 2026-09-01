/**
 * Helpers for printing receipts through a hidden <iframe>.
 *
 * The old approach injected an inline `<script>window.print()</script>` into the
 * iframe's srcDoc. That fails two ways:
 *   1. a strict Content-Security-Policy blocks the inline script outright, and
 *   2. it races the `/printing.css` load, so the FIRST print (before the sheet is
 *      cached) comes out blank / unstyled.
 *
 * Instead we drive `window.print()` from the parent, and only after the iframe's
 * stylesheets, images and fonts have actually finished loading.
 */

let cssPromise: Promise<string> | null = null;

/**
 * Warm the browser HTTP cache for /printing.css once per page load, so the
 * <link> inside the print iframe resolves quickly (ideally from cache).
 */
export function warmPrintingCss(): Promise<unknown> {
  if (!cssPromise) {
    cssPromise = fetch("/printing.css")
      .then((r) => (r.ok ? r.text() : ""))
      .catch(() => "");
  }
  return cssPromise;
}

/** Wrap receipt body markup in a full HTML document for the print iframe. */
export function buildPrintDocument(bodyHtml: string): string {
  return (
    `<!DOCTYPE html><html><head><meta charset="utf-8"/>` +
    `<link rel="stylesheet" href="/printing.css"/>` +
    `<style>@page { margin: 0; }</style></head>` +
    `<body>${bodyHtml}</body></html><!-- ${Math.random().toString()} -->`
  );
}

function waitForStylesheets(docu: Document): Promise<unknown> {
  const links = Array.from(
    docu.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
  );
  return Promise.all(
    links.map((link) => {
      try {
        // Accessing cssRules throws until the sheet is loaded (same-origin);
        // if it succeeds the sheet is ready.
        if (link.sheet && link.sheet.cssRules) return Promise.resolve();
      } catch {
        /* not ready yet */
      }
      return new Promise<void>((resolve) => {
        link.addEventListener("load", () => resolve(), { once: true });
        link.addEventListener("error", () => resolve(), { once: true });
        setTimeout(resolve, 4000); // hard cap so we never hang
      });
    }),
  );
}

function waitForImages(docu: Document): Promise<unknown> {
  return Promise.all(
    Array.from(docu.images).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
            setTimeout(resolve, 4000);
          }),
    ),
  );
}

function waitForFonts(docu: Document): Promise<unknown> {
  try {
    const fonts = (docu as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts && fonts.status !== "loaded") {
      return Promise.race([
        fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    }
  } catch {
    /* ignore */
  }
  return Promise.resolve();
}

/**
 * Print an already-loaded iframe. Waits for its stylesheets, images and fonts so
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

  await waitForStylesheets(docu);
  await Promise.all([waitForImages(docu), waitForFonts(docu)]);

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
