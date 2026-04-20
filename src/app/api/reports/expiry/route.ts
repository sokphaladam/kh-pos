import {
  ExpiryFilters,
  productExpiry,
  ProductExpiryReport,
} from "@/classes/reports/product-expiry";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<ProductExpiryReport>,
  ExpiryFilters
>(async ({ userAuth, db }) => {
  const report = new productExpiry(db, userAuth.admin!);
  const result = await report.getProductExpiry();
  return NextResponse.json({
    success: true,
    result: result,
  });
});
