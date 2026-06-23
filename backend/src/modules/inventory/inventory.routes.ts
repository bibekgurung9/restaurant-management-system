import * as express from "express";
import * as inventoryController from "./inventory.controller";
import authorize from "../../middleware/authorize";

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     InventoryItem:
 *       type: object
 *       properties:
 *         itemId:
 *           type: integer
 *         itemName:
 *           type: string
 *         quantity:
 *           type: integer
 *         threshold:
 *           type: integer
 *         unit:
 *           type: string
 *         image:
 *           type: string
 *         status:
 *           type: string
 *           enum: [in_stock, low, none]
 *     InventoryAdjustment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         itemId:
 *           type: integer
 *         quantity:
 *           type: integer
 *         type:
 *           type: string
 *           enum: [add, remove, set]
 *         note:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *     InventoryListResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/InventoryItem'
 *         meta:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             totalProducts:
 *               type: integer
 *             totalPages:
 *               type: integer
 */

/**
 * @openapi
 * /inventory:
 *   get:
 *     tags:
 *       - Inventory
 *     summary: Get all inventory items (paginated) with stock status
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
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by item name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [in_stock, low, none]
 *         description: Filter by stock status
 *     responses:
 *       200:
 *         description: Inventory list retrieved
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/",
  authorize("SUPER_ADMIN", "ADMIN"),
  inventoryController.getInventoryList
);

/**
 * @openapi
 * /inventory/low-stock:
 *   get:
 *     tags:
 *       - Inventory
 *     summary: Get items with low stock (paginated)
 *     description: Returns limited items with quantity below threshold
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
 *         description: Low stock items retrieved
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/low-stock",
  authorize("SUPER_ADMIN", "ADMIN"),
  inventoryController.getLowStockItems
);

/**
 * @openapi
 * /inventory/{itemId}:
 *   get:
 *     tags:
 *       - Inventory
 *     summary: Get inventory details for a specific item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inventory details retrieved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product or inventory not found
 */
router.get(
  "/:itemId",
  authorize("SUPER_ADMIN", "ADMIN"),
  inventoryController.getInventoryByItem
);

/**
 * @openapi
 * /inventory/{itemId}/adjust:
 *   patch:
 *     tags:
 *       - Inventory
 *     summary: Adjust inventory quantity (add, remove, or set)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
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
 *               - type
 *               - quantity
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [add, remove, set]
 *               quantity:
 *                 type: integer
 *               note:
 *                 type: string
 *               threshold:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Inventory adjusted successfully
 *       400:
 *         description: Invalid adjustment parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/:itemId/adjust",
  authorize("SUPER_ADMIN", "ADMIN"),
  inventoryController.adjustInventory
);

/**
 * @openapi
 * /inventory/{itemId}:
 *   patch:
 *     tags:
 *       - Inventory
 *     summary: Update inventory threshold
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
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
 *               - threshold
 *             properties:
 *               threshold:
 *                 type: integer
 *                 description: New low stock threshold
 *     responses:
 *       200:
 *         description: Threshold updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/:itemId",
  authorize("SUPER_ADMIN", "ADMIN"),
  inventoryController.updateThreshold
);

/**
 * @openapi
 * /inventory/adjustments:
 *   get:
 *     tags:
 *       - Inventory
 *     summary: Get inventory adjustment history (paginated)
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
 *           default: 20
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: integer
 *         description: Filter by item ID
 *     responses:
 *       200:
 *         description: Adjustment history retrieved
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/adjustments/history",
  authorize("SUPER_ADMIN", "ADMIN"),
  inventoryController.getAdjustmentHistory
);

export default router;