"use client";
import React from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

export type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> & {
  children?: React.ReactNode;
  className?: string;
  displayContent?: "items-first" | "items-last"; // used for children of component
  initialValue?: string;
  isValid?: boolean;
  onValueChange?: ((value: string, isValid: boolean) => void) | undefined;
  preText?: string[] | React.ReactNode[] | React.ReactNode;
  postText?: string[] | React.ReactNode[] | React.ReactNode;
};

export default function LabelInput(
  props: InputProps & { label: string; labelclassname?: string }
) {
  let input = (
    <Input
      {...props}
      onFocus={(e) => e.currentTarget.select()}
      id={props.label.toLowerCase()}
      className={props.className}
    />
  );

  if (props.multiple) {
    input = (
      <Textarea
        {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        onFocus={(e) => e.currentTarget.select()}
        id={props.label.toLowerCase()}
        className={props.className}
      />
    );
  }

  return (
    <div className="grid w-full items-center gap-2">
      <Label
        htmlFor={props.label.toLowerCase()}
        className={props.labelclassname}
      >
        {props.label}
      </Label>
      {input}
    </div>
  );
}
