export interface table_supplier {
  id?: string;
  name: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  note: string | null;
  is_consignment: number | null;
  created_at: string | null;
  updated_at: string | null;
  delete_date: string | null;
}
