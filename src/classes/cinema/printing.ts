import { getPrintSocketUrl } from "@/lib/print-socket-url";

// The print bridge closes the socket with this code when the ?token=...
// query param is missing or wrong (Settings -> Print Server -> access token).
export const PRINT_SOCKET_UNAUTHORIZED_CODE = 4401;

export interface PrintSocketTestResult {
  ok: boolean;
  /** short, user-facing explanation */
  message: string;
  /** set when the bridge rejected the access token */
  unauthorized?: boolean;
}

export class Printing {
  static connection: WebSocket | null = null;
  static queue: string | null = null;
  /** last connection-level problem, surfaced by the settings screen */
  static lastError: string | null = null;

  /**
   * Drop the shared connection so the next send() reconnects - call this after
   * the device's print-socket URL changes in settings.
   */
  static resetConnection() {
    try {
      Printing.connection?.close();
    } catch {
      // ignore - connection may already be closed
    }
    Printing.connection = null;
  }

  /**
   * Open a throwaway socket to `url` (defaults to the device's configured URL)
   * and report whether the print bridge is reachable and accepts us. Used by
   * the "Test" button in settings so a mistyped address or a wrong access
   * token is caught before the first real print job.
   */
  static testConnection(
    url: string = getPrintSocketUrl(),
    timeoutMs = 6000,
  ): Promise<PrintSocketTestResult> {
    return new Promise((resolve) => {
      let settled = false;
      let openFallback: ReturnType<typeof setTimeout> | null = null;
      let ws: WebSocket;

      const finish = (result: PrintSocketTestResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (openFallback) clearTimeout(openFallback);
        try {
          ws.close();
        } catch {
          /* noop */
        }
        resolve(result);
      };

      try {
        ws = new WebSocket(url);
      } catch (err) {
        resolve({
          ok: false,
          message:
            err instanceof Error ? err.message : "That URL is not valid",
        });
        return;
      }

      const timer = setTimeout(
        () =>
          finish({
            ok: false,
            message: "No response from the print server (timed out)",
          }),
        timeoutMs,
      );

      ws.onopen = () => {
        // The bridge sends {type:"welcome"} right after accepting, and
        // {type:"error"} + close(4401) when it rejects. Give that a moment;
        // if nothing arrives the socket is simply open with no auth.
        openFallback = setTimeout(
          () =>
            finish({ ok: true, message: "Connected to the print server" }),
          1500,
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(String(event.data));
          if (data?.type === "welcome") {
            finish({
              ok: true,
              message: data.message || "Connected to the print server",
            });
          } else if (data?.type === "error") {
            finish({
              ok: false,
              message: data.message || "The print server rejected the request",
            });
          }
        } catch {
          // non-JSON frame - ignore, wait for welcome / timeout
        }
      };

      ws.onerror = () => {
        finish({
          ok: false,
          message: "Could not reach the print server at this address",
        });
      };

      ws.onclose = (event) => {
        if (event.code === PRINT_SOCKET_UNAUTHORIZED_CODE) {
          finish({
            ok: false,
            unauthorized: true,
            message:
              "Access token rejected - check the token in the print app's Device access security",
          });
        } else {
          finish({
            ok: false,
            message: event.reason || "The print server closed the connection",
          });
        }
      };
    });
  }

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
    const ws = new WebSocket(getPrintSocketUrl());

    ws.onerror = () => {
      Printing.connection = null;
    };

    ws.onclose = (event) => {
      if (event.code === PRINT_SOCKET_UNAUTHORIZED_CODE) {
        Printing.lastError =
          "Print server rejected the connection - wrong or missing access token";
        console.warn(Printing.lastError);
      }
      Printing.connection = null;
    };

    ws.onopen = () => {
      Printing.lastError = null;
      if (Printing.queue !== null) {
        ws.send(Printing.queue);
        Printing.queue = null;
      }
    };

    return ws;
  }
}
