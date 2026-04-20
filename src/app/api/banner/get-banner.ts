import withDatabaseApi from "@/lib/server-functions/with-database-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
}

export const GetBanner = withDatabaseApi<
  unknown,
  unknown,
  ResponseType<{ data: Banner[] }>
>(async ({ db }) => {
  const items = await db
    .table("banners")
    .select()
    .orderBy("created_at", "desc");

  if (items.length === 0) {
    return NextResponse.json(
      { success: false, error: "No banner found" },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: items.map((x) => ({
        id: x.id,
        imageUrl: x.image_url,
        title: x.title,
        payload: x.payload ? JSON.parse(x.payload) : null,
      })),
      error: "",
    },
    { status: 200 }
  );
});
