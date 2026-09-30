import type { Metadata } from "next";
import { Tour } from "@/components/tour/Tour";

export const metadata: Metadata = {
  title: "Biye Bari 3D — walk into a Bengali wedding | Rajib Studio",
  description:
    "An interactive 3D walkthrough of a Bengali wedding house: the lit-up lane, the Shubho Bibaho gate, the chhadnatala, the reception stage, the feast and the tattwa gifts.",
};

export default function BiyeBariPage() {
  return <Tour />;
}
