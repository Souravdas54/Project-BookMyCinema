import express from 'express';
const movieRouter = express.Router();

import { protect, refreshTokenProtect, authorizeRoles } from '../middleware/user.middleaware';
import { movieControllers } from '../controllers/movie.controller';

import { CreateuploadFolder } from '../middleware/upload.middleware';
const upload = CreateuploadFolder('movies') // Create Folder name

/**
 * @swagger
 * components:
 *   schemas:
 *     Movie:
 *       type: object
 *       required:
 *         - moviename
 *         - genre
 *         - language
 *         - duration
 *         - cast
 *         - director
 *         - releaseDate
 *         - description
 *         - poster
 *         - rating
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         moviename:
 *           type: string
 *         genre:
 *           type: string
 *         language:
 *           type: string
 *         duration:
 *           type: string
 *         cast:
 *           type: array
 *           items:
 *             type: string
 *         director:
 *           type: array
 *           items:
 *             type: string
 *         releaseDate:
 *           type: string
 *         description:
 *           type: string
 *         poster:
 *           type: string
 *         rating:
 *           type: number
 *         ratingScale:
 *           type: number
 *         votes:
 *           type: number
 *         likes:
 *           type: number
 *         promoted:
 *           type: boolean
 */


/**
 * @swagger
 * /movies/create:
 *   post:
 *     summary: Create a new movie
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               moviename:
 *                 type: string
 *               genre:
 *                 type: string
 *               language:
 *                 type: string
 *               duration:
 *                 type: string
 *               cast:
 *                 type: array
 *                 items:
 *                   type: string
 *               director:
 *                 type: array
 *                 items:
 *                   type: string
 *               releaseDate:
 *                 type: string
 *               description:
 *                 type: string
 *               poster:
 *                 type: string
 *                 format: binary
 *               rating:
 *                 type: number
 *     responses:
 *       201:
 *         description: Movie created successfully
 */
movieRouter.post('/create', protect, authorizeRoles('admin'), upload.single('poster'), movieControllers.movieCreate);


/**
 * @swagger
 * /movies/get/all-movies:
 *   get:
 *     summary: Get all movies
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: All movies fetched
 */
movieRouter.get('/get/all-movies', movieControllers.getAllovies)


/**
 * @swagger
 * /movies/{id}:
 *   get:
 *     summary: Get movie by ID
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Movie details fetched
 */
movieRouter.get('/:id', protect, authorizeRoles('admin', 'user'), movieControllers.getMovieById)

/**
 * @swagger
 * /movies/movie/{id}/promote:
 *   patch:
 *     summary: Promote a movie
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Movie promoted successfully
 */
movieRouter.patch('/movie/:id/promote', protect, authorizeRoles('admin','user'), movieControllers.promoteMovie)


/**
 * @swagger
 * /movies/movie/{id}/simulate:
 *   post:
 *     summary: Simulate movie rating
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rating simulation completed
 */
movieRouter.post("/movie/:id/simulate",protect, authorizeRoles('admin','user'), movieControllers.simulateRating);

/**
 * @swagger
 * /movies/movie/{id}/react:
 *   patch:
 *     summary: Like/React on movie
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reaction updated
 */
movieRouter.patch('/movie/:id/react', protect, movieControllers.reactMovie);

export { movieRouter }