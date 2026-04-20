import {
  useDeleteCategory,
  useMutationToggleProductCategory,
} from "@/app/hooks/use-query-category";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { createDialog } from "@/components/create-dialog";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import { Formatter } from "@/lib/formatter";
import { Category } from "@/lib/server-functions/category/create-category";
import { useAuthentication } from "contexts/authentication-context";
import { LoaderIcon } from "lucide-react";
import { Fragment, useCallback } from "react";
import { toast } from "sonner";
import { createCategorySheet } from "./sheet-categtory-create";
import { useCommonDialog } from "@/components/common-dialog";

export default function CategoryList({
  data,
  onSuccess,
  offset,
  total,
  ...props
}: {
  data: Category[];
  onSuccess: (data: Category | null, id?: string) => void;
  offset: number;
  total: number;
} & WithLayoutPermissionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
        <CardDescription>Manage your product categories.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[100px] sm:table-cell text-nowrap text-xs">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead className="text-nowrap text-xs min-w-[150px]">
                  Title
                </TableHead>
                <TableHead className="text-nowrap text-xs min-w-[200px]">
                  Description
                </TableHead>
                <TableHead className="text-nowrap text-xs min-w-[200px]">
                  Products
                </TableHead>
                <TableHead className="text-nowrap text-xs w-[120px]">
                  Printer
                </TableHead>
                <TableHead className="md:table-cell text-nowrap text-xs w-[120px]">
                  Created At
                </TableHead>
                <TableHead className="md:table-cell text-nowrap text-xs w-[120px]">
                  Sort Order
                </TableHead>
                <TableHead className="md:table-cell text-nowrap text-xs w-[120px]">
                  Exclude Fee Delivery
                </TableHead>
                <TableHead className="md:table-cell text-nowrap text-xs w-[120px]">
                  Mark Extra Fee
                </TableHead>
                <TableHead className="text-xs w-[80px]">
                  <span>Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((cat, index) => {
                return (
                  <CategoryItem
                    onSuccess={onSuccess}
                    key={index}
                    data={cat}
                    id={index + 1 + offset}
                    {...props}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter>
        <Pagination
          limit={30}
          offset={offset}
          totalPerPage={data?.length || 0}
          total={total}
          text="categories"
        />
      </CardFooter>
    </Card>
  );
}

function CategoryItem({
  data,
  onSuccess,
  id,
  ...props
}: {
  data: Category;
  onSuccess: (data: Category | null, id?: string) => void;
  id: number;
} & WithLayoutPermissionProps) {
  const { currentWarehouse } = useAuthentication();
  const { showDialog } = useCommonDialog();
  const { trigger, isMutating } = useMutationToggleProductCategory();
  const menus = [
    {
      label: "Edit",
      onClick: async () => {
        await createCategorySheet
          .show({
            data,
          })
          .then((r) => onSuccess(r));
      },
    },
  ];

  const handleToggleProductForSale = useCallback(
    (status: "enable" | "disable", categoryId: string) => {
      showDialog({
        title: `${status === "enable" ? "Enable" : "Disable"} Products For Sale`,
        content: `Are you sure you want to ${status} products in this category for sale?`,
        destructive: status === "disable",
        actions: [
          {
            text: status.charAt(0).toUpperCase() + status.slice(1),
            onClick: async () => {
              trigger({ categoryIds: [categoryId], status })
                .then((res) => {
                  if (res.success) {
                    toast.success(res.message);
                    onSuccess(data);
                  } else {
                    toast.error(res.error || "Failed to update product status");
                  }
                })
                .catch(() => {
                  toast.error("Failed to update product status");
                });
            },
          },
        ],
      });
    },
    [showDialog, trigger, onSuccess, data],
  );

  if (!!currentWarehouse?.isMain && !!props.allowDelete) {
    menus.push({
      label: "Delete",
      onClick: async () => {
        await deleteCategoryDialog.show({ id: data.id }).then((r) => {
          toast.success("Deleted category");
          onSuccess(null, r.id);
        });
      },
    });
  }

  return (
    <TableRow>
      <TableCell className="text-xs">{id}</TableCell>
      <TableCell className="font-medium text-nowrap text-xs">
        <div
          key={data.imageUrl}
          className="w-[35px] h-[35px] relative cursor-pointer hover:scale-105 transition-all"
        >
          <ImageWithFallback
            alt="Product image"
            className="w-[35px] h-[35px] border border-dotted rounded-md object-contain"
            height={35}
            src={data.imageUrl + ""}
            width={35}
            title={(data.title || "")
              .split(" ")
              .map((x) => x.charAt(0).toUpperCase())
              .join("")}
          />
        </div>
      </TableCell>
      <TableCell className="font-medium md:table-cell text-xs max-w-[150px]">
        <div className="truncate" title={data.title ?? "N/A"}>
          {data.title ?? "N/A"}
        </div>
      </TableCell>
      <TableCell className="font-medium md:table-cell text-xs max-w-[200px]">
        <div className="truncate" title={data.description ?? "N/A"}>
          {data.description ?? "N/A"}
        </div>
      </TableCell>
      <TableCell className="font-medium md:table-cell text-nowrap text-xs">
        <div className="flex items-center gap-1">
          <span
            className={`truncate ${
              data.forSaleCount === data.productCount
                ? "text-green-600 font-semibold"
                : data.forSaleCount === 0
                  ? "text-red-600"
                  : "text-yellow-600"
            }`}
            title={`${data.forSaleCount ?? 0} for sale out of ${data.productCount ?? 0} total`}
          >
            {data.forSaleCount ?? 0}/{data.productCount ?? 0}
          </span>
          <span className="text-gray-500 text-[10px]">products</span>
        </div>
      </TableCell>
      <TableCell className="font-medium md:table-cell text-nowrap text-xs">
        <div className="truncate" title={data.printer?.name ?? "N/A"}>
          {data.printer?.name ?? "N/A"}
        </div>
      </TableCell>
      <TableCell className="md:table-cell text-nowrap text-xs">
        {Formatter.date(data.createdAt)}
      </TableCell>
      <TableCell className="md:table-cell text-center text-nowrap text-xs">
        {data.sortOrder ?? 0}
      </TableCell>
      <TableCell className="md:table-cell text-nowrap text-center text-xs">
        {data.excludeFeeDelivery ? "Yes" : "No"}
      </TableCell>
      <TableCell className="md:table-cell text-nowrap text-center text-xs">
        {data.markExtraFee ?? 0}
      </TableCell>
      <TableCell className="text-nowrap text-xs">
        <BasicMenuAction
          resource="category"
          value={data}
          disabled={isMutating}
          onEdit={async () => {
            await createCategorySheet
              .show({
                data,
              })
              .then((r) => onSuccess(r));
          }}
          onDelete={async () => {
            await deleteCategoryDialog.show({ id: data.id }).then((r) => {
              toast.success("Deleted category");
              onSuccess(null, r.id);
            });
          }}
          items={[
            {
              label: "Product For Sale",
              onClick: () => {},
              items: [
                {
                  label: "Enable",
                  onClick: () => handleToggleProductForSale("enable", data.id),
                },
                {
                  label: "Disable",
                  onClick: () => handleToggleProductForSale("disable", data.id),
                },
              ],
            },
          ]}
        />
      </TableCell>
    </TableRow>
  );
}

const deleteCategoryDialog = createDialog<{ id: string }, { id?: string }>(
  ({ close, id }) => {
    const { trigger, isMutating } = useDeleteCategory();

    const onDeleteSupplier = useCallback(() => {
      trigger({ id }).then(() => {
        close({ id });
      });
    }, [close, trigger, id]);

    return (
      <Fragment>
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
        </DialogHeader>
        <div>Are you sure you want to delete this category?</div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => close({})}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDeleteSupplier}>
            Delete
            {isMutating && <LoaderIcon className="w-4 h-4 animate-spin" />}
          </Button>
        </DialogFooter>
      </Fragment>
    );
  },
);
