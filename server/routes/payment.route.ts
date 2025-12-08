import express from 'express';
const paymentRouter = express.Router();

import { protect, authorizeRoles } from '../middleware/user.middleaware';
import { paymentController } from '../controllers/payment.controller';

// Regular routes (with body parser)
paymentRouter.use(express.json());

// Webhook needs to be before body parser

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       required:
 *         - bookingId
 *         - userId
 *         - amount
 *         - stripePaymentIntentId
 *       properties:
 *         _id:
 *           type: string
 *         bookingId:
 *           type: string
 *           description: Reference to the booking
 *         userId:
 *           type: string
 *           description: Reference to the user
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *           default: inr
 *         status:
 *           type: string
 *           enum: [pending, succeeded, failed, canceled]
 *         paymentMethod:
 *           type: string
 *         stripePaymentIntentId:
 *           type: string
 *         stripeCustomerId:
 *           type: string
 *         paymentDate:
 *           type: string
 *           format: date-time
 */


/**
 * @swagger
 * /payment/webhook:
 *   post:
 *     summary: Stripe webhook handler (Raw Body)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
paymentRouter.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);


/**
 * @swagger
 * /payment/create-intent:
 *   post:
 *     summary: Create a Stripe payment intent
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookingId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Payment intent created
 */
paymentRouter.post('/create-intent', protect, authorizeRoles('admin', 'user'), paymentController.createPaymentIntent);

/**
 * @swagger
 * /payment/confirm:
 *   post:
 *     summary: Confirm a Stripe payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment confirmed
 */
paymentRouter.post('/confirm', protect, authorizeRoles('admin', 'user'), paymentController.confirmPayment);

/**
 * @swagger
 * /payment/status/{paymentIntentId}:
 *   get:
 *     summary: Check the status of a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: paymentIntentId
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: Payment status returned
 */
paymentRouter.get('/status/:paymentIntentId', protect, authorizeRoles('admin', 'user'), paymentController.getPaymentStatus);

/**
 * @swagger
 * /payment/cancel/{paymentIntentId}:
 *   delete:
 *     summary: Cancel a payment intent
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: paymentIntentId
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: Payment intent canceled
 */
paymentRouter.delete('/cancel/:paymentIntentId', protect, authorizeRoles('admin', 'user'), paymentController.cancelPayment);

/**
 * @swagger
 * /payment/my-payments:
 *   get:
 *     summary: Get logged-in user's all payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user payments
 */
paymentRouter.get('/my-payments', protect, authorizeRoles('admin', 'user'), paymentController.getUserPayments);

/**
 * @swagger
 * /payment/success:
 *   post:
 *     summary: Handle payment success callback
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment success processed
 */
paymentRouter.post('/success', protect, authorizeRoles('admin', 'user'), paymentController.handlePaymentSuccess)

export { paymentRouter };