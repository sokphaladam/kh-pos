import puppeteer from "puppeteer";
import path from "path";
import fs from "fs/promises";

export interface PdfGeneratorOptions {
  /**
   * Output file path. If not provided, a unique filename will be generated in tmp/
   */
  outputPath?: string;

  /**
   * PDF page format (default: A4)
   */
  format?: "A4" | "Letter" | "Legal";

  /**
   * Print background graphics (default: true)
   */
  printBackground?: boolean;

  /**
   * Page margins
   */
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };

  /**
   * Custom page width (overrides format)
   */
  width?: string;

  /**
   * Custom page height (overrides format)
   */
  height?: string;

  landscape?: boolean;
}

/**
 * General-purpose PDF generator from HTML content
 * Uses Puppeteer to render HTML and generate PDF
 */
export class PdfGenerator {
  /**
   * Generate PDF from HTML string
   * @param html HTML content to convert to PDF
   * @param options PDF generation options
   * @returns Path to the generated PDF file
   */
  static async generateFromHtml(
    html: string,
    options: PdfGeneratorOptions = {},
  ): Promise<string> {
    const {
      outputPath,
      format = "A4",
      printBackground = true,
      margin = {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm",
      },
      width,
      height,
      landscape = false,
    } = options;

    // Ensure tmp directory exists
    const tmpDir = path.resolve(process.cwd(), "tmp");
    try {
      await fs.access(tmpDir);
    } catch {
      await fs.mkdir(tmpDir, { recursive: true });
    }

    // Determine output path
    const pdfPath =
      outputPath || path.join(tmpDir, `generated-pdf-${Date.now()}.pdf`);

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      // Generate PDF with options
      const pdfOptions: Record<string, unknown> = {
        path: pdfPath,
        printBackground,
        margin,
        landscape,
      };

      if (width && height) {
        pdfOptions.width = width;
        pdfOptions.height = height;
      } else {
        pdfOptions.format = format;
      }

      await page.pdf(pdfOptions);
    } finally {
      await browser.close();
    }

    return pdfPath;
  }

  /**
   * Generate PDF from HTML file
   * @param filePath Path to HTML file
   * @param options PDF generation options
   * @returns Path to the generated PDF file
   */
  static async generateFromHtmlFile(
    filePath: string,
    options: PdfGeneratorOptions = {},
  ): Promise<string> {
    const html = await fs.readFile(filePath, "utf-8");
    return this.generateFromHtml(html, options);
  }

  /**
   * Generate PDF from URL
   * @param url URL to convert to PDF
   * @param options PDF generation options
   * @returns Path to the generated PDF file
   */
  static async generateFromUrl(
    url: string,
    options: PdfGeneratorOptions = {},
  ): Promise<string> {
    const {
      outputPath,
      format = "A4",
      printBackground = true,
      margin = {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm",
      },
      width,
      height,
      landscape = false,
    } = options;

    // Ensure tmp directory exists
    const tmpDir = path.resolve(process.cwd(), "tmp");
    try {
      await fs.access(tmpDir);
    } catch {
      await fs.mkdir(tmpDir, { recursive: true });
    }

    // Determine output path
    const pdfPath =
      outputPath || path.join(tmpDir, `generated-pdf-${Date.now()}.pdf`);

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "networkidle0" });

      // Generate PDF with options
      const pdfOptions: Record<string, unknown> = {
        path: pdfPath,
        printBackground,
        margin,
        landscape,
      };

      if (width && height) {
        pdfOptions.width = width;
        pdfOptions.height = height;
      } else {
        pdfOptions.format = format;
      }

      await page.pdf(pdfOptions);
    } finally {
      await browser.close();
    }

    return pdfPath;
  }
}
