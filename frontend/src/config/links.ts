import { AdminRole } from "./constant";
import {
  UtensilsCrossed,
  Apple,
  HandPlatter,
  Banknote,
  User,
  File,
  Cog,
  Users,
  LayoutDashboard,
  Boxes,
  Calendar,
} from "lucide-react";

export const adminPanelLinks = [
  // Menu Management
  {
    title: "Menu",
    origin: "/menu",
    icon: Apple,
    roles: [
      AdminRole.SUPER_ADMIN,
      AdminRole.ADMIN,
    ],
    items: [
      {
        title: "Items",
        origin: "/menu/items",
      },
      {
        title: "Categories",
        origin: "/menu/categories",
      },
      {
        title: "Combos",
        origin: "/menu/combos",
      },
    ],
  },


  // Inventory
  {
    title: "Inventory",
    origin: "/inventory",
    icon: Boxes,
    roles: [
      AdminRole.SUPER_ADMIN,
      AdminRole.ADMIN,
    ],
    items: [
      {
        title: "Stock",
        origin: "/inventory/stock",
      },
      {
        title: "Low Stocks",
        origin: "/inventory/low-stocks",
      },
    ],
  },

  // Tables
  {
    title: "Tables",
    origin: "/tables",
    icon: UtensilsCrossed,
    roles: [
      AdminRole.SUPER_ADMIN,
      AdminRole.ADMIN,
      AdminRole.STAFF,
    ],
    items: [],
  },

  // Orders
  {
    title: "Orders",
    origin: "/orders",
    icon: HandPlatter,
    roles: [
      AdminRole.SUPER_ADMIN,
      AdminRole.ADMIN,
      AdminRole.STAFF,
    ],
    items: [
      {
        title: "All Orders",
        origin: "/orders",
      },
      {
        title: "New Order",
        origin: "/orders/new",
      },
      {
        title: "Pending Orders",
        origin: "/orders/pending",
      },
    ],
  },


  // Transactions
  {
    title: "Transactions",
    origin: "/transactions",
    icon: Banknote,
    roles: [
      AdminRole.SUPER_ADMIN,
      AdminRole.ADMIN,
      AdminRole.CASHIER,
    ],
    items: [
      {
        title: "Payments",
        origin: "/transactions/payments",
      },
      {
        title: "Day Book",
        origin: "/transactions/day-book",
      },
    ],
  },


  // Customers
  {
    title: "Customers",
    origin: "/customers",
    icon: User,
    roles: [
      AdminRole.SUPER_ADMIN,
      AdminRole.ADMIN,
      AdminRole.CASHIER,
    ],
    items: [
      {
        title: "All Customers",
        origin: "/customers",
      },
      {
        title: "Credits",
        origin: "/customers/credits",
      },
      {
        title: "Loyalty",
        origin: "/customers/loyalty",
      },
    ],
  },


  // Reports
  {
    title: "Reports",
    origin: "/reports",
    icon: File,
    roles: [
      AdminRole.SUPER_ADMIN,
      AdminRole.ADMIN,
    ],
    items: [
      {
        title: "Sales",
        origin: "/reports/sales",
      },
      {
        title: "Revenue",
        origin: "/reports/revenue",
      },
      {
        title: "Cancelled Orders",
        origin: "/reports/cancellations",
      },
    ],
  },

  // Settings
  {
    title: "Settings",
    origin: "/settings",
    icon: Cog,
    roles: [
      AdminRole.SUPER_ADMIN,
      AdminRole.ADMIN,
    ],
    items: [
      {
        title: "Users",
        origin: "/settings/users",
      },
      {
        title: "Logs",
        origin: "/settings/logs",
      },
            {
        title: "Logs Summary",
        origin: "/settings/logs/summary",
      },
    ],
  },

];
