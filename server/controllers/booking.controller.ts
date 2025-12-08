import { Request, Response } from "express";
import { Types } from "mongoose";
import { bookingRepository } from "../repository/booking.repo";
import { showRepository } from "../repository/show.repo"; // you already have this for lockSeats
import { LockSeatRequest, ConfirmBookingRequest } from "../interfaces/booking.interface";

import bookingEmailService from "../services/booking.mail.service";
import QRService from '../services/qrcode.service';
import { bookingModel } from "../models/booking.model";

class BookingController {
    // Lock seats (calls showRepository.lockSeats)
    async lock(req: Request, res: Response): Promise<Response> {
        try {
            const payload: LockSeatRequest = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            if (!payload.showId || !payload.seats || !payload.sessionId) {
                return res.status(400).json({ success: false, message: "Missing fields" });
            }

            const result = await showRepository.lockSeats(payload.showId, payload.seats, payload.sessionId, payload.ttlSeconds || 300);

            return res.status(200).json({ success: true, message: "Seats locked", data: result.data });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Server error";
            return res.status(500).json({ success: false, message: msg });
        }
    }

    // Confirm booking: atomic update on show + create booking document
    async confirm(req: Request, res: Response): Promise<Response> {
        try {
            const payload = req.body;
            const userId = req.user?.userId;

            console.log('📨 CONFIRM REQUEST RECEIVED:', {
                body: payload,
                userId: userId,
                headers: req.headers
            });

            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            // Validate required fields
            const requiredFields = ['showId', 'seats', 'sessionId', 'totalAmount'];
            const missingFields = requiredFields.filter(field => !payload[field]);

            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Missing required fields: ${missingFields.join(', ')}`
                });
            }

            // Additional validation for seats array
            if (!Array.isArray(payload.seats) || payload.seats.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Seats must be a non-empty array"
                });
            }

            console.log('VALIDATION CHECK:', {
                missingFields,
                showId: payload.showId,
                seats: payload.seats,
                sessionId: payload.sessionId,
                totalAmount: payload.totalAmount
            });


            // confirm & create booking
            const booking = await bookingRepository.confirmAndCreateBooking({
                showId: payload.showId,
                seats: payload.seats,
                sessionId: payload.sessionId,
                userId: userId,
                totalAmount: payload.totalAmount
            }) as any;

            // Check if booking was created successfully and has _id
            if (!booking || !booking._id) {
                throw new Error("Failed to create booking or booking ID not generated");
            }

            // Convert booking to any type to access _id safely
            const bookingData = booking as any;
            const bookingId = bookingData._id.toString();

            console.log('✅ Booking created with ID:', bookingId);

            // Generate QR code
            let qrCodeDataURL = "";
            try {
                qrCodeDataURL = await QRService.generateBookingQRCode(booking._id.toString());
                console.log('✅ QR code generated');

                // Update booking with QR code
                await bookingRepository.updateBookingQRCode(booking._id.toString(), qrCodeDataURL);
            } catch (qrError) {
                console.error('❌ QR code generation error:', qrError);
            }

            // Send confirmation email
            let emailSent = false;
            let emailError = "";
            try {
                const emailResult = await bookingEmailService.sendBookingConfirmation(booking._id.toString());
                emailSent = emailResult.success;
                if (!emailResult.success) {
                    emailError = emailResult.error || "Failed to send email";
                    console.warn('⚠️ Email sending failed:', emailError);
                } else {
                    console.log('✅ Email sent successfully');
                }
            } catch (emailErr) {
                emailError = emailErr instanceof Error ? emailErr.message : "Email sending failed";
                console.error('❌ Email sending error:', emailErr);
            }

            const bookingDetails = await bookingRepository.getCompleteBookingDetails(booking._id.toString());

            // Prepare response data
            const responseData = {
                booking: {
                    ...bookingDetails,
                    qrCodeData: qrCodeDataURL || bookingDetails?.qrCodeData || ""
                },
                bookingId: booking._id.toString(),
                emailStatus: {
                    sent: emailSent,
                    error: emailError
                }
            };

            return res.status(201).json({
                success: true,
                message: "Booking confirmed" + (emailSent ? " and email sent" : ""),
                data: responseData
            });

            // return res.status(201).json({ success: true, message: "Booking confirmed", data: booking });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Server error";
            console.error("❌ CONTROLLER ERROR - confirm:", msg);

            if (typeof msg === "string" && (msg.includes("already booked") || msg.includes("not locked"))) {
                return res.status(409).json({ success: false, message: msg });
            }
            return res.status(500).json({ success: false, message: msg });
        }
    }

    async getUserBookings(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const limit = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : 10;
            const skip = typeof req.query.skip === "string" ? parseInt(req.query.skip, 10) : 0;
            const page = typeof req.query.page === "string" ? parseInt(req.query.page, 10) : 1;
            const status = typeof req.query.status === "string" ? req.query.status : undefined;

            // Calculate skip based on page
            const calculatedSkip = (page - 1) * limit;

            // Get bookings with filter - IMPORTANT: Pass status filter
            const bookings = await bookingRepository.getBookingsByUser(userId, limit, calculatedSkip);

            // Get total count for pagination
            const totalCount = await bookingModel.countDocuments({
                userId: new Types.ObjectId(userId),
                ...(status && status !== 'all' ? { paymentStatus: status } : {})
            });

            const pagination = {
                currentPage: page,
                itemsPerPage: limit,
                totalItems: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                hasNextPage: page < Math.ceil(totalCount / limit),
                hasPrevPage: page > 1
            };

            return res.json({
                success: true,
                data: {
                    bookings,
                    pagination
                }
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Server error";
            return res.status(500).json({ success: false, message: msg });
        }
    }

    // Get booking by id
    async getBookingById(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const booking = await bookingRepository.getBookingById(id);
            if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
            return res.json({ success: true, data: booking });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Server error";
            return res.status(500).json({ success: false, message: msg });
        }
    }

    // Admin or user update booking (status/payment)
    async updateBooking(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const payload = req.body;
            const updated = await bookingRepository.updateBooking(id, payload, req.user?.userId);
            return res.json({ success: true, message: "Booking updated", data: updated });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Server error";
            return res.status(500).json({ success: false, message: msg });
        }
    }

    // Delete booking (admin or owner)
    async deleteBooking(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            // permission check may be added here (admin or owner)
            await bookingRepository.deleteBooking(id);
            return res.json({ success: true, message: "Booking deleted" });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Server error";
            return res.status(500).json({ success: false, message: msg });
        }
    }

    // Add this to your booking controller
    async release(req: Request, res: Response): Promise<Response> {
        try {
            const { showId, seats, sessionId } = req.body;
            const userId = req.user?.userId;

            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            if (!showId || !seats || !sessionId) {
                return res.status(400).json({ success: false, message: "Missing required fields" });
            }

            // You need to add this method to bookingRepository
            const result = await bookingRepository.releaseSeats(showId, seats, sessionId);

            return res.status(200).json({ success: true, message: "Seats released", data: result });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Server error";
            return res.status(500).json({ success: false, message: msg });
        }
    }

    // Get all bookings for admin dashboard
    async getAllBookingsForAdmin(req: Request, res: Response): Promise<Response> {
        try {
            const page = typeof req.query.page === "string" ? parseInt(req.query.page, 10) : 1;
            const limit = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : 10;
            const status = typeof req.query.status === "string" ? req.query.status : undefined;

            const skip = (page - 1) * limit;

            // Build filter
            const filter: any = {};
            if (status && status !== 'all') {
                filter.paymentStatus = status;
            }

            // Get bookings with populated data
            const bookings = await bookingModel.aggregate([
                { $match: filter },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limit },
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
                        seats: 1,
                        totalAmount: 1,
                        baseAmount: 1,
                        serviceCharge: 1,
                        status: 1,
                        paymentStatus: 1,
                        bookedAt: 1,
                        qrCodeData: 1,
                        createdAt: 1,
                        user: {
                            _id: "$user._id",
                            name: "$user.name",
                            email: "$user.email",
                            username: "$user.username"
                        },
                        movie: {
                            _id: "$movie._id",
                            title: { $ifNull: ["$movie.title", "$movie.moviename"] },
                            poster: "$movie.poster",
                            duration: "$movie.duration",
                            language: "$movie.language"
                        },
                        theater: {
                            _id: "$theater._id",
                            name: { $ifNull: ["$theater.name", "$theater.theatername"] },
                            location: "$theater.location",
                            district: "$theater.district"
                        },
                        show: {
                            _id: "$show._id",
                            date: "$show.date",
                            room: "$show.room",
                            timeSlots: "$show.timeSlots"
                        }
                    }
                }
            ]);

            // Get total count
            const totalCount = await bookingModel.countDocuments(filter);

            return res.json({
                success: true,
                data: {
                    bookings: bookings,
                    pagination: {
                        currentPage: page,
                        itemsPerPage: limit,
                        totalItems: totalCount,
                        totalPages: Math.ceil(totalCount / limit),
                        hasNextPage: page < Math.ceil(totalCount / limit),
                        hasPrevPage: page > 1
                    }
                }
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Server error";
            return res.status(500).json({ success: false, message: msg });
        }
    }
}

const bookingController = new BookingController();
export { bookingController }
