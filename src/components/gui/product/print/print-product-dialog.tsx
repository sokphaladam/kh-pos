import { createDialog } from "@/components/create-dialog";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QrCode } from "lucide-react";
import { PrintProductLot, PrintProductLotProps } from "./print-product-lot";

export const printProductLotDialog = createDialog<{
  data: PrintProductLotProps[];
}>(({ data, close }) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Print QR Labels
        </DialogTitle>
        <DialogDescription>
          {data.length === 1
            ? "1 item is ready to print."
            : `${data.length} items are ready to print.`}{" "}
          Review the details below before proceeding.
        </DialogDescription>
      </DialogHeader>

      <ScrollArea className="max-h-60 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Lot No.</TableHead>
              <TableHead>Mfg. Date</TableHead>
              <TableHead>Exp. Date</TableHead>
              <TableHead className="text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.lotId}>
                <TableCell className="font-medium">{item.sku}</TableCell>
                <TableCell className="text-muted-foreground">
                  {item.lotNumber}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.manufacturingDate}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.expirationDate}
                </TableCell>
                <TableCell className="text-right">{item.price}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={() => close(undefined)}>
          Cancel
        </Button>
        <PrintProductLot data={data} type="BUTTON" />
      </DialogFooter>
    </>
  );
});
