import { TicketCarousel } from "../../cinema/ticket-reservation/ticket-carousel";
import { Order } from "@/classes/order";
import { createDialog } from "@/components/create-dialog";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  order: Order;
}

export const orderDigitalTicket = createDialog<Props>(({ order }) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Digital Ticket</DialogTitle>
      </DialogHeader>
      <div className="flex flex-1 justify-center space-y-6">
        <TicketCarousel order={order} />
      </div>
    </>
  );
});
