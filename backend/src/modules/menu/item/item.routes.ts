import * as express from "express";
import multer from "multer";
import * as itemController from "./item.controller";
import authorize from "../../../middleware/authorize";

const router = express.Router();
const upload = multer();

/**
 * @openapi
 * components:
 *   schemas:
 *     Item:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         price:
 *           type: number
 *         image:
 *           type: string
 *         categoryId:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *         isLimited:
 *           type: boolean
 *         unit:
 *           type: string
 *         inventory:
 *           type: object
 *           properties:
 *             quantity:
 *               type: integer
 *             threshold:
 *               type: integer
 *     ItemListResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Item'
 *         meta:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             totalItems:
 *               type: integer
 *             totalPages:
 *               type: integer
 */

/**
 * @openapi
 * /product:
 *   get:
 *     tags:
 *       - Item
 *     summary: Get products (paginated) or a single product by productId
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: productId
 *         schema:
 *           type: integer
 *         description: Get a single product by ID
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Item not found (if productId provided)
 *       500:
 *         description: Server error
 */
router.get("/", itemController.itemList);
 
/**
 * @openapi
 * /product/search:
 *   get:
 *     tags:
 *       - Item
 *     summary: Search products by name
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Keyword missing
 *       401:
 *         description: Unauthorized
 */
router.get("/search", itemController.searchItem);

/**
 * @openapi
 * /product:
 *   post:
 *     tags:
 *       - Item
 *     summary: Create a new product (Admin/Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               categoryId:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               image:
 *                 type: string
 *                 format: binary
 *               isLimited:
 *                 type: boolean
 *                 description: Whether inventory tracking is enabled
 *               quantity:
 *                 type: integer
 *                 description: Initial stock quantity (required if isLimited=true)
 *               threshold:
 *                 type: integer
 *                 description: Low stock threshold (default 10)
 *               unit:
 *                 type: string
 *                 description: Unit of measurement (e.g., kg, piece)
 *     responses:
 *       201:
 *         description: Item created
 *       400:
 *         description: Invalid data (e.g., quantity missing when isLimited)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  upload.single("image"),
  authorize("SUPER_ADMIN", "ADMIN"),
  itemController.addItem
);

/**
 * @openapi
 * /product/{id}:
 *   patch:
 *     tags:
 *       - Item
 *     summary: Partially update a product (Admin/Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               categoryId:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               image:
 *                 type: string
 *                 format: binary
 *               isLimited:
 *                 type: boolean
 *               quantity:
 *                 type: integer
 *               threshold:
 *                 type: integer
 *               unit:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Item not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/:id",
  upload.single("image"),
  authorize("SUPER_ADMIN", "ADMIN"),
  itemController.updateItem
);

/**
 * @openapi
 * /product/{id}:
 *   delete:
 *     tags:
 *       - Item
 *     summary: Delete a product (Super Admin only)
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
 *         description: Item deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (requires SUPER_ADMIN)
 *       404:
 *         description: Item not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/:id",
  authorize("SUPER_ADMIN", "ADMIN"),
  itemController.deleteItem
);

/**
 * @openapi
 * /product/low-stock:
 *   get:
 *     tags:
 *       - Item
 *     summary: Get products with low stock (quantity < threshold) – paginated
 *     description: Returns products that have `isLimited = true` and current quantity below threshold. Stock status is included.
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
 *     responses:
 *       200:
 *         description: Low stock products retrieved
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       unit:
 *                         type: string
 *                       image:
 *                         type: string
 *                       inventory:
 *                         type: object
 *                         properties:
 *                           quantity:
 *                             type: integer
 *                           threshold:
 *                             type: integer
 *                       status:
 *                         type: string
 *                         enum: [low, none]
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     lowStocks:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/low-stock", itemController.getLowStockItems);

export default router;