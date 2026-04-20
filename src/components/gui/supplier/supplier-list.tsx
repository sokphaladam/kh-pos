"use client";

import {
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  Table,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Supplier as ISupplier } from "@/lib/server-functions/supplier";
import Supplier from "./supplier";
import { Pagination } from "@/components/pagination";

export default function SupllierList({
  data,
  offset,
  totalSupplier,
  limit,
  onSuccess,
}: {
  data: ISupplier[];
  offset: number;
  totalSupplier: number;
  limit: number;
  onSuccess: (data: ISupplier | null, id?: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Suppliers</CardTitle>
        <CardDescription>Manage supplier.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-nowrap text-xs w-[50px]">
                  #
                </TableHead>
                <TableHead className="text-nowrap text-xs min-w-[150px]">
                  Name
                </TableHead>
                <TableHead className="text-nowrap text-xs min-w-[120px]">
                  Contact Name
                </TableHead>
                <TableHead className="text-nowrap text-xs w-[100px]">
                  Is Consignment
                </TableHead>
                <TableHead className="md:table-cell text-nowrap text-xs w-[120px]">
                  Contact Phone
                </TableHead>
                <TableHead className="md:table-cell text-nowrap text-xs min-w-[150px]">
                  Address
                </TableHead>

                <TableHead className="md:table-cell text-nowrap text-xs min-w-[150px]">
                  Notes
                </TableHead>
                <TableHead className="md:table-cell text-nowrap text-xs">
                  Created At
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((supplier, index) => (
                <Supplier
                  index={index + offset + 1}
                  onSuccess={onSuccess}
                  key={supplier.id}
                  data={supplier}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter>
        <Pagination
          limit={limit}
          offset={offset}
          totalPerPage={data?.length || 0}
          total={totalSupplier}
          text="suppliers"
        />
      </CardFooter>
    </Card>
  );
}
