import Fonepay from '@/../../public/assets/fonepay.jpg';
import Esewa from "@/../../public/assets/esewa.png";
import Khalti from "@/../../public/assets//khalti.jpg";
import { Banknote, CreditCard } from "lucide-react";

export const paymentMethods = [
  { id: "cash", label: "Cash", icon: <Banknote className="w-10 h-10 text-primary" /> },
  { id: "fonepay", label: "fonePay", image: Fonepay },
  { id: "esewa", label: "eSewa", image: Esewa },
  { id: "khalti", label: "Khalti", image: Khalti },
  { id: "credit", label: "Credit", icon: <CreditCard className="w-10 h-10 text-primary" /> },
];

export const creditPaymentMethods = [
  { id: "cash", label: "Cash"},
  { id: "fonepay", label: "fonePay" },
  { id: "esewa", label: "eSewa" },
  { id: "khalti", label: "Khalti"},
];

export enum AdminRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  STAFF = "STAFF",
  CASHIER = "CASHIER",
}