"use client";
import { Printing } from "@/classes/cinema/printing";
import { SeatReservation } from "@/classes/cinema/reservation";
import { Button } from "@/components/ui/button";
import { useAuthentication } from "contexts/authentication-context";
import { Ticket } from "lucide-react";
import moment from "moment-timezone";
import { useEffect, useMemo, useRef } from "react";

interface Props {
  reservations?: SeatReservation[];
  disabled?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

export default function PrintTicketClient(props: Props) {
  const { currentWarehouse, setting } = useAuthentication();
  const contents = useMemo(() => {
    return props.reservations?.map((reservation) => {
      return [
        {
          type: "text",
          value: `${reservation.showtime?.variant?.at(0)?.basicProduct?.title}`,
          style: {
            fontSize: "20px",
            fontFamily: "Hanuman, 'Courier New', Courier, monospace",
            fontWeight: "bold",
            textAlign: "left",
          },
        },
        {
          type: "text",
          value: `Cinema: ${currentWarehouse?.name}`,
          style: {
            fontSize: "16px",
            fontFamily: "Hanuman, 'Courier New', Courier, monospace",
            fontWeight: "bold",
            textAlign: "left",
          },
        },
        {
          type: "text",
          value: `Hall: ${reservation.seat?.hall?.name}`,
          style: {
            fontSize: "16px",
            fontFamily: "Hanuman, 'Courier New', Courier, monospace",
            fontWeight: "bold",
            textAlign: "left",
          },
        },
        {
          type: "text",
          value: `Seat: ${reservation.seat?.row}${reservation.seat?.column} (${reservation.seat?.type})`,
          style: {
            fontSize: "16px",
            fontFamily: "Hanuman, 'Courier New', Courier, monospace",
            fontWeight: "bold",
            textAlign: "left",
          },
        },
        {
          type: "text",
          value: `Date: ${moment(reservation.showtime?.showDate).format(
            "ddd, DD MMM YYYY",
          )}`,
          style: {
            fontSize: "16px",
            fontFamily: "Hanuman, 'Courier New', Courier, monospace",
            fontWeight: "bold",
            textAlign: "left",
          },
        },
        {
          type: "text",
          value: `Time: ${moment(reservation.showtime?.startTime).format(
            "HH:mm a",
          )} - ${moment(reservation.showtime?.endTime).format("HH:mm a")}`,
          style: {
            fontSize: "16px",
            fontFamily: "Hanuman, 'Courier New', Courier, monospace",
            fontWeight: "bold",
            textAlign: "left",
            fontStyle: "uppercase",
          },
        },
        {
          type: "text",
          value: "--------------------------------",
          style: {
            fontSize: "20px",
            fontFamily: "Hanuman, 'Courier New', Courier, monospace",
            fontWeight: "bold",
            textAlign: "center",
          },
        },
        {
          type: "qrCode",
          value: `${reservation.code ? reservation.code : ""}`, // QR content
          height: "150", // size in px
          width: "150",
          position: "center",
          style: {
            margin: "0 0 0 0",
          },
          displayValue: true,
        },
        {
          type: "text",
          value: `${reservation.code}`,
          style: {
            fontSize: "16px",
            fontFamily: "Hanuman, 'Courier New', Courier, monospace",
            fontWeight: "bold",
            textAlign: "center",
          },
        },
      ];
    });
  }, [props.reservations, currentWarehouse]);

  const printerInfo = useMemo(() => {
    const valueSetting = setting?.data?.result?.find(
      (f) => f.option === "PRINT_SOCKET",
    )?.value;

    return valueSetting
      ? JSON.parse(valueSetting).printers
      : {
          id: "4782906b-492f-4ff9-a1ee-04efd181733d",
          ip: "127.0.0.1",
          name: "Print to Chasier1",
          port: 9100,
          printer_name: "Print to Chasier1",
          print_server_ip: "192.168.1.100:8080",
        };
  }, [setting]);

  // keep a stable instance across renders
  const printingRef = useRef<Printing | null>(null);

  useEffect(() => {
    // only run in browser
    if (typeof window !== "undefined") {
      printingRef.current = new Printing();
    }

    // optional cleanup if you want to close connection on unmount
    return () => {
      if (printingRef.current && Printing.connection) {
        Printing.connection.close();
        Printing.connection = null;
      }
    };
  }, []);

  const handlePrint = () => {
    // printingRef.current?.packageBarcode("ABC123", 2);

    printingRef.current?.send(
      JSON.stringify({
        content: contents,
        printer_info: printerInfo,
      }),
    );
  };

  return (
    <>
      <Button
        onClick={handlePrint}
        size={"sm"}
        variant={"outline"}
        ref={props.ref}
        disabled={props.disabled}
        className={props.ref ? "hidden" : ""}
      >
        <Ticket className="h-4 w-4 mr-2" />
        Print Ticket
      </Button>
    </>
  );
}
