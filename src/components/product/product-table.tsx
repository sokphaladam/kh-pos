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
import { Product as ProductCompent } from "./product";
import { Pagination } from "../pagination";
import { ProductV2 } from "@/classes/product-v2";
import { useWindowSize } from "../use-window-size";

export function ProductsTable({
  products,
  offset,
  totalProducts,
  onDelete,
  onCompleted,
}: {
  products: ProductV2[];
  offset: number;
  totalProducts: number;
  onDelete?: (id: string) => void;
  onCompleted?: () => void;
}) {
  const windowSize = useWindowSize();
  const isMobile = windowSize.width < 768;

  if (isMobile) {
    // Mobile view with cards
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Products</CardTitle>
            <CardDescription>
              Manage products and their inventory
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {products.map((product, index) => (
                <ProductCompent
                  key={product.id}
                  product={product}
                  onDelete={onDelete}
                  onCompleted={onCompleted}
                  index={offset + index}
                  viewMode="mobile"
                />
              ))}
            </div>
          </CardContent>
          <CardFooter className="p-4">
            <Pagination
              limit={30}
              offset={offset}
              totalPerPage={products?.length || 0}
              total={totalProducts}
              text="Product"
            />
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Desktop view with table
  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
        <CardDescription>Manage products and their inventory</CardDescription>
      </CardHeader>
      <CardContent>
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px] text-xs">
                <span>Product</span>
              </TableHead>
              <TableHead className="w-[180px]">Title</TableHead>
              <TableHead className="text-center text-xs w-[90px]">
                Variants
              </TableHead>
              <TableHead className="text-center text-xs w-[80px]">
                Stock
              </TableHead>
              <TableHead className="text-center text-xs w-[80px]">
                Price
              </TableHead>
              <TableHead className="text-xs w-[140px]">Category</TableHead>
              <TableHead className="text-xs w-[100px]">Created at</TableHead>
              <TableHead className="text-xs w-[80px]">
                <span>Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, index) => (
              <ProductCompent
                key={product.id}
                product={product}
                onDelete={onDelete}
                onCompleted={onCompleted}
                index={offset + index}
                viewMode="desktop"
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <Pagination
          limit={30}
          offset={offset}
          totalPerPage={products?.length || 0}
          total={totalProducts}
          text="Product"
        />
      </CardFooter>
    </Card>
  );
}
