import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, Edit3, Save, GripVertical, Hash } from "lucide-react";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

interface ArrayItem {
  label: string;
  value: string;
}

export function JsonArrayInput({ value, onChange }: Props) {
  const [items, setItems] = useState<ArrayItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<ArrayItem>({ label: "", value: "" });

  // Parse initial value
  useEffect(() => {
    try {
      const parsed = value ? JSON.parse(value) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
  }, [value]);

  // Update parent when items change
  const updateParent = (newItems: ArrayItem[]) => {
    setItems(newItems);
    onChange(JSON.stringify(newItems));
  };

  const addItem = () => {
    if (newItem.label.trim() && newItem.value.trim()) {
      updateParent([...items, { ...newItem }]);
      setNewItem({ label: "", value: "" });
    }
  };

  const removeItem = (index: number) => {
    updateParent(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, updatedItem: ArrayItem) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    updateParent(newItems);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Header with count and description */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">Items</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Configure label-value pairs for this setting
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-xs font-medium text-foreground/80 border-border"
        >
          {items.length} {items.length === 1 ? "item" : "items"}
        </Badge>
      </div>

      {/* Current Items List */}
      {items.length > 0 && (
        <Card className="border border-border">
          <CardContent className="p-4 space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "group relative",
                  "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
                  editingIndex === index
                    ? "bg-muted/40 border-border shadow-sm"
                    : "bg-card border-border hover:border-border hover:shadow-sm"
                )}
              >
                {/* Drag Handle */}
                <div className="flex items-center text-muted-foreground/70">
                  <GripVertical className="h-4 w-4" />
                </div>

                {editingIndex === index ? (
                  // Editing Mode
                  <div className="flex-1 flex gap-3">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Label"
                        value={item.label}
                        onChange={(e) =>
                          setItems((prev) => {
                            const newItems = [...prev];
                            newItems[index] = {
                              ...newItems[index],
                              label: e.target.value,
                            };
                            return newItems;
                          })
                        }
                        className="text-sm border-border focus:border-input"
                      />
                      <Input
                        placeholder="Value"
                        value={item.value}
                        onChange={(e) =>
                          setItems((prev) => {
                            const newItems = [...prev];
                            newItems[index] = {
                              ...newItems[index],
                              value: e.target.value,
                            };
                            return newItems;
                          })
                        }
                        className="text-sm font-mono border-border focus:border-input"
                      />
                    </div>
                    <div className="flex items-center">
                      <Button
                        size="sm"
                        onClick={() => updateItem(index, item)}
                        className="h-8 px-3 bg-gray-900 hover:bg-gray-800"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs font-medium text-foreground/80 bg-muted/40 border-border"
                        >
                          {item.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono bg-muted/40 px-2 py-1 rounded border truncate">
                        {item.value}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingIndex(index)}
                        className="h-8 px-2 text-muted-foreground hover:text-foreground/80 hover:bg-muted"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add New Item Form */}
      <Card className="border-2 border-dashed border-border bg-muted/30">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-muted rounded">
                <Plus className="h-3 w-3 text-muted-foreground" />
              </div>
              <label className="text-sm font-medium text-foreground">
                Add New Item
              </label>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Label
                  </label>
                  <Input
                    placeholder="e.g., Main Dining Room"
                    value={newItem.label}
                    onChange={(e) =>
                      setNewItem((prev) => ({ ...prev, label: e.target.value }))
                    }
                    className="text-sm border-border focus:border-input bg-card"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Value
                  </label>
                  <Input
                    placeholder="e.g., main-dining-room"
                    value={newItem.value}
                    onChange={(e) =>
                      setNewItem((prev) => ({ ...prev, value: e.target.value }))
                    }
                    className="text-sm font-mono border-border focus:border-input bg-card"
                  />
                </div>
              </div>

              <Button
                onClick={addItem}
                disabled={!newItem.label.trim() || !newItem.value.trim()}
                className={cn(
                  "w-full bg-gray-900 hover:bg-gray-800 text-white",
                  (!newItem.label.trim() || !newItem.value.trim()) &&
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
      {items.length === 0 && (
        <div className="text-center py-8 px-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-muted rounded-full mb-4">
            <Hash className="h-6 w-6 text-muted-foreground/70" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">
            No items configured
          </h3>
          <p className="text-xs text-muted-foreground">
            Add your first item using the form above
          </p>
        </div>
      )}
    </div>
  );
}
