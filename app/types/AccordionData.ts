import { ReactNode } from "react";

export interface AccordionData {
  title: string | ReactNode;
  key: number | string;
  node: string | ReactNode;
}
