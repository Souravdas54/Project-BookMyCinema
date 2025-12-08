import mongoose, { ClientSession, Types } from "mongoose";
import { BookingDocument, BookingInterfaace, CreateBooking } from "../interfaces/booking.interface";
import { bookingModel } from "../models/booking.model";
import { showModel } from "../models/show.model";

class BookingRepositories {

    async confirmAndCreateBooking(params: {
        showId: string;
        seats: string[];
        sessionId: string;
        userId: string;
        totalAmount: number;
    }): Promise<BookingDocument> {

        const { showId, seats, sessionId, userId, totalAmount } = params;

        console.log(' CONFIRMATION START - Received:', {
            showId, seats, sessionId, userId, totalAmount
        });

        const session: ClientSession = await mongoose.startSession();
        try {
            session.startTransaction();

            // Get the show
            const show = await showModel.findById(showId).session(session);
            if (!show) {
                throw new Error("Show not found");
            }

            const now = new Date();
            console.log('SHOW STATE:', {
                showId: show._id,
                totalLocksInDB: show.locks.length,
                allLocks: show.locks.map(l => ({
                    seat: l.seat,
                    sessionId: l.sessionId,
                    expiresAt: l.expiresAt,
                    isActive: new Date(l.expiresAt) > now
                })),
                bookedSeats: show.bookedSeats
            });

            // Filter valid locks
            const validLocks = show.locks.filter(lock => new Date(lock.expiresAt) > now);

            console.log(' VALID LOCKS:', validLocks.map(l => ({
                seat: l.seat,
                sessionId: l.sessionId,
                expiresAt: l.expiresAt
            })));

            // Check each seat individually
            const notLocked: string[] = [];

            seats.forEach(seat => {

                if (show.bookedSeats.includes(seat)) {
                    notLocked.push(`${seat} (already booked)`);
                    return;
                }
                const lock = validLocks.find(l => l.seat === seat);

                if (!lock) {
                    console.log(` SEAT ${seat}: No active lock found`);
                    notLocked.push(seat);
                    return;
                }

                const isSameSession = lock.sessionId === sessionId;
                const isPaymentLock = lock.sessionId.startsWith('payment_');
                const isNotExpired = new Date(lock.expiresAt) > now;

                console.log(` SEAT ${seat} CHECK:`, {
                    foundLock: true,
                    lockSession: lock.sessionId,
                    requestSession: sessionId,
                    sessionMatch: isSameSession,
                    expiresAt: lock.expiresAt,
                    currentTime: now.toISOString(),
                    isNotExpired: isNotExpired,
                    isValid: (isSameSession || isPaymentLock) && isNotExpired
                });

                if (isPaymentLock) {
                    console.log(` SEAT ${seat}: Found payment lock - allowing override`);
                    // Don't push to notLocked - we'll allow this
                    return;
                }

                if (!isSameSession) {
                    console.log(` SEAT ${seat}: Session mismatch - Lock: ${lock.sessionId}, Request: ${sessionId}`);
                    notLocked.push(seat);
                    return;
                }

                if (!isNotExpired) {
                    console.log(` SEAT ${seat}: Lock expired at ${lock.expiresAt}`);
                    notLocked.push(seat);
                    return;
                }

                // If we get here, seat is properly locked with same session
                console.log(` SEAT ${seat}: ✓ Valid lock found`);
            });

            if (notLocked.length > 0) {
                console.log(`⚠️  Attempting to clean up ${notLocked.length} invalid seats`);

                // Remove expired locks for these seats
                await showModel.updateOne(
                    { _id: showId },
                    {
                        $pull: {
                            locks: {
                                seat: { $in: notLocked },
                                expiresAt: { $lt: now }
                            }
                        }
                    },
                    { session }
                );
                throw new Error(`Seats not available: ${notLocked.join(", ")}`);
            }

            console.log(' ALL SEATS VERIFIED - Proceeding with booking...');

            // Calculate total with service charge (10% service charge)
            const serviceCharge = totalAmount * 0.10; // 10% service charge
            const finalAmount = totalAmount + serviceCharge;

            console.log(' AMOUNT CALCULATION:', {
                baseAmount: totalAmount,
                serviceCharge: serviceCharge.toFixed(2),
                finalAmount: finalAmount.toFixed(2)
            });

            // Create booking with PENDING payment status
            const bookingDoc = await bookingModel.create(
                [{
                    userId: new Types.ObjectId(userId),
                    movieId: show.movieId,
                    theaterId: show.theaterId,
                    showId: new Types.ObjectId(showId),
                    seats,
                    totalAmount: finalAmount, // Store final amount with service charge
                    baseAmount: totalAmount, // Store base amount separately
                    serviceCharge: serviceCharge, // Store service charge
                    status: "Pending", // Keep as Pending (waiting for payment)
                    paymentStatus: "Unpaid", // Keep as Unpaid
                    bookedAt: new Date()
                }],
                { session }
            );

            const createdBooking = bookingDoc[0];

            if (!createdBooking || !createdBooking._id) {
                throw new Error("Failed to create booking document");
            }

            const bookingId = createdBooking._id.toString();
            console.log(`✅ Booking created with ID: ${bookingId}`);

            // Remove ALL locks for these seats (both regular and payment locks)
            await showModel.updateOne(
                { _id: showId },
                {
                    $pull: {
                        locks: {
                            seat: { $in: seats }
                        }
                    }
                },
                { session }
            );

            await showModel.updateOne(
                { _id: showId },
                {
                    $addToSet: { bookedSeats: { $each: seats } }
                },
                { session }
            );
            // Add temporary payment locks for EACH seat individually
            // const paymentExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
            // // const paymentSessionId = `payment_${bookingDoc[0]._id}`;
            // const paymentSessionId = `payment_${bookingId}`;

            // // Create array of lock objects for each seat
            // const paymentLocks = seats.map(seat => ({
            //     seat: seat,
            //     sessionId: paymentSessionId,
            //     expiresAt: paymentExpiry
            // }));

            // // Push each lock individually
            // await showModel.updateOne(
            //     { _id: showId },
            //     {
            //         $push: { locks: { $each: paymentLocks } }
            //     },
            //     { session }
            // );

            await session.commitTransaction();
            session.endSession();

            console.log(' BOOKING CREATED - Waiting for payment:', {
                bookingId: bookingDoc[0]._id,
                status: "Pending",
                paymentStatus: "Unpaid",
                amount: finalAmount,
                serviceCharge: serviceCharge,
                // paymentLocksAdded: paymentLocks.length
                seats: seats
            });

            // return bookingDoc[0] as unknown as BookingInterfaace;
            // return createdBooking.toObject() as BookingDocument & { _id: Types.ObjectId };
            return createdBooking.toObject() as BookingDocument;

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error(" CONFIRMATION FAILED:", error);
            throw error;
        }
    }


