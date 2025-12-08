import { model, Schema, } from 'mongoose';
import { ShowInterface } from '../interfaces/show.interface';

const LockSchema = new Schema({
    seat: String,
    sessionId: String,
    expiresAt: Date,
}, { _id: false });

const ShowSchema: Schema = new Schema({

    movieId: {
        type: Schema.Types.ObjectId,
        ref: "Movie",
        required: true
    },
    theaterId: {
        type: Schema.Types.ObjectId,
        ref: "Theater",
        required: true
    },
    room: {
        name: { type: String, required: true },
        rows: { type: Number, required: true },
        columns: { type: Number, required: true }
    },
    screenNumber: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    timeSlots: [
        {
            time: { type: String, required: true },
            availableCategories: [
                {
                    category: {
                        type: String,
                        enum: ["Golden", "Platinum", "Diamond", "Royal"],
                        required: true
                    },
                    price: { type: Number, required: true }
                },
            ]
        }
    ],
    totalSeats: {
        type: Number,
        default: function () {
            return this.room.rows * this.room.columns;
        }
    },
    bookedSeats: {
        type: [String],
        default: []
    },
    locks: {
        type: [LockSchema], // transient locks
        default: []
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },


}, {
    timestamps: true
})

// Duplicate show prevention
ShowSchema.index({ movieId: 1, theaterId: 1, date: 1 }, { unique: true });

// Faster search
ShowSchema.index({ movieId: 1, date: 1 });
ShowSchema.index({ theaterId: 1 });
ShowSchema.index({ "locks.expiresAt": 1 });
// ShowSchema.index({ expiresAt: 1 }, { 
//   expireAfterSeconds: 0 // Documents will be deleted when expiresAt time is reached
// });

// ShowSchema.index({ date: 1 }, {
//     expireAfterSeconds: 86400, // 24 hours in seconds
//     partialFilterExpression: { date: { $lt: new Date() } }
// });

const showModel = model<ShowInterface>('Show', ShowSchema)
export { showModel }