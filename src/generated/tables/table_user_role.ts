export interface table_user_role {
  id?: string;
  role: string;
  created_at: string | null;
  is_default?: number | null;
  permissions: Record<string, unknown> | null;
}
