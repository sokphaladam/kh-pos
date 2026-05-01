"use client";
import { useUploadFile } from "@/app/hooks/use-upload-file";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Settings, Upload, X, Percent } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { InvoicePreview } from "./invoice-preview";

interface Props {
  value: string;
  onChangeValue: (v: string) => void;
}

export function InvoiceInput(props: Props) {
  const { toast } = useToast();
  const { trigger, isMutating: isUploading } = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const parseValue = useCallback((value: string) => {
    const parts = value.split(",");
    return {
      template: parts?.at(0) || "template-i",
      title: parts?.at(1) || "",
      logoUrl: parts?.at(2) || "",
      settings: parts?.at(3) || "2 2 2 2",
      limitProductName: parts?.at(4) || "0",
      productNameLimitLine: parts?.at(5) || "1",
      autoResetEveryDay: parts?.at(6) || "0",
      discountDisplayFormat: parts?.at(7) || "amount",
      showTotalDiscount: parts?.at(8) || "none",
    };
  }, []);

  const currentValue = parseValue(props.value || "");

  const updateValue = useCallback(
    (updates: Partial<typeof currentValue>) => {
      const newValue = { ...currentValue, ...updates };
      const csvValue = `${newValue.template},${newValue.title},${newValue.logoUrl},${newValue.settings},${newValue.limitProductName},${newValue.productNameLimitLine},${newValue.autoResetEveryDay},${newValue.discountDisplayFormat},${newValue.showTotalDiscount}`;
      props.onChangeValue(csvValue);
    },
    [currentValue, props],
  );

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Logo image must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    trigger({ file })
      .then(({ url }) => {
        updateValue({ logoUrl: url });
        toast({
          title: "Success",
          description: "Logo uploaded successfully.",
        });
      })
      .catch((e) => {
        toast({
          title: "Upload failed",
          description: e.message ?? "Failed to upload image",
          variant: "destructive",
        });
      });
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Template</Label>
        <InvoicePreview
          value={props.value}
          onChangeValue={props.onChangeValue}
        />
      </div>

      {/* Logo Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">Logo</Label>
        {/* Logo Display or Upload Area */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border">
          {currentValue.logoUrl ? (
            // Show image when available
            <>
              <ImageWithFallback
                src={currentValue.logoUrl}
                alt="Business Logo"
                title="Business Logo"
                className="w-16 h-16 object-contain rounded border bg-white"
                width={64}
                height={64}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {currentValue.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {currentValue.logoUrl}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateValue({ logoUrl: "" })}
                  className="h-6 px-2 mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-3 w-3 mr-1" />
                  Remove
                </Button>
              </div>
            </>
          ) : (
            // Show upload button when no image
            <>
              <div
                className={`w-16 h-16 flex items-center justify-center border-2 border-dashed rounded cursor-pointer transition-colors ${
                  isDragging
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400 bg-white"
                } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
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
                    handleLogoUpload(files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 text-gray-400" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleLogoUpload(file);
                    }
                  }}
                  className="sr-only"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Upload Logo
                </p>
                <p className="text-xs text-gray-500">
                  {isUploading
                    ? "Uploading..."
                    : "Drag and drop an image or click the upload button"}
                </p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
              </div>
            </>
          )}
        </div>
        {/* Logo Name Input */}
        <div className="space-y-1">
          <Label className="text-sm font-medium text-gray-600">
            Invoice Title
          </Label>
          <Input
            placeholder="Invoice Title"
            value={currentValue.title}
            onChange={(e) => updateValue({ title: e.target.value })}
            className="text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium text-gray-600 gap-2 flex items-center mb-2">
            <Checkbox
              checked={currentValue.autoResetEveryDay === "0"}
              onCheckedChange={(checked) =>
                updateValue({ autoResetEveryDay: checked ? "0" : "1" })
              }
            />{" "}
            Auto reset invoice number every day
          </Label>
          <Label className="text-sm font-medium text-gray-600 gap-2 flex items-center mb-2">
            <Checkbox
              checked={currentValue.limitProductName === "1"}
              onCheckedChange={(checked) =>
                updateValue({ limitProductName: checked ? "1" : "0" })
              }
            />{" "}
            Limit product name view on invoice
          </Label>
          <Input
            placeholder="Product Name"
            value={currentValue.productNameLimitLine}
            onChange={(e) =>
              updateValue({ productNameLimitLine: e.target.value })
            }
            className={cn(
              "text-sm",
              currentValue.limitProductName === "0" ? "hidden" : "inline-block",
            )}
            type="number"
          />
        </div>
        {/* Discount Display Format */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-600">
            Discount Display Format
          </Label>
          <Select
            value={currentValue.discountDisplayFormat}
            onValueChange={(value: "amount" | "percentage") =>
              updateValue({ discountDisplayFormat: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-gray-500" />
                  <span>
                    {currentValue.discountDisplayFormat === "amount"
                      ? "Show as Amount ($)"
                      : "Show as Percentage (%)"}
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="amount">
                <div className="flex items-center gap-2">
                  <span className="text-lg">$</span>
                  <span>Show as Amount ($)</span>
                </div>
              </SelectItem>
              <SelectItem value="percentage">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  <span>Show as Percentage (%)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Choose how discounts are displayed on invoices and receipts
          </p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-600">
            Show Option for Total Discount on Invoice and Receipt
          </Label>
          <Select
            value={currentValue.showTotalDiscount}
            onValueChange={(value: "none" | "amount" | "percentage") =>
              updateValue({ showTotalDiscount: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-gray-500" />
                  <span>
                    {currentValue.showTotalDiscount === "amount"
                      ? "Show as Amount ($)"
                      : currentValue.showTotalDiscount === "percentage"
                        ? "Show as Percentage (%)"
                        : "Do not show"}
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <div className="flex items-center gap-2">
                  <span>Do not show</span>
                </div>
              </SelectItem>
              <SelectItem value="amount">
                <div className="flex items-center gap-2">
                  <span className="text-lg">$</span>
                  <span>Show as Amount ($)</span>
                </div>
              </SelectItem>
              <SelectItem value="percentage">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  <span>Show as Percentage (%)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Choose how total discounts are displayed on invoices and receipts
          </p>
        </div>
      </div>

      {/* Print Settings */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">
          Print Settings
        </Label>
        <div className="p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Layout Configuration
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <Label className="text-xs text-gray-600">Padding Top</Label>
              <Input
                type="number"
                min={0}
                value={currentValue.settings.split(" ")[0] || ""}
                onChange={(e) => {
                  const parts = currentValue.settings.split(" ");
                  parts[0] = e.target.value;
                  updateValue({ settings: parts.join(" ") });
                }}
                className="text-sm font-mono"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Padding Bottom</Label>
              <Input
                type="number"
                min={0}
                value={currentValue.settings.split(" ")[2] || ""}
                onChange={(e) => {
                  const parts = currentValue.settings.split(" ");
                  parts[2] = e.target.value;
                  updateValue({ settings: parts.join(" ") });
                }}
                className="text-sm font-mono"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Padding Left</Label>
              <Input
                type="number"
                min={0}
                value={currentValue.settings.split(" ")[3] || ""}
                onChange={(e) => {
                  const parts = currentValue.settings.split(" ");
                  parts[3] = e.target.value;
                  updateValue({ settings: parts.join(" ") });
                }}
                className="text-sm font-mono"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Padding Right</Label>
              <Input
                type="number"
                min={0}
                value={currentValue.settings.split(" ")[1] || ""}
                onChange={(e) => {
                  const parts = currentValue.settings.split(" ");
                  parts[1] = e.target.value;
                  updateValue({ settings: parts.join(" ") });
                }}
                className="text-sm font-mono"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Padding order: top | right | bottom | left (in millimeters)
          </p>
        </div>
      </div>
    </div>
  );
}
