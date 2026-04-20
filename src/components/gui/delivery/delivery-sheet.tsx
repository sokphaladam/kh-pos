"use client";

import {
  useMutationCreateCustomer,
  useMutationUpdateCustomerId,
} from "@/app/hooks/use-query-customer";
import { Customer } from "@/classes/customer";
import { createSheet } from "@/components/create-sheet";
import { SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import LabelInput from "@/components/label-input";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  id?: string;
  initialData?: Customer;
}

interface FormData {
  customerName: string;
  phone: string;
  address: string;
  extraPrice: number;
}

interface FormErrors {
  customerName?: string;
  phone?: string;
  address?: string;
  extraPrice?: string;
}

export const deliverySheet = createSheet<Props, unknown>(
  ({ id, initialData, close }) => {
    const isEditMode = Boolean(id && initialData);

    const { trigger: createCustomer, isMutating: isCreating } =
      useMutationCreateCustomer();
    const { trigger: updateCustomer, isMutating: isUpdating } =
      useMutationUpdateCustomerId(id || "");

    const [formData, setFormData] = useState<FormData>({
      customerName: initialData?.customerName || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      extraPrice: parseFloat(initialData?.extraPrice || "0") || 0,
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = (): boolean => {
      const newErrors: FormErrors = {};

      if (!formData.customerName.trim()) {
        newErrors.customerName = "Customer name is required";
      }

      if (formData.extraPrice < 0) {
        newErrors.extraPrice = "Extra price cannot be negative";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
      if (!validateForm()) {
        toast.error("Please fix the validation errors");
        return;
      }

      setIsSubmitting(true);
      try {
        const payload = {
          customerName: formData.customerName.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          type: "delivery" as const,
          extraPrice: formData.extraPrice,
        };

        if (isEditMode) {
          const result = await updateCustomer(payload);
          if (result?.success) {
            toast.success("Customer updated successfully");
            close?.(result);
          } else {
            throw new Error(result?.error || "Failed to update customer");
          }
        } else {
          const result = await createCustomer(payload);
          if (result?.success) {
            toast.success("Customer created successfully");
            close?.(result);
          } else {
            throw new Error(result?.error || "Failed to create customer");
          }
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Something went wrong",
        );
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleFieldChange = (field: keyof FormData, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: field === "extraPrice" ? parseFloat(value) || 0 : value,
      }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

    const isLoading = isCreating || isUpdating || isSubmitting;

    return (
      <>
        <SheetHeader>
          <SheetTitle>
            {isEditMode ? "Edit Delivery Customer" : "Create Delivery Customer"}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4">
          <LabelInput
            label="Delivery Name"
            value={formData.customerName}
            onChange={(e) => {
              handleFieldChange("customerName", e.target.value);
              handleFieldChange("phone", e.target.value);
            }}
            placeholder="Enter delivery name"
            disabled={isLoading}
            required
            className={errors.customerName ? "border-red-500" : ""}
          />
          {errors.customerName && (
            <p className="text-sm text-red-500 mt-1">{errors.customerName}</p>
          )}
          <LabelInput
            label="Address"
            value={formData.address}
            onChange={(e) => handleFieldChange("address", e.target.value)}
            placeholder="Enter delivery address"
            disabled={isLoading}
            required
            multiple
            className={errors.address ? "border-red-500" : ""}
          />
          {errors.address && (
            <p className="text-sm text-red-500 mt-1">{errors.address}</p>
          )}

          <LabelInput
            label="Extra Price ($)"
            type="number"
            value={formData.extraPrice.toString()}
            onChange={(e) => handleFieldChange("extraPrice", e.target.value)}
            placeholder="0.00"
            disabled={isLoading}
            min="0"
            step="0.01"
            className={errors.extraPrice ? "border-red-500" : ""}
          />
          {errors.extraPrice && (
            <p className="text-sm text-red-500 mt-1">{errors.extraPrice}</p>
          )}
        </div>

        <SheetFooter className="gap-2 pt-6">
          <Button
            variant="outline"
            onClick={() => close?.(null)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-current border-r-transparent rounded-full mr-2" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{isEditMode ? "Update Customer" : "Create Customer"}</>
            )}
          </Button>
        </SheetFooter>
      </>
    );
  },
  { defaultValue: null },
);
