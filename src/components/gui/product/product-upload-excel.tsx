import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCallback, useRef, useState } from "react";
import ExcelJS from "exceljs";
import { ExcelRow } from "@/classes/upload-from-excel";
import { useUploadExcelProduct } from "@/app/hooks/use-upload-excel-product";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Download,
  X,
} from "lucide-react";
import LoadingSpinner from "@/components/loading-spinner";

function getColumnIndexByHeader(
  headerRow: ExcelJS.Row | undefined,
  headerName: string,
) {
  try {
    let colIndex = null;
    headerRow?.eachCell((cell, colNumber) => {
      if (cell.value === headerName) {
        colIndex = colNumber;
      }
    });
    return colIndex;
  } catch {
    return null;
  }
}

const REQUIRED_HEADERS = ["Code", "Title", "Price", "Product Group"];

const OPTIONAL_HEADERS = [
  "RSP",
  "Estimation GP",
  "Stocks",
  "Vendor Name",
  "Description",
  "Variant",
  "Image",
];

const ALL_HEADERS = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS];

interface UploadProgress {
  phase: "parsing" | "uploading" | "complete" | "error";
  progress: number;
  message: string;
  totalRows?: number;
  processedRows?: number;
}

export function ProductUploadExcel() {
  const { trigger, isMutating } = useUploadExcelProduct();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null,
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateExcelFile = (file: File): string[] => {
    const errors: string[] = [];

    // Check file type
    if (
      !file.name.toLowerCase().endsWith(".xlsx") &&
      !file.name.toLowerCase().endsWith(".xls")
    ) {
      errors.push("File must be an Excel file (.xlsx or .xls)");
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      errors.push("File size must be less than 10MB");
    }

    return errors;
  };

  const validateExcelHeaders = async (file: File): Promise<string[]> => {
    const errors: string[] = [];

    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);

      const sheet = workbook.getWorksheet(1);
      const headerRow = sheet?.getRow(1);

      if (!headerRow) {
        errors.push("Excel file must have a header row");
        return errors;
      }

      const foundHeaders: string[] = [];
      headerRow.eachCell((cell) => {
        if (cell.value) {
          foundHeaders.push(String(cell.value));
        }
      });

      const missingRequiredHeaders = REQUIRED_HEADERS.filter(
        (header) => !foundHeaders.includes(header),
      );

      if (missingRequiredHeaders.length > 0) {
        errors.push(
          `Missing required headers: ${missingRequiredHeaders.join(", ")}`,
        );
      }
    } catch {
      errors.push(
        "Failed to read Excel file. Please ensure it's a valid Excel format.",
      );
    }

    return errors;
  };

  const handleFileSelect = useCallback(async (file: File) => {
    setValidationErrors([]);
    setUploadProgress(null);

    // Basic file validation
    const basicErrors = validateExcelFile(file);
    if (basicErrors.length > 0) {
      setValidationErrors(basicErrors);
      return;
    }

    setSelectedFile(file);

    // Validate Excel headers
    const headerErrors = await validateExcelHeaders(file);
    if (headerErrors.length > 0) {
      setValidationErrors(headerErrors);
      return;
    }

    toast.success("File validated successfully. Ready to upload.");
  }, []);

  const handleFileUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setUploadProgress({
        phase: "parsing",
        progress: 0,
        message: "Reading Excel file...",
      });

      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await selectedFile.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);

      const sheet = workbook.getWorksheet(1);
      const headerRow = sheet?.getRow(1);
      const dataInput: ExcelRow[] = [];

      let totalRows = 0;
      sheet?.eachRow(() => totalRows++);
      totalRows = totalRows - 1; // Exclude header row

      setUploadProgress({
        phase: "parsing",
        progress: 25,
        message: `Found ${totalRows} data rows to process...`,
        totalRows,
      });

      let processedRows = 0;

      sheet?.eachRow((row, index) => {
        if (index > 1) {
          const barcodeColumn = getColumnIndexByHeader(headerRow, "Code");
          const title = getColumnIndexByHeader(headerRow, "Title");
          const descriptionColumn = getColumnIndexByHeader(
            headerRow,
            "Description",
          );
          const vendorNameColumn = getColumnIndexByHeader(
            headerRow,
            "Vendor Name",
          );
          const costColumn = getColumnIndexByHeader(headerRow, "Cost");
          const rspColumn = getColumnIndexByHeader(headerRow, "Price");
          const estimationGPColumn = getColumnIndexByHeader(
            headerRow,
            "Estimation GP",
          );
          const categoryColumn = getColumnIndexByHeader(
            headerRow,
            "Product Group",
          );
          const stocksColumn = getColumnIndexByHeader(headerRow, "Stocks");
          const variantColumn = getColumnIndexByHeader(headerRow, "Variant");
          const imageColumn = getColumnIndexByHeader(headerRow, "Image");

          const input: ExcelRow = {
            id: String(row.getCell(1).value || ""), // Assuming 'Code' is the first column
            barcode: barcodeColumn
              ? String(row.getCell(barcodeColumn).value || "")
              : "",
            title: title ? String(row.getCell(title).value || "") : "",
            description: descriptionColumn
              ? String(row.getCell(descriptionColumn).value || "")
              : "",
            vendorName: vendorNameColumn
              ? String(row.getCell(vendorNameColumn).value || "")
              : "",
            cost: costColumn ? Number(row.getCell(costColumn).value || 0) : 0,
            rsp: rspColumn ? Number(row.getCell(rspColumn).value || 0) : 0,
            estimationGP: estimationGPColumn
              ? Number(row.getCell(estimationGPColumn).value || 0)
              : 0,
            category: categoryColumn
              ? String(row.getCell(categoryColumn).value || "")
              : "",
            stocks: stocksColumn
              ? Number(row.getCell(stocksColumn).value || 0)
              : 0,
            variant: variantColumn
              ? String(row.getCell(variantColumn).value || "")
              : "",
            image: imageColumn
              ? String(row.getCell(imageColumn).value || "")
              : "",
          };

          dataInput.push(input);
          processedRows++;
        }
      });

      setUploadProgress({
        phase: "uploading",
        progress: 50,
        message: "Uploading products to server...",
        totalRows,
        processedRows,
      });

      const result = await trigger({ data: dataInput });

      if (result?.success) {
        setUploadProgress({
          phase: "complete",
          progress: 100,
          message: `Successfully uploaded ${processedRows} products!`,
          totalRows,
          processedRows,
        });
        toast.success(
          `Excel uploaded successfully! ${processedRows} products added.`,
        );

        // Reset after success
        setTimeout(() => {
          setSelectedFile(null);
          setUploadProgress(null);
          setOpen(false);
        }, 2000);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error(error);
      setUploadProgress({
        phase: "error",
        progress: 0,
        message: "Upload failed. Please try again.",
      });
      toast.error(
        "Failed to upload Excel file. Please check the format and try again.",
      );
    }
  }, [selectedFile, trigger]);

  const downloadTemplate = useCallback(() => {
    // Create a simple template Excel file
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Products");

    // Add headers
    sheet.addRow(ALL_HEADERS);

    // Add example row
    sheet.addRow([
      "PROD001",
      "Sample Product Name",
      "Sample Vendor",
      10.5,
      15.99,
      35,
      "Electronics",
      100,
    ]);

    // Style the header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6F3FF" },
    };

    // Auto-fit columns
    sheet.columns.forEach((column) => {
      column.width = 15;
    });

    // Download the file
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "product_upload_template.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });

    toast.success("Template downloaded successfully!");
  }, []);

  const resetUpload = useCallback(() => {
    setSelectedFile(null);
    setUploadProgress(null);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-8 gap-2 bg-emerald-600 hover:bg-emerald-700"
          disabled={isMutating}
        >
          <Upload className="h-4 w-4" />
          Upload Excel
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            Upload Products from Excel
          </DialogTitle>
          <DialogDescription>
            Upload multiple products at once using an Excel file. Download the
            template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Need a template?</CardTitle>
              <CardDescription className="text-xs">
                Download our Excel template with the correct format and sample
                data.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </CardContent>
          </Card>

          {/* File Upload Area */}
          <Card>
            <CardContent className="p-6">
              {!selectedFile && !uploadProgress ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDragging
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const files = Array.from(e.dataTransfer.files);
                    if (files.length > 0) {
                      handleFileSelect(files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Drop your Excel file here, or click to browse
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Supports .xlsx and .xls files up to 10MB
                  </p>
                  <Button variant="outline" size="sm">
                    Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                  />
                </div>
              ) : uploadProgress ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      {uploadProgress.phase === "complete"
                        ? "Upload Complete!"
                        : uploadProgress.phase === "error"
                          ? "Upload Failed"
                          : "Processing..."}
                    </h3>
                    {uploadProgress.phase === "complete" && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {uploadProgress.phase === "error" && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    {(uploadProgress.phase === "parsing" ||
                      uploadProgress.phase === "uploading") && (
                      <LoadingSpinner className="h-5 w-5" />
                    )}
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress.progress}%` }}
                    />
                  </div>

                  <p className="text-sm text-gray-600">
                    {uploadProgress.message}
                  </p>

                  {uploadProgress.totalRows && (
                    <div className="text-xs text-gray-500">
                      {uploadProgress.processedRows || 0} of{" "}
                      {uploadProgress.totalRows} rows processed
                    </div>
                  )}

                  {uploadProgress.phase === "error" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetUpload}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Try Again
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                      <div>
                        <p className="font-medium text-sm">
                          {selectedFile?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedFile &&
                            (selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                          MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetUpload}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {validationErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <h4 className="font-medium text-red-800 text-sm mb-2">
                        Validation Errors:
                      </h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validationErrors.length === 0 && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <div className="flex items-center gap-2 text-green-800 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        File validation passed! Ready to upload.
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleFileUpload}
                      disabled={validationErrors.length > 0 || isMutating}
                      className="flex-1 gap-2"
                    >
                      {isMutating ? (
                        <LoadingSpinner className="h-4 w-4" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {isMutating ? "Uploading..." : "Upload Products"}
                    </Button>
                    <Button variant="outline" onClick={resetUpload}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Required Headers Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Excel Headers</CardTitle>
              <CardDescription className="text-xs">
                Required and optional column headers for your Excel file:
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div>
                <h4 className="text-xs font-medium text-red-600 mb-2">
                  Required Headers:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {REQUIRED_HEADERS.map((header) => (
                    <div
                      key={header}
                      className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded"
                    >
                      <span className="font-mono text-red-700">{header}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">
                  Optional Headers:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {OPTIONAL_HEADERS.map((header) => (
                    <div
                      key={header}
                      className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded"
                    >
                      <span className="font-mono text-gray-600">{header}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
