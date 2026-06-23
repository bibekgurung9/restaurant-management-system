import * as express from "express";
import multer from "multer";
import * as comboController from "./combo.controller";
import authorize from "../../../middleware/authorize";

const router = express.Router();
const upload = multer();

/**
 * @openapi
 * components:
 *   schemas:
 *     ComboItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: integer
 *         quantity:
 *           type: integer
 *         name:
 *           type: string
 *         image:
 *           type: string
 *     Combo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         price:
 *           type: number
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ComboItem'
 *         image:
 *           type: string
 *         description:
 *           type: string
 *         expirable:
 *           type: boolean
 *         dateFrom:
 *           type: string
 *           format: date-time
 *         dateTo:
 *           type: string
 *           format: date-time
 *         status:
 *           type: boolean
 *         availability:
 *           type: string
 *           enum: [Available, Unavailable]
 *     ComboListResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Combo'
 *         meta:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             totalCombos:
 *               type: integer
 *             totalPages:
 *               type: integer
 */

/**
 * @openapi
 * /combo:
 *   get:
 *     tags:
 *       - Combo
 *     summary: Get combos (paginated) or a single combo by comboId
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page (default 10)
 *       - in: query
 *         name: comboId
 *         schema:
 *           type: integer
 *         description: Get a single combo by ID
 *       - in: query
 *         name: all
 *         schema:
 *           type: boolean
 *         description: If true, return all combos without pagination
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Combo not found (if comboId provided)
 *       500:
 *         description: Server error
 */
router.get("/", comboController.comboList);

/**
 * @openapi
 * /combo/search:
 *   get:
 *     tags:
 *       - Combo
 *     summary: Search combos by name
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
router.get("/search", comboController.searchCombo);

/**
 * @openapi
 * /combo:
 *   post:
 *     tags:
 *       - Combo
 *     summary: Create a new combo (Admin/Super Admin only)
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
 *               - items
 *               - expirable
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               items:
 *                 type: string
 *                 description: JSON stringified array of { productId, quantity }
 *               description:
 *                 type: string
 *               expirable:
 *                 type: boolean
 *               dateFrom:
 *                 type: string
 *                 format: date
 *               dateTo:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Combo created
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Combo name already exists
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  upload.single("image"),
  authorize("SUPER_ADMIN", "ADMIN"),
  comboController.addCombo
);

/**
 * @openapi
 * /combo/{id}:
 *   patch:
 *     tags:
 *       - Combo
 *     summary: Partially update a combo (Admin/Super Admin only)
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
 *               items:
 *                 type: string
 *               description:
 *                 type: string
 *               expirable:
 *                 type: boolean
 *               dateFrom:
 *                 type: string
 *                 format: date
 *               dateTo:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Combo updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Combo not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/:id",
  upload.single("image"),
  authorize("SUPER_ADMIN", "ADMIN"),
  comboController.updateCombo
);

/**
 * @openapi
 * /combo/{id}:
 *   delete:
 *     tags:
 *       - Combo
 *     summary: Delete a combo (Super Admin only)
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
 *         description: Combo deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (requires SUPER_ADMIN)
 *       404:
 *         description: Combo not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/:id",
  authorize("SUPER_ADMIN", "ADMIN"),
  comboController.destroyCombo
);

export default router;