import express from 'express';
const showRouter = express.Router();

import { protect, refreshTokenProtect, authorizeRoles } from '../middleware/user.middleaware';
import { allShowController } from '../controllers/show.controller';


/**
 * @swagger
 * components:
 *   schemas:
 *     ShowRoom:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         rows:
 *           type: number
 *         columns:
 *           type: number
 * 
 *     TimeSlot:
 *       type: object
 *       properties:
 *         time:
 *           type: string
 *         availableCategories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [Golden, Platinum, Diamond, Royal]
 *               price:
 *                 type: number
 *
 *     Lock:
 *       type: object
 *       properties:
 *         seat:
 *           type: string
 *         sessionId:
 *           type: string
 *         expiresAt:
 *           type: string
 *           format: date-time
 *
 *     Show:
 *       type: object
 *       required:
 *         - movieId
 *         - theaterId
 *         - room
 *         - screenNumber
 *         - date
 *         - timeSlots
 *       properties:
 *         _id:
 *           type: string
 *         movieId:
 *           type: string
 *         theaterId:
 *           type: string
 *         room:
 *           $ref: '#/components/schemas/ShowRoom'
 *         screenNumber:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         timeSlots:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TimeSlot'
 *         totalSeats:
 *           type: number
 *         bookedSeats:
 *           type: array
 *           items:
 *             type: string
 *         locks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Lock'
 *         createdBy:
 *           type: string
 */


/**
 * @swagger
 * /shows/create:
 *   post:
 *     summary: Create a new show
 *     tags: [Shows]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Show'
 *     responses:
 *       201:
 *         description: Show created successfully
 */

showRouter.post('/create', protect, authorizeRoles('admin'), allShowController.create)

/**
 * @swagger
 * /shows/movie/{movieId}:
 *   get:
 *     summary: Get shows by movie ID
 *     tags: [Shows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: movieId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of shows for the movie
 */
showRouter.get("/movie/:movieId", protect, authorizeRoles('admin', 'user'), allShowController.getShowsByMovie)

/**
 * @swagger
 * /shows/{id}:
 *   get:
 *     summary: Get show by ID
 *     tags: [Shows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: Show details fetched
 */
showRouter.get('/:id', protect, authorizeRoles('admin', 'user'), allShowController.getShowById)


/**
 * @swagger
 * /shows/{movieId}/times:
 *   get:
 *     summary: Get show times by movie + date filter
 *     tags: [Shows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: movieId
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: Filtered show times
 */
showRouter.get('/:movieId/times', protect, authorizeRoles('admin', 'user'), allShowController.getShowTimesByDate); // Filter Show Times

/**
 * @swagger
 * /shows/theater/{theaterId}/movie/{movieId}:
 *   get:
 *     summary: Get show by theater + movie + date + time
 *     tags: [Shows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: theaterId
 *         in: path
 *         required: true
 *       - name: movieId
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: Matched show found
 */ 
showRouter.get('/theater/:theaterId/movie/:movieId', protect, authorizeRoles('admin', 'user'), allShowController.getShowByTheaterMovieDateTime);

/**
 * @swagger
 * /shows/show/{id}:
 *   put:
 *     summary: Update a show
 *     tags: [Shows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         required: true
 *         in: path
 *     responses:
 *       200:
 *         description: Show updated successfully
 */
showRouter.put('/show/:id', protect, authorizeRoles('admin'), allShowController.updateShow);


/**
 * @swagger
 * /shows/show/{id}:
 *   delete:
 *     summary: Delete a show
 *     tags: [Shows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         required: true
 *         in: path
 *     responses:
 *       200:
 *         description: Show deleted successfully
 */
showRouter.delete('/show/:id', protect, authorizeRoles('admin'), allShowController.deleteShow);

/**
 * @swagger
 * /shows/release-expired-locks:
 *   delete:
 *     summary: Release expired seat locks
 *     tags: [Shows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expired locks released
 */
showRouter.delete('/release-expired-locks', protect, authorizeRoles('admin'), allShowController.releaseExpiredSeatLocks);


/**
 * @swagger
 * /shows/debug/all:
 *   get:
 *     summary: Debug — get all shows (no auth)
 *     tags: [Shows]
 *     responses:
 *       200:
 *         description: All shows debug info
 */
showRouter.get('/debug/all', allShowController.debugAllShows);

export { showRouter }