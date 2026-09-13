/**
 * Per-device print-server WebSocket URL.
 *
 * The label/ticket print bridge (`Printing`) talks to a small WebSocket server
 * running on the machine physically wired to the printer. That address differs
 * from device to device, so it is stored in `localStorage` on each device -
 * NOT in the shared/global settings table.
 */
const STORAGE_KEY = "print_socket_url";

export const DEFAULT_PRINT_SOCKET_URL = "ws://127.0.0.1:8181";

export function getPrintSocketUrl(): string {
  if (typeof window === "undefined") return DEFAULT_PRINT_SOCKET_URL;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored && stored.trim() ? stored.trim() : DEFAULT_PRINT_SOCKET_URL;
  } catch {
    return DEFAULT_PRINT_SOCKET_URL;
  }
}

/**
 * Persist the URL for this device. An empty value (or the default) clears the
 * override so the device falls back to {@link DEFAULT_PRINT_SOCKET_URL}.
 */
export function setPrintSocketUrl(url: string): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = url.trim();
    if (!trimmed || trimmed === DEFAULT_PRINT_SOCKET_URL) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, trimmed);
    }
  } catch {
    // storage disabled / full - nothing we can do, keep using the in-memory URL
  }
}

/** Basic sanity check for the settings input. */
export function isValidPrintSocketUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "ws:" || parsed.protocol === "wss:";
  } catch {
    return false;
  }
}
