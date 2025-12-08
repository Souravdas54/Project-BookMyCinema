import { Request, Response } from "express";
import { showRepository } from '../repository/show.repo';
import { showModel } from "../models/show.model";
import { theaterModel } from "../models/theaters.model";

class AllShowController {
    async create(req: Request, res: Response): Promise<any> {

        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            if (!userId || !userRole) {
                req.flash('error', 'Unauthorized access');
                return res.redirect('/admin/cinemas/create-show');
            }

            const showData = req.body;

            const theater = await theaterModel.findById(showData.theaterId);
            if (!theater) {
                req.flash('error', 'Theater not found');
                return res.redirect('/admin/cinemas/create-show');
            }

            const isAssigned = theater.assignedMovies.some(
                (id) => id.toString() === showData.movieId
            );

            if (!isAssigned) {
                req.flash('error', 'This movie is NOT assigned to this theater. Assign movie first!');
                return res.redirect('/admin/cinemas/create-show');
            }


            const newShow = await showRepository.create(
                showData,
                userId,
                userRole
            );

            req.flash('success', `Show created successfully for ${newShow.movieId}`);
            return res.redirect('/admin/cinemas/create-show');


        } catch (error: unknown) {
            console.log("Controller Error - theatherCreate:", error);

            // Proper error handling for unknown type
            let errorMessage = "Internal Server Error";
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            req.flash('error', errorMessage);
            return res.redirect('/admin/cinemas/create-show');
        }
    }

    // use for postman
    // async create(req: Request, res: Response): Promise<any> {

    //     try {
    //         const userId = req.user?.userId;
    //         const userRole = req.user?.role;

    //        if (!userId) {
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

    //         const showData = req.body;

    //         const newShow = await showRepository.create(
    //             showData,
    //             userId,
    //             userRole
    //         );

    //         return res.status(201).json({
    //             success: true,
    //             message: "Show created successfully",
    //             data: newShow
    //         });

    //     } catch (error: unknown) {
    //         console.log("Controller Error - theatherCreate:", error);

    //         // Proper error handling for unknown type
    //         let errorMessage = "Internal Server Error";
    //         if (error instanceof Error) {
    //             errorMessage = error.message;
    //         }

    //         // req.flash('error', errorMessage);
    //         // return res.redirect('/admin/cinemas/create-show');

    //         return res.status(500).json({
    //             success: false,
    //             message: errorMessage
    //         });
    //     }
    // }


    async getShowsByMovie(req: Request, res: Response) {
        try {
            const { movieId } = req.params;
            // const { date } = req.query as any;
            const date = typeof req.query.date === "string" ? req.query.date : undefined;

            const shows = await showRepository.findByMoviedDate(movieId, date);

            return res.json({ success: true, message: "Show Get Successfully", data: shows });

        } catch (err: any) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    async getShowTimesByDate(req: Request, res: Response) {
        try {
            const { movieId } = req.params;
            const date = req.query.date as string;

            if (!date) {
                return res.status(400).json({
                    success: false,
                    message: "date is required"
                });
            }

            const times = await showRepository.getAvailableTimes(movieId, date);

            return res.json({
                success: true,
                movieId,
                date,
                availableTimes: times
            });

        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getShowById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const show = await showRepository.findById(id);

            if (!show) return res.status(404).json({ success: false, message: "Show not found" });

            return res.json({ success: true, message: "Show Get Successfully", data: show });

        } catch (err: any) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    async getShowByTheaterMovieDateTime(req: Request, res: Response) {
        try {
            const { theaterId, movieId } = req.params;
            const { date, time } = req.query;

            console.log('🎯 Request parameters:', {
                theaterId,
                movieId,
                date,
                time,
                queryParams: req.query
            });

            if (!date || !time) {
                return res.status(400).json({
                    success: false,
                    message: "Date and time are required",
                });
            }

            const result = await showRepository.findShowByTheaterMovieDateTime(
                theaterId,
                movieId,
                String(date),
                String(time)
            );

            console.log('🎯 Repository result:', {
                resultType: typeof result,
                result: result
            });

            if (!result) {
                console.log('❌ No show found for criteria');
                return res.status(404).json({
                    success: false,
                    message: "Show not found for this theater, movie, and date combination",
                });
            }

            if (result === "TIME_NOT_FOUND") {
                console.log('❌ Time slot not found in show');
                return res.status(404).json({
                    success: false,
                    message: "Time slot not found in this show",
                });
            }

            console.log('✅ Show found successfully:', result._id);
            return res.json({
                success: true,
                message: "Show found successfully",
                data: result,
            });

        } catch (err: any) {
            console.error("❌ Controller Error - getShowByTheaterMovieDateTime:", err);
            return res.status(500).json({
                success: false,
                message: err.message,
            });
        }
    }

    async debugAllShows(req: Request, res: Response) {
        try {
            const shows = await showModel.find({})
                .populate('theaterId', 'theatername district')
                .populate('movieId', 'moviename')
                .lean()
                .exec();

            console.log('📊 All shows in database:', shows.length);

            const simplifiedShows = shows.map(show => ({
                _id: show._id,
                theaterId: show.theaterId,
                movieId: show.movieId,
                date: show.date,
                timeSlots: show.timeSlots
            }));

            return res.json({
                success: true,
                count: shows.length,
                data: simplifiedShows
            });
        } catch (err: any) {
            console.error("Debug error:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    async updateShow(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const updated = await showRepository.updateShow(id, updateData);

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: "Show not found"
                });
            }

            return res.json({
                success: true,
                message: "Show updated successfully",
                data: updated
            });

        } catch (error: unknown) {
            let message = "Internal Server Error";
            if (error instanceof Error) message = error.message;

            return res.status(500).json({
                success: false,
                message
            });
        }
    }

    async deleteShow(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const deleted = await showRepository.deleteShow(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: "Show not found"
                });
            }

            return res.json({
                success: true,
                message: "Show deleted successfully"
            });

        } catch (error: unknown) {
            let message = "Internal Server Error";
            if (error instanceof Error) message = error.message;

            return res.status(500).json({
                success: false,
                message
            });
        }
    }

    async releaseExpiredSeatLocks(req: Request, res: Response) {
        try {
            await showRepository.releaseExpiredLocks();

            res.status(200).json({
                success: true,
                message: 'Expired seat locks released successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to release expired locks'
            });
        }
    };

}

const allShowController = new AllShowController()
export { allShowController }