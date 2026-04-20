import request from "request";
import fs from "fs/promises";
import { createReadStream } from "fs";
import { env } from "@/config/env";

export interface EmailAttachment {
  filename: string;
  path: string;
}

export class EmailApp {
  /**
   * Send email with attachments using Mailgun API (working method)
   */
  static sendMailgunWithAttachments(
    email: string,
    subject: string,
    body: string,
    attachments?: EmailAttachment[],
  ): Promise<void> {
    const mailgunConfig = env.public.mailServer;

    return new Promise((resolve, reject) => {
      const formData: Record<string, unknown> = {
        from: mailgunConfig.FROM_EMAIL,
        to: email,
        subject: subject,
        html: body,
      };

      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        formData.attachment = attachments.map((att) => ({
          value: createReadStream(att.path),
          options: {
            filename: att.filename,
          },
        }));
      }

      request(
        mailgunConfig.HOST,
        {
          method: "POST",
          auth: {
            username: mailgunConfig.USERNAME,
            password: mailgunConfig.PASSWORD,
          },
          formData: formData,
        },
        async function (err, res, responseBody) {
          if (err) {
            console.error("Mailgun API error:", err);
            reject(err);
            return;
          }

          console.log("Email sent successfully via Mailgun API");
          console.log("Response:", responseBody);

          // Clean up attachment files after sending
          if (attachments) {
            for (const attachment of attachments) {
              try {
                await fs.unlink(attachment.path);
                console.log(`Cleaned up attachment: ${attachment.path}`);
              } catch (error) {
                console.error(
                  `Failed to delete attachment ${attachment.path}:`,
                  error,
                );
              }
            }
          }

          resolve();
        },
      );
    });
  }
}
