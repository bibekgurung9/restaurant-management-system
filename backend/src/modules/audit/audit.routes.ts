import * as express from "express";
import * as auditLogController from "./audit-logs.controller";
import authorize from "../../middleware/authorize";

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     AuditLog:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         userEmail:
 *           type: string
 *         userRole:
 *           type: string
 *         action:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, LOGIN, LOGOUT, LOGIN_FAILED]
 *         entity:
 *           type: string
 *           enum: [STAFF, PRODUCT, ORDER, TABLE, CATEGORY, COMBO, INVENTORY, RESERVATION, AUTH]
 *         entityId:
 *           type: integer
 *         changes:
 *           type: object
 *         ipAddress:
 *           type: string
 *         userAgent:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *     AuditLogListResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AuditLog'
 *         meta:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             total:
 *               type: integer
 *             totalPages:
 *               type: integer
 *     ActivitySummaryResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             byAction:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   action:
 *                     type: string
 *                   count:
 *                     type: integer
 *             byEntity:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   entity:
 *                     type: string
 *                   count:
 *                     type: integer
 */

/**
 * @openapi
 * /audit-logs:
 *   get:
 *     tags:
 *       - Audit Logs
 *     summary: Get audit logs with filters - Admin only
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
 *           default: 50
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, LOGIN, LOGOUT, LOGIN_FAILED]
 *         description: Filter by action type
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *           enum: [STAFF, PRODUCT, ORDER, TABLE, CATEGORY, COMBO, INVENTORY, RESERVATION, AUTH]
 *         description: Filter by entity type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Audit logs retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditLogListResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       500:
 *         description: Server error
 */
router.get("/", authorize("SUPER_ADMIN", "ADMIN"), auditLogController.getAuditLogs);

/**
 * @openapi
 * /audit-logs/recent:
 *   get:
 *     tags:
 *       - Audit Logs
 *     summary: Get recent logs (last 24 hours)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Recent logs retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/recent", authorize("SUPER_ADMIN", "ADMIN"), auditLogController.getRecentLogs);

/**
 * @openapi
 * /audit-logs/summary:
 *   get:
 *     tags:
 *       - Audit Logs
 *     summary: Get activity summary (last 7 days)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Activity summary retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ActivitySummaryResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/summary", authorize("SUPER_ADMIN", "ADMIN"), auditLogController.getActivitySummary);

export default router;