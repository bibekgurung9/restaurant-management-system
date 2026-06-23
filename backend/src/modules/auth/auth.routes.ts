import * as express from "express";
import multer from "multer";

import * as adminAuthController from "../auth/authController";
import authorize from "../../middleware/authorize";
import verifyToken from "../../middleware/verify-token";

const router = express.Router();
const upload = multer();

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Admin:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         userType:
 *           type: string
 *           example: admin
 *         role:
 *           type: string
 *         phone:
 *           type: string
 *         image:
 *           type: string
 *         phoneVerified:
 *           type: boolean
 *         emailVerified:
 *           type: boolean
 *     LoginResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             userType:
 *               type: string
 *             phone:
 *               type: string
 *             image:
 *               type: string
 *             phoneVerified:
 *               type: boolean
 *             emailVerified:
 *               type: boolean
 *             accessToken:
 *               type: string
 *             refreshToken:
 *               type: string
 *     RefreshTokenResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             accessToken:
 *               type: string
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *     UpdateInfoRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         image:
 *           type: string
 *           format: binary
 */

// Route for Admin login
/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Admin Auth
 *     summary: Admin login
 *     description: Authenticates an admin and returns access & refresh tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@admin.com.np
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */
router.post("/login", adminAuthController.login);

/**
 * @openapi
 * /auth/refresh-token:
 *   post:
 *     tags:
 *       - Admin Auth
 *     summary: Refresh access token
 *     description: Uses a valid refresh token to issue a new access token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenResponse'
 *       401:
 *         description: Missing or invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */
router.post("/refresh-token", adminAuthController.refreshToken);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags:
 *       - Admin Auth
 *     summary: Admin logout
 *     description: Invalidates the refresh token, logging out the admin.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Refresh token missing
 *       404:
 *         description: Refresh token not found
 *       500:
 *         description: Server error
 */
router.post("/logout", adminAuthController.logout);

// Routes protected by verifyToken middleware - requires a valid token
router.use(verifyToken);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags:
 *       - Admin Auth
 *     summary: Get current admin profile
 *     description: Returns the authenticated admin's information.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   $ref: '#/components/schemas/Admin'
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: Admin not found
 */
router.get("/me", adminAuthController.protectedRoute);

/**
 * @openapi
 * /auth/update-info:
 *   post:
 *     tags:
 *       - Admin Auth
 *     summary: Update admin profile information
 *     description: Updates the name and optionally the profile image for the authenticated admin. Requires SUPER_ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New name of the admin
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New profile image (jpg, jpeg, png, webp)
 *     responses:
 *       200:
 *         description: Information updated successfully
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
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     image:
 *                       type: string
 *                     phoneVerified:
 *                       type: boolean
 *                     emailVerified:
 *                       type: boolean
 *       400:
 *         description: Missing name or invalid image file
 *       401:
 *         description: Unauthorized (missing/invalid token or insufficient role)
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Failed to upload image or server error
 */
router.post(
  "/update-info",
  upload.single("image"),
  authorize("SUPER_ADMIN"),
  adminAuthController.updateInfo
);

export default router;