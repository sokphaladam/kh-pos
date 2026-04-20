"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  useMutationCreateChartOfAccount,
  useQueryChartOfAccount,
} from "@/app/hooks/accounting/use-query-chart-of-account";
import { toast } from "sonner";

interface AccountComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AccountCombobox({
  value,
  onChange,
  placeholder = "Select account...",
}: AccountComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [newAccountName, setNewAccountName] = React.useState("");
  const [newAccountType, setNewAccountType] = React.useState<
    "revenue" | "expense"
  >("revenue");

  // Fetch accounts
  const {
    data: accountsData,
    isLoading,
    mutate,
  } = useQueryChartOfAccount(0, 1000);

  const { trigger: createAccount, isMutating: isCreating } =
    useMutationCreateChartOfAccount();

  const accounts = accountsData?.result?.data || [];

  const selectedAccount = accounts.find((account) => account.id === value);

  const handleCreateAccount = async (e?: React.FormEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!newAccountName.trim()) {
      toast.error("Account name is required");
      return;
    }

    try {
      const result = await createAccount({
        account_name: newAccountName.trim(),
        account_type: newAccountType,
      });

      if (result.success && result.result) {
        toast.success("Account created successfully");
        onChange(result.result.id);
        setDialogOpen(false);
        setNewAccountName("");
        setNewAccountType("revenue");
        setOpen(false);
        mutate();
      } else {
        toast.error("Failed to create account");
      }
    } catch {
      toast.error("An error occurred while creating account");
    }
  };

  const handleOpenCreateDialog = () => {
    setNewAccountName(searchValue);
    setDialogOpen(true);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={isLoading}
            className="w-full justify-between"
          >
            {selectedAccount ? (
              <>
                {selectedAccount.accountName}{" "}
                <span className="text-muted-foreground">
                  ({selectedAccount.accountType})
                </span>
              </>
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput
              placeholder="Search account..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    No account found.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenCreateDialog}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create &quot;{searchValue || "new account"}&quot;
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {accounts.map((account) => (
                  <CommandItem
                    key={account.id}
                    value={`${account.accountName} ${account.accountType}`}
                    onSelect={() => {
                      onChange(account.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === account.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{account.accountName}</span>
                      <span className="text-xs text-muted-foreground">
                        {account.accountType}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
            <DialogDescription>
              Add a new account to your chart of accounts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="account-name">Account Name *</Label>
              <Input
                id="account-name"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="e.g., Sales Revenue, Office Supplies"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-type">Account Type *</Label>
              <Select
                value={newAccountType}
                onValueChange={(value: "revenue" | "expense") =>
                  setNewAccountType(value)
                }
              >
                <SelectTrigger id="account-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              form="create-account-form"
              disabled={isCreating}
              onClick={handleCreateAccount}
            >
              {isCreating ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
