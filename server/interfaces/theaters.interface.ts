import mongoose from "mongoose";

export interface TheatersInterface {
    userId: mongoose.Types.ObjectId;
    theatername: String,
    screens: String,
    contact: String,
    assignedMovies: mongoose.Types.ObjectId[],
    district: string;
    state: string;

}

export interface CreateTheatersInterface {
    theatername: String,
    screens: String,
    contact: String,
    assignedMovies: mongoose.Types.ObjectId[],
    district: string;
    state: string;

}

