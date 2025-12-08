import mongoose, { model, Schema } from "mongoose";
import { PaymentInterface } from "../interfaces/payment.interface";

const PaymentSchema: Schema = new Schema({
  bookingId: {
    type: mongoose.Types.ObjectId,
    ref: "Booking",
    required: true
  },
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: "inr"
  },
  status: {
    type: String,
    enum: ["pending", "succeeded", "failed", "canceled"],
    default: "pending"
  },
  paymentMethod: {
    type: String,
    default: "card"
  },
  stripePaymentIntentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  stripeCustomerId: {
    type: String
  },
  paymentDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
PaymentSchema.index({ bookingId: 1 });
PaymentSchema.index({ userId: 1 });
// PaymentSchema.index({ stripePaymentIntentId: 1 });
PaymentSchema.index({ createdAt: 1 });

export const paymentModel = model<PaymentInterface>("Payment", PaymentSchema);