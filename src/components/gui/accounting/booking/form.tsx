"use client";

import { useMutationCreateBooking } from "@/app/hooks/accounting/use-query-booking";
import { createSheet } from "@/components/create-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { AccountCombobox } from "@/components/account-combobox";
import {
  SchemaAccountBooking,
  TypeSchemaAccountBooking,
} from "@/classes/accounting/account-booking";

export const bookingForm = createSheet<
  unknown,
  TypeSchemaAccountBooking | null
>(
  ({ close }) => {
    const { trigger: createTrigger, isMutating: isCreating } =
      useMutationCreateBooking();

    const form = useForm<TypeSchemaAccountBooking>({
      resolver: zodResolver(SchemaAccountBooking),
      defaultValues: {
        bookingName: "",
        amount: 0,
        accountId: "",
      },
    });

    const {
      formState: { errors },
      register,
      control,
      handleSubmit,
    } = form;

    const onSubmit = useCallback(
      async (formData: TypeSchemaAccountBooking) => {
        try {
          const result = await createTrigger(formData);
          if (result.success) {
            toast.success("Booking created successfully");
            close(formData);
          } else {
            toast.error("Failed to create booking");
          }
        } catch {
          toast.error("An error occurred while creating booking");
        }
      },
      [close, createTrigger],
    );

    return (
      <>
        <SheetHeader>
          <SheetTitle>Create Account Booking</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 p-4">
          <form onSubmit={handleSubmit(onSubmit)} id="booking-form">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="bookingName"
                  className="text-sm font-medium text-slate-700"
                >
                  Description *
                </Label>
                <Input
                  id="bookingName"
                  {...register("bookingName")}
                  placeholder="e.g., Payment for services, Sales revenue, etc."
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 border-slate-200"
                />
                {errors.bookingName && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    {errors.bookingName?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="amount"
                  className="text-sm font-medium text-slate-700"
                >
                  Amount *
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...register("amount", { valueAsNumber: true })}
                  placeholder="0.00"
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 border-slate-200"
                />
                {errors.amount && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    {errors.amount?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="accountId"
                  className="text-sm font-medium text-slate-700"
                >
                  Account *
                </Label>
                <Controller
                  name="accountId"
                  control={control}
                  render={({ field }) => (
                    <AccountCombobox
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Search or create account"
                    />
                  )}
                />
                {errors.accountId && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    {errors.accountId?.message}
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>
        <SheetFooter>
          <Button
            type="submit"
            form="booking-form"
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? "Creating..." : "Create Booking"}
          </Button>
        </SheetFooter>
      </>
    );
  },
  { defaultValue: null },
);
