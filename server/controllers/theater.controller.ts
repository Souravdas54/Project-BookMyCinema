import { Request, Response } from "express";
import { theaterRepositories } from "../repository/theater.repo"
import { CreateTheatersInterface } from "../interfaces/theaters.interface";
import { Types } from "mongoose";
import { movieRepositories } from "../repository/movie.repo";

class AllTheaterController {

    async create(req: Request, res: Response): Promise<any> {
        try {
            const userId = req.user?.userId;
            // const movieId = req.body.movieId;
            const userRole = req.user?.role;

            if (!userId || !userRole) {
                // Redirect with ALL form data preserved
                let redirectUrl = '/admin/cinemas/create_theater?error=' +
                    encodeURIComponent('Unauthorized: Authentication required');

                // Preserve form data
                Object.keys(req.body).forEach(key => {
                    if (req.body[key]) {
                        redirectUrl += `&${key}=${encodeURIComponent(req.body[key])}`;
                    }
                });

                return res.redirect(redirectUrl);
            }

            const theatherData: CreateTheatersInterface = {
                theatername: req.body.theatername,

                screens: req.body.screens,
                contact: req.body.contact,
                assignedMovies: req.body.assignedMovies,
                district: req.body.district,
                state: req.body.state || "West Bengal",

            }

            const theather = await theaterRepositories.create(theatherData, userId, userRole)

            if (req.accepts('html')) {
                return res.redirect('/admin/cinemas/create-theater?success=' + encodeURIComponent('Theater created successfully'));
            } else {
                return res.status(201).json({
                    success: true,
                    message: "Theater created successfully",
                    data: theather
                });
            }

            //  res.redirect('/admin/cinemas/create-theater')

            // return res.status(201).json({
            //     success: true,
            //     message: "Theater created successfully",
            //     data: theather
            // });

        } catch (error: unknown) {
            console.log("Controller Error - theatherCreate:", error);

            // Proper error handling for unknown type
            let errorMessage = "Something went wrong";
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            const movies = await movieRepositories.find();

            res.render("cinemas/create_theater", {
                success: null,
                error: errorMessage,
                theaterData: req.body,
                movies
            });

            return res.status(400).json({
                success: false,
                message: errorMessage
            });
        }
    }

    // use for postman
    //  async create(req: Request, res: Response): Promise<any> {
    //     try {
    //         const userId = req.user?.userId;
    //         // const movieId = req.body.movieId;
    //         const userRole = req.user?.role;

    //         if (!userId) {
    //             return res.status(401).json({
    //                 success: false,
    //                 message: "Unauthorized: User ID missing"
    //             });
    //         }

    //         if (!userRole) {
    //             return res.status(401).json({
    //                 success: false,
    //                 message: "Unauthorized: Role missing"
    //             });
    //         }

    //         const theatherData: CreateTheatersInterface = {
    //             theatername: req.body.theatername,
   
    //             screens: req.body.screens,
    //             contact: req.body.contact,
    //             assignedMovies: req.body.assignedMovies,
    //             district: req.body.district,
    //             state: req.body.state || "West Bengal",
                
    //         }

    //         const theather = await theaterRepositories.create(theatherData, userId, userRole)

    //         return res.status(201).json({
    //             success: true,
    //             message: "Movie created successfully",
    //             data: theather
    //         });

    //     } catch (error: unknown) {
    //         console.log("Controller Error - theatherCreate:", error);

    //         // Proper error handling for unknown type
    //         let errorMessage = "Something went wrong";
    //         if (error instanceof Error) {
    //             errorMessage = error.message;
    //         }

    //         return res.status(400).json({
    //             success: false,
    //             message: errorMessage
    //         });
    //     }
    // }
    async getAssignedMoviesbyTheater(req: Request, res: Response) {
        try {
            const { theaterId } = req.params;

            if (!theaterId) {
                return res.status(400).json({
                    success: false,
                    message: "Theater ID is required"
                });
            }

            if (!Types.ObjectId.isValid(theaterId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Theater ID format"
                });
            }

            const theaters = await theaterRepositories.getTheaterByIdwithAssignedMovies(theaterId);

            res.status(200).json({
                success: true,
                data: theaters
            });


        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch theaters for this movie"
            });
        }
    }

    async getTheatersByMovie(req: Request, res: Response) {
        try {
            const { movieId } = req.params;

            if (!movieId) {
                return res.status(400).json({
                    success: false,
                    message: "Movie ID is required"
                });
            }

            if (!Types.ObjectId.isValid(movieId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Movie ID format"
                });
            }

            const theaters = await theaterRepositories.getTheatersByMovie(movieId);

            res.status(200).json({
                success: true,
                count: theaters.length,
                data: theaters
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch theaters for this movie"
            });
        }
    }

    async getTheatersByState(req: Request, res: Response) {
        try {
            const { state, movieId } = req.query;

            if (!state) {
                return res.status(400).json({
                    success: false,
                    message: "State is required"
                });
            }

            const data = await theaterRepositories.getTheatersByState(
                // String(state),
                state as string,
                movieId as string);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            res.status(500).json({ success: false, message: "Error fetching theaters" });
        }
    }

    async getByDistrict(req: Request, res: Response) {
        try {
            const { district, movieId } = req.query;

            if (!district) {
                return res.status(400).json({
                    success: false,
                    message: "District is required"
                });
            }

            const data = await theaterRepositories.getTheatersByDistrict(
                district as string,
                movieId as string
            );

            res.status(200).json({
                success: true,
                total: data.length,
                data
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Server Error"
            });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { movieId } = req.body;

            if (!movieId) {
                return res.status(400).json({
                    success: false,
                    message: "movieId is required"
                });
            }

            const updated = await theaterRepositories.updateTheater(id, movieId);

            if (!updated) {
                return res.status(404).json({ message: "Theater not found" });
            }

            return res.status(200).json({
                message: "Theater updated successfully",
                data: updated
            });
        } catch (error) {
            console.error("Controller Error - update:", error);
            return res.status(500).json({ message: "Update failed" });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await theaterRepositories.deleteTheater(id);

            if (!deleted) {
                return res.status(404).json({ message: "Theater not found" });
            }

            return res.status(200).json({
                message: "Theater deleted successfully",
                data: deleted
            });
        } catch (error) {
            console.error("Controller Error - delete:", error);
            return res.status(500).json({ message: "Delete failed" });
        }
    }

    async getAllTheatersAPI(req: Request, res: Response): Promise<any> {
        try {
            const theaters = await theaterRepositories.findAll();

            if (theaters && theaters.length > 0) {
                return res.status(200).json({
                    success: true,
                    message: "Theaters fetched successfully",
                    total: theaters.length,
                    data: theaters,
                });
            } else {
                return res.status(200).json({
                    success: true,
                    message: "No theaters found",
                    data: [],
                    total: 0
                });
            }
        } catch (error: any) {
            console.error("Theater Controller Error - getAllTheatersAPI:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch theaters",
                error: error.message
            });
        }
    }

}

const allTheaterController = new AllTheaterController()
export { allTheaterController }