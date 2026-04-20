"use client";

import { useState, useMemo } from "react";
import { useUserList } from "@/app/hooks/use-query-user";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, X, Users, Filter } from "lucide-react";

interface UserPickerProps {
  selectedUserIds?: string[];
  onSelectionChange?: (userIds: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function UserPicker({
  selectedUserIds = [],
  onSelectionChange,
  placeholder = "Select users...",
  className,
}: UserPickerProps) {
  const [open, setOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const { data: userData, isLoading: isLoadingUsers } = useUserList(100, 0);

  const users = useMemo(() => userData?.result?.data || [], [userData]);
  const roles = useMemo(() => {
    const uniqueRoles = [
      ...new Map(
        users
          .filter((user) => user.role)
          .map((user) => [user.role!.id, user.role!])
      ).values(),
    ];
    return uniqueRoles;
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (roleFilter === "all") {
      return users;
    }
    return users.filter((user) => user.role?.id === roleFilter);
  }, [users, roleFilter]);

  const selectedUsers = useMemo(() => {
    return users.filter((user) => selectedUserIds.includes(user.id));
  }, [users, selectedUserIds]);

  const handleUserToggle = (userId: string) => {
    const newSelection = selectedUserIds.includes(userId)
      ? selectedUserIds.filter((id) => id !== userId)
      : [...selectedUserIds, userId];

    onSelectionChange?.(newSelection);
  };

  const handleRemoveUser = (userId: string) => {
    const newSelection = selectedUserIds.filter((id) => id !== userId);
    onSelectionChange?.(newSelection);
  };

  const handleClearAll = () => {
    onSelectionChange?.([]);
  };

  const handleSelectAll = () => {
    const allFilteredUserIds = filteredUsers.map((user) => user.id);
    onSelectionChange?.(allFilteredUserIds);
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between min-h-10 h-auto border-t-0 border-x-0 bg-transparent rounded-none border-b-[1px] dark:border-gray-600 focus:border-primary text-base md:text-sm text-gray-900 focus:outline-none dark:text-white dark:focus:border-primary transition-colors duration-200"
          >
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
              <Users className="h-4 w-4 shrink-0" />
              {selectedUsers.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                <div className="flex flex-wrap gap-1 flex-1">
                  {selectedUsers.slice(0, 2).map((user) => (
                    <Badge
                      key={user.id}
                      variant="secondary"
                      className="text-xs px-2 py-1"
                    >
                      {user.fullname}
                      <div
                        className="inline-flex items-center justify-center h-4 w-4 hover:bg-muted-foreground/20 rounded-sm cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveUser(user.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </div>
                    </Badge>
                  ))}
                  {selectedUsers.length > 2 && (
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      +{selectedUsers.length - 2} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="flex flex-col">
            {/* Role Filter */}
            <div className="p-3 border-b flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-8 flex-1">
                  <SelectValue placeholder="Filter by role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="p-3 border-b flex justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={filteredUsers.length === 0}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={selectedUserIds.length === 0}
                >
                  Clear All
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedUserIds.length} of {filteredUsers.length} selected
              </div>
            </div>

            {/* User List */}
            <Command>
              <CommandInput placeholder="Search users..." className="h-9" />
              <CommandList className="max-h-60">
                <CommandEmpty>
                  {isLoadingUsers ? "Loading users..." : "No users found."}
                </CommandEmpty>
                {filteredUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <CommandItem
                      key={user.id}
                      value={`${user.fullname} ${user.role?.role || ""}`}
                      onSelect={() => handleUserToggle(user.id)}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleUserToggle(user.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{user.fullname}</div>
                        {user.role && (
                          <div className="text-xs text-muted-foreground">
                            {user.role.role}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandList>
            </Command>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
