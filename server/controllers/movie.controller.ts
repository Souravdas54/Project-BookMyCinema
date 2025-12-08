import { Request, Response } from "express";
import { movieRepositories } from "../repository/movie.repo";
import { Types } from "mongoose";

class AllMoviesControllers {

    async movieCreate(req: Request, res: Response): Promise<any> {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            if (!userId) {
                console.log("Error: No file uploaded");
                req.flash('error_msg', 'Poster image is required');
                return res.redirect('/admin/cinemas/create_cinema');

            }

            if (!userRole) {

                req.flash('error_msg', 'Unauthorized: Role missing');
                return res.redirect('/admin/cinemas/create_cinema')
            }

            // Poster upload → multer 
            const poster = req.file ? req.file.path : null;

            if (!req.file) {
                console.log("Error: No file uploaded");
                req.flash('error_msg', 'Poster image is required');
                return res.redirect('/admin/cinemas/create_cinema');
            }

            // const genre = req.body.genre.split(",").map((name: string) => name.trim()).filter((name: string) => name !== "");

            const cast = req.body.cast.split(",").map((name: string) => name.trim()).filter((name: string) => name !== "");

            const director = req.body.director.split(",").map((name: string) => name.trim()).filter((name: string) => name !== "");

            const movieData = {
                moviename: req.body.moviename,
                genre: req.body.genre,
                language: req.body.language,
                duration: req.body.duration,
                cast: cast,
                director: director,
                releaseDate: req.body.releaseDate,
                description: req.body.description,
                poster,
                rating: Number(req.body.rating),
                votes: Number(req.body.votes) || 0,
                likes: Number(req.body.likes) || 0,
                promoted: req.body.promoted === "true" ? true : false
            };

            await movieRepositories.create(movieData, userId, userRole);

            // Success flash message
            req.flash('success_msg', `Movie created successfully!`);


            return res.redirect('/admin/cinemas/create-cinema')


        } catch (error: any) {
            console.log("Controller Error - movieCreate:", error);

            const errorMessage = error.message || 'Failed to create movie. Please try again.';
            req.flash('error_msg', errorMessage);
            return res.redirect('/admin/cinemas/create-cinema');
        }
    }

    async getAllovies(req: Request, res: Response): Promise<any> {
        try {
            const getAllMovies = await movieRepositories.find();

            if (getAllMovies && getAllMovies.length > 0) {
                return res.status(200).json({
                    success: true,
                    message: "Get All Movies successfully",
                    total: getAllMovies.length,
                    data: getAllMovies,
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: "No users found",
                    data: []
                });
            }
        } catch (error: unknown) {
            console.log("Controller Error - get all movie:", error);

            // Proper error handling for unknown type
            let errorMessage = "Something went wrong";
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            return res.status(400).json({
                success: false,
                message: errorMessage
            });
        }
    }

    async getMovieById(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: "Movie ID is required"
                });
            }

            // ObjectId 
            if (!Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Movie ID format"
                });
            }

            const movie = await movieRepositories.findById(id);

            if (!movie) {
                return res.status(404).json({
                    success: false,
                    message: "Movie not found"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Movie retrieved successfully",
                data: movie
            });
        } catch (error: unknown) {
            console.log("Controller Error - get movie by id:", error);

            let errorMessage = "Something went wrong";
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            return res.status(400).json({
                success: false,
                message: errorMessage
            });
        }
    }

    async updateMovie(req: Request, res: Response) {
        try {
            const movieId = req.params.id;
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: User ID missing"
                });
            }

            if (!userRole) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: Role missing"
                });
            }

            const result = await movieRepositories.updateMovie(
                movieId,
                req.body,
                userId,
                userRole
            );

            res.status(200).json({
                success: true,
                message: "Movie updated successfully",
                data: result
            });

        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }


    async deleteMovie(req: Request, res: Response) {
        try {
            const movieId = req.params.id;
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: User ID missing"
                });
            }

            if (!userRole) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: Role missing"
                });
            }

            const result = await movieRepositories.deleteMovie(
                movieId,
                userId,
                userRole
            );

            res.status(200).json({
                success: true,
                message: "Movie deleted successfully",
                data: result
            });

        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async promoteMovie(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { promoted } = req.body; // true or false
            const userRole = req.user?.role;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: "Movie ID is required"
                });
            }

            if (!Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Movie ID format"
                });
            }

            if (!userRole) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: Role missing"
                });
            }

            if (typeof promoted !== "boolean") {
                return res.status(400).json({
                    success: false,
                    message: "promoted must be true or false"
                });
            }

            const updatedMovie = await movieRepositories.togglePromoteMovie(
                id,
                userRole,
                promoted
            );

            return res.status(200).json({
                success: true,
                message: promoted ? "Movie Promoted successfully" : "Movie Unpromoted successfully",
                data: updatedMovie
            });

        } catch (error: any) {
            console.log("Controller Error - Promote Movie:", error);

            return res.status(500).json({
                success: false,
                message: error.message || "Something went wrong"
            });
        }
    }


    async reactMovie(req: Request, res: Response) {
        try {
            const movieId = req.params.id;

            const result = await movieRepositories.reactMovie(movieId, req.body);

            res.status(200).json({
                success: true,
                message: "Reaction updated",
                data: result
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async simulateRating(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { futureVotes, userRating } = req.body;

            const result = await movieRepositories.simulateRating(
                id,
                futureVotes,
                userRating
            );

            res.status(200).json({
                success: true,
                message: "Simulation success",
                predictedRating: result
            });

        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }



}

export const movieControllers = new AllMoviesControllers()