    async createBooking(adminPayload: {
        userId: string; movieId: string; theaterId: string; showId: string;
        seats: string[]; totalAmount: number;
        status?: "Confirmed" | "Cancelled" | "Pending"; paymentStatus?: "Paid" | "Unpaid";
    }): Promise<BookingInterfaace> {

        const doc = await bookingModel.create({
            userId: new Types.ObjectId(adminPayload.userId),
            movieId: new Types.ObjectId(adminPayload.movieId),
            theaterId: new Types.ObjectId(adminPayload.theaterId),
            showId: new Types.ObjectId(adminPayload.showId),
            seats: adminPayload.seats.map(s => typeof s === "string" ? s : String(s)),
            totalAmount: adminPayload.totalAmount,
            status: adminPayload.status ?? "Confirmed",
            paymentStatus: adminPayload.paymentStatus ?? "Paid",
            bookedAt: new Date()
        });

        return doc.toObject() as BookingInterfaace;
    }

    async getBookingById(bookingId: string) {
        const objId = new Types.ObjectId(bookingId);
        const data = await bookingModel.aggregate([
            { $match: { _id: objId } },
            {
                $lookup: {
                    from: "movies",
                    localField: "movieId",
                    foreignField: "_id",
                    as: "movie"
                }
            },
            { $unwind: { path: "$movie", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "theaters",
                    localField: "theaterId",
                    foreignField: "_id",
                    as: "theater"
                }
            },
            { $unwind: { path: "$theater", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "shows",
                    localField: "showId",
                    foreignField: "_id",
                    as: "show"
                }
            },
            { $unwind: { path: "$show", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    userId: 1,
                    seats: 1,
                    totalAmount: 1,
                    status: 1,
                    paymentStatus: 1,
                    bookedAt: 1,
                    createdAt: 1,
                    movie: { _id: "$movie._id", moviename: "$movie.moviename", poster: "$movie.poster" },
                    theater: { _id: "$theater._id", theatername: "$theater.theatername", district: "$theater.district" },
                    show: { _id: "$show._id", date: "$show.date", room: "$show.room", timeSlots: "$show.timeSlots" }
                }
            }
        ]);

        return data[0] ?? null;
    }

