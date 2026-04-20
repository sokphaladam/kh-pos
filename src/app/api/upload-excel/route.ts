import { ExcelRow, UploadFromExcel } from "@/classes/upload-from-excel";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const GET = withAuthApi(async ({ db, userAuth }) => {
  const excelData = await new UploadFromExcel(
    db,
    userAuth.admin!,
    "product_list.xlsx"
  ).uploadProducts();
  // Process the excelData as needed
  console.log(excelData);
  return NextResponse.json({ success: true, data: excelData });
});


export const POST = withAuthApi<unknown, {data: ExcelRow[]}, ResponseType<unknown>>(async ({body, userAuth, db}) => {

  const excelData = await new UploadFromExcel(
    db,
    userAuth.admin!,
    "product_list.xlsx"
  ).uploadProducts(body?.data);

  return NextResponse.json({ success: true, data: excelData });
})