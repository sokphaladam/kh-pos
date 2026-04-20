export class Printing {
  static connection: WebSocket | null = null;
  static queue: string | null = null;

  constructor() {
    if (Printing.connection === null) {
      Printing.connection = this.createWebSocket();
    }
  }

  public send(message: string) {
    console.log(message, Printing.connection);

    if (Printing.connection === null) {
      Printing.queue = message;
      Printing.connection = this.createWebSocket();
      return;
    }

    if (Printing.connection.readyState === Printing.connection.OPEN) {
      Printing.connection.send(message);
    } else {
      Printing.queue = message;
    }
  }

  public packageBarcode(barcode: string, size?: number) {
    if (!size) {
      this.send("PRINT_PACKAGE " + barcode);
    } else {
      this.send("PRINT_PACKAGE " + JSON.stringify({ barcode, size }));
    }
  }

  private createWebSocket() {
    const ws = new WebSocket("ws://127.0.0.1:8181");

    ws.onerror = () => {
      Printing.connection = null;
    };

    ws.onclose = () => {
      Printing.connection = null;
    };

    ws.onopen = () => {
      if (Printing.queue !== null) {
        ws.send(Printing.queue);
        Printing.queue = null;
      }
    };

    return ws;
  }
}
