"use client";
import React from "react";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface Props {
  offset: number;
  limit: number;
  total: number;
  totalPerPage: number;
  text?: string;
}

export function Pagination({
  limit,
  offset,
  total,
  totalPerPage,
  text,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function prevPage() {
    const newOffset = Math.max(0, offset - limit);
    const params = new URLSearchParams(searchParams.toString());
    params.set("offset", newOffset.toString());
    router.push(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  }

  function nextPage() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("offset", (offset + limit).toString());
    router.push(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  }

  return (
    <form className="flex items-center w-full justify-between">
      <div className="text-xs text-muted-foreground">
        Showing{" "}
        <strong>
          {offset + 1}-{Math.min(offset + totalPerPage, total)}
        </strong>{" "}
        of <strong>{total}</strong> {text}
      </div>
      <div className="flex">
        <Button
          formAction={prevPage}
          variant="ghost"
          size="sm"
          type="submit"
          disabled={offset === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Prev
        </Button>
        <Button
          formAction={nextPage}
          variant="ghost"
          size="sm"
          type="submit"
          disabled={offset + limit >= total}
        >
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
