import mongoose, { Types } from "mongoose";
import { showModel } from "../models/show.model";
import { ShowInterface, CreateMovieShow } from "../interfaces/show.interface";
import { roleModel } from "../models/role.model";

interface LockResult {
    success: boolean;
    message?: string;
    alreadyBooked?: string[];
    alreadyLocked?: string[];
    data?: {
        lockedSeats: string[];
    };
}

interface ConfirmResult {
    success: boolean;
    message?: string;
    data?: ShowInterface;
}

class ShowRepository {
    async create(showData: CreateMovieShow, createdBy: string, userRole: string): Promise<ShowInterface> {
        try {
            // Check role (Admin only)
            const roleDoc = await roleModel.findOne({ name: userRole });

            if (!roleDoc) {
                throw new Error("Role not found");
            }

            if (roleDoc.name !== "admin") {
                throw new Error("Only Admin can create movies");
            }

            let normalizedDate: Date;

            if (showData.date instanceof Date) {
                normalizedDate = new Date(showData.date);
            } else {
                normalizedDate = new Date(showData.date as string);
            }

            normalizedDate.setUTCHours(0, 0, 0, 0);

            // Calculate expiration date (24 hours after the last show time)
            const expiresAt = new Date(normalizedDate);
            expiresAt.setDate(expiresAt.getDate() + 1); // Add 24 hours
            expiresAt.setUTCHours(23, 59, 59, 999); // End of next day

            const showtocreate = {
                movieId: showData.movieId,
                theaterId: showData.theaterId,

                room: {
                    name: showData.room.name,
                    rows: showData.room.rows,
                    columns: showData.room.columns
                },
                screenNumber: showData.screenNumber,

                date: normalizedDate,
                timeSlots: showData.timeSlots,
                totalSeats: showData.room.rows * showData.room.columns,

                bookedSeats: [],
                createdBy: createdBy,
            }

            const newShow = await showModel.create(showtocreate)
            return newShow;

        } catch (error) {
            console.log("Repository Error - create:", error);
            throw error;
        }
    }

