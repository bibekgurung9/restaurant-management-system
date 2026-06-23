import * as express from "express";
import * as reportsController from "./reports.controller";
import authorize from "../../middleware/authorize";

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     CompletedOrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         totalAmount:
 *           type: number
 *         guests:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         table:
 *           type: string
 *         paymentDetails:
 *           type: object
 *     DailySalesResponse:
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
 *             records:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CompletedOrderItem'
 *         meta:
 *           type: object
 *     CancelledOrder:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         table:
 *           type: object
 *         totalAmount:
 *           type: number
 *         paymentMode:
 *           type: string
 *         status:
 *           type: string
 *         guests:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *     MiscellaneousRecord:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         miscellaneousReason:
 *           type: string
 *         costOrPrice:
 *           type: number
 *         reason:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

// ========== SALES ENDPOINTS ==========

/**
 * @openapi
 * /reports/sales/daily:
 *   get:
 *     tags:
 *       - Reports
 *     summary: Daily sales report (metrics + paginated orders)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: YYYY-MM-DD (default today)
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
 *         description: Daily sales report
 *       400:
 *         description: Invalid date
 *       404:
 *         description: No completed orders
 */
router.get(
  "/sales/daily",
  authorize("SUPER_ADMIN", "ADMIN"),
  reportsController.dailySalesReport
);

/**
 * @openapi
 * /reports/sales/cancelled:
 *   get:
 *     tags:
 *       - Reports
 *     summary: Paginated list of cancelled orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Cancelled orders list
 */
router.get(
  "/sales/cancelled",
  authorize("SUPER_ADMIN", "ADMIN"),
  reportsController.getCancelledOrders
);

/**
 * @openapi
 * /reports/sales/revenue-insights:
 *   post:
 *     tags:
 *       - Reports
 *     summary: Revenue insights for a date range (daily/monthly grouping)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startDate, endDate]
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               timePeriod:
 *                 type: string
 *                 enum: [daily, monthly]
 *                 default: daily
 *     responses:
 *       200:
 *         description: Revenue insights with miscellaneous costs
 */
router.post(
  "/sales/revenue-insights",
  authorize("SUPER_ADMIN", "ADMIN"),
  reportsController.getRevenueInsights
);

// ========== MISCELLANEOUS ENDPOINTS ==========

/**
 * @openapi
 * /reports/miscellaneous:
 *   get:
 *     tags:
 *       - Reports
 *     summary: Get miscellaneous records for a day (paginated, with metrics)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: YYYY-MM-DD (default today)
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
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search in reason or miscellaneousReason
 *     responses:
 *       200:
 *         description: Paginated miscellaneous records + metrics
 */
router.get(
  "/miscellaneous",
  authorize("SUPER_ADMIN", "ADMIN"),
  reportsController.getMiscellaneousForDay
);

/**
 * @openapi
 * /reports/miscellaneous:
 *   post:
 *     tags:
 *       - Reports
 *     summary: Create a new miscellaneous record
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [miscellaneousReason, costOrPrice]
 *             properties:
 *               miscellaneousReason:
 *                 type: string
 *               costOrPrice:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Record created
 */
router.post(
  "/miscellaneous",
  authorize("SUPER_ADMIN", "ADMIN"),
  reportsController.createMiscellaneous
);

/**
 * @openapi
 * /reports/miscellaneous/{id}:
 *   patch:
 *     tags:
 *       - Reports
 *     summary: Partially update a miscellaneous record
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               miscellaneousReason:
 *                 type: string
 *               costOrPrice:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Record updated
 */
router.patch(
  "/miscellaneous/:id",
  authorize("SUPER_ADMIN", "ADMIN"),
  reportsController.updateMiscellaneous
);

/**
 * @openapi
 * /reports/miscellaneous/{id}:
 *   delete:
 *     tags:
 *       - Reports
 *     summary: Delete a miscellaneous record
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
 *         description: Record deleted
 */
router.delete(
  "/miscellaneous/:id",
  authorize("SUPER_ADMIN", "ADMIN"),
  reportsController.deleteMiscellaneous
);

export default router;