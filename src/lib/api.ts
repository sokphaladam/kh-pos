import { getAdminCookies, getCustomerCookies } from "./cookies/cookies";

export async function requestDatabase<ResponseType = unknown>(
  url: string,
  method: "GET" | "POST" | "DELETE" | "PUT" = "GET",
  body?: unknown,
  callBy: "ADMIN" | "CUSTOMER" = "ADMIN"
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
