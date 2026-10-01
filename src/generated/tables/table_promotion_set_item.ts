export interface table_promotion_set_item {
  id: string;
  promotion_set_id: string;
  match_type?: 'VARIANT' | 'PRODUCT' | 'CATEGORY';
  match_id: string;
  qty?: number;
  discount_type?: 'PERCENTAGE' | 'AMOUNT';
  discount_value?: string;
  sort_order?: number;
}
