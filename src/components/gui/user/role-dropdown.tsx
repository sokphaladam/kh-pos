import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { useQueryRoleList } from "@/lib/queries/role-list";
import { Role } from "@/lib/server-functions/get-role-list";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";

interface Props {
  value: string;
  setValue: (v: string) => void;
}

export function RoleDropdown(props: Props) {
  const [open, setOpen] = useState(false);
  const { roles, isLoading } = useQueryRoleList();

  const data: Role[] = roles as Role[];

  const value = data
    ? data
        .filter((f: Role) => props.value.includes(f.id))
        .map((x: Role) => x.role)
        .join(",")
    : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox_role"
          className="w-full justify-between"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {value.length > 0 ? value : "Select role..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        {isLoading && <div></div>}
        <div className="w-full flex flex-col gap-4">
          {data &&
            data.map((role: Role) => {
              const checked = props.value.includes(role.id);
              return (
                <div key={role.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={role.id}
                    checked={checked}
                    onCheckedChange={(e: boolean) => {
                      if (e) {
                        props.setValue(role.id);
                      } else {
                        props.setValue("");
                      }
                    }}
                  />
                  <label
                    htmlFor={role.id}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {role.role}
                  </label>
                </div>
              );
            })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
