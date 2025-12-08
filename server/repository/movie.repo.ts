import mongoose from "mongoose";
import { movieModel } from "../models/movie.model";
import { roleModel } from "../models/role.model";
import { Types } from "mongoose";


class MovieRepositories {

    async create(movieData: any, userId: string, userRole: string) {
        try {
            // Check role (Admin only)
            const roleDoc = await roleModel.findOne({ name: userRole });

            if (!roleDoc) {
                throw new Error("Role not found");
            }

            if (roleDoc.name !== "admin") {
                throw new Error("Only Admin can create movies");
            }

            // Movie data object
            const movieToCreate = {
                userId: userId,
                moviename: movieData.moviename,
                genre: movieData.genre,
                language: movieData.language,
                duration: movieData.duration,
                cast: movieData.cast,
                director: movieData.director,
                releaseDate: movieData.releaseDate,
                description: movieData.description,
                poster: movieData.poster,
                rating: movieData.rating,
                votes: movieData.votes,
                likes: movieData.likes,
                promoted: movieData.promoted
            };

            const newMovie = await movieModel.create(movieToCreate);
            return newMovie;

        } catch (error) {
            console.log("Repository Error - create:", error);
            throw error;
        }
    }

    async find() {
        try {
            const getAllMovies = await movieModel.find()

            // const getAllMovies = await movieModel.aggregate([
            //     {
            //         $lookup: {
            //             from: "users",
            //             localField: "userId",
            //             foreignField: "_id",
            //             as: "createdBy"
            //         }
            //     },
            //     {
            //         $unwind: {
            //             path: "$createdBy",
            //             preserveNullAndEmptyArrays: true
            //         }
            //     },
            //     {
            //         $project: {
            //             moviename: 1,
            //             genre: 1,
            //             language: 1,
            //             duration: 1,
            //             cast: 1,
            //             director: 1,
            //             releaseDate: 1,
            //             description: 1,
            //             poster: 1,
            //             rating: 1,
            //             votes: 1,
            //             likes: 1,
            //             promoted: 1,
            //             createdAt: 1,
            //             "createdBy.name": 1,
            //             "createdBy.email": 1
            //         }
            //     },
            //     {
            //         $sort: { createdAt: -1 }
            //     }
            // ]);

            return getAllMovies;
        } catch (error) {
            console.log("Repository Error - find:", error);
            throw error;
        }
    }

    async findById(id: string) {
        try {
            const movie = await movieModel.aggregate([
                {
                    $match: { _id: new Types.ObjectId(id) }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "createdBy"
                    }
                },
                {
                    $unwind: {
                        path: "$createdBy",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        moviename: 1,
                        genre: 1,
                        language: 1,
                        duration: 1,
                        cast: 1,
                        director: 1,
                        releaseDate: 1,
                        description: 1,
                        poster: 1,
                        rating: 1,
                        votes: 1,
                        likes: 1,
                        promoted: 1,
                        createdAt: 1,
                        "createdBy.name": 1,
                        "createdBy.email": 1
                    }
                }
            ]);

            return movie.length > 0 ? movie[0] : null;

        } catch (error) {
            console.log("Repository Error - findById:", error);
            throw error;
        }
    }

    async updateMovie(movieId: string, movieData: any, userId: string, userRole: string) {
        try {
            // Role check (Admin only)
            const roleDoc = await roleModel.findOne({ name: userRole });

            if (!roleDoc) {
                throw new Error("Role not found");
            }

            if (roleDoc.name !== "admin") {
                throw new Error("Only Admin can update movies");
            }

            const updatedMovie = await movieModel.findByIdAndUpdate(
                movieId,
                {
                    userId: userId,
                    moviename: movieData.moviename,
                    genre: movieData.genre,
                    language: movieData.language,
                    duration: movieData.duration,
                    cast: movieData.cast,
                    director: movieData.director,
                    releaseDate: movieData.releaseDate,
                    description: movieData.description,
                    poster: movieData.poster,
                    rating: movieData.rating,
                    votes: movieData.votes,
                    likes: movieData.likes,
                    promoted: movieData.promoted,
                },
                { new: true, runValidators: true }
            );

            if (!updatedMovie) {
                throw new Error("Movie not found");
            }

            return updatedMovie;

        } catch (error) {
            console.log("Repository Error - updateMovie:", error);
            throw error;
        }
    }


    // DELETE MOVIE
    async deleteMovie(movieId: string, userId: string, userRole: string) {
        try {
            // Role check (Admin only)
            const roleDoc = await roleModel.findOne({ name: userRole });

            if (!roleDoc) {
                throw new Error("Role not found");
            }

            if (roleDoc.name !== "admin") {
                throw new Error("Only Admin can delete movies");
            }

            const deletedMovie = await movieModel.findByIdAndDelete(movieId);

            if (!deletedMovie) {
                throw new Error("Movie not found");
            }

            return deletedMovie;

        } catch (error) {
            console.log("Repository Error - deleteMovie:", error);
            throw error;
        }
    }

    async togglePromoteMovie(movieId: string, userRole: string, promoted: boolean) {
        try {
            if (userRole !== "admin") {
                throw new Error("Only Admin can promote or unpromote movies");
            }

            const updatedMovie = await movieModel.findByIdAndUpdate(
                movieId,
                { promoted },
                { new: true }
            );

            if (!updatedMovie) {
                throw new Error("Movie not found");
            }

            return updatedMovie;
        } catch (error) {
            console.log("Repository Error - togglePromoteMovie:", error);
            throw error;
        }
    }


    async reactMovie(movieId: string, body: { rating?: number; like?: boolean }) {
        try {
            const movie = await movieModel.findById(movieId);
            if (!movie) throw new Error("Movie not found");

            const currentVotes = movie.votes || 0;
            const currentRating = movie.rating || 0;
            const currentLikes = movie.likes || 0;

            const update: any = {};

            // LIKE SYSTEM
            if (body.like === true) {
                update.likes = currentLikes + 1;
            }

            // RATING SYSTEM (AVERAGE)
            if (body.rating !== undefined) {
                const maxRating = movie.ratingScale;

                if (body.rating < 0 || body.rating > maxRating) {
                    throw new Error(`Rating must be between 0 and ${maxRating}`);
                }

                const newVotes = currentVotes + 1;
                const newRating =
                    ((currentRating * currentVotes) + body.rating) / newVotes;

                update.rating = Number(newRating.toFixed(1));
                update.votes = newVotes;
            }

            return await movieModel.findByIdAndUpdate(movieId, update, { new: true });

        } catch (error) {
            console.log("Repository Error - React Movie:", error);
            throw error;
        }
    }

    async simulateRating(movieId: string, futureVotes: number, userRating: number) {

        try {


            const movie = await movieModel.findById(movieId);
            if (!movie) throw new Error("Movie not found");

            const currentRating = movie.rating || 0;
            const currentVotes = movie.votes || 0;

            const predicted =
                ((currentRating * currentVotes) + (userRating * futureVotes)) /
                (currentVotes + futureVotes);

            return Number(predicted.toFixed(1));
        } catch (error) {
            console.log("Repository Error - Simulate Rating:", error);
            throw error;
        }
    }


}
const movieRepositories = new MovieRepositories();
export { movieRepositories }