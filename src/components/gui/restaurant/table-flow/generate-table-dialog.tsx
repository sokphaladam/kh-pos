import { useMutationGenerateTableLayout } from "@/app/hooks/use-query-table";
import { createDialog } from "@/components/create-dialog";
import { Button } from "@/components/ui/button";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MaterialInput } from "@/components/ui/material-input";
import { useAuthentication } from "contexts/authentication-context";
import { produce } from "immer";
import { useState } from "react";

interface GenerateTableForm {
  count: number;
  key: string;
  capacity: number;
  section: string;
  shape: string;
}

const DEFAULT_FORM: GenerateTableForm = {
  count: 5,
  key: "T",
  capacity: 4,
  section: "",
  shape: "",
};

export const generateTableDialog = createDialog(
  ({ close }) => {
    const { trigger, isMutating } = useMutationGenerateTableLayout();
    const { setting } = useAuthentication();
    const [form, setForm] = useState<GenerateTableForm>(DEFAULT_FORM);

    const listSection = setting?.data
      ? JSON.parse(
          setting.data.result?.find((f) => f.option === "TABLE_SELECTION")
            ?.value || "[]",
        )
      : [];

    const listShape = setting?.data
      ? JSON.parse(
          setting.data.result?.find((f) => f.option === "TABLE_SHAPE")?.value ||
            "[]",
        )
      : [];

    const isDisabled =
      !form.key.trim() || !form.count || !form.capacity || !form.section.trim();

    const handleGenerate = async () => {
      await trigger({
        count: form.count,
        default: {
          key: form.key,
          capacity: form.capacity,
          section: form.section,
          shape: form.shape,
        },
      });
      close(null);
    };

    return (
      <>
        <DialogHeader>
          <DialogTitle>Generate Table Layout</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Automatically create multiple tables with default settings.
        </p>
        <div className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <MaterialInput
              type="number"
              required
              label="Number of Tables *"
              placeholder="e.g., 5"
              value={form.count}
              onChange={(e) =>
                setForm(
                  produce((draft) => {
                    draft.count = Number(e.target.value) || 1;
                  }),
                )
              }
            />
            <MaterialInput
              type="text"
              required
              label="Table Name Prefix *"
              placeholder="e.g., T, A, VIP"
              value={form.key}
              onChange={(e) =>
                setForm(
                  produce((draft) => {
                    draft.key = e.target.value;
                  }),
                )
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MaterialInput
              type="number"
              required
              label="Seating Capacity *"
              placeholder="e.g., 4"
              value={form.capacity}
              onChange={(e) =>
                setForm(
                  produce((draft) => {
                    draft.capacity = Number(e.target.value) || 1;
                  }),
                )
              }
            />
            <MaterialInput
              required
              label="Section *"
              data={listSection}
              renderItem={({ item }) => (
                <div className="text-sm font-normal">{item.label}</div>
              )}
              value={
                listSection.find(
                  (f: { value: string; label: string }) =>
                    f.value === form.section,
                )?.label || ""
              }
              onSelectedItem={(e) =>
                setForm(
                  produce((draft) => {
                    draft.section = (e as { value: string }).value;
                  }),
                )
              }
            />
          </div>
          <MaterialInput
            label="Table Shape"
            data={listShape}
            renderItem={({ item }) => (
              <div className="text-sm font-normal">{item.label}</div>
            )}
            value={
              listShape.find(
                (f: { value: string; label: string }) => f.value === form.shape,
              )?.label || ""
            }
            onSelectedItem={(e) =>
              setForm(
                produce((draft) => {
                  draft.shape = (e as { value: string }).value;
                }),
              )
            }
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(null)}>
            Cancel
          </Button>
          <Button disabled={isDisabled || isMutating} onClick={handleGenerate}>
            {isMutating ? "Generating..." : "Generate Tables"}
          </Button>
        </DialogFooter>
      </>
    );
  },
  { defaultValue: null },
);
