import { ExcelRow } from "@/classes/upload-from-excel";
import { useGenericMutation } from "./use-generic";
import { ResponseType } from "@/lib/types";

export function useUploadExcelProduct() {
  return useGenericMutation<{data: ExcelRow[]}, ResponseType<unknown>>('POST',"/api/upload-excel");
}