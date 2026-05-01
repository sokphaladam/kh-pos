"use client";
import {
  FunctionComponent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";

type SheetProviderSlot = "default" | "base";

export function SheetProvider({
  slot = "default",
}: {
  slot?: SheetProviderSlot;
}) {
  const [open, setOpen] = useState(false);
  const [component, setComponent] = useState<FunctionComponent>();
  const [options, setOptions] = useState<unknown>();
  const [resolve, setResolve] = useState<(props: unknown) => void>();
  const [defaultCloseValue, setDefaultCloseValue] = useState<unknown>();
  const [showKey, setShowKey] = useState(0);
  const resolvedRef = useRef(false);

  const SheetComponent = component;

  const showToggle = useCallback(
    ({
      component,
      options,
      resolve,
      defaultCloseValue,
    }: {
      component: FunctionComponent;
      options: unknown;
      resolve: (props: unknown) => void;
      defaultCloseValue: unknown;
    }) => {
      resolvedRef.current = false;
      setComponent(() => component);
      setOptions(options);
      setResolve(() => resolve);
      setDefaultCloseValue(defaultCloseValue);
      setOpen(true);
      setShowKey((k) => k + 1);
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.showSheet) {
      window.showSheet = {};
    }

    window.showSheet[slot] = showToggle;
    return () => {
      delete window.showSheet[slot];
    };
  }, [showToggle, slot]);

  return (
    <>
      {open && SheetComponent && (
        <Sheet
          open={open}
          onOpenChange={(state) => {
            if (!state) {
              if (!resolvedRef.current && resolve) {
                resolvedRef.current = true;
                resolve(defaultCloseValue);
              }
              setOpen(false);
            }
          }}
        >
          <SheetContent
            className="w-full md:w-[70%] md:min-w-[50%] overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
            onInteractOutside={(e) => e.preventDefault()}
            aria-describedby={undefined}
          >
            <SheetHeader className="hidden">
              <SheetTitle>Default Sheet</SheetTitle>
            </SheetHeader>
            <SheetComponent
              key={showKey}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              {...(options as any)}
              close={(value: unknown) => {
                if (!resolvedRef.current && resolve) {
                  resolvedRef.current = true;
                  resolve(value);
                }
                setOpen(false);
              }}
            />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}

type SheetComponentProps<
  ParamType = unknown,
  ReturnType = undefined,
> = ParamType & {
  close: (value: ReturnType) => void;
};

export function createSheet<ParamType = unknown, ReturnType = undefined>(
  component: FunctionComponent<SheetComponentProps<ParamType, ReturnType>>,
  options?: {
    defaultValue?: ReturnType;

    /**
     * Slot to render the Sheet in. If not specified,
     * it will be rendered to the deepest available slot.
     */
    slot?: SheetProviderSlot;
  },
) {
  return {
    show: (props: ParamType) => {
      return new Promise<ReturnType>((resolve) => {
        if (!window.showSheet) return;

        let slot = options?.slot || "default";

        if (!slot) {
          if (window.showSheet["base"]) slot = "base";
          else slot = "default";
        }

        if (!window.showSheet[slot]) return;

        window.showSheet[slot]({
          component,
          options: props,
          resolve: resolve as unknown as (props: unknown) => void,
          defaultCloseValue: options?.defaultValue,
        });
      });
    },
  } as Readonly<{
    show: (props: ParamType) => Promise<ReturnType>;
  }>;
}
