"use client";
import { Printing } from "@/classes/cinema/printing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Warehouse } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";

interface Props {
  value: string;
  onChange?: (value: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PrintProductLotTest({ config }: { config: any }) {
  const contents = useMemo(() => {
    const testData = {
      lotNumber: "LOT-2025-0042",
      expirationDate: "2026-12-31",
      sku: "SKU-8809253649255",
      lotId: "3af64575-8a9c-452e-8004-17e4fd921277",
      price: "$9.99",
      manufacturingDate: "2025-01-15",
    };
    return [testData];
  }, []);

  const printerInfo = useMemo(() => {
    const setting = config;
    return setting.printers;
  }, [config]);

  useEffect(() => {
    return () => Printing.connection?.close();
  }, []);

  const handlePrint = useCallback(() => {
    if (typeof window !== "undefined") {
      console.log("Printing test ticket to printer:", printerInfo);
      const printer = new Printing();
      printer.send(
        JSON.stringify({
          content: contents,
          printer_info: printerInfo,
        }),
      );
    }
  }, [contents, printerInfo]);

  return (
    <Button variant={"outline"} onClick={handlePrint}>
      Print
    </Button>
  );
}

export function InventorySetting(props: Props) {
  const parseValue = useCallback((value: string) => {
    const parts = JSON.parse(value || "{}");
    return {
      restrict_product_lot: parts.restrict_product_lot || false,
      print_name: parts.print_name || "",
    };
  }, []);

  const currentValue = parseValue(props.value);

  const updateValue = useCallback(
    (newValue: Partial<typeof currentValue>) => {
      const updated = { ...currentValue, ...newValue };
      props.onChange?.(JSON.stringify(updated));
    },
    [currentValue, props],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Warehouse className="h-4 w-4 text-gray-500" />
            <h4 className="text-sm font-semibold text-gray-900">
              Inventory Configuration
            </h4>
          </div>
          <p className="text-xs text-gray-500">
            Configure inventory settings for your warehouses. This setting
            allows you to restrict product lots.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div>
            <Label htmlFor="printer-name" className="mb-2">
              Printer Name
            </Label>
            <div className="flex flex-row gap-2">
              <div>
                <Input
                  id="printer-name"
                  type="text"
                  value={currentValue.print_name}
                  onChange={(e) => updateValue({ print_name: e.target.value })}
                  placeholder="Cashier Printer"
                />
              </div>
              <div>
                <PrintProductLotTest
                  config={{
                    printers: {
                      printer_name: currentValue.print_name,
                      type: "product_lot",
                      size: "big",
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id="shared-order-draft"
            checked={currentValue.restrict_product_lot}
            onCheckedChange={(checked) =>
              updateValue({ restrict_product_lot: checked })
            }
          />
          <Label
            htmlFor="shared-order-draft"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            {currentValue.restrict_product_lot
              ? "Restrict product lot enabled"
              : "Restrict product lot disabled"}
          </Label>
        </div>
      </div>
    </div>
  );
}
