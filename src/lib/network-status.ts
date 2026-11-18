// Tiny global store for "is the app offline?" so the offline screen and the
// request layer agree. Driven by browser online/offline events and by fetch
// network failures (wifi connected but no internet doesn't fire "offline").
let offline = typeof navigator !== "undefined" && !navigator.onLine;
const listeners = new Set<() => void>();

export function setOffline(value: boolean) {
  if (offline === value) return;
  offline = value;
  listeners.forEach((l) => l());
}

export function isOffline() {
  return offline;
}

export function subscribeOffline(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => setOffline(false));
  window.addEventListener("offline", () => setOffline(true));
}
