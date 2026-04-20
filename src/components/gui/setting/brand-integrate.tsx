"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, Edit3, Save, Link, KeyRound, Tag } from "lucide-react";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface IntegrateItem {
  name: string;
  url: string;
  token: string;
}

interface BrandIntegrateSettingProps {
  value: string;
  onChange?: (value: string) => void;
}

export function BrandIntegrateSetting({
  value,
  onChange,
}: BrandIntegrateSettingProps) {
  const [items, setItems] = useState<IntegrateItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<IntegrateItem>({
    name: "",
    url: "",
    token: "",
  });

  useEffect(() => {
    try {
      const parsed = value ? JSON.parse(value) : [];
      const normalized = Array.isArray(parsed)
        ? parsed.map((item: Partial<IntegrateItem>) => ({
            name: item.name ?? "",
            url: item.url ?? "",
            token: item.token ?? "",
          }))
        : [];
      setItems(normalized);
    } catch {
      setItems([]);
    }
  }, [value]);

  const updateParent = (newItems: IntegrateItem[]) => {
    setItems(newItems);
    onChange?.(JSON.stringify(newItems));
  };

  const addItem = () => {
    if (newItem.name.trim() && newItem.url.trim() && newItem.token.trim()) {
      updateParent([...items, { ...newItem }]);
      setNewItem({ name: "", url: "", token: "" });
    }
  };

  const removeItem = (index: number) => {
    updateParent(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, updatedItem: IntegrateItem) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    updateParent(newItems);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link className="h-4 w-4 text-gray-500" />
            <h4 className="text-sm font-semibold text-gray-900">
              Brand Integrations
            </h4>
          </div>
          <p className="text-xs text-gray-500">
            Configure external integrations with URL and token
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-xs font-medium text-gray-700 border-gray-300"
        >
          {items.length} {items.length === 1 ? "entry" : "entries"}
        </Badge>
      </div>

      {items.length > 0 && (
        <Card className="border border-gray-200">
          <CardContent className="p-4 space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "group relative",
                  "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
                  editingIndex === index
                    ? "bg-gray-50 border-gray-300 shadow-sm"
                    : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm",
                )}
              >
                {editingIndex === index ? (
                  <div className="flex-1 flex gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                          <Tag className="h-3 w-3" /> Brand Name
                        </label>
                        <Input
                          placeholder="e.g. My Brand"
                          value={item.name}
                          onChange={(e) =>
                            setItems((prev) => {
                              const next = [...prev];
                              next[index] = {
                                ...next[index],
                                name: e.target.value,
                              };
                              return next;
                            })
                          }
                          className="text-sm border-gray-200 focus:border-gray-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                          <Link className="h-3 w-3" /> URL
                        </label>
                        <Input
                          placeholder="https://example.com/api"
                          value={item.url}
                          onChange={(e) =>
                            setItems((prev) => {
                              const next = [...prev];
                              next[index] = {
                                ...next[index],
                                url: e.target.value,
                              };
                              return next;
                            })
                          }
                          className="text-sm border-gray-200 focus:border-gray-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                          <KeyRound className="h-3 w-3" /> Token
                        </label>
                        <Input
                          placeholder="Bearer token or API key"
                          value={item.token}
                          onChange={(e) =>
                            setItems((prev) => {
                              const next = [...prev];
                              next[index] = {
                                ...next[index],
                                token: e.target.value,
                              };
                              return next;
                            })
                          }
                          className="text-sm font-mono border-gray-200 focus:border-gray-400"
                        />
                      </div>
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
                  <>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1 text-xs text-gray-700 font-semibold">
                        <Tag className="h-3 w-3 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Link className="h-3 w-3 shrink-0" />
                        <span className="truncate font-mono bg-gray-50 px-2 py-0.5 rounded border w-full">
                          {item.url}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <KeyRound className="h-3 w-3 shrink-0" />
                        <span className="truncate font-mono bg-gray-50 px-2 py-0.5 rounded border w-full tracking-widest">
                          {"•".repeat(Math.min(item.token.length, 24))}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingIndex(index)}
                        className="h-8 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="h-8 px-2 text-gray-500 hover:text-red-600 hover:bg-red-50"
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

      <Card className="border-2 border-dashed border-gray-300 bg-gray-50/30">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-gray-100 rounded">
                <Plus className="h-3 w-3 text-gray-600" />
              </div>
              <label className="text-sm font-medium text-gray-800">
                Add Integration
              </label>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Brand Name
                </label>
                <Input
                  placeholder="e.g. My Brand"
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="text-sm border-gray-200 focus:border-gray-400 bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                  <Link className="h-3 w-3" /> URL
                </label>
                <Input
                  placeholder="https://example.com/api"
                  value={newItem.url}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, url: e.target.value }))
                  }
                  className="text-sm border-gray-200 focus:border-gray-400 bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                  <KeyRound className="h-3 w-3" /> Token
                </label>
                <Input
                  placeholder="Bearer token or API key"
                  value={newItem.token}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, token: e.target.value }))
                  }
                  className="text-sm font-mono border-gray-200 focus:border-gray-400 bg-white"
                />
              </div>
              <Button
                onClick={addItem}
                disabled={
                  !newItem.name.trim() ||
                  !newItem.url.trim() ||
                  !newItem.token.trim()
                }
                className={cn(
                  "w-full bg-gray-900 hover:bg-gray-800 text-white",
                  (!newItem.name.trim() ||
                    !newItem.url.trim() ||
                    !newItem.token.trim()) &&
                    "opacity-50 cursor-not-allowed",
                )}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {items.length === 0 && (
        <div className="text-center py-6 px-4 text-gray-400">
          <Link className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium text-gray-500">
            No integrations yet
          </p>
          <p className="text-xs mt-1">
            Add a brand name, URL, and token to get started
          </p>
        </div>
      )}
    </div>
  );
}
