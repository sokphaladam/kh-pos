"use client";
import {
  useCreateSupplier,
  useUpdateSupplier,
  useQuerySupplierById,
} from "@/app/hooks/use-query-supplier";
import { createSheet } from "@/components/create-sheet";
import { Button } from "@/components/ui/button";
import { SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Supplier, SupplierInput } from "@/lib/server-functions/supplier";
import { produce } from "immer";
import { LoaderIcon } from "lucide-react";
import { Fragment, useCallback, useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
const initialInput: SupplierInput = {
  name: "",
  contactEmail: "",
  contactName: "",
  contactPhone: "",
  note: "",
  address: "",
  isConsignment: false,
};

export const createSupplierSheet = createSheet<
  { data?: Supplier; supplierId?: string },
  Supplier | null
>(
  ({ close, data, supplierId }) => {
    const { supplier: fetchedSupplier, isLoading: isFetching } =
      useQuerySupplierById(supplierId || "");

    const [supplier, setSupplier] = useState<SupplierInput>(
      data ?? initialInput
    );

    const { trigger: update, isMutating: isUpdating } = useUpdateSupplier();

    const { trigger: create, isMutating: isCreating } = useCreateSupplier();

    useEffect(() => {
      if (fetchedSupplier && !data) {
        setSupplier({
          name: fetchedSupplier.name,
          contactEmail: fetchedSupplier.contactEmail || "",
          contactName: fetchedSupplier.contactName || "",
          contactPhone: fetchedSupplier.contactPhone || "",
          note: fetchedSupplier.note || "",
          address: fetchedSupplier.address || "",
          isConsignment: fetchedSupplier.isConsignment || false,
        });
      }
    }, [fetchedSupplier, data]);

    const onChangeText = useCallback(
      (key: keyof SupplierInput, value: string) => {
        setSupplier(
          produce((draft) => {
            (draft as Record<string, unknown>)[key] = value;
          })
        );
      },
      []
    );

    const onSubmit = useCallback(() => {
      if (supplierId || data) {
        const id = supplierId || data?.id;
        if (id) {
          update({ ...supplier, id })
            .then((r) => {
              close(r as Supplier | null);
              toast.success("Supplier updated");
            })
            .catch(() => {
              toast.error("Error: something went wrong!");
            });
        }
      } else {
        create(supplier)
          .then((r) => {
            close(r as Supplier | null);
            toast.success("Supplier created");
          })
          .catch(() => {
            toast.error("Error: something went wrong!");
          });
      }
    }, [supplier, create, data, update, close, supplierId]);

    const isLoading = useMemo(
      () => isCreating || isUpdating || isFetching,
      [isCreating, isUpdating, isFetching]
    );

    const disabled = useMemo(() => {
      return !supplier.name || !supplier.name.trim();
    }, [supplier]);

    return (
      <Fragment>
        <SheetHeader>
          <SheetTitle>
            {!supplierId && !data ? "Create" : "Edit"} Supplier
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4">
          {/* Row 1: Name and Contact Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={supplier?.name ?? ""}
                placeholder="Name"
                onChange={(e) => onChangeText("name", e.target.value)}
              />
            </div>
            <div>
              <Label>Contact Name</Label>
              <Input
                value={supplier?.contactName ?? ""}
                placeholder="Contact name"
                onChange={(e) => onChangeText("contactName", e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Contact Email and Contact Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Contact Email</Label>
              <Input
                type="email"
                value={supplier?.contactEmail ?? ""}
                placeholder="Email"
                onChange={(e) => onChangeText("contactEmail", e.target.value)}
              />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input
                value={supplier?.contactPhone ?? ""}
                placeholder="Phone number"
                onChange={(e) => onChangeText("contactPhone", e.target.value)}
              />
            </div>
          </div>

          {/* Row 3: Address (full width) */}
          <div>
            <Label>Address</Label>
            <Input
              value={supplier?.address ?? ""}
              placeholder="Address"
              onChange={(e) => onChangeText("address", e.target.value)}
            />
          </div>

          {/* Row 4: Notes (full width) */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={supplier?.note ?? ""}
              placeholder="Note..."
              onChange={(e) => onChangeText("note", e.target.value)}
            />
          </div>

          {/* Row 5: Consignment checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isConsignment"
              checked={supplier?.isConsignment ?? false}
              onCheckedChange={(checked) => {
                setSupplier(
                  produce((draft) => {
                    (draft as Record<string, unknown>).isConsignment = checked;
                  })
                );
              }}
            />
            <Label htmlFor="isConsignment">Consignment</Label>
          </div>
        </div>
        <SheetFooter className="mt-4">
          <Button disabled={disabled} onClick={onSubmit}>
            Submit
            {isLoading && <LoaderIcon className="h-4 w-4 animate-spin" />}
          </Button>
        </SheetFooter>
      </Fragment>
    );
  },
  {
    defaultValue: null,
  }
);
