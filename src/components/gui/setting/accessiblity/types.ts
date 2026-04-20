import { Action } from "@/lib/permissions";

export interface TransformedRole {
  id: string;
  role: string;
  permissions: Record<string, Action[]>;
}

export interface AddRoleSheetOptions {
  mutate: () => void;
}

export interface AddRoleSheetProps extends AddRoleSheetOptions {
  close: (value: boolean) => void;
}
