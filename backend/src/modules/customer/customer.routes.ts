import * as express from "express";
import * as customerController from "./customer.controller";
import authorize from "../../middleware/authorize";

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     OrderSummary:
 *       type: object
 *       properties:
 *         orderId:
 *           type: integer
 *         totalAmount:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *         date:
 *           type: string
 *           format: date-time
 *     PaymentSummary:
 *       type: object
 *       properties:
 *         paymentId:
 *           type: integer
 *         amount:
 *           type: number
 *         method:
 *           type: string
 *         status:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         discount:
 *           type: number
 *         vat:
 *           type: number
 *         serviceCharge:
 *           type: number
 *         tip:
 *           type: number
 *     Customer:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         availableCredit:
 *           type: number
 *         currentCredit:
 *           type: number
 *         totalOrders:
 *           type: integer
 *         totalOrderAmount:
 *           type: number
 *         totalLifetimeSpend:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         orderHistory:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderSummary'
 *         paymentHistory:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PaymentSummary'
 *     CustomerListItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         availableCredit:
 *           type: number
 *         currentCredit:
 *           type: number
 *         totalOrders:
 *           type: integer
 *         totalOrderAmount:
 *           type: number
 *     CustomerListResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CustomerListItem'
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
 *     CustomerDetailResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/Customer'
 */

/**
 * @openapi
 * /customers:
 *   get:
 *     tags:
 *       - Customer
 *     summary: Get customers (paginated list) or full details by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (only when listing)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page (only when listing)
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         description: Customer ID – if provided, returns full details including order and payment history
 *     responses:
 *       200:
 *         description: Success – either paginated list or single customer with history
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/CustomerListResponse'
 *                 - $ref: '#/components/schemas/CustomerDetailResponse'
 *       400:
 *         description: Invalid customer ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.get("/", authorize("SUPER_ADMIN", "ADMIN"), customerController.getCustomers);

/**
 * @openapi
 * /customers/search:
 *   get:
 *     tags:
 *       - Customer
 *     summary: Find customer by phone number
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer phone number
 *     responses:
 *       200:
 *         description: Customer found
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
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: Phone number missing
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.get("/search", authorize("SUPER_ADMIN", "ADMIN"), customerController.getCustomerByPhone);

/**
 * @openapi
 * /customers:
 *   post:
 *     tags:
 *       - Customer
 *     summary: Create a new customer
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 example: +977 9876543210
 *               email:
 *                 type: string
 *                 example: john@example.com
 *     responses:
 *       201:
 *         description: Customer created
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
 *                   $ref: '#/components/schemas/CustomerListItem'
 *       400:
 *         description: Missing fields or duplicate phone/email
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/", authorize("SUPER_ADMIN", "ADMIN"), customerController.createCustomer);

/**
 * @openapi
 * /customers/{id}:
 *   patch:
 *     tags:
 *       - Customer
 *     summary: Partially update a customer
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
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               availableCredit:
 *                 type: number
 *                 description: New credit limit (must be > currentCredit)
 *     responses:
 *       200:
 *         description: Customer updated
 *       400:
 *         description: Invalid input or duplicate phone/email
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.patch("/:id", authorize("SUPER_ADMIN", "ADMIN"), customerController.updateCustomer);

/**
 * @openapi
 * /customers/{id}:
 *   delete:
 *     tags:
 *       - Customer
 *     summary: Delete a customer
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
 *         description: Customer deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (requires SUPER_ADMIN)
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", authorize("SUPER_ADMIN", "ADMIN"), customerController.deleteCustomer);

export default router;