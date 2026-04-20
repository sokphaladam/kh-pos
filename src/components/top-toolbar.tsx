"use client";

import { File, PlusCircle, Search } from "lucide-react";
import { Button } from "./ui/button";
import React, { useCallback, useState } from "react";
import { onGetExportExcel } from "@/lib/export-xlsx";
import { Input } from "./ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

interface Filter {
  title: string;
  value: string;
}
interface Props {
  disabled?: boolean;
  activeFilterTab?: string;
  onAddNew?: () => void;
  lable?: string;
  text?: string;
  data?: unknown;
  filter?: Filter[];
  searchEnabled?: boolean;
  onChangeFilter?: (value: string) => void;
  headerRight?: React.ReactElement;
}

export function TopToolbar(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("s") || "");

  const onExport = useCallback(() => {
    if (props.data) {
      setLoading(true);
      onGetExportExcel(props.data, `${props.text}-${new Date().getTime()}`)
        .then()
        .catch()
        .finally(() => setLoading(false));
    }
  }, [props]);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      // Reset offset when searching
      if (name === "s") {
        params.delete("offset");
      }
      return params.toString();
    },
    [searchParams]
  );

  const removeQueryString = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("s");
    // Reset offset when clearing search
    params.delete("offset");
    return params.toString();
  }, [searchParams]);

  return (
    <div className="w-full flex-wrap flex flex-row pb-4 gap-4 items-center justify-between">
      {props.filter && (
        <Tabs value={props.activeFilterTab}>
          <TabsList>
            {props.filter.map((item, index) => (
              <TabsTrigger
                onClick={(e) => {
                  e.preventDefault();
                  props.onChangeFilter?.(item.value);
                }}
                key={index}
                value={item.value}
              >
                {item.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {props.searchEnabled && (
        <div className={props.searchEnabled ? "flex-1" : "hidden"}>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={`Search ${props.text}...`}
              className="pl-8"
              value={searchInput}
              onChange={(e) => {
                if (e.target.value === "") {
                  router.push(pathname + "?" + removeQueryString());
                }
                setSearchInput(e.target.value);
              }}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchInput) {
                  router.push(
                    pathname + "?" + createQueryString("s", searchInput.trim())
                  );
                }
              }}
            />
          </div>
        </div>
      )}
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className={`h-8 gap-1 ${props.data ? "" : "hidden"} hidden`}
          onClick={onExport}
          disabled={loading}
        >
          <File className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Export
          </span>
        </Button>
        {props.headerRight ? (
          props.headerRight
        ) : (
          <Button
            size="sm"
            className={`h-8 gap-1 ${props.onAddNew ? "" : "hidden"}`}
            onClick={props.onAddNew}
            disabled={props.disabled}
          >
            {!props.lable && <PlusCircle className="h-3.5 w-3.5" />}
            <span className="sm:whitespace-nowrap">
              {props.lable ? props.lable : `Add ${props.text}`}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
