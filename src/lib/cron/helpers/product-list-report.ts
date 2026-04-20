import { Knex } from "knex";

export interface ProductReportItem {
  id: string;
  title: string;
  description: string | null;
  sku: string;
  barcode: string;
  price: number;
  stock: number;
  category: string;
  variantName: string;
}

export interface ProductReportData {
  items: ProductReportItem[];
  summary: {
    totalProducts: number;
    totalVariants: number;
    totalStock: number;
  };
}

/**
 * Query product data from database for reporting
 */
export async function queryProductListData(
  db: Knex,
): Promise<ProductReportData> {
  // Query products with variants and categories directly
  const rows = await db
    .select(
      "product.id as product_id",
      "product.title as product_title",
      "product.description as product_description",
      "product_variant.id as variant_id",
      "product_variant.name as variant_name",
      "product_variant.sku",
      "product_variant.barcode",
      "product_variant.price",
      db.raw(
        "GROUP_CONCAT(DISTINCT product_category.title ORDER BY product_category.title SEPARATOR ', ') as categories",
      ),
    )
    .from("product")
    .leftJoin("product_variant", "product.id", "product_variant.product_id")
    .leftJoin(
      "product_categories",
      "product.id",
      "product_categories.product_id",
    )
    .leftJoin(
      "product_category",
      "product_categories.category_id",
      "product_category.id",
    )
    .whereNull("product.deleted_at")
    .whereNull("product_variant.deleted_at")
    .groupBy(
      "product.id",
      "product.title",
      "product.description",
      "product_variant.id",
      "product_variant.name",
      "product_variant.sku",
      "product_variant.barcode",
      "product_variant.price",
    )
    .orderBy("product.title", "asc")
    .orderBy("product_variant.name", "asc");

  if (rows.length === 0) {
    return {
      items: [],
      summary: {
        totalProducts: 0,
        totalVariants: 0,
        totalStock: 0,
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reportItems: ProductReportItem[] = rows.map((row: any) => ({
    id: row.product_id,
    title: row.product_title,
    description: row.product_description,
    sku: String(row.sku || ""),
    barcode: String(row.barcode || ""),
    price: Number(row.price) || 0,
    stock: 0, // Stock not available in product_variant table
    category: row.categories || "Uncategorized",
    variantName: row.variant_name || "Default",
  }));

  // Calculate summary
  const uniqueProducts = new Set(reportItems.map((item) => item.id));

  return {
    items: reportItems,
    summary: {
      totalProducts: uniqueProducts.size,
      totalVariants: reportItems.length,
      totalStock: 0, // Stock not available
    },
  };
}

/**
 * Generate HTML for product list report
 */
export function generateProductListHtml(data: ProductReportData): string {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 40px;
          background: #fff;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #333;
          padding-bottom: 20px;
        }
        .header h1 {
          font-size: 28px;
          color: #333;
          margin-bottom: 10px;
        }
        .header p {
          font-size: 14px;
          color: #666;
        }
        .summary {
          background: #f5f5f5;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 5px;
          display: flex;
          justify-content: space-between;
        }
        .summary-item {
          text-align: center;
        }
        .summary-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .summary-value {
          font-size: 20px;
          font-weight: bold;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background: #333;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 600;
        }
        td {
          padding: 10px 8px;
          border-bottom: 1px solid #ddd;
          font-size: 11px;
          color: #333;
        }
        tr:hover {
          background: #f9f9f9;
        }
        tr:last-child td {
          border-bottom: 2px solid #333;
        }
        .price {
          text-align: right;
          font-weight: 600;
        }
        .stock {
          text-align: center;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #999;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Product Inventory List</h1>
        <p>Generated on ${currentDate}</p>
      </div>

      <div class="summary">
        <div class="summary-item">
          <div class="summary-label">Total Products</div>
          <div class="summary-value">${data.summary.totalProducts}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Variants</div>
          <div class="summary-value">${data.summary.totalVariants}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Stock Units</div>
          <div class="summary-value">${data.summary.totalStock}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Variant</th>
            <th>Category</th>
            <th>SKU</th>
            <th>Barcode</th>
            <th>Price</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          ${data.items
            .map(
              (item) => `
            <tr>
              <td>${item.title}</td>
              <td>${item.variantName}</td>
              <td>${item.category}</td>
              <td>${item.sku}</td>
              <td>${item.barcode}</td>
              <td class="price">$${item.price.toFixed(2)}</td>
              <td class="stock">${item.stock}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>

      <div class="footer">
        <p>L-POS Product Inventory Report • Confidential</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML email content for product report
 */
export function generateProductReportEmail(data: ProductReportData): string {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .summary {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        .summary-item:last-child {
          border-bottom: none;
        }
        .label {
          font-weight: 600;
          color: #666;
        }
        .value {
          font-weight: bold;
          color: #667eea;
          font-size: 18px;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #999;
          font-size: 12px;
        }
        .attachment-note {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Daily Product Inventory Report</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${currentDate}</p>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Here is your daily product inventory report summary:</p>
          
          <div class="summary">
            <div class="summary-item">
              <span class="label">Total Products:</span>
              <span class="value">${data.summary.totalProducts}</span>
            </div>
            <div class="summary-item">
              <span class="label">Total Variants:</span>
              <span class="value">${data.summary.totalVariants}</span>
            </div>
            <div class="summary-item">
              <span class="label">Total Stock Units:</span>
              <span class="value">${data.summary.totalStock}</span>
            </div>
          </div>

          <div class="attachment-note">
            <strong>📎 Attachment:</strong> The complete product list is attached as a PDF file.
          </div>

          <p>Please review the attached PDF for the complete product inventory details.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>L-POS System</strong>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated report from L-POS System</p>
          <p>Generated on ${new Date().toISOString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
