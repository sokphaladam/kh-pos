import {
  generateMovieShowtimeHtml,
  groupByMovieHallBranch,
  queryMovieShowtimeData,
} from "@/lib/cron/helpers/movie-showtime-report";
import { Formatter } from "@/lib/formatter";
import { PdfGenerator } from "@/lib/pdf-generator";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { promises as fsPromises } from "fs";
import { EmailApp } from "@/lib/email/email-servive-app";

async function requestUploadFile(
  url: string,
  { file, filename }: { file: Blob; filename: string },
): Promise<{ url: string }> {
  const myHeaders = new Headers();
  myHeaders.append(
    "Authorization",
    "Bearer mxa1b7695b97e29314bcf4821b28f3511c",
  );

  const formdata = new FormData();
  formdata.append("file", file, filename);

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: formdata,
    // redirect: "follow" as RequestRedirect,
  };

  const raw = await fetch(url, requestOptions);

  const text = await raw.text();

  return JSON.parse(text);
}

export const sendEmail = withAuthApi<
  unknown,
  { date: string },
  ResponseType<unknown>
>(async ({ body, db, logger }) => {
  const date = body?.date;

  const day = Formatter.date(date) || "";

  const rows = await queryMovieShowtimeData(db, {
    startDate: day,
    endDate: `${day} 23:59:59`,
  });

  const reportData = groupByMovieHallBranch(rows);

  if (reportData.length === 0) {
    return NextResponse.json(
      {
        success: false,
        result: "No showtime data found for the specified date range",
      },
      { status: 404 },
    );
  }

  const skipEmail = process.env.SKIP_EMAIL === "true";

  if (!skipEmail) {
    const recipientEmail = reportData
      .map((item) => item.email_producer.split(",").flat())
      .flat();

    const uniqueEmails = [...new Set(recipientEmail)];

    const currentDate = new Date(day).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    for (const email of uniqueEmails) {
      const data = reportData.filter((item) =>
        item.email_producer.split(",").includes(email),
      );

      if (data.length > 0) {
        // Generate HTML for PDF
        const html = generateMovieShowtimeHtml(data, day);

        // Generate PDF from HTML
        const pdfPath = await PdfGenerator.generateFromHtml(html, {
          format: "A4",
          margin: {
            top: "0mm",
            bottom: "0mm",
            left: "0mm",
            right: "0mm",
          },
          landscape: true,
        });
        // Upload PDF to server https://sv-k8.l192.com/upload/chuck
        const pdfBuffer = await fsPromises.readFile(pdfPath);
        const pdfBlob = new Blob([new Uint8Array(pdfBuffer)], {
          type: "application/pdf",
        });
        const upload = await requestUploadFile(
          "https://sv-k8.l192.com/upload/chuck",
          {
            file: pdfBlob,
            filename: `movie-showtime-report-${currentDate}.pdf`,
          },
        );

        // Send email with PDF attachment
        // default email if email is null or empty 2keppere@gmail.com
        await EmailApp.sendMailgunWithAttachments(
          email === "null" ? "2keppere@gmail.com" : email,
          `Daily Movie Showtime Report - ${currentDate}`,
          "Please find attached the daily movie showtime report.",
          [
            {
              filename: `movie-showtime-report-${currentDate}.pdf`,
              path: pdfPath,
            },
          ],
        );
        logger.serverLog("Generated HTML for email:", {
          action: "create",
          key: `movie-showtime-report-${currentDate}.pdf`,
          table_name: "/api/reports/cinema-showtime/send-email",
          content: {
            email: email === "null" ? "2keppere@gmail.com" : email,
            currentDate,
            upload,
          },
        });
      }
    }
  } else {
  }

  return NextResponse.json(
    { success: true, result: reportData.length },
    { status: 200 },
  );
});
