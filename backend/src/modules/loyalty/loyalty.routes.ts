import * as express from "express";
import * as loyaltyController from "./loyalty.controller";
import authorize from "../../middleware/authorize";

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     LoyaltyProgram:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         discount:
 *           type: integer
 *         totalOrdersRequired:
 *           type: integer
 *         totalAmountSpent:
 *           type: number
 *         description:
 *           type: string
 *         validFrom:
 *           type: string
 *           format: date-time
 *         validTo:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [available, not available]
 *     LoyaltyListResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LoyaltyProgram'
 *         meta:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             totalLoyaltyPrograms:
 *               type: integer
 *             totalPages:
 *               type: integer
 */

/**
 * @openapi
 * /loyalty-programs:
 *   get:
 *     tags:
 *       - Loyalty
 *     summary: Get paginated list of loyalty programs (sorted by availability)
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
 *         description: List of loyalty programs
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  authorize("SUPER_ADMIN", "ADMIN"),
  loyaltyController.loyaltyProgramList
);

/**
 * @openapi
 * /loyalty-programs:
 *   post:
 *     tags:
 *       - Loyalty
 *     summary: Create a new loyalty program
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
 *               - discount
 *               - totalOrdersRequired
 *               - totalAmountSpent
 *               - validFrom
 *               - validTo
 *             properties:
 *               name:
 *                 type: string
 *               discount:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               totalOrdersRequired:
 *                 type: integer
 *               totalAmountSpent:
 *                 type: number
 *               description:
 *                 type: string
 *               validFrom:
 *                 type: string
 *                 format: date
 *               validTo:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Loyalty program created
 *       400:
 *         description: Validation error or duplicate criteria
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  authorize("SUPER_ADMIN", "ADMIN"),
  loyaltyController.addLoyaltyProgram
);

/**
 * @openapi
 * /loyalty-programs/{id}:
 *   patch:
 *     tags:
 *       - Loyalty
 *     summary: Partially update a loyalty program
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
 *               discount:
 *                 type: integer
 *               totalOrdersRequired:
 *                 type: integer
 *               totalAmountSpent:
 *                 type: number
 *               description:
 *                 type: string
 *               validFrom:
 *                 type: string
 *                 format: date
 *               validTo:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Program updated
 *       400:
 *         description: Invalid data or duplicate criteria
 *       404:
 *         description: Program not found
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/:id",
  authorize("SUPER_ADMIN", "ADMIN"),
  loyaltyController.updateLoyaltyProgram
);

/**
 * @openapi
 * /loyalty-programs/{id}:
 *   delete:
 *     tags:
 *       - Loyalty
 *     summary: Delete a loyalty program
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
 *         description: Program deleted
 *       404:
 *         description: Program not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/:id",
  authorize("SUPER_ADMIN", "ADMIN"),
  loyaltyController.deleteLoyaltyProgram
);

/**
 * @openapi
 * /loyalty-programs/check-eligibility:
 *   post:
 *     tags:
 *       - Loyalty
 *     summary: Check which loyalty programs a customer is eligible for
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *             properties:
 *               customerId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Eligibility results
 *       404:
 *         description: Customer not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/check-eligibility",
  authorize("SUPER_ADMIN", "ADMIN", "STAFF"),
  loyaltyController.checkLoyaltyEligibility
);

export default router;