    // async getBookingsByUser(userId: string, limit = 50, skip = 0) {
    //     const userObj = new Types.ObjectId(userId);

    //     const data = await bookingModel.aggregate([

    //         { $match: { userId: userObj } },
    //         { $sort: { createdAt: -1 } },
    //         { $skip: skip },
    //         { $limit: limit },
    //         {
    //             $lookup: {
    //                 from: "movies",
    //                 localField: "movieId",
    //                 foreignField: "_id",
    //                 as: "movie"
    //             }
    //         },
    //         { $unwind: { path: "$movie", preserveNullAndEmptyArrays: true } },
    //         {
    //             $lookup: {
    //                 from: "theaters",
    //                 localField: "theaterId",
    //                 foreignField: "_id",
    //                 as: "theater"
    //             }
    //         },
    //         { $unwind: { path: "$theater", preserveNullAndEmptyArrays: true } },
    //         {
    //             $project: {
    //                 userId: 1,
    //                 seats: 1,
    //                 totalAmount: 1,
    //                 status: 1,
    //                 paymentStatus: 1,
    //                 bookedAt: 1,
    //                 createdAt: 1,
    //                 movie: { _id: "$movie._id", moviename: "$movie.moviename", poster: "$movie.poster" },
    //                 theater: { _id: "$theater._id", theatername: "$theater.theatername", district: "$theater.district" }
    //             }
    //         }
    //     ]);

    //     return data;
    // }

