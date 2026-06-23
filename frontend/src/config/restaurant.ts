import { IndianRupee } from "lucide-react";

export const restaurantConfig = {
  name: "Bibek's Restaurant",
  phone: "9800000000",
  address: "Kathmandu",
  currencyIcon : IndianRupee,
  receipt: {
    showLogo: true,
    footer: "Thank you for visiting!"
  }
} as const