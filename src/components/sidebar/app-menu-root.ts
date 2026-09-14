import { LucideProps } from "lucide-react";
import React from "react";

export interface ItemMenuProp {
  title: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  onlyMain?: boolean;
  url: string;
  subitems?: ItemMenuProp[];
  newTab?: boolean;
}

export interface MenuProp {
  /** Stable, untranslated identifier for icon lookup / special-casing. */
  key: string;
  title: string;
  items: ItemMenuProp[];
}
