import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Edit3, Save } from "lucide-react";
import { generateId } from "@/lib/generate-id";
import { cn } from "@/lib/utils";

interface PrintServerInputProps {
  value: string;
  onChange?: (value: string) => void;
}

interface Printer {
  id?: string;
  name: string;
  printer_name: string;
  ip: string;
  port: number;
}

interface PrintersEditorProps {
  printers: Printer[];
  onPrintersChange: (printers: Printer[]) => void;
}
const defaultPrinter: Omit<Printer, "id"> = {
  name: "",
  printer_name: "",
  ip: "",
  port: 9100,
};

const PrintersEditor = ({
  printers,
  onPrintersChange,
}: PrintersEditorProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const [newPrinter, setNewPrinter] =
    useState<Omit<Printer, "id">>(defaultPrinter);

  const addPrinter = useCallback(() => {
    if (
      newPrinter.name.trim() &&
      newPrinter.printer_name.trim() &&
      newPrinter.ip.trim()
    ) {
      const id = generateId();
      const printerWithId = { ...newPrinter, id };
      onPrintersChange([...printers, printerWithId]);
      setNewPrinter({
        name: "",
        printer_name: "",
        ip: "",
        port: defaultPrinter.port,
      });
    }
  }, [newPrinter, onPrintersChange, printers]);

  const removePrinter = (index: number) => {
    // Prevent removing the last printer
    if (printers.length <= 1) {
      return;
    }
    onPrintersChange(printers.filter((_, i) => i !== index));
  };

  const updatePrinter = useCallback(
    (index: number, updatedPrinter: Printer) => {
      const newPrinters = [...printers];
      newPrinters[index] = updatedPrinter;
      onPrintersChange(newPrinters);
      setEditingIndex(null);
      setEditingPrinter(null);
    },
    [printers, onPrintersChange]
  );

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingPrinter({ ...printers[index] });
  };

  const saveEditing = () => {
    if (editingIndex !== null && editingPrinter) {
      updatePrinter(editingIndex, editingPrinter);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1" />
        <Badge variant="outline" className="text-xs">
          {printers.length} {printers.length === 1 ? "printer" : "printers"}
        </Badge>
      </div>

      {/* Printers Table */}
      {printers.length > 0 && (
        <div className="space-y-2">
          {printers.map((printer, index) => (
            <div
              key={printer.id || index}
              className="p-3 bg-gray-50 rounded-lg border group"
            >
              {editingIndex === index ? (
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    placeholder="Name"
                    value={editingPrinter?.name || ""}
                    onChange={(e) =>
                      setEditingPrinter((prev) =>
                        prev
                          ? {
                              ...prev,
                              name: e.target.value,
                            }
                          : null
                      )
                    }
                    className="text-sm"
                  />
                  <Input
                    placeholder="Printer Name"
                    value={editingPrinter?.printer_name || ""}
                    onChange={(e) =>
                      setEditingPrinter((prev) =>
                        prev
                          ? {
                              ...prev,
                              printer_name: e.target.value,
                            }
                          : null
                      )
                    }
                    className="text-sm"
                  />
                  <Input
                    placeholder="IP Address"
                    value={editingPrinter?.ip || ""}
                    onChange={(e) =>
                      setEditingPrinter((prev) =>
                        prev
                          ? {
                              ...prev,
                              ip: e.target.value,
                            }
                          : null
                      )
                    }
                    className="text-sm"
                  />
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      placeholder="Port"
                      value={editingPrinter?.port || 9100}
                      onChange={(e) =>
                        setEditingPrinter((prev) =>
                          prev
                            ? {
                                ...prev,
                                port: parseInt(e.target.value) || 9100,
                              }
                            : null
                        )
                      }
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={saveEditing}
                      className="h-8 px-2"
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="grid grid-cols-4 gap-4 flex-1">
                    <div>
                      <div className="text-xs text-gray-500">Name</div>
                      <div className="text-sm font-medium">{printer.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Printer</div>
                      <div className="text-sm">{printer.printer_name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">IP</div>
                      <div className="text-sm font-mono">{printer.ip}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Port</div>
                      <div className="text-sm font-mono">{printer.port}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(index)}
                      className="h-7 px-2 text-gray-600 hover:text-gray-900"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePrinter(index)}
                      disabled={printers.length <= 1}
                      className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add New Printer */}
      <Card className="border-2 border-dashed border-gray-300 bg-gray-50/30">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-gray-100 rounded">
                <Plus className="h-3 w-3 text-gray-600" />
              </div>
              <label className="text-sm font-medium text-gray-800">
                Add New Printer
              </label>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">
                    Name
                  </label>
                  <Input
                    placeholder="e.g., Cashier Printer"
                    value={newPrinter.name}
                    onChange={(e) =>
                      setNewPrinter((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="text-sm border-gray-200 focus:border-gray-400 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">
                    Printer Name
                  </label>
                  <Input
                    placeholder="e.g., XP-80C"
                    value={newPrinter.printer_name}
                    onChange={(e) =>
                      setNewPrinter((prev) => ({
                        ...prev,
                        printer_name: e.target.value,
                      }))
                    }
                    className="text-sm border-gray-200 focus:border-gray-400 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">
                    IP Address
                  </label>
                  <Input
                    placeholder="e.g., 127.0.0.1"
                    value={newPrinter.ip}
                    onChange={(e) =>
                      setNewPrinter((prev) => ({ ...prev, ip: e.target.value }))
                    }
                    className="text-sm border-gray-200 focus:border-gray-400 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">
                    Port
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g., 9100"
                    value={newPrinter.port}
                    onChange={(e) =>
                      setNewPrinter((prev) => ({
                        ...prev,
                        port: parseInt(e.target.value) || 9100,
                      }))
                    }
                    className="text-sm border-gray-200 focus:border-gray-400 bg-white"
                  />
                </div>
              </div>

              <Button
                onClick={addPrinter}
                disabled={
                  !newPrinter.name.trim() ||
                  !newPrinter.printer_name.trim() ||
                  !newPrinter.ip.trim()
                }
                className={cn(
                  "w-full bg-gray-900 hover:bg-gray-800 text-white",
                  (!newPrinter.name.trim() ||
                    !newPrinter.printer_name.trim() ||
                    !newPrinter.ip.trim()) &&
                    "opacity-50 cursor-not-allowed"
                )}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Printer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {printers.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <p className="text-sm">No printers configured</p>
          <p className="text-xs">Add printers using the form above</p>
        </div>
      )}
    </div>
  );
};

export function PrintServerInput(props: PrintServerInputProps) {
  const [jsonValue, setJsonValue] = useState<Record<string, unknown>>({});

  useEffect(() => {
    try {
      const parsed = props.value ? JSON.parse(props.value) : {};
      setJsonValue({ ...parsed, group_by: parsed.group_by || "ITEM" });
    } catch {
      setJsonValue({});
    }
  }, [props.value]);

  const handlePrintersChange = useCallback(
    (printers: Printer[]) => {
      const updated = { ...jsonValue, printers };
      setJsonValue(updated);
      // Use setTimeout to defer the onChange call to avoid setState during render
      setTimeout(() => {
        props.onChange?.(JSON.stringify(updated));
      }, 0);
    },
    [jsonValue, props]
  );

  const handleGroupByChange = useCallback(
    (value: string) => {
      const updated = { ...jsonValue, group_by: value };
      setJsonValue(updated);
      setTimeout(() => {
        props.onChange?.(JSON.stringify(updated));
      }, 0);
    },
    [jsonValue, props]
  );

  // Extract printers array, default to empty array if not present
  const printers = (jsonValue.printers as Printer[]) || [];
  const otherEntries = Object.entries(jsonValue).filter(
    ([key]) => key !== "printers" && key !== "group_by"
  );

  return (
    <div className="space-y-4">
      {/* Group By Selection */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-800 mb-2 block">
          Group By
        </label>
        <Select
          value={(jsonValue.group_by as string) || "ITEM"}
          onValueChange={handleGroupByChange}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select grouping" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ITEM">Item</SelectItem>
            <SelectItem value="TABLE">Table</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Always show PrintersEditor */}
      <div className="mb-4">
        <PrintersEditor
          printers={printers}
          onPrintersChange={handlePrintersChange}
        />
      </div>

      {/* Show other non-printer entries */}
      {otherEntries.map(([key, value]) => (
        <div key={key} className="mb-2">
          <div className="font-semibold mb-1 capitalize">
            {key.replace(/_/g, " ")}:
          </div>
          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
            {typeof value === "string" ? value : JSON.stringify(value)}
          </span>
        </div>
      ))}
    </div>
  );
}
