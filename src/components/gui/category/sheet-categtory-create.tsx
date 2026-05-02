import {
  useCreateCategory,
  useUpdateCategory,
} from "@/app/hooks/use-query-category";
import { useUploadFileMinIO } from "@/app/hooks/use-upload-file";
import { createSheet } from "@/components/create-sheet";
import LabelInput from "@/components/label-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Category } from "@/lib/server-functions/category/create-category";
import { useAuthentication } from "contexts/authentication-context";
import { produce } from "immer";
import { LoaderIcon, UploadCloud } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { PrinterSelect } from "./printer-select";
import { Checkbox } from "@/components/ui/checkbox";

const defaultValue = {
  title: "",
  description: "",
  parentId: null,
  imageUrl: null,
  printerId: null,
  createdAt: "",
};
export const createCategorySheet = createSheet<
  {
    data?: Category;
  },
  Category
>(({ close, data }) => {
  const { currentWarehouse } = useAuthentication();
  const [input, setInput] = useState<Omit<Category, "id">>(
    data ?? defaultValue,
  );
  const { trigger, isMutating: isUploading } = useUploadFileMinIO();

  const { trigger: create, isMutating: isCreating } = useCreateCategory();
  const { trigger: update, isMutating: isUpdating } = useUpdateCategory();

  const onUploadFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      trigger({ file })
        .then(({ url }) => {
          setInput(
            produce((draft) => {
              draft.imageUrl = url;
            }),
          );
        })
        .catch((e) => {
          toast.error(e.message ?? "Failed to upload image");
        });
    },
    [trigger],
  );

  const onSubmit = useCallback(() => {
    if (data) {
      update({ ...input, id: data.id })
        .then((r) => {
          close(r);
          toast.success("Category updated");
        })
        .catch((e) => {
          toast.error(e.message ?? "Failed to update category");
        });
    } else {
      create(input)
        .then((r) => {
          if (!r.result) return;
          close(r.result);
          toast.success("Category created");
        })
        .catch((e) => {
          toast.error(e.message ?? "Failed to create category");
        });
    }
  }, [data, create, update, close, input]);

  const loading = useMemo(() => {
    return isCreating || isUpdating;
  }, [isCreating, isUpdating]);

  return (
    <>
      <SheetHeader>
        <SheetTitle>Create New Category</SheetTitle>
      </SheetHeader>
      <div className="flex flex-col gap-3 py-4">
        <div className="flex flex-col gap-2 items-start mb-2">
          <Label>Image</Label>
          {input.imageUrl && (
            <Image
              src={input.imageUrl}
              alt="Uploaded preview"
              className="w-32 h-32 object-cover rounded-md"
              width="56"
              height="56"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={onUploadFile}
            className="hidden"
            id="upload-image"
            readOnly={currentWarehouse?.isMain ? false : true}
            disabled={currentWarehouse?.isMain ? false : true}
          />
          <Button asChild variant="secondary">
            <label htmlFor="upload-image" className="cursor-pointer flex gap-2">
              <UploadCloud /> Upload file
              {isUploading && <LoaderIcon className="h-4 w-4 animate-spin" />}
            </label>
          </Button>
        </div>

        <LabelInput
          label="Title"
          placeholder="Enter category name"
          value={input.title}
          onChange={(e) => {
            setInput(
              produce((draft) => {
                draft.title = e.target.value;
              }),
            );
          }}
          readOnly={currentWarehouse?.isMain ? false : true}
        />
        <div className="flex flex-col gap-2 mt-2">
          <Label>Description</Label>
          <Textarea
            value={input.description ?? ""}
            placeholder="Enter description"
            onChange={(e) => {
              setInput(
                produce((draft) => {
                  draft.description = e.target.value;
                }),
              );
            }}
            readOnly={currentWarehouse?.isMain ? false : true}
          />
        </div>

        <div className="flex flex-row items-center gap-2">
          <div className="w-1/2">
            <PrinterSelect
              value={input.printerId ?? null}
              onChange={(printerId) => {
                setInput(
                  produce((draft) => {
                    draft.printerId = printerId;
                  }),
                );
              }}
            />
          </div>
          <div className="w-1/2">
            <LabelInput
              label="Sort Order"
              placeholder="Enter sort order to arrange categories"
              value={input.sortOrder?.toString() || "0"}
              onChange={(e) => {
                setInput(
                  produce((draft) => {
                    draft.sortOrder = parseInt(e.target.value, 10) || 0;
                  }),
                );
              }}
              readOnly={currentWarehouse?.isMain ? false : true}
            />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 space-y-4">
          <div className="w-full">
            <Label className="py-2">
              <Checkbox
                checked={input.excludeFeeDelivery}
                onCheckedChange={(checked) => {
                  setInput(
                    produce((draft) => {
                      draft.excludeFeeDelivery = checked === true;
                    }),
                  );
                }}
                className="mr-2"
              />
              Exclude Fee Delivery
            </Label>
          </div>
          <div className="w-full">
            <LabelInput
              type="number"
              step={0.1}
              label="Extra Delivery Fee"
              placeholder="Enter extra delivery fee amount"
              value={input.markExtraFee?.toString() || "0"}
              onChange={(e) => {
                setInput(
                  produce((draft) => {
                    draft.markExtraFee = parseFloat(e.target.value) || 0;
                  }),
                );
              }}
            />
          </div>
        </div>
      </div>
      <SheetFooter>
        <Button
          disabled={loading || !input.title}
          onClick={onSubmit}
          size={"sm"}
        >
          Save
          {loading && <LoaderIcon className="h-4 w-4 animate-spin" />}
        </Button>
      </SheetFooter>
    </>
  );
});
