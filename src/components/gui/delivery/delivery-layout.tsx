"use client";

import { useQueryCustomerList } from "@/app/hooks/use-query-customer";
import SkeletonTableList from "@/components/skeleton-table-list";
import { TopToolbar } from "@/components/top-toolbar";
import { useSearchParams } from "next/navigation";
import { DeliveryList } from "./delivery-list";
import { deliverySheet } from "./delivery-sheet";
import { toast } from "sonner";

export function DeliveryLayout() {
  const searchParams = useSearchParams();
  const offset = Number(searchParams.get("offset") || 0);
  const { data, isLoading, isValidating, mutate } = useQueryCustomerList(
    30,
    offset,
    undefined,
    "delivery",
  );

  const handleAddNew = async () => {
    try {
      const result = await deliverySheet.show({});
      if (result) {
        // Refresh the list after successful creation
        mutate();
      }
    } catch (error) {
      console.error("Error creating customer:", error);
    }
  };

  const handleEdit = async (customerId: string) => {
    const customer = data?.result?.data.find((c) => c.id === customerId);
    if (!customer) {
      toast.error("Customer not found");
      return;
    }

    try {
      const result = await deliverySheet.show({
        id: customerId,
        initialData: customer,
      });
      if (result) {
        // Refresh the list after successful update
        mutate();
      }
    } catch (error) {
      console.error("Error editing customer:", error);
    }
  };

  const handleDelete = async (customerId: string) => {
    if (customerId) {
      mutate();
    }
  };

  if (isLoading || isValidating) {
    return <SkeletonTableList />;
  }

  return (
    <div className="w-full">
      <TopToolbar onAddNew={handleAddNew} text={"Delivery"} />
      <DeliveryList
        data={data?.result?.data || []}
        limit={30}
        offset={offset}
        total={data?.result?.total || 0}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
