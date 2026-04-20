"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import moment from "moment-timezone";
import { Button } from "@/components/ui/button";
import { Ticket } from "lucide-react";
import { Printing } from "@/classes/cinema/printing";

interface PrintSocketInputProps {
  value: string;
  onChange?: (value: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PrintTicketClientTest({ config }: { config: any }) {
  const contents = useMemo(() => {
    return [
      [
        {
          type: "text",
          value: `${"Sample Movie Title"}`,
          style: {
            fontSize: "20px",
            fontFamily: "Hanuman, 'Courier New', Courier, monospace",
            fontWeight: "bold",
            textAlign: "left",
          },
        },
        {
          type: "text",
          value: `Cinema: ${"Sample Cinema Name"}`,
          style: {
            fontSize: "16px",
            fontFamily: "Hanuman, 'Courier New', Courier, monospace",
            fontWeight: "bold",
            textAlign: "left",
          },
        },
        {
          type: "text",
          value: `Hall: ${"Sample Hall Name"}`,
          style: {
            fontSize: "16px",
            fontFamily: "Hanuman, 'Courier New', Courier, monospace",
            fontWeight: "bold",
            textAlign: "left",
          },
        },
        {
          type: "text",
          value: `Seat: ${"A1"} (${"Regular"})`,
          style: {
            fontSize: "16px",
            fontFamily: "Hanuman, 'Courier New', Courier, monospace",
            fontWeight: "bold",
            textAlign: "left",
          },
        },
        {
          type: "text",
          value: `Date: ${moment().format("ddd, DD MMM YYYY")}`,
          style: {
            fontSize: "16px",
            fontFamily: "Hanuman, 'Courier New', Courier, monospace",
            fontWeight: "bold",
            textAlign: "left",
          },
        },
        {
          type: "text",
          value: `Time: ${moment().format(
            "HH:mm a",
          )} - ${moment().format("HH:mm a")}`,
          style: {
            fontSize: "16px",
            fontFamily: "Hanuman, 'Courier New', Courier, monospace",
            fontWeight: "bold",
            textAlign: "left",
            fontStyle: "uppercase",
          },
        },
        {
          type: "text",
          value: "--------------------------------",
          style: {
            fontSize: "20px",
            fontFamily: "Hanuman, 'Courier New', Courier, monospace",
            fontWeight: "bold",
            textAlign: "center",
          },
        },
        {
          type: "qrCode",
          value: `${"ASs234as"}`, // QR content
          height: "150", // size in px
          width: "150",
          position: "center",
          style: {
            margin: "0 0 0 0",
          },
          displayValue: true,
        },
        {
          type: "text",
          value: `${"ASs234as"}`,
          style: {
            fontSize: "16px",
            fontFamily: "Hanuman, 'Courier New', Courier, monospace",
            fontWeight: "bold",
            textAlign: "center",
          },
        },
      ],
    ];
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
    <Button onClick={handlePrint} size={"sm"} variant={"outline"}>
      <Ticket className="h-4 w-4 mr-2" />
      Print
    </Button>
  );
}

export function PrintSocketInput(props: PrintSocketInputProps) {
  const defaultValue = useMemo(() => {
    return {
      url: "ws://localhost:8181",
      printers: {
        id: "1",
        name: "Cashier Printer",
        printer_name: "XP-80C",
        ip: "127.0.0.1",
        port: 9100,
      },
      print_server_ip: "192.168.1.100:8080",
    };
  }, []);

  const [config, setConfig] = useState(defaultValue);

  useEffect(() => {
    try {
      const parsed = props.value ? JSON.parse(props.value) : defaultValue;
      setConfig({
        url: parsed.url || defaultValue.url,
        printers: {
          id: parsed.printers?.id || defaultValue.printers.id,
          name: parsed.printers?.name || defaultValue.printers.name,
          printer_name:
            parsed.printers?.printer_name || defaultValue.printers.printer_name,
          ip: parsed.printers?.ip || defaultValue.printers.ip,
          port: parsed.printers?.port || defaultValue.printers.port,
        },
        print_server_ip: parsed.print_server_ip || defaultValue.print_server_ip,
      });
    } catch {
      setConfig(defaultValue);
    }
  }, [props.value, defaultValue]);

  const handleChange = (field: string, value: string | number) => {
    const updatedConfig = { ...config };

    if (field.startsWith("printers.")) {
      const printerField = field.replace("printers.", "");
      updatedConfig.printers = {
        ...updatedConfig.printers,
        [printerField]: value,
      };
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (updatedConfig as any)[field] = value;
    }

    setConfig(updatedConfig);
    props.onChange?.(JSON.stringify(updatedConfig));
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-row justify-between">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Print Socket Configuration
          </h3>
          <PrintTicketClientTest config={config} />
        </div>
        {/* Printer Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Printer Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="printer-name" className="mb-2">
                  Printer Name
                </Label>
                <Input
                  id="printer-name"
                  type="text"
                  value={config.printers.name}
                  onChange={(e) =>
                    handleChange("printers.name", e.target.value)
                  }
                  placeholder="Cashier Printer"
                />
              </div>

              <div>
                <Label htmlFor="printer-device-name" className="mb-2">
                  Device Name
                </Label>
                <Input
                  id="printer-device-name"
                  type="text"
                  value={config.printers.printer_name}
                  onChange={(e) =>
                    handleChange("printers.printer_name", e.target.value)
                  }
                  placeholder="XP-80C"
                />
              </div>

              <div>
                <Label htmlFor="printer-ip" className="mb-2">
                  Printer IP Address
                </Label>
                <Input
                  id="printer-ip"
                  type="text"
                  value={config.printers.ip}
                  onChange={(e) => handleChange("printers.ip", e.target.value)}
                  placeholder="127.0.0.1"
                />
              </div>

              <div>
                <Label htmlFor="printer-port" className="mb-2">
                  Printer Port
                </Label>
                <Input
                  id="printer-port"
                  type="number"
                  value={config.printers.port}
                  onChange={(e) =>
                    handleChange("printers.port", parseInt(e.target.value) || 0)
                  }
                  placeholder="9100"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