    async getAvailableTimes(movieId: string, date: string) {
        try {
            const selectedDate = new Date(date);

            // Start of day (UTC safe)
            const start = new Date(selectedDate);
            start.setUTCHours(0, 0, 0, 0);

            // End of day
            const end = new Date(selectedDate);
            end.setUTCHours(23, 59, 59, 999);

            const shows = await showModel.aggregate([
                {
                    $match: {
                        movieId: new Types.ObjectId(movieId),
                        date: {
                            $gte: start,
                            $lte: end
                        }
                    }
                },
                { $unwind: "$timeSlots" },
                {
                    $group: {
                        _id: null,
                        times: { $addToSet: "$timeSlots.time" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        times: 1
                    }
                }
            ]);

            return shows.length ? shows[0].times : [];

        } catch (error) {
            console.error("Repository Error - getAvailableTimes:", error);
            throw error;
        }
    }



    async findByMoviedDate(movieId: string, date?: string): Promise<ShowInterface[]> {
        try {

            const matchStage: any = { movieId: new Types.ObjectId(movieId) };

            if (date) {
                const start = new Date(date);
                start.setHours(0, 0, 0, 0);

                const end = new Date(date);
                end.setHours(23, 59, 59, 999);

                end.setDate(end.getDate() + 1);
                matchStage.date = { $gte: start, $lt: end };
            }
            return await showModel.aggregate([
                { $match: matchStage },
                {
                    $lookup: {
                        from: "theaters",
                        localField: "theaterId",
                        foreignField: "_id",
                        as: "theater"
                    }
                },
                { $unwind: "$theater" },
                {
                    $project: {
                        _id: 1,
                        movieId: 1,
                        date: 1,
                        screenNumber: 1,
                        room: 1,
                        timeSlots: 1,
                        theater: {
                            _id: 1,
                            theatername: 1,
                            location: 1
                        }
                    }
                }
            ]);

        } catch (error) {
            console.error("Repository Error - findByMovieAndDate:", error);
            throw error;
        }
    }
    async findById(id: string): Promise<ShowInterface | null> {
        try {
            return await showModel.findById(id).lean();
        } catch (error) {
            console.error("Repository Error - findById:", error);
            throw error;
        }
    }

    async findDuplicateShow(movieId: string, theaterId: string, date: Date, times: string[]) {
        return await showModel.findOne({
            movieId,
            theaterId,
            date,
            "timeSlots.time": { $in: times }
        });
    }

    async findShowByTheaterMovieDateTime(theaterId: string, movieId: string, date: string, time: string) {
        try {
            console.log('🔍 Searching show:', { theaterId, movieId, date, time });

            // For string dates, search with exact string match
            const show = await showModel.findOne({
                theaterId: new Types.ObjectId(theaterId),
                movieId: new Types.ObjectId(movieId),
                date: date, // Exact string match: "2025-11-29"
            });

            console.log('🔍 Found show:', show ? {
                _id: show._id,
                date: show.date,
                dateType: typeof show.date
            } : 'NO SHOW FOUND');

            if (!show) {
                return null;
            }

            // Check if requested time exists inside timeSlots
            console.log('🔍 Show timeSlots:', show.timeSlots);
            const timeSlot = show.timeSlots.find(slot => slot.time === time);

            if (!timeSlot) {
                console.log('❌ Time slot not found:', time);
                return "TIME_NOT_FOUND";
            }

            console.log('✅ Show found successfully:', show._id);
            return show;

        } catch (error) {
            console.error("❌ Repository Error - findShowByTheaterMovieDateTime:", error);
            throw error;
        }
    }



    async lockSeats(showId: string, seats: string[], sessionId: string, ttlSeconds: number = 300): Promise<LockResult> {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            console.log('🔒 Starting seat lock process:', {
                showId, seats, sessionId, ttlSeconds
            });

            // First, remove expired locks
            const cleanupResult = await showModel.updateOne(
                { _id: new Types.ObjectId(showId) },
                {
                    $pull: {
                        locks: { expiresAt: { $lt: new Date() } }
                    }
                },
                { session }
            );

            console.log('🧹 Cleaned expired locks for show:', showId);

            // Now get the updated show document
            const show = await showModel.findById(showId).session(session);

            if (!show) {
                await session.abortTransaction();
                session.endSession();
                throw new Error("Show not found");
            }

            const now = new Date();

            console.log('🔍 Show state after cleanup:', {
                showId: show._id,
                bookedSeats: show.bookedSeats,
                currentLocks: show.locks,
                currentTime: now.toISOString()
            });

            // Check already booked seats
            const alreadyBooked = seats.filter(seat => show.bookedSeats.includes(seat));
            if (alreadyBooked.length > 0) {
                await session.abortTransaction();
                session.endSession();
                return {
                    success: false,
                    message: `Seats already booked: ${alreadyBooked.join(', ')}`,
                    alreadyBooked
                };
            }

            // Check already locked seats (only active ones)
            const activeLocks = show.locks.filter(lock => new Date(lock.expiresAt) > now);
            const alreadyLocked = seats.filter(seat =>
                activeLocks.some(lock => lock.seat === seat)
            );

            if (alreadyLocked.length > 0) {
                await session.abortTransaction();
                session.endSession();
                return {
                    success: false,
                    message: `Seats already locked: ${alreadyLocked.join(', ')}`,
                    alreadyLocked
                };
            }

            // Create new locks
            const expiresAt = new Date(Date.now() + (ttlSeconds * 1000));
            const newLocks = seats.map(seat => ({
                seat,
                sessionId,
                expiresAt
            }));

            console.log('➕ Adding new locks:', newLocks);

            // CRITICAL FIX: Use $push to add locks to the array
            const updateResult = await showModel.updateOne(
                { _id: new Types.ObjectId(showId) },
                {
                    $push: {
                        locks: {
                            $each: newLocks
                        }
                    }
                },
                { session }
            );

            console.log('📝 Lock update result:', {
                matchedCount: updateResult.matchedCount,
                modifiedCount: updateResult.modifiedCount
            });

            if (updateResult.modifiedCount === 0) {
                throw new Error("Failed to add locks to show");
            }

            // Verify locks were saved by reading the show again
            const updatedShow = await showModel.findById(showId).session(session);
            console.log('✅ Final show state after lock:', {
                totalLocks: updatedShow?.locks.length,
                locks: updatedShow?.locks
            });

            await session.commitTransaction();
            session.endSession();

            console.log('🎉 Seats locked successfully!', {
                seats,
                sessionId,
                showId,
                expiresAt: expiresAt.toISOString()
            });

            return {
                success: true,
                data: {
                    lockedSeats: seats
                }
            };

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error("❌ Repository Error - lockSeats:", error);
            throw error;
        }
    }

    async updateShow(showId: string, updateData: Partial<ShowInterface>): Promise<ShowInterface | null> {
        try {
            const updatedShow = await showModel.findByIdAndUpdate(
                showId,
                updateData,
                { new: true }
            ).lean().exec();

            return updatedShow;
        } catch (error) {
            console.error("Repository Error - updateShow:", error);
            throw error;
        }
    }

    async deleteShow(showId: string): Promise<boolean> {
        try {
            const result = await showModel.findByIdAndDelete(showId).exec();
            return result ? true : false;
        } catch (error) {
            console.error("Repository Error - deleteShow:", error);
            throw error;
        }
    }


    async releaseExpiredLocks(): Promise<void> {
        try {
            // This will automatically remove expired locks due to TTL index
            const now = new Date();

            await showModel.updateMany(
                {},
                {
                    $pull: {
                        locks: { expiresAt: { $lt: now } }
                    }
                }
            );
            console.log("Expired locks cleanup completed");
        } catch (error) {
            console.error("Repository Error - releaseExpiredLocks:", error);
            throw error;
        }
    }
}

export const showRepository = new ShowRepository();