    async updateBooking(bookingId: string, payload: Partial<CreateBooking> & { status?: string; paymentStatus?: string; }, currentUserId?: string) {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            const booking = await bookingModel.findById(bookingId).session(session);
            if (!booking) {
                throw new Error("Booking not found");
            }

            // If cancelling and booking was Confirmed -> free seats
            if (payload.status === "Cancelled" && booking.status === "Confirmed") {
                // remove booked seats from show
                await showModel.updateOne(
                    { _id: booking.showId },
                    { $pull: { bookedSeats: { $in: booking.seats } } },
                    { session }
                );
            }

            // apply updates to booking
            if (payload.totalAmount !== undefined) booking.totalAmount = payload.totalAmount;
            if (payload.status !== undefined) booking.status = payload.status as any;
            if (payload.paymentStatus !== undefined) booking.paymentStatus = payload.paymentStatus as any;

            await booking.save({ session });

            await session.commitTransaction();
            session.endSession();

            return booking.toObject();
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    async deleteBooking(bookingId: string) {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            const booking = await bookingModel.findById(bookingId).session(session);
            if (!booking) {
                throw new Error("Booking not found");
            }

            if (booking.status === "Confirmed") {
                await showModel.updateOne(
                    { _id: booking.showId },
                    { $pull: { bookedSeats: { $in: booking.seats } } },
                    { session }
                );
            }

            await bookingModel.deleteOne({ _id: bookingId }).session(session);

            await session.commitTransaction();
            session.endSession();
            return true;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    // Add this to your show repository
    async releaseSeats(showId: string, seats: string[], sessionId: string) {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            const show = await showModel.findById(new Types.ObjectId(showId)).session(session);
            if (!show) {
                throw new Error("Show not found");
            }

            // Remove locks for these seats with this sessionId
            await showModel.updateOne(
                { _id: show._id },
                {
                    $pull: {
                        locks: {
                            seat: { $in: seats },
                            sessionId: sessionId
                        }
                    }
                },
                { session }
            );

            await session.commitTransaction();
            session.endSession();

            return { releasedSeats: seats };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }


    async getCompleteBookingDetails(bookingId: string): Promise<any> {
        const objId = new Types.ObjectId(bookingId);
        const data = await bookingModel.aggregate([
            { $match: { _id: objId } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "movies",
                    localField: "movieId",
                    foreignField: "_id",
                    as: "movie"
                }
            },
            { $unwind: { path: "$movie", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "theaters",
                    localField: "theaterId",
                    foreignField: "_id",
                    as: "theater"
                }
            },
            { $unwind: { path: "$theater", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "shows",
                    localField: "showId",
                    foreignField: "_id",
                    as: "show"
                }
            },
            { $unwind: { path: "$show", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    seats: 1,
                    baseAmount: 1,
                    serviceCharge: 1,
                    totalAmount: 1,
                    status: 1,
                    paymentStatus: 1,
                    bookedAt: 1,
                    qrCodeData: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    user: {
                        _id: "$user._id",
                        name: "$user.name",
                        username: "$user.username",
                        email: "$user.email"
                    },
                    movie: {
                        _id: "$movie._id",
                        moviename: "$movie.moviename",
                        poster: "$movie.poster",
                        duration: "$movie.duration",
                        genre: "$movie.genre"
                    },
                    theater: {
                        _id: "$theater._id",
                        theatername: "$theater.theatername",
                        district: "$theater.district",
                        location: "$theater.location",
                        amenities: "$theater.amenities"
                    },
                    show: {
                        _id: "$show._id",
                        date: "$show.date",
                        room: "$show.room",
                        screen: "$show.screen",
                        timeSlots: "$show.timeSlots",
                        price: "$show.price"
                    }
                }
            }
        ]);

        return data[0] || null;
    }

    // Update booking with QR code
    async updateBookingQRCode(bookingId: string, qrCodeData: string): Promise<any> {
        return await bookingModel.findByIdAndUpdate(
            bookingId,
            {
                qrCodeData: qrCodeData,
                updatedAt: new Date()
            },
            { new: true }
        );
    }

    async getBookingsByUser(userId: string, limit = 50, skip = 0, status?: string) {
    const userObj = new Types.ObjectId(userId);

    // Build match conditions
    const matchConditions: any = { userId: userObj };
    
    // Add payment status filter if provided and not 'all'
    if (status && status !== 'all') {
        matchConditions.paymentStatus = status;
    }

    const data = await bookingModel.aggregate([
        { $match: matchConditions },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
            $lookup: {
                from: "movies",
                localField: "movieId",
                foreignField: "_id",
                as: "movie"
            }
        },
        { $unwind: { path: "$movie", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "theaters",
                localField: "theaterId",
                foreignField: "_id",
                as: "theater"
            }
        },
        { $unwind: { path: "$theater", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "shows",
                localField: "showId",
                foreignField: "_id",
                as: "show"
            }
        },
        { $unwind: { path: "$show", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                userId: 1,
                seats: 1,
                baseAmount: 1,
                serviceCharge: 1,
                totalAmount: 1,
                status: 1,
                paymentStatus: 1,
                bookedAt: 1,
                createdAt: 1,
                qrCodeData: 1,
                movie: { 
                    _id: "$movie._id", 
                    title: "$movie.title", 
                    moviename: "$movie.moviename", 
                    poster: "$movie.poster",
                    duration: "$movie.duration",
                    language: "$movie.language",
                    genre: "$movie.genre"
                },
                theater: { 
                    _id: "$theater._id", 
                    name: "$theater.theatername", 
                    theatername: "$theater.theatername", 
                    location: "$theater.location",
                    district: "$theater.district" 
                },
                show: {
                    _id: "$show._id",
                    date: "$show.date",
                    room: "$show.room",
                    screen: "$show.screen",
                    timeSlots: "$show.timeSlots",
                    price: "$show.price"
                }
            }
        }
    ]);

    return data;
}


}

export const bookingRepository = new BookingRepositories();
