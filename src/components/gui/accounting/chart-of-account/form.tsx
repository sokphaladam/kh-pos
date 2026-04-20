"use client";

import {
  useMutationCreateChartOfAccount,
  useMutationUpdateChartOfAccount,
} from "@/app/hooks/accounting/use-query-chart-of-account";
import { createDialog } from "@/components/create-dialog";
import { Button } from "@/components/ui/button";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export const SchemaChartOfAccount = z.object({
  id: z.string().optional(),
  account_name: z.string().min(1, "Account name is required"),
  account_type: z.enum(["revenue", "expense"], {
    errorMap: () => ({ message: "Account type is required" }),
  }),
});

export type TypeSchemaChartOfAccount = z.infer<typeof SchemaChartOfAccount>;

interface FormProps {
  data?: TypeSchemaChartOfAccount | null;
}

export const chartOfAccountForm = createDialog<
  FormProps,
  TypeSchemaChartOfAccount | null
>(({ data, close }) => {
  const { trigger: createTrigger, isMutating: isCreating } =
    useMutationCreateChartOfAccount();
  const { trigger: updateTrigger, isMutating: isUpdating } =
    useMutationUpdateChartOfAccount();
  const form = useForm<TypeSchemaChartOfAccount>({
    resolver: zodResolver(SchemaChartOfAccount),
    defaultValues: {
      id: data?.id || undefined,
      account_name: data?.account_name || "",
      account_type: data?.account_type || "expense",
    },
  });

  const {
    formState: { errors },
    register,
    control,
    handleSubmit,
  } = form;

  useEffect(() => {
    if (data) {
      form.reset({
        id: data.id,
        account_name: data.account_name,
        account_type: data.account_type,
      });
    }
  }, [data, form]);

  const onSubmit = useCallback(
    async (formData: TypeSchemaChartOfAccount) => {
      try {
        if (formData.id) {
          const result = await updateTrigger(formData);
          if (result.success) {
            toast.success("Chart of account updated successfully");
            close(formData);
          } else {
            toast.error("Failed to update chart of account");
          }
        } else {
          const result = await createTrigger(formData);
          if (result.success) {
            toast.success("Chart of account created successfully");
            close(formData);
          } else {
            toast.error("Failed to create chart of account");
          }
        }
      } catch {
        toast.error("An error occurred while saving chart of account");
      }
    },
    [close, createTrigger, updateTrigger],
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {data?.id ? "Edit" : "Create"} Chart of Account
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 p-4">
        <form onSubmit={handleSubmit(onSubmit)} id="chart-of-account-form">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="account_name"
                className="text-sm font-medium text-slate-700"
              >
                Account Name *
              </Label>
              <Input
                id="account_name"
                {...register("account_name")}
                placeholder="e.g., Cash, Sales, etc."
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 border-slate-200"
              />
              {errors.account_name && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  {errors.account_name?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="account_type"
                className="text-sm font-medium text-slate-700"
              >
                Account Type *
              </Label>
              <Controller
                name="account_type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.account_type && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  {errors.account_type?.message}
                </p>
              )}
            </div>
          </div>
        </form>
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => close(null)}
          disabled={isCreating || isUpdating}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="chart-of-account-form"
          disabled={isCreating || isUpdating}
        >
          {data?.id ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </>
  );
});
