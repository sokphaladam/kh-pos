"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfoIcon } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FormDataHall } from "../hall-seat-form";

interface Props {
  form: UseFormReturn<FormDataHall>;
}

export function HallInformation({ form }: Props) {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const statusValue = watch("status");

  return (
    <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <InfoIcon className="h-5 w-5 text-info" />
          Hall Information
        </CardTitle>
        <CardDescription>
          Enter the basic details for your cinema hall
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="hallName"
              className="text-sm font-medium text-foreground/80"
            >
              Hall Name *
            </Label>
            <Input
              id="hallName"
              {...register("hallName")}
              placeholder="e.g., Grand Theater"
              className="transition-all duration-200 focus:ring-2 focus:ring-info/20 border-border"
            />
            {errors.hallName && (
              <p className="text-sm text-destructive flex items-center gap-1">
                {errors.hallName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="hallNumber"
              className="text-sm font-medium text-foreground/80"
            >
              Hall Number *
            </Label>
            <Input
              id="hallNumber"
              type="number"
              {...register("hallNumber", { valueAsNumber: true })}
              placeholder="e.g., 1"
              className="transition-all duration-200 focus:ring-2 focus:ring-info/20 border-border"
            />
            {errors.hallNumber && (
              <p className="text-sm text-destructive flex items-center gap-1">
                {errors.hallNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="status"
              className="text-sm font-medium text-foreground/80"
            >
              Status *
            </Label>
            <Select
              value={statusValue}
              onValueChange={(value) =>
                setValue(
                  "status",
                  value as "active" | "maintenance" | "inactive"
                )
              }
            >
              <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-info/20 border-border">
                <SelectValue placeholder="Select hall status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    Active
                  </div>
                </SelectItem>
                <SelectItem value="maintenance">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-warning"></div>
                    Maintenance
                  </div>
                </SelectItem>
                <SelectItem value="inactive">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-destructive"></div>
                    Inactive
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive flex items-center gap-1">
                {errors.status.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="rows"
              className="text-sm font-medium text-foreground/80"
            >
              Number of Rows *
            </Label>
            <Input
              id="rows"
              type="number"
              {...register("rows", { valueAsNumber: true })}
              min="1"
              max="50"
              placeholder="10"
              className="transition-all duration-200 focus:ring-2 focus:ring-info/20 border-border"
            />
            {errors.rows && (
              <p className="text-sm text-destructive flex items-center gap-1">
                {errors.rows.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="columns"
              className="text-sm font-medium text-foreground/80"
            >
              Seats per Row *
            </Label>
            <Input
              id="columns"
              type="number"
              {...register("columns", { valueAsNumber: true })}
              min="1"
              max="50"
              placeholder="15"
              className="transition-all duration-200 focus:ring-2 focus:ring-info/20 border-border"
            />
            {errors.columns && (
              <p className="text-sm text-destructive flex items-center gap-1">
                {errors.columns.message}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
