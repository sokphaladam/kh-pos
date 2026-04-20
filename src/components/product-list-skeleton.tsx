import { Skeleton } from "@/components/ui/skeleton";
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
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useWindowSize } from "./use-window-size";

export function ProductListSkeleton() {
  const windowSize = useWindowSize();
  const isMobile = windowSize.width < 768;

  if (isMobile) {
    // Mobile skeleton with cards
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
              {Array.from({ length: 5 }).map((_, index) => (
                <Card
                  key={index}
                  className="mb-4 shadow-sm border-l-4 border-l-blue-500"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-4 w-32" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </div>
                        </div>
                      </div>
                      <Skeleton className="w-8 h-8 rounded" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Skeleton className="w-4 h-4 rounded" />
                          <Skeleton className="h-3 w-12" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <Skeleton className="h-8 w-32 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
          <CardFooter className="p-4">
            <div className="flex items-center justify-between w-full">
              <Skeleton className="h-4 w-24" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-20 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-20 rounded" />
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Desktop skeleton with table
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
            {Array.from({ length: 8 }).map((_, index) => (
              <TableRow key={index} className="hover:bg-gray-50 h-12">
                <TableCell className="w-[140px]">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-5 h-3" />
                    <Skeleton className="w-6 h-6 rounded" />
                    <Skeleton className="w-8 h-8 rounded-md" />
                  </div>
                </TableCell>
                <TableCell className="w-[180px]">
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                </TableCell>
                <TableCell className="text-center w-[90px]">
                  <Skeleton className="h-5 w-8 mx-auto rounded-full" />
                </TableCell>
                <TableCell className="text-center w-[80px]">
                  <Skeleton className="h-4 w-8 mx-auto" />
                </TableCell>
                <TableCell className="text-center w-[80px]">
                  <Skeleton className="h-4 w-12 mx-auto" />
                </TableCell>
                <TableCell className="w-[140px]">
                  <Skeleton className="h-5 w-20 rounded-full" />
                </TableCell>
                <TableCell className="w-[100px]">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell className="w-[80px]">
                  <Skeleton className="w-8 h-8 mx-auto rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="flex items-center justify-between w-full">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-20 rounded" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
