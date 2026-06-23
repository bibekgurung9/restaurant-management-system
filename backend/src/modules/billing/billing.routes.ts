import * as express from "express";
import * as billingController from "./billing.controller";
import authorize from "../../middleware/authorize";

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     BillingOrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         productId:
 *           type: integer
 *         comboId:
 *           type: integer
 *         quantity:
 *           type: integer
 *         unit:
 *           type: string
 *         price:
 *           type: number
 *         productName:
 *           type: string
 *         comboName:
 *           type: string
 *     BillingOrderDetail:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         table:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *         totalAmount:
 *           type: number
 *         paymentMode:
 *           type: string
 *         status:
 *           type: string
 *         guests:
 *           type: integer
 *         customerId:
 *           type: integer
 *         orderItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BillingOrderItem'
 *         paymentDetails:
 *           type: object
 *     DayBookResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             metrics:
 *               type: object
 *               properties:
 *                 totalOrders:
 *                   type: integer
 *                 totalSales:
 *                   type: string
 *                 metricDate:
 *                   type: string
 *             orders:
 *               type: array
 *         meta:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             totalOrders:
 *               type: integer
 *             totalPages:
 *               type: integer
 */

/**
 * @openapi
 * /billing/order/{id}:
 *   get:
 *     tags:
 *       - Billing
 *     summary: Get full billing details for an order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order billing details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/BillingOrderDetail'
 *       400:
 *         description: OrderId missing/invalid
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/order/:id",
  authorize("SUPER_ADMIN", "ADMIN", "CASHIER"),
  billingController.billingOrderDetail
);

/**
 * @openapi
 * /billing/receipt/{id}:
 *   get:
 *     tags:
 *       - Billing
 *     summary: Get receipt details for an order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Receipt details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Order ID missing
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/receipt/:id",
  authorize("SUPER_ADMIN", "ADMIN", "CASHIER"),
  billingController.getOrderReceiptDetails
);

/**
 * @openapi
 * /billing/order/{id}/complete:
 *   post:
 *     tags:
 *       - Billing
 *     summary: Complete an order and record payment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_mode
 *               - actualTotalAmount
 *             properties:
 *               payment_mode:
 *                 type: string
 *                 enum: [cash, card, credit, other]
 *               customerId:
 *                 type: integer
 *               vatPercentage:
 *                 type: number
 *               serviceChargePercentage:
 *                 type: number
 *               paidAmount:
 *                 type: number
 *               tipAmount:
 *                 type: number
 *               discountPercent:
 *                 type: number
 *               actualTotalAmount:
 *                 type: number
 *               partialPaymentMethod:
 *                 type: string
 *               partialPaymentAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Order completed successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  "/order/:id/complete",
  authorize("SUPER_ADMIN", "ADMIN", "CASHIER"),
  billingController.completeOrder
);

/**
 * @openapi
 * /billing/day-book:
 *   get:
 *     tags:
 *       - Billing
 *     summary: Get daily order book (paginated) with optional status filter
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in YYYY-MM-DD (default today)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Day book retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DayBookResponse'
 *       400:
 *         description: Invalid date or future date
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/day-book",
  authorize("SUPER_ADMIN", "ADMIN"),
  billingController.dayBook
);

/**
 * @openapi
 * /billing/day-book/metrics:
 *   get:
 *     tags:
 *       - Billing
 *     summary: Get metrics and all orders for a specific day (unpaginated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Metrics and orders retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     metrics:
 *                       type: object
 *                       properties:
 *                         totalOrders:
 *                           type: integer
 *                         totalSales:
 *                           type: string
 *                         metricDate:
 *                           type: string
 *                     orders:
 *                       type: array
 *       400:
 *         description: Invalid date or future date
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/day-book/metrics",
  authorize("SUPER_ADMIN", "ADMIN"),
  billingController.getOrdersAndMetricsForDay
);

/**
 * @openapi
 * /payments:
 *   get:
 *     tags:
 *       - Payments
 *     summary: Get all payments (paginated) or filter by customerId
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *         description: Filter payments by a specific customer
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentListResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/payment",
  authorize("SUPER_ADMIN", "ADMIN"),
  billingController.getAllPayments
);

export default router;