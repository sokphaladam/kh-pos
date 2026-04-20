"use client";

import { Customer } from "@/classes/customer";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { useCommonDialog } from "@/components/common-dialog";
import { Pagination } from "@/components/pagination";
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
import { Badge } from "@/components/ui/badge";
import { useCallback } from "react";
import { useMutationDeleteCustomerId } from "@/app/hooks/use-query-customer";
import { toast } from "sonner";

interface Props {
  data: Customer[];
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  limit: number;
  offset: number;
  total: number;
}

function DeliveryItem({
  customer,
  index,
  offset,
  onEdit,
  onDelete,
}: {
  customer: Customer;
  index: number;
  offset: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const { showDialog } = useCommonDialog();
  const { trigger: deleteCustomer } = useMutationDeleteCustomerId(
    customer.id || "",
  );

  const onDeleteCustomer = useCallback(
    async (id: string) => {
      showDialog({
        title: "Delete Customer",
        content: `Are you sure you want to delete customer "${customer?.customerName}"?`,
        actions: [
          {
            text: "Delete",
            onClick: async () => {
              deleteCustomer({}).then((res) => {
                if (res.success) {
                  toast.success("Customer deleted successfully");
                  if (onDelete) {
                    onDelete(id);
                  }
                }
              });
            },
          },
        ],
      });
    },
    [onDelete, showDialog, customer, deleteCustomer],
  );

  const formatExtraPrice = (extraPrice: string | null) => {
    if (!extraPrice || extraPrice === "0") return "-";
    return `$${parseFloat(extraPrice).toFixed(2)}`;
  };

  return (
    <TableRow key={customer.id}>
      <TableCell className="font-medium text-nowrap text-xs">
        {index + 1 + offset}
      </TableCell>
      <TableCell className="font-medium text-nowrap text-xs">
        {customer.customerName}
      </TableCell>
      <TableCell
        className="text-nowrap text-xs max-w-48 truncate"
        title={customer.address}
      >
        {customer.address}
      </TableCell>
      <TableCell className="text-nowrap text-xs">
        {formatExtraPrice(customer.extraPrice)}
      </TableCell>
      <TableCell className="text-nowrap text-xs">
        {customer.warehouse?.name || "-"}
      </TableCell>
      <TableCell className="text-nowrap text-xs">
        {new Date(customer.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-nowrap text-xs">
        {customer.createdBy?.fullname || "-"}
      </TableCell>
      <TableCell className="text-nowrap text-xs">
        <Badge variant="outline">{customer.orders?.length || 0} orders</Badge>
      </TableCell>
      <TableCell className="flex flex-row justify-end font-medium text-nowrap text-xs">
        <BasicMenuAction
          value={customer}
          onEdit={() => {
            if (onEdit) {
              onEdit(customer.id);
            }
          }}
          onDelete={() => onDeleteCustomer(customer.id)}
        />
      </TableCell>
    </TableRow>
  );
}

export function DeliveryList({
  data: customers,
  onDelete,
  onEdit,
  offset,
  limit,
  total,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery List</CardTitle>
        <CardDescription>
          Manage delivery and view their information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-nowrap text-xs">#</TableHead>
              <TableHead className="text-nowrap text-xs">
                Delivery Name
              </TableHead>
              <TableHead className="text-nowrap text-xs">Address</TableHead>
              <TableHead className="text-nowrap text-xs">Extra Price</TableHead>
              <TableHead className="text-nowrap text-xs">Warehouse</TableHead>
              <TableHead className="text-nowrap text-xs">Created At</TableHead>
              <TableHead className="text-nowrap text-xs">Created By</TableHead>
              <TableHead className="text-nowrap text-xs">Orders</TableHead>
              <TableHead className="text-nowrap text-xs"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer, index) => (
              <DeliveryItem
                key={customer.id}
                customer={customer}
                index={index}
                offset={offset}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <Pagination
          limit={limit}
          offset={offset}
          total={total}
          totalPerPage={customers.length}
          text="delivery customers"
        />
      </CardFooter>
    </Card>
  );
}
