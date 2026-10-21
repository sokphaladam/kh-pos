import {
  MenuAnalysis,
  menuAnalysisSchema,
  MenuAnalysisService,
} from "@/classes/menu-analysis";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export type MenuAnalysisInput = z.input<typeof menuAnalysisSchema>;

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<MenuAnalysis>,
  MenuAnalysisInput
>(async ({ db, userAuth, searchParams }) => {
  const input = menuAnalysisSchema.parse(searchParams ?? {});
  const result = await new MenuAnalysisService(db, userAuth.admin!).analyse(
    input,
  );
  return NextResponse.json({ success: true, result }, { status: 200 });
});
