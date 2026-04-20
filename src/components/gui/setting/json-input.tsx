import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function JsonInput({ value, onChange }: Props) {
  const [jsonObject, setJsonObject] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  // Parse initial value
  useEffect(() => {
    try {
      const parsed = value ? JSON.parse(value) : {};
      setJsonObject(
        typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}
      );
    } catch {
      setJsonObject({});
    }
  }, [value]);

  // Update parent when object changes
  const updateParent = (newObject: Record<string, string>) => {
    setJsonObject(newObject);
    onChange(JSON.stringify(newObject));
  };

  const updateProperty = (key: string, newValue: string) => {
    updateParent({ ...jsonObject, [key]: newValue });
  };

  const removeProperty = (key: string) => {
    const newObject = { ...jsonObject };
    delete newObject[key];
    updateParent(newObject);
  };

  const addProperty = () => {
    if (
      newKey.trim() &&
      newValue.trim() &&
      !jsonObject.hasOwnProperty(newKey.trim())
    ) {
      updateParent({ ...jsonObject, [newKey.trim()]: newValue.trim() });
      setNewKey("");
      setNewValue("");
    }
  };

  const properties = Object.entries(jsonObject);

  return (
    <div className="space-y-4">
      {/* Current Properties */}
      {properties.length > 0 && (
        <div className="space-y-2">
          {properties.map(([key, val]) => (
            <div
              key={key}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="secondary"
                    className="text-xs font-medium font-mono capitalize"
                  >
                    {key}
                  </Badge>
                </div>
                <Input
                  value={val}
                  onChange={(e) => updateProperty(key, e.target.value)}
                  className="text-sm font-mono"
                  placeholder="Enter value"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeProperty(key)}
                className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Property */}
      <Card className="border-2 border-dashed border-gray-300 bg-gray-50/30">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-gray-100 rounded">
                <Plus className="h-3 w-3 text-gray-600" />
              </div>
              <label className="text-sm font-medium text-gray-800">
                Add New Item
              </label>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">
                    Label
                  </label>
                  <Input
                    placeholder="e.g., urgent"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="text-sm font-mono border-gray-200 focus:border-gray-400 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">
                    Value
                  </label>
                  <Input
                    placeholder="e.g., 1"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="text-sm border-gray-200 focus:border-gray-400 bg-white"
                  />
                </div>
              </div>

              {newKey.trim() && jsonObject.hasOwnProperty(newKey.trim()) && (
                <p className="text-xs text-red-600">
                  Property key already exists
                </p>
              )}

              <Button
                onClick={addProperty}
                disabled={
                  !newKey.trim() ||
                  !newValue.trim() ||
                  jsonObject.hasOwnProperty(newKey.trim())
                }
                className={cn(
                  "w-full bg-gray-900 hover:bg-gray-800 text-white",
                  (!newKey.trim() ||
                    !newValue.trim() ||
                    jsonObject.hasOwnProperty(newKey.trim())) &&
                    "opacity-50 cursor-not-allowed"
                )}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {properties.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <Settings className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No properties configured</p>
          <p className="text-xs">Add properties using the form above</p>
        </div>
      )}
    </div>
  );
}
