"use client";
import { usePermission } from "@/hooks/use-permissions";
import { Resource } from "@/lib/permissions";
import { MoreHorizontal } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface Props {
  value: unknown;
  onEdit?: (value: unknown) => void;
  onDelete?: (value: unknown) => void;
  onAdd?: (value: unknown) => void;
  disabled?: boolean;
  items?: {
    label: string;
    onClick: (v: unknown) => void;
    items?: { label: string; onClick: (v: unknown) => void }[];
  }[];
  resource?: Resource;
  size?: "default" | "sm" | "lg" | "icon" | null | undefined;
  className?: string;
}

export function BasicMenuAction(props: Props) {
  const [open, setOpen] = useState(false);
  const permission = usePermission(props.resource);
  const onChangeOpen = useCallback((state: boolean) => {
    if (!state) {
      (document.activeElement as HTMLElement | null)?.blur();
    }
    setOpen(state);
  }, []);

  return (
    <DropdownMenu open={open} onOpenChange={onChangeOpen}>
      <DropdownMenuTrigger asChild disabled={props.disabled}>
        <Button
          aria-haspopup="true"
          size={props.size || "icon"}
          variant="ghost"
          data-menu-trigger="true"
          onClick={(e) => e.stopPropagation()}
          className={props.className}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" data-menu-action="true">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        {props.onAdd && (
          <DropdownMenuItem
            disabled={!!props.resource && !permission.includes("create")}
            onClick={(e) => {
              e.stopPropagation();
              onChangeOpen(false);
              props.onAdd?.(props.value);
            }}
          >
            Add new
          </DropdownMenuItem>
        )}
        {props.onEdit && (
          <DropdownMenuItem
            disabled={!!props.resource && !permission.includes("update")}
            onClick={(e) => {
              e.stopPropagation();
              onChangeOpen(false);
              props.onEdit?.(props.value);
            }}
          >
            Edit
          </DropdownMenuItem>
        )}
        {props.onDelete && (
          <DropdownMenuItem
            disabled={!!props.resource && !permission.includes("delete")}
            onClick={(e) => {
              e.stopPropagation();
              onChangeOpen(false);
              props.onDelete?.(props.value);
            }}
          >
            Delete
          </DropdownMenuItem>
        )}
        {(props.items?.length || 0) > 0 &&
          (props.onAdd || props.onEdit || props.onDelete) && (
            <DropdownMenuSeparator />
          )}
        {props.items?.map((item, index) => {
          if (item.items && item.items.length > 0) {
            return (
              <DropdownMenuSub key={index}>
                <DropdownMenuSubTrigger>{item.label}</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {item.items.map((subItem, subIndex) => {
                      return (
                        <DropdownMenuItem
                          key={subIndex + "@" + index}
                          onClick={(e) => {
                            e.stopPropagation();
                            onChangeOpen(false);
                            subItem.onClick(props.value);
                          }}
                        >
                          {subItem.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            );
          }
          return (
            <DropdownMenuItem
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                onChangeOpen(false);
                item.onClick(props.value);
              }}
            >
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
