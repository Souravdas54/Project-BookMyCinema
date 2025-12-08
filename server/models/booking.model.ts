import mongoose, { model, Schema } from "mongoose"
import { BookingInterfaace } from "../interfaces/booking.interface"

const BookingSchema: Schema = new Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true
  },
  movieId: {
    type: mongoose.Types.ObjectId,
    ref: "Movie",
    required: true
  },
  theaterId: {
    type: mongoose.Types.ObjectId,
    ref: "Theater",
    required: true
  },
  showId: {
    type: mongoose.Types.ObjectId,
    ref: "Show",
    required: true
  },
  seats: {
    type: [String],
    required: true
  },
  baseAmount: {
    type: Number,
    required: true,
    default: 0
  },
  serviceCharge: {
    type: Number,
    required: true,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["Confirmed", "Cancelled", "Pending"],
    default: "Confirmed"
  },
  paymentStatus: {
    type: String,
    enum: ["Paid", "Unpaid", "Failed", "Refunded"],
    default: "Unpaid"
  },
  bookedAt: {
    type: Date,
    default: Date.now
  },
   qrCodeData: {
        type: String
    },
}, {
  timestamps: true
});


// Indexes for better performance
BookingSchema.index({ userId: 1 });
BookingSchema.index({ showId: 1 });
BookingSchema.index({ createdAt: 1 });
BookingSchema.index({ paymentStatus: 1 });

const bookingModel = model<BookingInterfaace>("Booking", BookingSchema)
export { bookingModel }