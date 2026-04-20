import { useEffect, useState } from "react";
import { PrintLabelPreview } from "./print-label-preview";

interface PrintLabelProps {
  value: string;
  onChange?: (value: string) => void;
}

export interface PrintLabelJson {
  paperSize?: {
    width?: number;
    height?: number;
    padding?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
  };
  price?: boolean;
  barcode?: {
    displayValue?: boolean;
    width?: number;
    height?: number;
  };
  using?: "SOCKET" | "BROWSER";
  printerName?: string;
}

export function PrintLabel({ value, onChange }: PrintLabelProps) {
  const [jsonObject, setJsonObject] = useState<PrintLabelJson>({});

  // Parse initial value
  useEffect(() => {
    try {
      const parsed = value ? JSON.parse(value) : {};
      setJsonObject(
        typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {},
      );
    } catch {
      setJsonObject({});
    }
  }, [value]);

  return (
    <div className="space-y-4">
      {/* Paper Size */}
      <div>
        <h3 className="font-semibold mb-2">Paper Size</h3>
        <div className="flex gap-4 mb-2">
          <label className="flex flex-col">
            Width (mm)
            <input
              type="number"
              value={jsonObject.paperSize?.width ?? ""}
              onChange={(e) => {
                const obj = jsonObject;
                obj.paperSize!.width = Number(e.target.value);
                setJsonObject(obj);
                onChange?.(JSON.stringify(obj));
              }}
              className="border rounded px-2 py-1"
              min={1}
              onFocus={(e) => e.target.select()}
            />
          </label>
          <label className="flex flex-col">
            Height (mm)
            <input
              type="number"
              value={jsonObject.paperSize?.height ?? ""}
              onChange={(e) => {
                const obj = jsonObject;
                obj.paperSize!.height = Number(e.target.value);
                setJsonObject(obj);
                onChange?.(JSON.stringify(obj));
              }}
              className="border rounded px-2 py-1"
              min={1}
              onFocus={(e) => e.target.select()}
            />
          </label>
        </div>
        <div className="flex gap-2">
          <label className="flex flex-col">
            Padding Top
            <input
              type="number"
              value={jsonObject.paperSize?.padding?.top ?? ""}
              onChange={(e) => {
                const obj = jsonObject;
                obj.paperSize!.padding!.top = Number(e.target.value);
                setJsonObject(obj);
                onChange?.(JSON.stringify(obj));
              }}
              className="border rounded px-2 py-1"
              min={0}
              onFocus={(e) => e.target.select()}
            />
          </label>
          <label className="flex flex-col">
            Padding Right
            <input
              type="number"
              value={jsonObject.paperSize?.padding?.right ?? ""}
              onChange={(e) => {
                const obj = jsonObject;
                obj.paperSize!.padding!.right = Number(e.target.value);
                setJsonObject(obj);
                onChange?.(JSON.stringify(obj));
              }}
              className="border rounded px-2 py-1"
              min={0}
              onFocus={(e) => e.target.select()}
            />
          </label>
          <label className="flex flex-col">
            Padding Bottom
            <input
              type="number"
              value={jsonObject.paperSize?.padding?.bottom ?? ""}
              onChange={(e) => {
                const obj = jsonObject;
                obj.paperSize!.padding!.bottom = Number(e.target.value);
                setJsonObject(obj);
                onChange?.(JSON.stringify(obj));
              }}
              className="border rounded px-2 py-1"
              min={0}
              onFocus={(e) => e.target.select()}
            />
          </label>
          <label className="flex flex-col">
            Padding Left
            <input
              type="number"
              value={jsonObject.paperSize?.padding?.left ?? ""}
              onChange={(e) => {
                const obj = jsonObject;
                obj.paperSize!.padding!.left = Number(e.target.value);
                setJsonObject(obj);
                onChange?.(JSON.stringify(obj));
              }}
              className="border rounded px-2 py-1"
              min={0}
              onFocus={(e) => e.target.select()}
            />
          </label>
        </div>
      </div>

      {/* Price */}
      <div className="flex flex-row gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!jsonObject.price}
            onChange={(e) => {
              const obj = jsonObject;
              obj.price = e.target.checked;
              setJsonObject(obj);
              onChange?.(JSON.stringify(obj));
            }}
            onFocus={(e) => e.target.select()}
          />
          Show Price
        </label>
      </div>

      {/* If using socket */}
      <div>
        <h3 className="font-semibold mb-2 gap-2 flex flex-row">
          <input
            type="checkbox"
            checked={!!jsonObject.using && jsonObject.using === "SOCKET"}
            onChange={(e) => {
              const obj = jsonObject;
              obj.using = e.target.checked ? "SOCKET" : undefined;
              setJsonObject(obj);
              onChange?.(JSON.stringify(obj));
            }}
            onFocus={(e) => e.target.select()}
          />
          {jsonObject.using !== "SOCKET" ? "Use Socket" : "Socket Printer Name"}
        </h3>
        {jsonObject.using === "SOCKET" && (
          <label className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={jsonObject.printerName ?? ""}
              onChange={(e) => {
                const obj = jsonObject;
                obj.printerName = e.target.value;
                setJsonObject(obj);
                onChange?.(JSON.stringify(obj));
              }}
              className="border rounded px-2 py-1"
              onFocus={(e) => e.target.select()}
              placeholder="Printer Name"
            />
          </label>
        )}
      </div>

      {/* Barcode */}
      <div>
        <h3 className="font-semibold mb-2">Barcode</h3>
        <label className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={!!jsonObject.barcode?.displayValue}
            onChange={(e) => {
              const obj = jsonObject;
              obj.barcode!.displayValue = e.target.checked;
              setJsonObject(obj);
              onChange?.(JSON.stringify(obj));
            }}
            onFocus={(e) => e.target.select()}
          />
          Display Value
        </label>
        <div className="flex gap-4">
          <label className="flex flex-col">
            QR code size
            <input
              type="number"
              value={jsonObject.barcode?.height ?? ""}
              onChange={(e) => {
                const obj = jsonObject;
                obj.barcode!.height = Number(e.target.value);
                setJsonObject(obj);
                onChange?.(JSON.stringify(obj));
              }}
              className="border rounded px-2 py-1"
              min={1}
              onFocus={(e) => e.target.select()}
            />
          </label>
        </div>
      </div>
      <PrintLabelPreview data={jsonObject} />
    </div>
  );
}
