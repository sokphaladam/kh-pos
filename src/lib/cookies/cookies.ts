import Cookies from "js-cookie";

export function getAdminCookies() {
  try {
    const session = Cookies.get("session");
    return JSON.parse(session || "");
  } catch {
    return null;
  }
}

export function getCustomerCookies() {
  try {
    const session = Cookies.get("cus_session");
    return JSON.parse(session || "");
  } catch {
    return null;
  }
}
