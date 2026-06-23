import { AdminRole } from "./constant";

export const routePermissions: Record<string, AdminRole[]> = {
  "/tables": [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.STAFF,
  ],

  "/orders": [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.STAFF,
  ],

  "/transactions": [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.CASHIER,
  ],

  "/transactions/pending": [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.CASHIER,
  ],

  "/transactions/order-book": [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.CASHIER,
  ],

  "/transactions/miscellaneous": [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.CASHIER,
  ],

  "/inventory": [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
  ],

  "/inventory/categories": [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
  ],

  "/menu/items": [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
  ],

  "/inventory/combos": [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
  ],

  "/inventory/low-stock": [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
  ],

  "/credit": [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.CASHIER,
  ],

  "/credit/customerss": [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.CASHIER,
  ],

  "/credit/history": [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.CASHIER,
  ],

  "/sales": [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.CASHIER,
  ],

  "/sales/records": [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.CASHIER,
  ],

  "/sales/cancellations": [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.CASHIER,
  ],

  "/sales/revenue": [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
  ],

  "/loyalty": [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.CASHIER,
  ],

  "/loyalty/milestone-rewards": [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.CASHIER,
  ],

  "/loyalty/purchases": [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.CASHIER,
  ],
};