/* eslint-disable @typescript-eslint/no-explicit-any */
import { createDialog } from "@/components/create-dialog";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const voidOrderLog = createDialog<{ content: any[] }>(
  ({ content }) => {
    console.log(content);
    return (
      <>
        <DialogHeader>
          <DialogTitle>Void Order Log</DialogTitle>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          {content && content.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      {item.key ||
                        item.name ||
                        item.field ||
                        `Field ${index + 1}`}
                    </TableCell>
                    <TableCell className="max-w-64">
                      <div className="break-all">
                        {typeof item.value === "object" && item.value !== null
                          ? JSON.stringify(item.value, null, 2)
                          : String(item.value || "N/A")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {typeof item.value}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="w-12 h-12 mx-auto mb-4 text-gray-300">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  className="w-full h-full"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p>No content available</p>
            </div>
          )}
        </div>
      </>
    );
  },
  { defaultValue: undefined }
);
