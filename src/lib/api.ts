import Cookies from "js-cookie";
import { getAdminCookies, getCustomerCookies } from "./cookies/cookies";
import { getDeviceHeaders } from "./device-identity";
import { isOffline, setOffline } from "./network-status";

const LOGIN_PATH = "/admin/login";
const UNAUTHORIZED = { success: false, error: "Unauthorized" };

// Admin token gate: an admin request is only sent after /api/user/me has
// accepted the current token. One /me call is shared by concurrent requests.
const verifiedTokens = new Set<string>();
let pendingMe: { token: string; promise: Promise<MeResult> } | null = null;
let sessionInvalid = false;

type MeResult = { ok: boolean; status: number; json: unknown };

// fetch that flags the app offline on network failure instead of silently failing.
async function send(url: string, init: RequestInit) {
  try {
    const res = await fetch(url, init);
    setOffline(false);
    return res;
  } catch (err) {
    if (err instanceof TypeError) setOffline(true);
    throw err;
  }
}

function invalidateSession() {
  verifiedTokens.clear();
  Cookies.remove("session", { path: "/" });
  if (window.location.pathname !== LOGIN_PATH) {
    // Block every further request until the login page has loaded.
    sessionInvalid = true;
    window.location.href = LOGIN_PATH;
  }
}

function fetchMe(token: string): Promise<MeResult> {
  if (pendingMe?.token === token) return pendingMe.promise;

  const promise: Promise<MeResult> = send("/api/user/me", {
    headers: { Authorization: `Bearer ${token}`, ...getDeviceHeaders() },
  })
    .then(async (res) => {
      if (res.ok) verifiedTokens.add(token);
      else if (res.status === 401) invalidateSession();
      return { ok: res.ok, status: res.status, json: await res.json() };
    })
    .finally(() => {
      if (pendingMe?.promise === promise) pendingMe = null;
    });

  pendingMe = { token, promise };
  return promise;
}

export async function requestDatabase<ResponseType = unknown>(
  url: string,
  method: "GET" | "POST" | "DELETE" | "PUT" = "GET",
  body?: unknown,
  callBy: "ADMIN" | "CUSTOMER" = "ADMIN",
): Promise<ResponseType> {
  if (isOffline() || !navigator.onLine) {
    setOffline(true);
    throw new Error("No internet connection");
  }

  const cookie = callBy === "ADMIN" ? getAdminCookies() : getCustomerCookies();
  const token: string = cookie?.token || "";

  if (callBy === "ADMIN") {
    if (sessionInvalid) return UNAUTHORIZED as ResponseType;

    // No token: public pages (login, register, invoice) still call public APIs;
    // the server decides. Admin pages without a session are redirected by middleware.
    if (token) {
      const isMe = method === "GET" && url.split("?")[0] === "/api/user/me";
      if (isMe) return (await fetchMe(token)).json as ResponseType;

      if (!verifiedTokens.has(token)) {
        const me = await fetchMe(token);
        if (!me.ok) {
          return (me.status === 401 ? UNAUTHORIZED : me.json) as ResponseType;
        }
      }
    }
  }

  const raw = await send(url, {
    method,
    headers: {
      "Content-Type": method !== "GET" ? "application/json" : "",
      Authorization: `Bearer ${token}`,
      ...getDeviceHeaders(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Token revoked/deleted mid-session.
  if (raw.status === 401 && callBy === "ADMIN" && token) invalidateSession();

  const json = await raw.json();

  return json as ResponseType;
}

export function streamFetcher(
  method: "GET" | "POST" | "DELETE" | "PUT" = "GET",
  key: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { next }: { next: (err: Error | null, data?: any) => void },
) {
  const abortController = new AbortController();

  // Parse out our actual URL endpoint and payload configuration
  const { url, body } = JSON.parse(key);

  const cookie = getAdminCookies();

  fetch(url, {
    method,
    headers: {
      "Content-Type": method !== "GET" ? "application/json" : "",
      Authorization: `Bearer ${cookie ? cookie.token || "" : ""}`,
      ...getDeviceHeaders(),
    },
    body: method !== "GET" ? JSON.stringify(body || {}) : undefined,
    signal: abortController.signal,
  })
    .then(async (response) => {
      if (!response.ok) throw new Error("Network pipeline connection error");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = (await reader?.read()) || {};
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (part.startsWith("data: ")) {
            const rawJson = part.replace("data: ", "").trim();
            if (!rawJson) continue;

            const parsedData = JSON.parse(rawJson);
            next(null, parsedData); // Push data straight to SWR state
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        next(err); // Feed execution errors into SWR
      }
    });

  // Automatically aborts request fetch loop if component unmounts or trigger key changes
  return () => abortController.abort();
}
