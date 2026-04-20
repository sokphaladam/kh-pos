"use client";
import { FunctionComponent, useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription } from "./ui/dialog";
import { cn } from "@/lib/utils";

type DialogProviderSlot = "default" | "base";

export function DialogProvider({
  slot = "default",
}: {
  slot?: DialogProviderSlot;
}) {
  const [open, setOpen] = useState(false);
  const [component, setComponent] = useState<FunctionComponent>();
  const [options, setOptions] = useState<unknown>();
  const [resolve, setResolve] = useState<(props: unknown) => void>();
  const [defaultCloseValue, setDefaultCloseValue] = useState<unknown>();
  const [className, setClassName] = useState("");
  const DialogComponent = component;

  const showToggle = useCallback(
    ({
      component,
      options,
      resolve,
      defaultCloseValue,
      className: cn,
    }: {
      component: FunctionComponent;
      options: unknown;
      resolve: (props: unknown) => void;
      defaultCloseValue: unknown;
      className?: string;
    }) => {
      setComponent(() => component);
      setOptions(options);
      setResolve(() => resolve);
      setDefaultCloseValue(defaultCloseValue);
      setOpen(true);
      setClassName(cn || "");
    },
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.showDialog) {
      window.showDialog = {};
    }

    window.showDialog[slot] = showToggle;
    return () => {
      delete window.showDialog[slot];
    };
  }, [showToggle, slot]);

  return (
    <>
      {open && DialogComponent && (
        <Dialog
          open={open}
          onOpenChange={(state) => {
            if (!state) {
              if (resolve) resolve(defaultCloseValue);
              setOpen(false);
            }
          }}
        >
          <DialogContent
            className={cn(`overflow-y-auto w-full ${className}`)}
            aria-describedby={undefined}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogDescription></DialogDescription>
            <DialogComponent
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              {...(options as any)}
              close={(value: unknown) => {
                if (resolve) resolve(value);
                setOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

type DialogComponentProps<
  ParamType = unknown,
  ReturnType = undefined
> = ParamType & {
  close: (value: ReturnType) => void;
};

export function createDialog<ParamType = unknown, ReturnType = undefined>(
  component: FunctionComponent<DialogComponentProps<ParamType, ReturnType>>,
  options?: {
    defaultValue?: ReturnType;

    /**
     * Slot to render the dialog in. If not specified,
     * it will be rendered to the deepest available slot.
     */
    slot?: DialogProviderSlot;
    className?: string;
  }
) {
  return {
    show: (props: ParamType) => {
      return new Promise<ReturnType>((resolve) => {
        if (!window.showDialog) return;

        let slot = options?.slot || "default";

        if (!slot) {
          if (window.showDialog["base"]) slot = "base";
          else slot = "default";
        }

        if (!window.showDialog[slot]) return;

        window.showDialog[slot]({
          component,
          options: props,
          resolve: resolve as unknown as (props: unknown) => void,
          defaultCloseValue: options?.defaultValue,
          className: options?.className,
        });
      });
    },
  } as Readonly<{
    show: (props: ParamType) => Promise<ReturnType>;
  }>;
}
