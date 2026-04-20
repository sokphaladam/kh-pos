export interface table_product_images {
  id?: string;
  product_id: string;
  image_url: string;
  product_variant_id: string | null;
  image_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}
