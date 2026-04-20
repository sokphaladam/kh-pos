/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useRef } from "react";
import ReactDOM from "react-dom";

function copyStyles(sourceDoc: Document, targetDoc: Document) {
  Array.from(sourceDoc.styleSheets).forEach((styleSheet) => {
    if (styleSheet.href) {
      // true for stylesheets loaded from a URL
      const newLinkEl = sourceDoc.createElement("link");

      newLinkEl.rel = "stylesheet";
      newLinkEl.href = styleSheet.href;
      targetDoc.head.appendChild(newLinkEl);
    } else {
      const newStyleEl = sourceDoc.createElement("style");
      newStyleEl.sheet?.insertRule(
        styleSheet as any,
        (newStyleEl.sheet as any).length
      );

      Array.from(styleSheet.cssRules).forEach((cssRule) => {
        newStyleEl.appendChild(sourceDoc.createTextNode(cssRule.cssText));
      });

      targetDoc.head.appendChild(newStyleEl);
    }
  });
}

export function NewWindow(
  props: React.PropsWithChildren<{ onClosed?: () => void }>
) {
  const containerEl = useRef<HTMLDivElement | null>(null);
  const externalWindow = useRef<Window | null>(null);

  // Create the container div only once
  if (!containerEl.current) {
    containerEl.current = document.createElement("div");
  }

  useEffect(() => {
    // Open the window only once
    externalWindow.current = window.open(
      "",
      "",
      `toolbar=no,menubar=no,location=no,resizable=yes,scrollbars=yes,
    width=${window.screen.availWidth},height=${window.screen.availHeight},
    left=0,top=0`
    );
    if (!externalWindow.current || !containerEl.current) return;

    externalWindow.current.document.title = "Point of Sales";
    externalWindow.current.document.body.appendChild(containerEl.current);
    copyStyles(window.document, externalWindow.current.document);

    // Listen for manual window close
    const handleUnload = () => {
      props.onClosed?.();
    };
    externalWindow.current.addEventListener("beforeunload", handleUnload);

    return () => {
      externalWindow.current?.removeEventListener("beforeunload", handleUnload);
      externalWindow.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only render portal if containerEl.current is attached
  return containerEl.current
    ? ReactDOM.createPortal(props.children, containerEl.current)
    : null;
}
