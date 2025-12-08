import express from 'express';
import { protect, refreshTokenProtect, authorizeRoles } from '../middleware/user.middleaware';
import { allTheaterController } from "../controllers/theater.controller"

const theaterRouter = express.Router();


/**
 * @swagger
 * tags:
 *   name: Theater
 *   description: Theater management APIs
 */

/**
 * @swagger
 * /theaters/create:
 *   post:
 *     summary: Create a new theater
 *     tags: [Theater]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Theater'
 *     responses:
 *       201:
 *         description: Theater created successfully
 */
theaterRouter.post('/theaters/create', protect, authorizeRoles('admin'), allTheaterController.create);

/**
 * @swagger
 * /theaters/movie/{movieId}:
 *   get:
 *     summary: Get theaters by movie ID
 *     tags: [Theater]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of theaters showing the movie
 */
theaterRouter.get("/movie/:movieId", protect, authorizeRoles("user", "admin"), allTheaterController.getTheatersByMovie);

/**
 * @swagger
 * /theaters/assigned-movie/{theaterId}:
 *   get:
 *     summary: Get assigned movies of a theater
 *     tags: [Theater]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: theaterId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Movies assigned to the theater
 */
theaterRouter.get("/assigned-movie/:theaterId",protect, authorizeRoles('admin'), allTheaterController.getAssignedMoviesbyTheater);

/**
 * @swagger
 * /theaters/update/{id}:
 *   put:
 *     summary: Update theater details
 *     tags: [Theater]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Theater'
 *     responses:
 *       200:
 *         description: Theater updated successfully
 */
theaterRouter.put("/update/:id", protect, authorizeRoles("admin"), allTheaterController.update);

/**
 * @swagger
 * /theaters/delete/{id}:
 *   delete:
 *     summary: Delete a theater
 *     tags: [Theater]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: Theater deleted successfully
 */
theaterRouter.delete("/delete/:id", protect, authorizeRoles("admin"), allTheaterController.delete);

/**
 * @swagger
 * /theaters/search/theaters-by-state:
 *   get:
 *     summary: Get theaters by state
 *     tags: [Theater]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of theaters by state
 */
theaterRouter.get("/search/theaters-by-state", protect, authorizeRoles("user"), allTheaterController.getTheatersByState);
/**
 * @swagger
 * /theaters/search/theaters-by-district:
 *   get:
 *     summary: Get theaters by district
 *     tags: [Theater]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of theaters by district
 */
theaterRouter.get("/search/theaters-by-district", protect, authorizeRoles("user"), allTheaterController.getByDistrict);



export { theaterRouter }