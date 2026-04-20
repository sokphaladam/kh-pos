"use client";

import { File, PlusCircle, Search, ScanLine } from "lucide-react";
import { Button } from "./ui/button";
import React, { useCallback, useState, useRef, useEffect } from "react";
import { onGetExportExcel } from "@/lib/export-xlsx";
import { MaterialInput, MaterialInputRef } from "./ui/material-input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

interface Filter {
  title: string;
  value: string;
}

type SearchMode = "title" | "barcode";

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
  initialSearchMode?: SearchMode;
}

export function SearchModeToolbar(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>(
    props.initialSearchMode || "title"
  );
  const [searchInput, setSearchInput] = useState(searchParams.get("s") || "");
  const inputRef = useRef<MaterialInputRef>(null);

  // Update search input when URL changes
  useEffect(() => {
    const urlSearch = searchParams.get("s") || "";
    const urlBarcode = searchParams.get("barcode") || "";

    if (urlBarcode) {
      setSearchMode("barcode");
      setSearchInput(urlBarcode);
    } else if (urlSearch) {
      setSearchMode("title");
      setSearchInput(urlSearch);
    }
  }, [searchParams]);

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

      // Clear both search parameters and offset when setting a new one
      params.delete("s");
      params.delete("barcode");
      params.delete("offset");

      if (value.trim()) {
        params.set(name, value);
      }

      return params.toString();
    },
    [searchParams]
  );

  const removeQueryString = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("s");
    params.delete("barcode");
    params.delete("offset");

    return params.toString();
  }, [searchParams]);

  const handleSearch = useCallback(() => {
    if (!searchInput.trim()) {
      router.push(pathname + "?" + removeQueryString());
      return;
    }

    const queryParam = searchMode === "barcode" ? "barcode" : "s";
    router.push(
      pathname + "?" + createQueryString(queryParam, searchInput.trim())
    );
  }, [
    searchInput,
    searchMode,
    pathname,
    router,
    createQueryString,
    removeQueryString,
  ]);

  const toggleSearchMode = useCallback(() => {
    const newMode: SearchMode = searchMode === "title" ? "barcode" : "title";
    setSearchMode(newMode);

    // Focus the input after toggling
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus?.();
        // Access the select method through the HTMLInputElement interface
        if (
          "select" in inputRef.current &&
          typeof inputRef.current.select === "function"
        ) {
          inputRef.current.select();
        }
      }
    }, 0);
  }, [searchMode]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchInput(value);

      if (value === "") {
        router.push(pathname + "?" + removeQueryString());
      }
    },
    [router, pathname, removeQueryString]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const getPlaceholderText = () => {
    const baseText = props.text || "items";
    return searchMode === "barcode"
      ? `Scan or enter barcode...`
      : `Search ${baseText}...`;
  };

  const getSearchIcon = () => {
    return searchMode === "barcode" ? Search : ScanLine;
  };

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
          <div className="relative flex-1 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 px-3"
              onClick={toggleSearchMode}
              title={`Switch to ${
                searchMode === "title" ? "barcode" : "title"
              } search`}
            >
              {React.createElement(getSearchIcon(), { className: "h-4 w-4" })}
            </Button>
            <div className="relative flex-1">
              <MaterialInput
                ref={inputRef}
                type="text"
                label={getPlaceholderText()}
                placeholder=""
                className="pl-4"
                value={searchInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                animate="float"
              />
            </div>
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
