"use client";
import { createDialog } from "@/components/create-dialog";
import LabelInput from "@/components/label-input";
import { Button } from "@/components/ui/button";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React, { useCallback } from "react";

export const createProductDialog = createDialog<object, unknown>(
  ({ close }) => {
    const onCreate = useCallback(() => {
      close({ id: "123456-789012-345678-901234" });
    }, [close]);

    return (
      <>
        <DialogHeader>
          <DialogTitle>Create new product</DialogTitle>
        </DialogHeader>
        <hr />
        <div className="flex flex-col gap-2">
          <LabelInput label="Title" placeholder="Enter product title" />
          <LabelInput
            label="Description"
            placeholder="Input something about product..."
            multiple
          />
        </div>
        <DialogFooter>
          <Button onClick={onCreate} size={"sm"}>
            Create
          </Button>
        </DialogFooter>
      </>
    );
  },
  { defaultValue: undefined }
);
