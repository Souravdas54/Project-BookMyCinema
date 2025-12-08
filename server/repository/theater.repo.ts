import { roleModel } from "../models/role.model";
import { theaterModel } from "../models/theaters.model";
import { TheatersInterface, CreateTheatersInterface } from "../interfaces/theaters.interface";
import { Types } from "mongoose";

class TheaterRepositories {

    async create(theatersData: CreateTheatersInterface, userId: string, userRole: string): Promise<TheatersInterface> {
        try {
            // Check role (Admin only)
            const roleDoc = await roleModel.findOne({ name: userRole });

            if (!roleDoc) {
                throw new Error("Role not found");
            }

            if (roleDoc.name !== "admin") {
                throw new Error("Only Admin can create movies");
            }

            const theatersToCreate = {
                userId: userId,
                theatername: theatersData.theatername,
                screens: theatersData.screens,
                contact: theatersData.contact,
                assignedMovies: theatersData.assignedMovies,
                district: theatersData.district,
                state: theatersData.state,

            }

            const newTheaters = await theaterModel.create(theatersToCreate)
            return newTheaters;
        }
        catch (error) {
            console.log("Repository Error - create:", error);
            throw error;
        }
    }

    async getTheatersByMovie(movieId: string): Promise<any[]> {
        try {
            return await theaterModel.aggregate([
                {
                    $match: {
                        assignedMovies: {
                            $in: [new Types.ObjectId(movieId)]
                        }
                    }
                },
                {
                    $project: {
                        theatername: 1,
                        district: 1,
                        state: 1,
                        screens: 1,
                        contact: 1,
                        assignedMovies: 1
                    }
                }
            ]);
        } catch (error) {
            console.error("Repository Error - getTheatersByMovie:", error);
            throw error;
        }
    }

    async getTheatersByState(state: string, movieId?: string): Promise<TheatersInterface[]> {
        try {
            const match: any = { state };

            if (movieId) {
                match.assignedMovies = { $in: [new Types.ObjectId(movieId)] };
            }

            return await theaterModel.find(match);
            // return await theaterModel.aggregate([
            //     { $match: match }
            // ]);

        } catch (error) {
            console.error("Repository Error - getTheatersByState:", error);
            throw error;
        }
    }

    async getTheatersByDistrict(district: string, movieId?: string) {
        try {
            const match: any = {
                district: { $regex: `^${district}$`, $options: "i" }
            };

            if (movieId) {
                match.assignedMovies = { $in: [new Types.ObjectId(movieId)] };
            }

            return await theaterModel.find(match);

            // return await theaterModel.aggregate([
            //     { $match: match }
            // ]);

        } catch (error) {
            console.error("Repository Error - getTheatersByDistrict:", error);
            throw error;
        }
    }

    async getTheaterByIdwithAssignedMovies(theaterId: string): Promise<TheatersInterface | null> {
        try {
            const result = await theaterModel.aggregate([
                {
                    $match: { _id: new Types.ObjectId(theaterId) }
                },
                {
                    $lookup: {
                        from: 'movies', // The collection name for movies (usually plural)
                        localField: 'assignedMovies',
                        foreignField: '_id',
                        as: 'assignedMoviesDetails'
                    }
                },
                {
                    $project: {
                        theatername: 1,
                        theatercity: 1,
                        screens: 1,
                        assignedMovies: 1,
                        assignedMoviesDetails: {
                            _id: 1,
                            moviename: 1,
                            duration: 1,
                            genre: 1
                        },

                    }
                }
            ]);

            return result[0] || null;

        } catch (error) {
            console.error("Repository Error - getTheaterById:", error);
            throw error;
        }

    }

    async updateTheater(theaterId: string, movieId: string): Promise<TheatersInterface | null> {
        try {
            return await theaterModel.findByIdAndUpdate(
                theaterId,
                {
                    $addToSet: { assignedMovies: movieId }   // Add movie without duplicates
                },
                {
                    new: true,
                    runValidators: true
                }
            );
        } catch (error) {
            console.error("Repository Error - updateTheater:", error);
            throw error;
        }
    }

    async deleteTheater(theaterId: string) {
        try {
            return await theaterModel.findByIdAndDelete(theaterId);
        } catch (error) {
            console.error("Repository Error - deleteTheater:", error);
            throw error;
        }
    }

    async findAll() {
        try {
            const theaters = await theaterModel.find()
                .populate('userId', 'name email')
                .populate('assignedMovies', 'moviename poster duration')
                .sort({ createdAt: -1 })
                .lean();

            return theaters;
        } catch (error) {
            console.error("Theater Repository Error - findAll:", error);
            throw error;
        }
    }

}

const theaterRepositories = new TheaterRepositories();
export { theaterRepositories }