import * as express from "express";
import * as tableController from "./table.controller";
import authorize from "../../middleware/authorize";

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Table:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         capacity:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [available, occupied, reserved, unavailable]
 *     TableResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         capacity:
 *           type: integer
 *         status:
 *           type: string
 *     TableListResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TableResponse'
 *         meta:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             totalTables:
 *               type: integer
 *             totalPages:
 *               type: integer
 *     SearchTableResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             page:
 *               type: integer
 *             totalPages:
 *               type: integer
 *             data:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   status:
 *                     type: string
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 */

/**
 * @openapi
 * /table:
 *   get:
 *     tags:
 *       - Table
 *     summary: Get all tables (paginated) or a single table by tableId
 *     description: |
 *       Retrieves a paginated list of tables. If `tableId` query parameter is provided, returns a single table.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, occupied, reserved, unavailable]
 *         description: Filter tables by status
 *       - in: query
 *         name: tableId
 *         schema:
 *           type: integer
 *         description: Get a single table by ID (overrides pagination)
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/TableListResponse'
 *                 - type: object
 *                   properties:
 *                     status:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                     data:
 *                       $ref: '#/components/schemas/TableResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Table not found (when tableId provided)
 *       500:
 *         description: Server error
 */
router.get("/", tableController.tableList);

/**
 * @openapi
 * /table/search:
 *   get:
 *     tags:
 *       - Table
 *     summary: Search tables by keyword
 *     description: Searches tables by name, code, or status (case-insensitive partial match).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *         description: Search keyword
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
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SearchTableResponse'
 *       400:
 *         description: Keyword not provided
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/search", tableController.searchTable);

/**
 * @openapi
 * /table:
 *   post:
 *     tags:
 *       - Table
 *     summary: Create a new table
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
 *               - code
 *               - capacity
 *             properties:
 *               name:
 *                 type: string
 *                 description: Table name
 *                 example: "Table 1"
 *               code:
 *                 type: string
 *                 description: Unique table code
 *                 example: "T01"
 *               capacity:
 *                 type: integer
 *                 description: Number of seats
 *                 example: 4
 *               status:
 *                 type: string
 *                 enum: [available, occupied, reserved, unavailable]
 *                 default: available
 *                 description: Table status
 *               hide:
 *                 type: boolean
 *                 default: false
 *                 description: Whether the table is hidden
 *     responses:
 *       201:
 *         description: Table created successfully
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
 *                   $ref: '#/components/schemas/TableResponse'
 *       400:
 *         description: Invalid data (missing name, code, or capacity)
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Table name or code already exists
 *       500:
 *         description: Server error
 */
router.post("/",
  authorize("SUPER_ADMIN", "ADMIN"),
  tableController.addTable);

/**
 * @openapi
 * /table/{id}:
 *   patch:
 *     tags:
 *       - Table
 *     summary: Partially update an existing table
 *     description: Updates only the fields provided in the request body.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Table ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New table name
 *                 example: "VIP Table"
 *               code:
 *                 type: string
 *                 description: New unique table code
 *                 example: "T99"
 *               capacity:
 *                 type: integer
 *                 description: Number of seats
 *                 example: 6
 *               status:
 *                 type: string
 *                 enum: [available, occupied, reserved, unavailable]
 *                 description: Table status
 *               hide:
 *                 type: boolean
 *                 description: Whether to hide the table
 *     responses:
 *       200:
 *         description: Table updated successfully
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
 *                   $ref: '#/components/schemas/TableResponse'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Table not found
 *       409:
 *         description: Table name or code already exists
 *       500:
 *         description: Failed to update table
 */
router.patch("/:id", authorize("SUPER_ADMIN", "ADMIN"), tableController.updateTable);

/**
 * @openapi
 * /table/{id}:
 *   delete:
 *     tags:
 *       - Table
 *     summary: Delete a table
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Table ID
 *     responses:
 *       200:
 *         description: Table deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Table not found
 *       500:
 *         description: Server error
 */
router.delete("/:id",
  authorize("SUPER_ADMIN", "ADMIN"),
  tableController.destroyTable);

export default router;