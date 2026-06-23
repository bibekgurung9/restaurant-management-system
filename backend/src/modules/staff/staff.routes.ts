import * as express from "express";
import * as staffController from "./staff.controller";
import authorize from "../../middleware/authorize";

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     StaffMember:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         image:
 *           type: string
 *         role:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, STAFF, CASHIER]
 *         verified:
 *           type: boolean
 *         phone_verified:
 *           type: boolean
 *         email_verified:
 *           type: boolean
 *         last_active_at:
 *           type: string
 *           format: date-time
 *         type:
 *           type: string
 *         remarks:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     StaffListResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/StaffMember'
 *         meta:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             totalStaff:
 *               type: integer
 *             totalPages:
 *               type: integer
 */

/**
 * @openapi
 * /staff:
 *   get:
 *     tags:
 *       - Staff Management
 *     summary: Get all staff members (paginated) - Super Admin & Admin only
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
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, STAFF, CASHIER]
 *         description: Filter by role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: Staff list retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Insufficient role)
 */
router.get(
  "/",
  authorize("SUPER_ADMIN", "ADMIN"),
  staffController.getStaffList
);

/**
 * @openapi
 * /staff/me:
 *   get:
 *     tags:
 *       - Staff Management
 *     summary: Get current logged-in staff profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/me",
  authorize("SUPER_ADMIN", "ADMIN", "STAFF", "CASHIER"),
  staffController.getMyProfile
);

/**
 * @openapi
 * /staff:
 *   post:
 *     tags:
 *       - Staff Management
 *     summary: Create a new staff member - Super Admin only
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
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, STAFF, CASHIER]
 *               type:
 *                 type: string
 *               remarks:
 *                 type: string
 *     responses:
 *       201:
 *         description: Staff member created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Super Admin only)
 *       409:
 *         description: Email already exists
 */
router.post(
  "/",
  authorize("SUPER_ADMIN"),
  staffController.createStaff
);

/**
 * @openapi
 * /staff/{id}:
 *   patch:
 *     tags:
 *       - Staff Management
 *     summary: Update a staff member - Super Admin & Admin (limited)
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
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, STAFF, CASHIER]
 *               type:
 *                 type: string
 *               remarks:
 *                 type: string
 *               verified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Staff member updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Staff member not found
 */
router.patch(
  "/:id",
  authorize("SUPER_ADMIN", "ADMIN"),
  staffController.updateStaff
);

/**
 * @openapi
 * /staff/{id}:
 *   delete:
 *     tags:
 *       - Staff Management
 *     summary: Delete a staff member - Super Admin only
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
 *         description: Staff member deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Super Admin only)
 *       404:
 *         description: Staff member not found
 */
router.delete(
  "/:id",
  authorize("SUPER_ADMIN"),
  staffController.deleteStaff
);

export default router;