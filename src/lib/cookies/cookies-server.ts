import { cookies } from "next/headers";
import { UserInfo } from "../server-functions/get-auth-from-token";

export async function getNextAdminCookies() {
  try {
    const session = (await cookies()).get("session")?.value;
    return JSON.parse(session || "") as UserInfo;
  } catch {
    return null;
  }
}
