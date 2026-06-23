import * as express from "express";
import multer from "multer";
import * as categoryController from "./category.controller";
import authorize from "../../../middleware/authorize";

const router = express.Router();
const upload = multer();

/**
 * @openapi
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         image:
 *           type: string
 *         productCount:
 *           type: integer
 *     CategoryListResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *         meta:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             totalCategories:
 *               type: integer
 *             totalPages:
 *               type: integer
 */

/**
 * @openapi
 * /category:
 *   get:
 *     tags:
 *       - Category
 *     summary: Get categories (paginated) or a single category by categoryId
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
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Get a single category by ID
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found (if categoryId provided)
 *       500:
 *         description: Server error
 */
router.get("/", categoryController.categoryList);

/**
 * @openapi
 * /category/search:
 *   get:
 *     tags:
 *       - Category
 *     summary: Search categories by name
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
router.get("/search", categoryController.searchCategory);
 
/**
 * @openapi
 * /category:
 *   post:
 *     tags:
 *       - Category
 *     summary: Create a new category (Admin/Super Admin only)
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
 *             properties:
 *               name:
 *                 type: string
 *               hide:
 *                 type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         description: Invalid data or duplicate name
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient role)
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  upload.single("image"),
  authorize("SUPER_ADMIN", "ADMIN"),
  categoryController.addCategory
);

/**
 * @openapi
 * /category/{id}:
 *   patch:
 *     tags:
 *       - Category
 *     summary: Partially update a category (Admin/Super Admin only)
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
 *               hide:
 *                 type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Category updated
 *       400:
 *         description: Invalid input or duplicate name
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/:id",
  upload.single("image"),
  authorize("SUPER_ADMIN", "ADMIN"),
  categoryController.updateCategory
);

/**
 * @openapi
 * /category/{id}:
 *   delete:
 *     tags:
 *       - Category
 *     summary: Delete a category (Super Admin only)
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
 *         description: Category deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (requires SUPER_ADMIN)
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/:id",
  authorize("SUPER_ADMIN", "ADMIN"),
  categoryController.destroyCategory
);

export default router;