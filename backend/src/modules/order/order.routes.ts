import * as express from "express";
import * as orderController from "./order.controller";
import authorize from "../../middleware/authorize";

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     OrderItem:
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
 *         price:
 *           type: number
 *         totalPrice:
 *           type: number
 *         unit:
 *           type: string
 *         productName:
 *           type: string
 *         comboName:
 *           type: string
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         tableId:
 *           type: integer
 *         tableName:
 *           type: string
 *         totalAmount:
 *           type: number
 *         paymentMode:
 *           type: string
 *         guests:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *         cancelReason:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *     OrderListResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               tableName:
 *                 type: string
 *               totalAmount:
 *                 type: number
 *               paymentMode:
 *                 type: string
 *               guests:
 *                 type: integer
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
 * /order:
 *   get:
 *     tags:
 *       - Order
 *     summary: Get pending orders (paginated) or filter by status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *         description: Filter by order status (default pending)
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/", orderController.pendingOrderList);

/**
 * @openapi
 * /order/{id}:
 *   get:
 *     tags:
 *       - Order
 *     summary: Get full details of a single order
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
 *         description: Order details
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", orderController.orderDetails);

/**
 * @openapi
 * /order:
 *   post:
 *     tags:
 *       - Order
 *     summary: Create a new order (Admin/Staff)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tableId
 *               - items
 *               - guestCount
 *             properties:
 *               tableId:
 *                 type: integer
 *               guestCount:
 *                 type: integer
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     comboId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Order created
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Table not found
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  authorize("SUPER_ADMIN", "ADMIN", "STAFF"),
  orderController.orderCreate
);

/**
 * @openapi
 * /order/{id}:
 *   patch:
 *     tags:
 *       - Order
 *     summary: Update order (items, table, guests, or cancel)
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
 *               tableId:
 *                 type: integer
 *               guests:
 *                 type: integer
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     productId:
 *                       type: integer
 *                     comboId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     unit:
 *                       type: string
 *               cancelOrder:
 *                 type: boolean
 *               cancelReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order or table not found
 */
router.patch(
  "/:id",
  authorize("SUPER_ADMIN", "ADMIN", "STAFF"),
  orderController.orderUpdate
);

/**
 * @openapi
 * /order/{id}:
 *   delete:
 *     tags:
 *       - Order
 *     summary: Delete an order (hard delete, restores inventory)
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
 *         description: Order deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (requires SUPER_ADMIN)
 *       404:
 *         description: Order not found
 */
router.delete(
  "/:id",
  authorize("SUPER_ADMIN", "ADMIN"),
  orderController.deleteOrder
);

/**
 * @openapi
 * /order/{id}/transfer:
 *   post:
 *     tags:
 *       - Order
 *     summary: Transfer items from this order to another table
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
 *               - sourceTableId
 *               - targetTableId
 *               - items
 *             properties:
 *               sourceTableId:
 *                 type: integer
 *               targetTableId:
 *                 type: integer
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Transfer completed
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Source order or table not found
 */
router.post(
  "/:id/transfer",
  authorize("SUPER_ADMIN", "ADMIN", "STAFF"),
  orderController.transferOrderItems
);

export default router;