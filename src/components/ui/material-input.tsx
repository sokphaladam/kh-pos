"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Command as CommandPrimitive } from "cmdk";
import * as React from "react";

import { cn } from "@/lib/utils";
import { Command, CommandGroup, CommandItem, CommandList } from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

import { ChevronDown } from "lucide-react";
import LoadingBar from "../loading-bar-animation";
import { Button } from "./button";
import { Input } from "./input";

export interface MaterialRenderItemInfo<T> {
  item: T;
  index: number;
}

export interface MaterialInputProps<T = unknown>
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  animate?: "float" | "none";
  data?: T[];
  loading?: boolean;
  targetValue?: string;
  onSelectedItem?: (item: unknown) => void;
  renderItem?: (item: MaterialRenderItemInfo<T>) => React.ReactElement;
  ListFooterComponent?: React.ReactElement;
  variant?: "default" | "standard";
}

export type MaterialInputRef = HTMLInputElement & {
  focus?: () => void;
  onOpen: () => void;
};
const MaterialInput = React.forwardRef<
  MaterialInputRef,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MaterialInputProps<any>
>(
  (
    {
      className,
      animate = "float",
      label,
      error,
      data,
      loading,
      renderItem,
      targetValue,
      onSelectedItem,
      placeholder,
      ListFooterComponent,
      variant = "default",
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const listboxId = React.useId();
    React.useImperativeHandle(ref, () => ({
      onOpen: () => setOpen(true),
      ...inputRef.current!,
      focus: () => {
        if (inputRef.current) {
          inputRef.current?.focus();
        }
      },
    }));

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setHasValue(e.target.value.length > 0);
        setOpen(true); // Open dropdown when user types
        props.onChange?.(e);
      },
      [props]
    );

    const handleSelectItem = React.useCallback(
      (item: Record<string, string | undefined>) => {
        setHasValue(true);
        setOpen(false);
        const value =
          targetValue && typeof item !== "string" ? item[targetValue] : item;
        if (onSelectedItem) {
          onSelectedItem(value);
          inputRef.current?.blur();
        }
      },
      [targetValue, onSelectedItem]
    );

    const onFocus = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement, Element>) => {
        setIsFocused(true);
        // Use setTimeout to avoid conflicts with simultaneous events
        if (data && data.length > 0) {
          setTimeout(() => setOpen(true), 0);
        }
        e.target.select();
        props.onFocus?.(e);
      },
      [props, data]
    );

    const onBlur = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement, Element>) => {
        setIsFocused(false);
        if (!props.value) {
          setHasValue(false);
        }

        // Only close if we're not moving focus to the popover content
        const relatedTarget = e.relatedTarget as Element;
        if (
          !relatedTarget ||
          (!relatedTarget.closest("[data-radix-popover-content]") &&
            !relatedTarget.hasAttribute("cmdk-item"))
        ) {
          // Delay closing to prevent conflicts with item selection
          setTimeout(() => {
            // Double-check if input is still not focused
            if (document.activeElement !== inputRef.current) {
              setOpen(false);
            }
          }, 150);
        }

        props.onBlur?.(e);
      },
      [props]
    );

    const renderCustomInput = () =>
      variant === "standard" ? (
        <Input
          ref={inputRef}
          placeholder={isFocused ? placeholder : label}
          {...props}
          className={cn(
            error && "border-red-500 focus:border-red-500",
            className
          )}
          value={props.value === null ? "" : props.value}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          style={{ backgroundColor: "transparent !important" }}
        />
      ) : (
        <input
          ref={inputRef}
          placeholder={isFocused ? placeholder : label}
          {...props}
          className={cn(
            "peer w-full font-normal border-gray-300 bg-transparent px-0 py-2 border-b-[1px] dark:border-gray-600 focus:border-primary text-base md:text-sm text-gray-900 focus:outline-none dark:text-white dark:focus:border-primary transition-colors duration-200",
            error && "border-red-500 focus:border-red-500",
            className
          )}
          value={props.value === null ? "" : props.value}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          style={{ backgroundColor: "transparent !important" }}
        />
      );

    // Sync hasValue with props.value changes
    React.useEffect(() => {
      setHasValue(Boolean(props.value && String(props.value).length > 0));
    }, [props.value]);

    return (
      <div className="relative">
        <Popover open={open}>
          <Command shouldFilter={false} className="bg-transparent">
            <PopoverTrigger asChild>
              <PopoverPrimitive.Anchor asChild>
                <CommandPrimitive.Input asChild className="bg-transparent">
                  <div className="bg-transparent">
                    {renderCustomInput()}
                    {renderItem && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (data && data.length > 0) {
                            setOpen(true);
                            inputRef.current?.focus();
                          }
                        }}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    )}

                    {/* Animated floating label */}
                    {animate === "float" && (
                      <label
                        className={cn(
                          "absolute pointer-events-none left-0 top-2 z-10 origin-[0] -translate-y-6 scale-75 transform duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-90 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-primary transition-all",
                          error
                            ? "text-red-500 peer-focus:text-red-500"
                            : "text-gray-500 dark:text-gray-400",
                          (isFocused || hasValue || props.value) &&
                            !error &&
                            "text-primary dark:text-primary opacity-100",
                          !isFocused &&
                            !hasValue &&
                            !props.value &&
                            "opacity-0",
                          variant === "standard" ? "top-0" : "top-2"
                        )}
                      >
                        {label}
                      </label>
                    )}

                    {/* Loading indicator */}
                    {loading && <LoadingBar />}

                    {/* Error message */}
                    {error && (
                      <p className="mt-1 text-xs text-red-500">{error}</p>
                    )}
                  </div>
                </CommandPrimitive.Input>
              </PopoverPrimitive.Anchor>
            </PopoverTrigger>

            {!open && <CommandList aria-hidden="true" className="hidden" />}

            <PopoverPrimitive.Portal>
              <PopoverContent
                asChild
                onOpenAutoFocus={(e) => e.preventDefault()}
                onInteractOutside={(e) => {
                  const target = e.target as Element;
                  // Don't close if clicking on the input itself or any part of the trigger
                  if (
                    target &&
                    (target.hasAttribute("cmdk-input") ||
                      target.closest("[data-radix-popover-trigger]") ||
                      inputRef.current?.contains(target))
                  ) {
                    e.preventDefault();
                    return;
                  }
                  // Close the popover for all other outside clicks
                  setOpen(false);
                }}
                className="w-[--radix-popover-trigger-width] p-0 rounded-none"
                align="start"
                side="bottom"
                sideOffset={0}
                avoidCollisions={true}
                collisionBoundary={undefined}
                sticky="always"
              >
                {data && (
                  <CommandList className="max-h-[400px] overflow-y-auto">
                    <>
                      {data.length > 0 && (
                        <CommandGroup>
                          {(data ?? []).map((item, index) => (
                            <CommandItem
                              key={index}
                              value={
                                typeof item === "string"
                                  ? item
                                  : targetValue
                                  ? item[targetValue]
                                  : JSON.stringify(item)
                              }
                              onMouseDown={(e) => e.preventDefault()}
                              onSelect={() => handleSelectItem(item)}
                            >
                              {renderItem ? (
                                renderItem({ item, index })
                              ) : (
                                <span className="text-sm">
                                  {typeof item === "string"
                                    ? item
                                    : targetValue
                                    ? item[targetValue]
                                    : JSON.stringify(item)}
                                </span>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                      {ListFooterComponent && (
                        <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                          {ListFooterComponent}
                        </div>
                      )}
                    </>
                  </CommandList>
                )}
              </PopoverContent>
            </PopoverPrimitive.Portal>
          </Command>
        </Popover>
      </div>
    );
  }
);

MaterialInput.displayName = "MaterialInput";

export { MaterialInput };
