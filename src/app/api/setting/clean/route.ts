import withAuthApi from "@/lib/server-functions/with-auth-api";
import { sleep } from "@/lib/sleep";
import { NextResponse } from "next/server";

export const POST = withAuthApi(async ({ db, userAuth }) => {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (
        status: "running" | "completed" | "failed",
        progress: number,
        message: string,
      ) => {
        const data = JSON.stringify({ status, progress, message });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        sendUpdate("running", 0, "Starting database pipeline...");
        let processed = 0;
        await db.transaction(async (tx) => {
          sendUpdate("running", 0, "Counting total rows to process...");
          const customerOrder = await tx.table("customer_order").where({
            is_testing: 1,
            warehouse_id: userAuth.admin?.currentWarehouseId,
          });

          if (customerOrder.length > 0) {
            sendUpdate(
              "running",
              0,
              `Found ${customerOrder.length} customer orders to process.`,
            );
            await sleep(100); // Add a small delay to avoid overwhelming the database
          }

          const customerOrderDetail = await tx
            .table("customer_order_detail")
            .where({
              is_testing: 1,
            })
            .whereIn(
              "order_id",
              customerOrder.map((order) => order.order_id),
            );

          if (customerOrderDetail.length > 0) {
            sendUpdate(
              "running",
              0,
              `Found ${customerOrderDetail.length} customer order details to process.`,
            );
            await sleep(100); // Add a small delay to avoid overwhelming the database
          }

          const orderPayment = await tx
            .table("order_payment")
            .where({
              is_testing: 1,
            })
            .whereIn(
              "order_id",
              customerOrder.map((order) => order.order_id),
            );

          if (orderPayment.length > 0) {
            sendUpdate(
              "running",
              0,
              `Found ${orderPayment.length} order payments to process.`,
            );
            await sleep(100); // Add a small delay to avoid overwhelming the database
          }

          const shift = await tx
            .table("shift")
            .join("user", "user.id", "shift.opened_by")
            .where({
              "shift.is_testing": 1,
              "user.warehouse_id": userAuth.admin?.currentWarehouseId,
            })
            .select("shift.*");

          if (shift.length > 0) {
            sendUpdate(
              "running",
              0,
              `Found ${shift.length} shifts to process.`,
            );
            await sleep(100); // Add a small delay to avoid overwhelming the database
          }

          const printKitchenLog = await tx.table("print_kitchen_log").where({
            is_testing: 1,
            warehouse_id: userAuth.admin?.currentWarehouseId,
          });

          if (printKitchenLog.length > 0) {
            sendUpdate(
              "running",
              0,
              `Found ${printKitchenLog.length} print kitchen logs to process.`,
            );
            await sleep(100); // Add a small delay to avoid overwhelming the database
          }

          const totalRows =
            customerOrder.length +
            customerOrderDetail.length +
            orderPayment.length +
            shift.length +
            printKitchenLog.length;

          sendUpdate(
            "running",
            0,
            `Total rows to process: ${totalRows}. Starting deletion...`,
          );
          await sleep(500); // Add a small delay to avoid overwhelming the database

          if (totalRows === 0) {
            sendUpdate(
              "completed",
              100,
              "No rows to process. Nothing to delete.",
            );
            return;
          }

          if (customerOrder.length > 0) {
            for (const order of customerOrder) {
              processed++;
              sendUpdate(
                "running",
                (processed / totalRows) * 100,
                `Deleting customer order ${order.order_id} (${processed} of ${totalRows})...`,
              );
              await tx
                .table("customer_order")
                .where({ order_id: order.order_id })
                .delete();
              await sleep(100); // Add a small delay to avoid overwhelming the database
            }
          }

          if (customerOrderDetail.length > 0) {
            for (const detail of customerOrderDetail) {
              processed++;
              sendUpdate(
                "running",
                (processed / totalRows) * 100,
                `Deleting customer order detail ${detail.order_detail_id} (${processed} of ${totalRows})...`,
              );
              await tx
                .table("customer_order_detail")
                .where({ order_detail_id: detail.order_detail_id })
                .delete();
              await sleep(100); // Add a small delay to avoid overwhelming the database
            }
          }

          if (orderPayment.length > 0) {
            for (const payment of orderPayment) {
              processed++;
              sendUpdate(
                "running",
                (processed / totalRows) * 100,
                `Deleting order payment ${payment.payment_id} (${processed} of ${totalRows})...`,
              );
              await tx
                .table("order_payment")
                .where({ payment_id: payment.payment_id })
                .delete();
              await sleep(100); // Add a small delay to avoid overwhelming the database
            }
          }
          if (shift.length > 0) {
            for (const s of shift) {
              processed++;
              sendUpdate(
                "running",
                (processed / totalRows) * 100,
                `Deleting shift ${s.shift_id} (${processed} of ${totalRows})...`,
              );
              await tx.table("shift").where({ shift_id: s.shift_id }).delete();
              await sleep(100); // Add a small delay to avoid overwhelming the database
            }
          }

          if (printKitchenLog.length > 0) {
            for (const log of printKitchenLog) {
              processed++;
              sendUpdate(
                "running",
                (processed / totalRows) * 100,
                `Deleting print kitchen log ${log.id} (${processed} of ${totalRows})...`,
              );
              await tx
                .table("print_kitchen_log")
                .where({ id: log.id })
                .delete();
              await sleep(100); // Add a small delay to avoid overwhelming the database
            }
          }

          if (processed === totalRows) {
            sendUpdate(
              "completed",
              100,
              "Database pipeline completed successfully.",
            );
          }
        });
      } catch (error) {
        console.error(error);
        sendUpdate(
          "failed",
          0,
          "An execution error stopped the database pipeline.",
        );
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
});
