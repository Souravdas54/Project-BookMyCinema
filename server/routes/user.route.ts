import express from 'express';

const userRouter = express.Router();

import { userController } from '../controllers/user.controller';
import { protect, refreshTokenProtect, authorizeRoles } from '../middleware/user.middleaware';
import { CreateuploadFolder } from '../middleware/upload.middleware';
import { otpVerification } from '../utils/otp.verification';

const upload = CreateuploadFolder('authentication') // Create Folder name

// Public routes
/**
 * @swagger
 * /auth/signup:
 *   post:
 *     tags: [Users]
 *     summary: User Registration
 *     description: Register a new user with profile picture upload.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: "+8801712345678"
 *               gender:
 *                 type: string
 *                 example: male
 *               password:
 *                 type: string
 *                 example: "password123"
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 example: user
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Validation error or email exists
 *       500:
 *         description: Internal Server Error
 */
userRouter.post('/signup', upload.single('profilePicture'), userController.register)

/**
 * @swagger
 * /auth/signin:
 *   post:
 *     tags: [Users]
 *     summary: User Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       401:
 *         description: Invalid password
 */
userRouter.post('/signin', userController.login)
// userRouter.get('/verify-email/:token', userController.verifyEmail);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     tags: [Users]
 *     summary: Refresh Access Token
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "your-refresh-token-here"
 *     responses:
 *       200:
 *         description: Token refreshed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshResponse'
 *       401:
 *         description: Invalid refresh token
 */
userRouter.post('/refresh-token', refreshTokenProtect, userController.refreshToken);


// OTP Routes

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     tags: [Users]
 *     summary: Verify OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid OTP
 */
userRouter.post('/verify-otp',otpVerification.verify_Otp)

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     tags: [Users]
 *     summary: Resend OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP resent successfully
 */
userRouter.post('/resend-otp',otpVerification.resend_OTP)

// Protected routes

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get all user profiles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No users found
 */
userRouter.get('/profile', protect, userController.getUserprofile);

/**
 * @swagger
 * /auth/profile/user/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
userRouter.get('/profile/user/:id', protect, userController.getUserById);


/**
 * @swagger
 * /auth/profile/update/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
userRouter.put('/profile/update/:id', protect, upload.single('profilePicture'), userController.updateProfile);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Users]
 *     summary: User Logout
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
userRouter.post('/logout', protect, userController.logout);

// Admin only routes
// userRouter.get('/admin/profile', protect, authorizeRoles('admin'), userController.getUserprofile);

export { userRouter };