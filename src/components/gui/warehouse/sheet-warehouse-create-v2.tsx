import {
  CreateWarehouseV2Input,
  UpdateWarehouseV2Input,
} from "@/app/api/warehouse-v2/route";
import {
  useCreateWarehouseV2,
  useUpdateWarehouseV2,
} from "@/app/hooks/use-query-warehouse";
import { useUploadFileMinIO } from "@/app/hooks/use-upload-file";
import { createSheet } from "@/components/create-sheet";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import { MaterialInput } from "@/components/ui/material-input";
import { SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ResponseType } from "@/lib/types";
import {
  MapPin,
  Upload,
  X,
  Building2,
  User,
  MapIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { produce } from "immer";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

const EMPTY_VALUE: CreateWarehouseV2Input = {
  warehouseName: "",
  phoneNumber: "",
  address: "",
  ownerName: "",
  userName: "",
  password: "",
  image: "",
  lat: "",
  lng: "",
  useMainBranchVisibility: false,
};

export const createWarehouseSheetV2 = createSheet<
  { edit: CreateWarehouseV2Input | UpdateWarehouseV2Input | undefined },
  unknown
>(
  ({ close, edit }) => {
    const [input, setInput] = useState<
      CreateWarehouseV2Input | UpdateWarehouseV2Input
    >(edit ?? EMPTY_VALUE);
    const [isDragging, setIsDragging] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { trigger: create, isMutating: loadingCreate } =
      useCreateWarehouseV2();
    const { trigger: update, isMutating: loadingUpdate } =
      useUpdateWarehouseV2();
    const { trigger: uploadFile, isMutating: isUploading } =
      useUploadFileMinIO();

    const handleImageUpload = useCallback(
      (file: File) => {
        if (!file.type.startsWith("image/")) {
          toast.error("Please upload an image file.");
          return;
        }

        // Create preview URL immediately for better UX
        const previewUrl = URL.createObjectURL(file);
        setInput(
          produce((draft) => {
            draft.image = previewUrl;
          }),
        );

        uploadFile({ file })
          .then(({ url }) => {
            // Clean up the preview URL
            URL.revokeObjectURL(previewUrl);
            // Set the actual uploaded URL
            setInput(
              produce((draft) => {
                draft.image = url;
              }),
            );
            toast.success("Image uploaded successfully.");
          })
          .catch((e) => {
            // Clean up the preview URL on error
            URL.revokeObjectURL(previewUrl);
            // Revert to previous state
            setInput(
              produce((draft) => {
                draft.image = "";
              }),
            );
            toast.error(e.message ?? "Failed to upload image");
          });
      },
      [uploadFile, setInput],
    );

    const removeImage = useCallback(() => {
      setInput(
        produce((draft) => {
          draft.image = "";
        }),
      );
    }, [setInput]);

    const onCreate = useCallback(async () => {
      let res: ResponseType<string> = {
        success: false,
        result: "",
      };
      if (!edit) {
        res = await create(input);
      } else {
        if ("id" in edit) {
          res = await update({ ...input, id: edit.id });
        }
      }

      if (res.success) {
        toast.success(!edit ? "Warehouse created" : "Warehouse info updated");
        close(input);
      } else {
        toast.error(res.error || "Create warehouse failed");
      }
    }, [close, create, edit, input, update]);

    return (
      <>
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold">
                {edit ? "Edit Warehouse" : "Create New Warehouse"}
              </SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {edit
                  ? "Update the warehouse details below"
                  : "Fill in the details to set up a new warehouse"}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-6 py-5 px-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Image Upload Section */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Warehouse Image
            </p>

            {input.image ? (
              <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-xl border border-border">
                <ImageWithFallback
                  src={input.image}
                  alt="Warehouse Image"
                  title="Warehouse Image"
                  className="w-16 h-16 object-cover rounded-lg border bg-white flex-shrink-0"
                  width={64}
                  height={64}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground mb-0.5">
                    Image uploaded
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-48">
                    {input.image.startsWith("blob:")
                      ? "Processing…"
                      : input.image.split("/").pop()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeImage}
                  disabled={isUploading}
                  className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <div
                className={`relative flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30 bg-muted/10"
                } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const files = Array.from(e.dataTransfer.files);
                  if (files.length > 0) handleImageUpload(files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {isUploading ? "Uploading…" : "Click or drag to upload"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    PNG, JPG, GIF up to 5 MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="sr-only"
                />
              </div>
            )}
          </div>

          {/* Basic Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Basic Information
              </h3>
            </div>

            <MaterialInput
              label="Warehouse Name *"
              placeholder="Enter warehouse name"
              type="text"
              value={input.warehouseName}
              onChange={(e) =>
                setInput(
                  produce((draft) => {
                    draft.warehouseName = e.target.value;
                  }),
                )
              }
              autoFocus
            />

            <div className="grid grid-cols-2 gap-4">
              <MaterialInput
                label="Owner Name"
                placeholder="Enter owner name"
                type="text"
                value={input.ownerName}
                onChange={(e) =>
                  setInput(
                    produce((draft) => {
                      draft.ownerName = e.target.value;
                    }),
                  )
                }
              />

              <MaterialInput
                label="Phone Number"
                placeholder="+855 ..."
                type="tel"
                value={input.phoneNumber}
                onChange={(e) =>
                  setInput(
                    produce((draft) => {
                      draft.phoneNumber = e.target.value;
                    }),
                  )
                }
              />
            </div>

            {/* Visibility toggle */}
            <div
              className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors cursor-pointer select-none ${
                input.useMainBranchVisibility
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-muted/20 hover:bg-muted/40"
              }`}
              onClick={() =>
                setInput(
                  produce((draft) => {
                    draft.useMainBranchVisibility =
                      !draft.useMainBranchVisibility;
                  }),
                )
              }
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted flex-shrink-0 mt-0.5">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground leading-tight">
                    Use Main Branch Visibility
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Inherit product visibility settings from the main branch
                  </p>
                </div>
              </div>
              <Switch
                checked={input.useMainBranchVisibility}
                onCheckedChange={(checked) =>
                  setInput(
                    produce((draft) => {
                      draft.useMainBranchVisibility = checked;
                    }),
                  )
                }
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Location Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Location
              </h3>
            </div>

            <MaterialInput
              label="Address"
              placeholder="Enter full address"
              type="text"
              value={input.address}
              onChange={(e) =>
                setInput(
                  produce((draft) => {
                    draft.address = e.target.value;
                  }),
                )
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <MaterialInput
                label="Latitude"
                placeholder="e.g. 13.7563"
                type="number"
                step="any"
                value={input.lat}
                onChange={(e) =>
                  setInput(
                    produce((draft) => {
                      draft.lat = e.target.value;
                    }),
                  )
                }
              />

              <MaterialInput
                label="Longitude"
                placeholder="e.g. 100.5018"
                type="number"
                step="any"
                value={input.lng}
                onChange={(e) =>
                  setInput(
                    produce((draft) => {
                      draft.lng = e.target.value;
                    }),
                  )
                }
              />
            </div>

            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapIcon className="h-3 w-3 flex-shrink-0" />
              Coordinates are optional and help with delivery routing
            </p>
          </div>

          {/* User Account Section (only for new warehouses) */}
          {!edit && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                  <User className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Manager Account
                </h3>
              </div>

              <p className="text-xs text-muted-foreground -mt-1">
                These credentials will be used by the warehouse manager to log
                in.
              </p>

              <MaterialInput
                label="Username *"
                placeholder="e.g. warehouse_mgr"
                type="text"
                value={(input as CreateWarehouseV2Input).userName}
                onChange={(e) =>
                  setInput(
                    produce((draft) => {
                      (draft as CreateWarehouseV2Input).userName =
                        e.target.value;
                    }),
                  )
                }
              />

              <div className="relative">
                <MaterialInput
                  label="Password *"
                  placeholder="Enter a secure password"
                  type={showPassword ? "text" : "password"}
                  value={(input as CreateWarehouseV2Input).password}
                  onChange={(e) =>
                    setInput(
                      produce((draft) => {
                        (draft as CreateWarehouseV2Input).password =
                          e.target.value;
                      }),
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => close(undefined as unknown)}
              disabled={loadingCreate || loadingUpdate || isUploading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={onCreate}
              disabled={loadingCreate || loadingUpdate || isUploading}
            >
              {loadingCreate || loadingUpdate ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  {edit ? "Updating…" : "Creating…"}
                </>
              ) : (
                <>{edit ? "Update Warehouse" : "Create Warehouse"}</>
              )}
            </Button>
          </div>
        </SheetFooter>
      </>
    );
  },
  { defaultValue: null },
);
