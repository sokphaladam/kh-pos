import { getAdminCookies, getCustomerCookies } from "./cookies/cookies";

export async function requestDatabase<ResponseType = unknown>(
  url: string,
  method: "GET" | "POST" | "DELETE" | "PUT" = "GET",
  body?: unknown,
  callBy: "ADMIN" | "CUSTOMER" = "ADMIN",
): Promise<ResponseType> {
  const cookie = callBy === "ADMIN" ? getAdminCookies() : getCustomerCookies();

  const raw = await fetch(url, {
    method,
    headers: {
      "Content-Type": method !== "GET" ? "application/json" : "",
      Authorization: `Bearer ${cookie ? cookie.token || "" : ""}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

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
