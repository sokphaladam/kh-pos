/* eslint-disable @typescript-eslint/no-explicit-any */
import getKnex from "@/lib/knex";
import { NextResponse } from "next/server";

const DEFAULT_FAVICON = "/favicon.ico";

export const dynamic = "force-dynamic";

// NextResponse.redirect rejects relative URLs, and req.url may be the internal
// container host behind the proxy, so set Location directly (browsers accept relative).
function redirect(location: string) {
  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: location,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export async function GET() {
  try {
    const db = await getKnex();
    const result: any[] = await db
      .table("setting")
      .where({ warehouse: null })
      .select();

    const brand = JSON.parse(
      result.find((f: any) => f.option === "BRAND")?.value || "{}",
    );

    return redirect(brand?.icon || DEFAULT_FAVICON);
  } catch {
    return redirect(DEFAULT_FAVICON);
  }
}
