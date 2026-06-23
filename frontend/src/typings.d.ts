import { AdminRole } from "./config/constant";


export interface Category {
  id: number;
  name: string;
  itemCount: number;
}

export interface Item {
  id: number;
  name: string;
  price: number;
  image: string;
  unit: string;
  categoryId: number;
  categoryName: string;
  available: boolean;
  isLimited?: boolean;
  inventory?: {
    quantity: number;
    threshold: number;
  };
}

export interface ComboItem {
  id?: number;
  name?: string;
  quantity?: number;
  threshold: number;
}

export interface Combo {
  id: number;
  name: string;
  price: number;
  items: ComboItem[];
  image: string;
  description: string;
  expirable: boolean;
  dateFrom: string;
  dateTo: string;
  status: boolean;
  available: boolean;
}

export interface FoodItem {
  id: number;
  name: string;
  price: number;
  image: string;
  unit: string;
  categoryId: number;
  categoryName: string;
  available: boolean;
  isLimited?: boolean;
  inventory?: {
    quantity: number;
    threshold: number;
  };
}

export interface Role {
  id: number;
  code: string;
  name: string;
  employeeCount: number;
}

export interface Table {
  id: number;
  name: string;
  code: string;
  capacity: string;
  status: "available" | "occupied" | "reserved";
  pendingOrder: any;
}

export interface Order {
  id: number;
  table: {
    id: number;
    name: string;
    capacity: number;
  };
  orderItems?: OrderItem[];
  totalAmount: number;
  appliedDiscount: number;
  discountAmount: number;
  paymentMode: string | null;
  guests: number;
  paymentId: string | null;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  customerId?: number | null;
  paidAmount: number;
  remainingBalance: number;
  tipsId?: number | null;
  cancelReason?: string;
  paymentDetails: Payment;
  completedAt: string;
  customerName: string;
}

export interface Payment {
  id: number;
  orderId: number;
  customerId: number;
  paidAmount: number;
  customerName: string;
  tipAmount: number;
  paymentMethod: string;
  paymentStatus: "completed" | "pending" | "failed";
  paymentDate: string;
  vatAmount: number;
  serviceChargeAmount: number;
  discountAmount: number;
  discountPercent: number;
  vatPercentage: number;
  serviceChargePercentage: number;
  totalAmountAfterTaxes: number;
  paymentReference: string | null;
}

type OrderStatus = "pending" | "completed" | "cancelled" | "credit";

export interface OrderItem {
  id?: number;
  orderId?: number;
  itemId?: number;
  comboId?: number;
  name?: string;
  totalPrice?: number;
  price: number;
  quantity: number;
  comboName?: string;
  itemName?: string;
  unit?: "food" | "combo";
}

export interface LoyaltyProgram {
  id: number;
  name: string;
  image: string;
  discount: number;
  items: Array<number>;
  totalOrdersRequired: number;
  totalAmountSpent: number;
  description: string;
  validFrom: string;
  validTo: string;
  status: "available" | "inactive" | "expired";
}

export interface User {
  address: string;
  email: string;
  role?: Role;
  password?: string;
  userType: string;
  emailVerified: boolean;
  logo: string;
  name: string;
  phone: string;
  phoneVerified: boolean;
  type: string;
  approved?: boolean;
};

export interface Customer {
  id: number | null;
  name: string;
  phone: string;
  email: string;
  availableCredit?: number;
  currentCredit?: number;
  totalOrders?: number;
  totalOrderAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Stock {
  itemId: number;
  itemName: string;
  quantity: number;
  threshold: number;
  unit: string;
  image: string;
  price: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
}

export interface CustomerCredit {
  id: number;
  name: string;
  availableCredit: number;
  currentCredit: number;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  storeId: number;
  image?: string | null;
  hide: boolean;
  unit: string;
  store?: Store;
  category?: Category;
  isLimited: boolean;
  inventory?: Inventory | null;
}

export interface Inventory {
  id: number;
  itemId: number;
  quantity: number;
  threshold: number;
  lastUpdated: Date;
}

export interface LowStockItem {
  id: number;
  name: string;
  price: 1000;
  // categoryName: string;
  image: string;
  inventory: {
    quantity: number;
    threshold: number;
  };
  status: "low" | "none";
}

export interface SalesMetrics {
  totalOrders: number;
  totalSales: string;
  totalCreditPayments: string;
  remainingBalanceTotal: string;
  paymentMethodStats: {
    cash: number;
    fonepay: number;
    esewa: number;
    khalti: number;
    credit: number;
  };
  openingBalance: string;
  closingBalance: string;
}


export interface SaleRecord {
  id: number;
  totalAmount: number;
  guests: number;
  createdAt: string;
  table: string;
  paymentDetails: {
    paymentMethod?: string;
    paymentStatus?: string;
  };
}

export interface Reservation {
  id: number;

  customerName: string;
  customerNo: string;
  customerEmail?: string | null;

  noOfPeople: number;

  reserveFor?: string | null;

  fromTime?: string | null;
  toTime?: string | null;

  tableId: number;

  status: "pending" | "confirmed" | "cancelled" | string;

  createdAt: string; // or Date if you parse it client-side
  updatedAt: string;

  // optional relation (if API includes it)
  table?: {
    id: number;
    name?: string;
    number?: number;
  };
}

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  LOGIN_FAILED = "LOGIN_FAILED",
}

export enum AuditEntity {
  STAFF = "STAFF",
  PRODUCT = "PRODUCT",
  ORDER = "ORDER",
  TABLE = "TABLE",
  CATEGORY = "CATEGORY",
  COMBO = "COMBO",
  INVENTORY = "INVENTORY",
  RESERVATION = "RESERVATION",
  AUTH = "AUTH",
}

export interface AuditLog {
  id: number;
  userId: number;
  userName?: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: number | null;
  description?: string | null;
  metadata?: any;
  createdAt: string;
}