import * as express from "express";
import orderRoutes from "../modules/order/order.routes";
import tableRoutes from "../modules/table/table.routes";
import billingRoutes from "../modules/billing/billing.routes";
import creditRoutes from "../modules/credit/credit.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import rootRoutes from "./rootRoute";
import customerRoutes from "../modules/customer/customer.routes";
import itemRoutes from "../modules/menu/item/item.routes";
import authRoutes from "../modules/auth/auth.routes";
import verifyToken from "../middleware/verify-token";
import categoryRoutes from "../modules/menu/category/category.routes";
import comboRoutes from "../modules/menu/combo/combo.routes";
import reportsRoutes from "../modules/reports/reports.routes";
import loyaltyRoutes from "../modules/loyalty/loyalty.routes";
import inventoryRoutes from "../modules/inventory/inventory.routes";
import staffRoutes from "../modules/staff/staff.routes";
import auditRoutes from "../modules/audit/audit.routes";

const router = express.Router();

router.use("/", rootRoutes); 
router.use("/auth", authRoutes);

router.use(verifyToken);

// Menu management
router.use("/category", categoryRoutes);
router.use("/item", itemRoutes);
router.use("/combo", comboRoutes);

// Floor management
router.use("/table", tableRoutes);
router.use("/order", orderRoutes);

// Inventory Management
router.use("/inventory", inventoryRoutes)

// Billing & Payments
router.use("/billing", billingRoutes);

// Customer Mangement
router.use("/customer", customerRoutes);
router.use("/credit", creditRoutes);
router.use("/loyalty", loyaltyRoutes);

// Reporting & Analytics
router.use("/reports", reportsRoutes);
router.use("/dashboard", dashboardRoutes);

// Settings
router.use("/staff", staffRoutes)
router.use("/audit-logs", auditRoutes);

export default router;