import withDatabaseApi from "@/lib/server-functions/with-database-api";
import { NextResponse } from "next/server";

export const GET = withDatabaseApi<
  unknown,
  unknown,
  unknown,
  {
    brandName: string;
    warehouseId: string;
    startDate?: string;
    endDate?: string;
    groupBy?: string;
    userIds?: string;
    categoryIds?: string[];
    productId?: string;
  }
>(async ({ db, searchParams }) => {
  const setting = await db
    .table("setting")
    .where("option", "BRAND_INTEGRATION")
    .first();

  let brandIntegration: { name: string; url: string; token: string }[] = [];
  try {
    brandIntegration = setting?.value ? JSON.parse(setting.value) : [];
  } catch {
    brandIntegration = [];
  }

  const brand = brandIntegration.find(
    (f) => f.name === searchParams?.brandName,
  );

  if (!brand) return NextResponse.json({ result: [] });

  try {
    const myHeaders = new Headers();

    myHeaders.append("Authorization", "Bearer " + brand.token);

    const requestOptions: RequestInit = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    const params = new URLSearchParams();

    params.append("warehouseId", searchParams?.warehouseId ?? "");

    if (searchParams?.startDate && searchParams?.endDate) {
      params.append("startDate", searchParams.startDate);
      params.append("endDate", searchParams.endDate);
    }

    if (searchParams?.groupBy) {
      params.append("groupBy", searchParams.groupBy);
    }
    if (searchParams?.userIds) {
      searchParams.userIds
        .split(",")
        .forEach((id) => params.append("userIds", id));
    }
    if (searchParams?.categoryIds) {
      searchParams.categoryIds.forEach((id) =>
        params.append("categoryIds", id),
      );
    }
    if (searchParams?.productId) {
      params.append("productId", searchParams.productId);
    }

    const res = await fetch(
      `${brand.url}/api/report/sale-by-category?${params.toString()}`,
      requestOptions,
    );

    if (!res.ok) {
      return NextResponse.json({ result: [] });
    }

    const json = await res.json();
    return NextResponse.json({ result: json.result });
  } catch {
    return NextResponse.json({ result: [] });
  }
});
