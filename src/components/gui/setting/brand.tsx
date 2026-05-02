"use client";

import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tag, AlignLeft, ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUploadFileMinIO } from "@/app/hooks/use-upload-file";

interface Props {
  value: string;
  onChange?: (value: string) => void;
}

interface BrandItem {
  title: string;
  description: string;
  icon: string;
}

const EMPTY_ITEM: BrandItem = { title: "", description: "", icon: "" };

function IconUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const { trigger: uploadFile, isMutating: isUploading } = useUploadFileMinIO();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file.");
        return;
      }
      const preview = URL.createObjectURL(file);
      onChange(preview);
      uploadFile({ file })
        .then(({ url }) => {
          URL.revokeObjectURL(preview);
          onChange(url);
        })
        .catch((e) => {
          URL.revokeObjectURL(preview);
          onChange("");
          toast.error(e?.message ?? "Failed to upload icon");
        });
    },
    [uploadFile, onChange],
  );

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
        <ImageIcon className="h-3 w-3" /> Icon
      </label>
      {value ? (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="icon preview"
            className="w-8 h-8 object-contain rounded border bg-white flex-shrink-0"
          />
          <span className="flex-1 text-xs text-gray-500 truncate font-mono">
            {value.startsWith("blob:") ? "Uploading…" : value.split("/").pop()}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isUploading}
            onClick={() => onChange("")}
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "flex items-center gap-2 p-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
            isUploading
              ? "opacity-60 pointer-events-none border-gray-200"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500">
            {isUploading ? "Uploading…" : "Click to upload icon"}
          </span>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function BrandSetting({ value, onChange }: Props) {
  const [item, setItem] = useState<BrandItem>({ ...EMPTY_ITEM });

  useEffect(() => {
    try {
      const parsed = value ? JSON.parse(value) : EMPTY_ITEM;
      setItem({
        title: parsed?.title || "",
        description: parsed?.description || "",
        icon: parsed?.icon || "",
      });
    } catch {
      setItem({ ...EMPTY_ITEM });
    }
  }, [value]);

  const update = (patch: Partial<BrandItem>) => {
    const next = { ...item, ...patch };
    setItem(next);
    onChange?.(JSON.stringify(next));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-gray-500" />
        <h4 className="text-sm font-semibold text-gray-900">Brand</h4>
      </div>

      <Card className="border border-gray-200">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <Tag className="h-3 w-3" /> Title
            </label>
            <Input
              placeholder="e.g. My Brand"
              value={item.title}
              onChange={(e) => update({ title: e.target.value })}
              className="text-sm border-gray-200 focus:border-gray-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <AlignLeft className="h-3 w-3" /> Description
            </label>
            <Input
              placeholder="Short description"
              value={item.description}
              onChange={(e) => update({ description: e.target.value })}
              className="text-sm border-gray-200 focus:border-gray-400"
            />
          </div>

          <IconUpload
            value={item.icon}
            onChange={(url) => update({ icon: url })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
