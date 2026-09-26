"use client";
import { noop } from "lodash";
import {
  ForwardRefExoticComponent,
  PropsWithChildren,
  ReactElement,
  RefAttributes,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { HoldButton } from "./ui/hold-button";
import { Loader, LucideProps } from "lucide-react";
import { Toaster } from "sonner";

interface ShowDialogProps {
  title: string;
  content: string | ReactElement;
  destructive?: boolean;
  actions?: {
    text: string;
    icon?: ForwardRefExoticComponent<
      Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
    >;
    onClick: () => Promise<void>;
    onComplete?: () => void;
  }[];
}

interface CommonDialogContextProps {
  showDialog(option: ShowDialogProps): void;
}

const CommonDialogContext = createContext<CommonDialogContextProps>({
  showDialog: noop,
});

export function CommonDialogProvider({ children }: PropsWithChildren) {
  const [dialogOption, setDialogOption] = useState<ShowDialogProps | null>(
    null
  );

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const hideDialog = useCallback(() => {
    setErrorMessage("");
    setDialogOption(null);
  }, []);

  const runAction = useCallback(
    (action: NonNullable<ShowDialogProps["actions"]>[number]) => {
      setLoading(true);
      action
        .onClick()
        .then(() => {
          hideDialog();
          if (action.onComplete) {
            action.onComplete();
          }
        })
        .catch((e) => {
          if (e instanceof Error) {
            setErrorMessage(e.message);
          } else {
            setErrorMessage("An error occurred");
          }
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [hideDialog],
  );

  return (
    <CommonDialogContext.Provider value={{ showDialog: setDialogOption }}>
      {children}
      <Toaster richColors />
      {dialogOption && (
        <Dialog
          open={dialogOption !== null}
          onOpenChange={(openState) => {
            if (!openState) {
              hideDialog();
            }
          }}
        >
          <DialogContent>
            <DialogHeader
              className={dialogOption?.destructive ? "text-destructive" : ""}
            >
              <DialogTitle>{dialogOption.title}</DialogTitle>
            </DialogHeader>

            {errorMessage && (
              <div className="text-sm text-destructive font-mono flex gap-4 items-end">
                <p>{errorMessage}</p>
              </div>
            )}

            <div>{dialogOption.content}</div>

            <DialogDescription className="flex flex-col gap-2"></DialogDescription>

            <DialogFooter className="gap-2 sm:items-center">
              {dialogOption.destructive ? (
                <p className="mr-auto text-xs text-muted-foreground">
                  Press and hold to confirm
                </p>
              ) : null}
              <Button
                disabled={loading}
                variant="outline"
                onClick={() => {
                  hideDialog();
                }}
              >
                Cancel
              </Button>

              {dialogOption.actions?.map((action) =>
                dialogOption.destructive ? (
                  // Destructive actions need a deliberate press-and-hold
                  <HoldButton
                    key={action.text}
                    variant="destructive"
                    disabled={loading}
                    resetAfter={0}
                    icon={
                      action.icon ? <action.icon className="size-4" /> : undefined
                    }
                    doneIcon={<Loader className="size-4 animate-spin" />}
                    doneLabel="Working…"
                    onHold={() => runAction(action)}
                  >
                    {action.text}
                  </HoldButton>
                ) : (
                  <Button
                    key={action.text}
                    disabled={loading}
                    onClick={() => runAction(action)}
                  >
                    {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                    {action.icon && !loading && (
                      <action.icon className="w-4 h-4 mr-2" />
                    )}
                    {action.text}
                  </Button>
                ),
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </CommonDialogContext.Provider>
  );
}

export function useCommonDialog() {
  return useContext(CommonDialogContext);
}
