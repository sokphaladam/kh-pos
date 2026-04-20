/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useMutationBacklogResolve,
  useQueryBacklog,
} from "@/app/hooks/use-query-back-log";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { useCallback } from "react";
import { toast } from "sonner";
import { ImageWithFallback } from "@/components/image-with-fallback";
import Link from "next/link";
import SkeletonTableList from "@/components/skeleton-table-list";

export function BackLog() {
  const { data, isLoading, mutate, isValidating } = useQueryBacklog(0, 15);
  const { trigger, isMutating } = useMutationBacklogResolve();

  const onClickResolve = useCallback(
    (id: string) => {
      trigger({
        backlogId: id,
      })
        .then((res) => {
          if (res.success) {
            toast.success("Resolve was done.");
            mutate();
          } else {
            toast.error(res.error);
          }
        })
        .catch(() => {
          toast.error("Failed to resolve back log.");
        });
    },
    [mutate, trigger]
  );

  if (isLoading || isValidating) {
    return <SkeletonTableList />;
  }

  return (
    <div className="h-[340px] min-h-[340px] max-h-[340px] flex flex-col overflow-hidden">
      <div className="flex flex-row justify-between items-center mb-6">
        <span className="font-semibold text-purple-700 dark:text-purple-300 text-lg">
          Recent Back Log
        </span>
        <Link
          href="/admin/backlog"
          className="text-purple-700 dark:text-purple-300 hover:underline hover:text-purple-900 dark:hover:text-purple-100 transition font-medium flex items-center gap-1 text-sm"
          aria-label="View all back log"
        >
          View all
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </Link>
      </div>
      <div className="-my-4 flex-1 flex flex-col justify-center overflow-x-auto">
        <ScrollArea className="h-full w-full min-w-[480px]">
          {data && !isLoading && !isValidating && (
            <Table className="w-full text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-gray-600 dark:text-gray-300 w-[120px]">
                    Product
                  </TableHead>
                  <TableHead className="font-semibold text-gray-600 dark:text-gray-300 max-lg:hidden w-[80px]">
                    Slot
                  </TableHead>
                  <TableHead className="font-semibold text-gray-600 dark:text-gray-300 w-[80px]">
                    Stock
                  </TableHead>
                  <TableHead className="font-semibold text-gray-600 dark:text-gray-300 w-[80px]">
                    Qty
                  </TableHead>
                  <TableHead className="font-semibold text-gray-600 dark:text-gray-300 w-[80px]">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.result?.data.map((x, i) => (
                  <TableRow
                    key={x.id}
                    className="hover:bg-purple-50 dark:hover:bg-purple-900 transition"
                  >
                    <TableCell className="sm:hidden font-bold text-purple-700">
                      {"BL-" + (i + 1).toString().padStart(3, "0")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-row gap-2 items-center">
                        <ImageWithFallback
                          src={x.variant?.basicProduct?.images[0]?.url + ""}
                          alt={x.variant?.basicProduct?.title + ""}
                          className="w-[28px] h-[28px] border border-dotted rounded-md object-contain bg-white"
                          height={28}
                          width={28}
                          title={x.variant?.basicProduct?.title + ""}
                        />
                        <div>
                          <div className="max-lg:hidden font-semibold text-gray-800 dark:text-gray-200 truncate w-[80px]">
                            <span
                              className="truncate w-full block"
                              title={
                                x.variant?.basicProduct?.title +
                                " (" +
                                x.variant?.name +
                                ")"
                              }
                            >
                              {x.variant?.basicProduct?.title} (
                              {x.variant?.name})
                            </span>
                          </div>
                          <div>
                            <small
                              className="text-gray-400 truncate w-[60px] block"
                              title={
                                x.variant?.sku
                                  ? String(x.variant?.sku)
                                  : undefined
                              }
                            >
                              SKU: {x.variant?.sku}
                            </small>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-lg:hidden">
                      <div>
                        <span
                          className="font-semibold text-gray-700 dark:text-gray-200 truncate w-[60px] inline-block"
                          title={
                            x.slot?.name + (x.slot?.posSlot ? " (POS)" : "")
                          }
                        >
                          {x.slot?.name} {x.slot?.posSlot ? "(POS)" : ""}
                        </span>
                        <br />
                        <small
                          className="text-gray-400 truncate w-[60px] inline-block"
                          title={(x.slot as any).warehouse.name}
                        >
                          {(x.slot as any).warehouse.name}
                        </small>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-blue-700 dark:text-blue-300 text-center">
                      {x.variant?.stock}
                    </TableCell>
                    <TableCell className="font-semibold text-pink-700 dark:text-pink-300 text-center">
                      {x.qty}
                    </TableCell>
                    <TableCell className="text-center">
                      <BasicMenuAction
                        value={x}
                        items={[
                          {
                            label: "Resolve",
                            onClick: () => onClickResolve(x.id),
                          },
                        ]}
                        disabled={isMutating}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
