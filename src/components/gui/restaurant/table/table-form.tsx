import React, { useState } from "react";
import { MaterialInput } from "@/components/ui/material-input";
import { Badge } from "@/components/ui/badge";
import { produce } from "immer";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import LabelInput from "@/components/label-input";
import { useAuthentication } from "contexts/authentication-context";

interface Props {
  data: {
    tableNumber: string;
    seatingCapacity: number;
    section: string;
    tableShape: string;
    locationDescription: string;
    features: string[];
    additionalNotes: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setData: React.Dispatch<React.SetStateAction<any>>;
  onSubmit?: () => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

export default function TableForm({
  data,
  setData,
  onSubmit,
  isLoading,
  isEdit,
}: Props) {
  const { setting } = useAuthentication();
  const [featureInput, setFeatureInput] = useState("");

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setData(
        produce(data, (draft) => {
          draft.features.push(featureInput.trim());
        })
      );
      setFeatureInput("");
    }
  };

  const removeFeature = (feature: string) => {
    setData(
      produce(data, (draft) => {
        draft.features = draft.features.filter((f) => f !== feature);
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onSubmit?.();
  };

  const listSection = setting?.data
    ? JSON.parse(
        setting.data.result?.find((f) => f.option === "TABLE_SELECTION")
          ?.value || ""
      )
    : [];

  const listShape = setting?.data
    ? JSON.parse(
        setting.data.result?.find((f) => f.option === "TABLE_SHAPE")?.value ||
          ""
      )
    : [];

  // Check required fields
  const isDisabled =
    !data.tableNumber?.trim() || !data.seatingCapacity || !data.section?.trim();

  return (
    <div>
      <form id="table-form" className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">
            {isEdit ? "Edit Table" : "Create New Table"}
          </h2>
          <p className="text-gray-500 mb-4">
            {isEdit ? "Change a " : "Add a new "} dining table to your
            restaurant layout
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <MaterialInput
              type="text"
              required
              placeholder="e.g., T-01, A1, 15"
              label="Table Number *"
              className="w-full"
              value={data.tableNumber}
              onChange={(e) => {
                setData(
                  produce(data, (draft) => {
                    draft.tableNumber = e.target.value;
                  })
                );
              }}
            />
          </div>
          <div>
            <MaterialInput
              type="number"
              required
              placeholder="e.g., 4"
              label="Seating Capacity *"
              className="w-full"
              value={data.seatingCapacity}
              onChange={(e) => {
                setData(
                  produce(data, (draft) => {
                    draft.seatingCapacity = Number(e.target.value ?? 1);
                  })
                );
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
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
                    f.value === data.section
                )?.label || ""
              }
              onSelectedItem={(e) => {
                setData(
                  produce(data, (draft) => {
                    draft.section = (e as { value: string }).value;
                  })
                );
              }}
            />
          </div>
          <div>
            <MaterialInput
              label="Table Shape"
              data={listShape}
              renderItem={({ item }) => (
                <div className="text-sm font-normal">{item.label}</div>
              )}
              value={
                listShape.find(
                  (f: { value: string; label: string }) =>
                    f.value === data.tableShape
                )?.label || ""
              }
              onSelectedItem={(e) => {
                setData(
                  produce(data, (draft) => {
                    draft.tableShape = (e as { value: string }).value;
                  })
                );
              }}
            />
          </div>
        </div>
        <div>
          <MaterialInput
            type="text"
            placeholder="e.g., Near window, Corner table, Center of room"
            label="Location Description"
            className="w-full"
            value={data.locationDescription}
            onChange={(e) => {
              setData(
                produce(data, (draft) => {
                  draft.locationDescription = e.target.value;
                })
              );
            }}
          />
        </div>
        <div>
          <div className="flex w-full gap-2">
            <div className="w-[97%]">
              <MaterialInput
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                placeholder="Add feature (e.g., Window view, Wheelchair accessible)"
                label="Special Features"
                className="w-full"
              />
            </div>
            <button
              type="button"
              onClick={handleAddFeature}
              className="bg-gray-900 text-white rounded-md px-3 py-2 flex items-center justify-center"
              aria-label="Add feature"
            >
              +
            </button>
          </div>
          {data.features.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 w-full">
              {data.features.map((f, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs rounded-full px-3 py-1"
                >
                  {f}
                  <button
                    type="button"
                    onClick={() => removeFeature(f)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div>
          <LabelInput
            type="textarea"
            placeholder="Any additional information about this table..."
            label="Additional Notes"
            className="w-full h-[100px]"
            value={data.additionalNotes}
            onChange={(e) => {
              setData(
                produce(data, (draft) => {
                  draft.additionalNotes = e.target.value;
                })
              );
            }}
            multiple
          />
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button
            type="button"
            disabled={isLoading || isDisabled}
            onClick={handleSubmit}
          >
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
