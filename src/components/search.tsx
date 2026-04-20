"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Spinner } from "./icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function SearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const param = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [typeSearch, setTypeSearch] = useState<string>("supplier.name");

  function searchAction(formData: FormData) {
    const value = formData.get("q") as string;
    const t = formData.get("t") as string;
    const params = new URLSearchParams({ q: value, t });
    startTransition(() => {
      router.replace(`${pathname}/?${params.toString()}`);
    });
  }

  return (
    <form
      action={searchAction}
      className="relative ml-auto flex-1 md:grow-0 mr-4 items-center flex gap-2"
    >
      <Select value={typeSearch} onValueChange={setTypeSearch} name="t">
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="supplier.name">Supplier</SelectItem>
          <SelectItem value="product.title">Product</SelectItem>
        </SelectContent>
      </Select>
      <div className="relative">
        <Search className="absolute left-2.5 top-[.75rem] h-4 w-4 text-muted-foreground" />
        <Input
          name="q"
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
          defaultValue={param.get("q") || ""}
        />
        {isPending && <Spinner />}
      </div>
    </form>
  );
}
