import mongoose from "mongoose";

export interface LockInterface {
    seat: string;
    sessionId: string;
    expiresAt: Date;
}

export interface SeatPrice {
    category: "Golden" | "Platinum" | "Diamond" | "Royal";
    price: number;
}

export interface ShowTimeSlot {
    time: string; // "12:00 PM"
    availableCategories: SeatPrice[];
}

export interface ShowInterface {
    movieId: mongoose.Types.ObjectId,
    theaterId: mongoose.Types.ObjectId,
    room: {
        name: string;      // Room A / Room B
        rows: number;      // e.g 5
        columns: number;   // e.g 10
    };
    screenNumber: string,
    date: Date,
    expiresAt: Date; // Add this field
    timeSlots: ShowTimeSlot[];
    totalSeats: number,
    bookedSeats: string[],
    locks: LockInterface[],

    createdBy: mongoose.Types.ObjectId, // ADMIN ID
    createdAt: Date,
    updatedAt: Date
}

export interface CreateMovieShow {
    movieId: mongoose.Types.ObjectId,
    theaterId: mongoose.Types.ObjectId,
    room: {
        name: string;      // Room A / Room B
        rows: number;      // e.g 5
        columns: number;   // e.g 10
    };
    screenNumber: string,
    date: Date,
    timeSlots: ShowTimeSlot[];
    totalSeats: number,
    bookedSeats: string[],
    createdAt: Date,
    updatedAt: Date
}
export interface ShowSummary {
    _id: string;
    theaterId: {
        _id: string;
        theatername: string;
        district?: string;
    };
    room: {
        name: string;
        rows: number;
        columns: number;
    };
    date: String;
    bookedSeats: string[];
}