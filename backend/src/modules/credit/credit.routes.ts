import * as express from "express";
import * as creditController from "./credit.controller";
import authorize from "../../middleware/authorize";

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     CreditOrder:
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
 *     CreditCustomer:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         availableCredit:
 *           type: number
 *         currentCredit:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreditOrdersResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CreditOrder'
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
 *     CreditCustomersResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CreditCustomer'
 *         meta:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             totalCustomers:
 *               type: integer
 *             totalPages:
 *               type: integer
 */

/**
 * @openapi
 * /credits/orders:
 *   get:
 *     tags:
 *       - Credit
 *     summary: Get paginated list of orders with credit status
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
 *         description: Credit orders retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreditOrdersResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/orders", authorize("SUPER_ADMIN", "ADMIN"), creditController.creditOrderList);

/**
 * @openapi
 * /credits/customers:
 *   get:
 *     tags:
 *       - Credit
 *     summary: Get paginated list of customers with available credit > 0
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
 *         description: Customers with credit retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreditCustomersResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/customers", authorize("SUPER_ADMIN", "ADMIN"), creditController.getCustomersWithCredit);

/**
 * @openapi
 * /credits/customers/{id}:
 *   patch:
 *     tags:
 *       - Credit
 *     summary: Set or update credit balance for a customer
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
 *               - availableCredit
 *             properties:
 *               availableCredit:
 *                 type: number
 *                 description: New credit limit (must be >= 0)
 *     responses:
 *       200:
 *         description: Credit limit updated
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
 *                     customerId:
 *                       type: integer
 *                     availableCredit:
 *                       type: number
 *       400:
 *         description: Invalid credit amount
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.patch("/customers/:id", authorize("SUPER_ADMIN", "ADMIN"), creditController.setOrUpdateCreditBalance);

export default router;