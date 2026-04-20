import { BacklogService } from "@/classes/back-log";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const backlogSchema = z.object({
  backlogId: z.string().nonempty(),
});

export const POST = withAuthApi<
  unknown,
  { backlogId: string },
  ResponseType<boolean>
>(async ({ db, body, userAuth }) => {
  const parsedBody = backlogSchema.parse(body);
  const backlogId = parsedBody.backlogId;

  const backlogService = new BacklogService(db, userAuth.admin!);
  const result = await backlogService.resolveBacklog(backlogId);

  return NextResponse.json(
    {
      success: true,
      result,
    },
    { status: 200 }
  );
});
