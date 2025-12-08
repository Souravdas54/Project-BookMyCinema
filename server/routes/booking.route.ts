import express from 'express';
const bookingRouter = express.Router();

import { protect, authorizeRoles } from '../middleware/user.middleaware';
import { bookingController } from '../controllers/booking.controller';
// import { showModel } from '../models/show.model';


/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         movieId:
 *           type: string
 *         theaterId:
 *           type: string
 *         showId:
 *           type: string
 *         seats:
 *           type: array
 *           items:
 *             type: string
 *         baseAmount:
 *           type: number
 *         serviceCharge:
 *           type: number
 *         totalAmount:
 *           type: number
 *         status:
 *           type: string
 *           enum: [Confirmed, Cancelled, Pending]
 *         paymentStatus:
 *           type: string
 *           enum: [Paid, Unpaid, Failed, Refunded]
 *         bookedAt:
 *           type: string
 *         qrCodeData:
 *           type: string
 */

/**
 * @swagger
 * /api/booking/lock:
 *   post:
 *     summary: Lock selected seats
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               showId:
 *                 type: string
 *               seats:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Seats locked successfully
 */
bookingRouter.post('/lock', protect, authorizeRoles('user', 'admin'), bookingController.lock)


/**
 * @swagger
 * /api/booking/confirm:
 *   post:
 *     summary: Confirm seat booking
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking confirmed
 */
bookingRouter.post('/confirm', protect, authorizeRoles('user', 'admin'), bookingController.confirm)


/**
 * @swagger
 * /api/booking/my-booking:
 *   get:
 *     summary: Get user's bookings
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user bookings
 */
bookingRouter.get('/my-booking', protect, authorizeRoles('user', 'admin'), bookingController.getUserBookings);


/**
 * @swagger
 * /api/booking/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details returned
 */
bookingRouter.get("/:id", protect, bookingController.getBookingById);

/**
 * @swagger
 * /api/booking/{id}:
 *   put:
 *     summary: Update a booking (Admin only)
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking updated successfully
 */
bookingRouter.put("/:id", protect, authorizeRoles("admin"), bookingController.updateBooking);


/**
 * @swagger
 * /api/booking/{id}:
 *   delete:
 *     summary: Delete a booking (Admin only)
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking removed
 */
bookingRouter.delete("/:id", protect, authorizeRoles("admin"), bookingController.deleteBooking);


/**
 * @swagger
 * /api/booking/release:
 *   post:
 *     summary: Release locked seats
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seats released
 */
bookingRouter.post('/release', protect, authorizeRoles('user', 'admin'), bookingController.release);


// Admin bookings route


/**
 * @swagger
 * /api/booking/admin/all:
 *   get:
 *     summary: Get all bookings (Admin only)
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all bookings
 */
bookingRouter.get('/admin/all', protect, authorizeRoles('admin'), bookingController.getAllBookingsForAdmin);

// In booking.router.ts - temporary debug route

// bookingRouter.get('/debug/locks/:showId', async (req, res) => {
//   try {
//     const { showId } = req.params;
//     const show = await showModel.findById(showId);
    
//     if (!show) {
//       return res.status(404).json({ success: false, message: "Show not found" });
//     }

//     const now = new Date();
//     const activeLocks = show.locks.filter(lock => new Date(lock.expiresAt) > now);
    
//     res.json({
//       success: true,
//       data: {
//         showId: show._id,
//         totalLocks: show.locks.length,
//         activeLocks: activeLocks.length,
//         locks: show.locks.map(lock => ({
//           seat: lock.seat,
//           sessionId: lock.sessionId,
//           expiresAt: lock.expiresAt,
//           isActive: new Date(lock.expiresAt) > now,
//           secondsRemaining: Math.max(0, Math.round((new Date(lock.expiresAt).getTime() - now.getTime()) / 1000))
//         })),
//         bookedSeats: show.bookedSeats,
//         serverTime: now.toISOString()
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
//   }
// });


export { bookingRouter }