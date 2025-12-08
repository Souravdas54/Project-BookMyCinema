import { model, Schema, Types } from 'mongoose';
import { MovieInterface } from '../interfaces/movie.interface';

const MovieSchema: Schema = new Schema({

    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    moviename: {
        type: String,
        required: true,
        trim: true
    },

    genre: {
        type: String,
        required: true,
        trim: true
    },

    language: {
        type: String,
        required: true,
        trim: true
    },

    duration: {
        type: String,
        required: true,
        trim: true
    },

    cast: {
        type: [String],
        required: true,
        trim: true
    },

    director: {
        type: [String],
        required: true,
        trim: true
    },

    releaseDate: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true,
        trim: true
    },

    poster: {
        type: String,
        required: true,
        trim: true
    },

    rating: {
        type: Number,
        required: true
    },
    ratingScale: {
        type: Number,
        enum: [5, 10],
        default: 5,
    },

    votes: {
        type: Number,
        default: 0
    },

    likes: {
        type: Number,
        default: 0
    },

    promoted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const movieModel = model<MovieInterface>("Movie", MovieSchema)
export { movieModel }