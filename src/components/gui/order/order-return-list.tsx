import { OrderReturn } from "@/classes/order-return";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Formatter } from "@/lib/formatter";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { cn } from "@/lib/utils";
import { InfoIcon, Undo2 } from "lucide-react";

interface Props {
  items?: OrderReturn[];
  show?: boolean;
}

export function OrderReturnList(props: Props) {
  const { formatForDisplay } = useCurrencyFormat();
  const list = props.items?.map((x) => {
    return (
      <TableRow
        key={x.id}
        className={cn(
          !!props.show
            ? "collapsible-content-open"
            : "collapsible-content-close",
          "text-red-500 bg-rose-50"
        )}
      >
        <TableCell
          className="text-xs text-nowrap text-left truncate text-ellipsis overflow-hidden max-w-[75px]"
          colSpan={2}
        >
          <div className="flex flex-row items-center gap-2">
            <div className="ml-3">
              <Undo2 className="h-4 w-4" />
            </div>
            {x.reason && (
              <Tooltip>
                <TooltipTrigger className="truncate text-ellipsis overflow-hidden max-w-full">
                  <i>{`"${x.reason}"`}</i>
                </TooltipTrigger>
                <TooltipContent>
                  <i>{`"${x.reason}"`}</i>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TableCell>
        <TableCell className="text-xs text-center text-nowrap">
          {x.quantity}
        </TableCell>
        <TableCell></TableCell>
        <TableCell className="text-xs text-right text-nowrap">
          {formatForDisplay(Number(x.refundAmount))}
        </TableCell>
        <TableCell className="text-xs text-nowrap text-center">
          <Tooltip delayDuration={1000}>
            <TooltipTrigger>
              <div className="bg-secondary rounded-full shadow-sm">
                <InfoIcon className="text-sky-600 w-4 h-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div>
                {x.returnedAt && (
                  <div className="flex flex-row items-center justify-between">
                    <div className="border-r-[1px] w-[75px] p-1">Returned</div>
                    <div className="border-r-[1px] w-[125px] text-nowrap text-center mr-4 p-1">
                      {Formatter.dateTime(x.returnedAt)}
                    </div>
                    <div className="text-right p-1">
                      {x.returnedBy?.fullname}
                    </div>
                  </div>
                )}
                {x.stockInAt && (
                  <div className="flex flex-row items-center justify-between border-t-[1px]">
                    <div className="border-r-[1px] w-[75px] p-1">Stock In</div>
                    <div className="border-r-[1px] w-[125px] text-nowrap text-center mr-4 p-1">
                      {Formatter.dateTime(x.stockInAt)}
                    </div>
                    <div className="text-right p-1">
                      {x.stockInBy?.fullname}
                    </div>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TableCell>
      </TableRow>
    );
  });
  return list;
}
