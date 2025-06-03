import { ReactNode } from "react";

export interface AccordionData {
  title: string | ReactNode;
  textValue: string;
  key: number | string;
  node: string | ReactNode;
}
