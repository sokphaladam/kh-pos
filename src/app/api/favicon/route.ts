/* eslint-disable @typescript-eslint/no-explicit-any */
import getKnex from "@/lib/knex";
import { NextResponse } from "next/server";

const DEFAULT_FAVICON = "/favicon.ico";

export const dynamic = "force-dynamic";

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

    const iconUrl: string = brand?.icon || DEFAULT_FAVICON;

    return NextResponse.redirect(iconUrl, {
      status: 302,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch {
    return NextResponse.redirect(DEFAULT_FAVICON, { status: 302 });
  }
}
