import {
  useMutationDeleteReplenishment,
  useQueryReplenishmentList,
} from "@/app/hooks/use-query-replenishment";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TopToolbar } from "@/components/top-toolbar";
import { Fragment, useCallback, useMemo } from "react";
import {
  Replenishment,
  ReplenishmentFilterType,
} from "@/classes/replenishment";
import { Button } from "@/components/ui/button";
import { LoaderIcon, PlusCircle, RefreshCcw } from "lucide-react";
import { createDialog } from "@/components/create-dialog";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Formatter } from "@/lib/formatter";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createReplenishmentSheet } from "./create-replenishment-sheet";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthentication } from "../../../../contexts/authentication-context";
import { Pagination } from "@/components/pagination";
import SkeletonTableList from "@/components/skeleton-table-list";
import { replenishmentDetailSheet } from "./replenishment-detail-sheet";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";

const LIMIT = 30;

type FilterType = ReplenishmentFilterType["status"];
export default function ReplenishmentList(props: WithLayoutPermissionProps) {
  const searchParams = useSearchParams();

  const offset = Number(searchParams.get("offset") || 0);
  const rawStatus = searchParams.get("status");
  const status =
    rawStatus === "all" || rawStatus === null
      ? undefined
      : (rawStatus as FilterType);

  const router = useRouter();

  const { user } = useAuthentication();

  const isMainWarehouse = user?.warehouse?.isMain;

  const { data, mutate, isLoading, isValidating } = useQueryReplenishmentList({
    limit: String(LIMIT),
    offset: String(offset),
    ...(!isMainWarehouse
      ? {
          toWarehouseId: user?.currentWarehouseId,
        }
      : {}),
    ...(status ? { status } : {}),
  });

  const onClickAdd = useCallback(async () => {
    const result = await createReplenishmentSheet.show({});
    if (result) {
      mutate();
    }
  }, [mutate]);

  const onSuccess = useCallback(() => {
    mutate();
  }, [mutate]);

  const onChangeFilter = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === "all") {
        params.delete("status");
      } else {
        params.set("status", value);
      }

      params.set("offset", "0");

      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const Filter = useMemo(
    () => [
      {
        title: "All",
        value: "all",
      },
      ...(isMainWarehouse
        ? [
            {
              title: "Draft",
              value: "draft",
            },
          ]
        : []),
      {
        title: "Approved",
        value: "approved",
      },
      {
        title: "Receiving",
        value: "receiving",
      },
      {
        title: "Received",
        value: "received",
      },
    ],
    [isMainWarehouse]
  );

  const headerRight = (
    <div className="flex flex-row gap-2">
      <Button
        onClick={() => {
          router.push("replenishment/suggest");
        }}
        size="sm"
      >
        <RefreshCcw className="h-4 w-4" />
      </Button>

      <Button
        disabled={!props.allowCreate}
        onClick={onClickAdd}
        size="sm"
        className="h-8 gap-1"
      >
        <PlusCircle className="h-3.5 w-3.5" />
        Add New
      </Button>
    </div>
  );

  if (isLoading) {
    return <SkeletonTableList />;
  }

  return (
    <div className="w-full flex flex-col relative">
      <TopToolbar
        filter={Filter}
        activeFilterTab={status ?? "all"}
        onChangeFilter={onChangeFilter}
        headerRight={isMainWarehouse ? headerRight : undefined}
      />
      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>Replenishment</CardTitle>
            <CardDescription>Manage your replenishment.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] text-nowrap text-xs">
                    ID
                  </TableHead>
                  <TableHead className="text-nowrap text-xs">
                    {isMainWarehouse ? "To Warehouse" : "From Warehouse"}
                  </TableHead>
                  <TableHead className="text-nowrap text-xs">Status</TableHead>
                  <TableHead className="text-nowrap text-xs">
                    Created At
                  </TableHead>
                  <TableHead className="text-nowrap text-xs">
                    Total Sent Qty
                  </TableHead>
                  <TableHead className="text-nowrap text-xs">
                    Total Received
                  </TableHead>
                  <TableHead className="text-nowrap text-xs">
                    Total Cost
                  </TableHead>
                  <TableHead className="text-nowrap text-xs">
                    <span>Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <ReplenishmentItem
                    key={item.id}
                    data={item}
                    onSuccess={onSuccess}
                    isMain={isMainWarehouse ?? false}
                    loading={isValidating || isLoading}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Pagination
              offset={offset}
              limit={LIMIT}
              text="Items"
              total={data.length ?? 0}
              totalPerPage={data.length ?? 0}
            />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function ReplenishmentItem({
  data,
  isMain,
  onSuccess,
}: {
  isMain: boolean;
  data: Replenishment;
  onSuccess: () => void;
  loading: boolean;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium text-nowrap text-xs">{`TR-${data.autoId
        .toString()
        .padStart(4, "0")}`}</TableCell>
      <TableCell className="font-medium text-nowrap text-xs">
        {isMain ? data.toWarehouseId?.name : data.fromWarehouseId?.name}
      </TableCell>
      <TableCell className="text-nowrap text-xs">
        <Badge
          variant="outline"
          className={cn(
            "uppercase",
            data.status === "completed" ? "border-green-500" : "",
            data.status === "closed" ? "opacity-50" : ""
          )}
        >
          {data.status ?? "N/A"}
        </Badge>
      </TableCell>
      <TableCell className="text-nowrap text-xs">
        {Formatter.date(data.createdAt)}
      </TableCell>
      <TableCell className="font-medium text-nowrap text-xs">
        {data.totalSentQty}
      </TableCell>
      <TableCell className="font-medium text-nowrap text-xs">
        {data.totalReceivedQty}
      </TableCell>
      <TableCell className="font-medium text-nowrap text-xs">
        ${data.totalCost}
      </TableCell>
      <TableCell className="text-nowrap text-xs">
        <BasicMenuAction
          resource="replenishment"
          value={data}
          onEdit={
            data.status === "draft" && isMain
              ? async () => {
                  await createReplenishmentSheet
                    .show({
                      replenishmentId: data.id!,
                    })
                    .then(onSuccess);
                }
              : undefined
          }
          onDelete={
            data.status === "draft" && isMain
              ? async () => {
                  await deleteReplenishmentDialog
                    .show({ id: data.id })
                    .then(onSuccess);
                }
              : undefined
          }
          items={
            data.status === "draft"
              ? []
              : [
                  {
                    label: "Details",
                    onClick: async () => {
                      await replenishmentDetailSheet
                        .show({ id: data.id!, isMain })
                        .then(onSuccess);
                    },
                  },
                ]
          }
        />
      </TableCell>
    </TableRow>
  );
}

const deleteReplenishmentDialog = createDialog<{ id: string }, { id: string }>(
  ({ close, id }) => {
    const { trigger, isMutating } = useMutationDeleteReplenishment();

    const onDelete = useCallback(() => {
      trigger({ id })
        .then((r) => {
          if (r.success) {
            close({ id });
            toast.success("Replenishment deleted successfully");
          }
        })
        .catch((err) =>
          toast.error(err.message ?? "Failed to delete replenishment")
        );
    }, [trigger, id, close]);

    return (
      <Fragment>
        <DialogHeader>
          <DialogTitle>Delete Replenishment</DialogTitle>
        </DialogHeader>
        <div>Are you sure you want to delete this replenishment?</div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => close({ id })}>
            Cancel
          </Button>
          <Button
            disabled={isMutating}
            onClick={onDelete}
            variant="destructive"
          >
            Delete
            {isMutating && <LoaderIcon className="w-4 h-4 animate-spin ml-2" />}
          </Button>
        </DialogFooter>
      </Fragment>
    );
  }
);
