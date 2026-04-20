import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { CardFooter } from "./ui/card";

export default function FooterPagination({
  offset,
  totalPages,
  totalPerPage,
}: {
  offset: number;
  totalPerPage: number;
  totalPages: number;
}) {
  return (
    <CardFooter>
      <form className="flex items-center w-full justify-between">
        <div className="text-xs text-muted-foreground">
          Showing{" "}
          <strong>
            {Math.max(0, Math.min(offset - totalPerPage, totalPages) + 1)}-
            {offset}
          </strong>{" "}
          of <strong>{totalPerPage}</strong> products
        </div>
        <div className="flex">
          <Button
            // formAction={prevPage}
            variant="ghost"
            size="sm"
            type="submit"
            disabled={offset === totalPerPage}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Prev
          </Button>
          <Button
            // formAction={nextPage}
            variant="ghost"
            size="sm"
            type="submit"
            disabled={offset + totalPerPage > totalPages}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </CardFooter>
  );
}
