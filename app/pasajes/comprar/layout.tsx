import type { ReactNode } from "react";
import { PurchaseProvider } from "@/components/pasajes/PurchaseProvider";

export default function ComprarLayout({ children }: { children: ReactNode }) {
  return <PurchaseProvider>{children}</PurchaseProvider>;
}
