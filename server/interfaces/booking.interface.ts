import mongoose, { Types } from "mongoose"

export interface BookingInterfaace {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;
    movieId: Types.ObjectId;
    theaterId: Types.ObjectId;
    showId: Types.ObjectId;
    seats: string[];
    baseAmount: number;
    serviceCharge: number;
    totalAmount: number;
    status: "Confirmed" | "Cancelled" | "Pending";
    paymentStatus: "Paid" | "Unpaid" | "Failed" | "Refunded";
    bookedAt?: Date;
    qrCodeData?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Add this new interface for booking documents with guaranteed _id
export interface BookingDocument extends BookingInterfaace {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateBooking {
    seats: string[];
    totalAmount: number;
    status: "Confirmed" | "Cancelled" | "Pending";
    paymentStatus: "Paid" | "Unpaid";
}

export interface LockSeatRequest {
    showId: string;
    seats: string[];
    sessionId: string;
    ttlSeconds?: number;
}

export interface ConfirmBookingRequest {
    showId: string;
    seats: string[];
    userId: string;
    totalAmount: number;
    sessionId: string;
}


// SEND EMAIL AND QR CODE


export interface EmailBookingDetails {
    bookingId: string;
    userName: string;
    userEmail: string;
    movieName: string;
    theaterName: string;
    district: string;
    room: string;
    screen: string;
    date: string;
    time: string;
    seats: string[];
    totalAmount: number;
    baseAmount: number;
    serviceCharge: number;
    bookingDate: string;
    bookingTime: string;
}

export interface QRVerificationResponse {
    success: boolean;
    data?: {
        bookingId: string;
        userName: string;
        movieName: string;
        theaterName: string;
        district: string;
        room: string;
        screen: string;
        date: string;
        time: string;
        seats: string[];
        totalAmount: number;
        baseAmount: number;
        serviceCharge: number;
        status: string;
        paymentStatus: string;
        bookingDate: string;
    };
    message?: string;
}


export interface PaymentSuccessRequest {
    bookingId: string;
    paymentId: string;
    paymentMethod?: string;
}