import mongoose, { Types } from "mongoose";

export interface PaymentInterface {
    _id: Types.ObjectId;
    bookingId: Types.ObjectId;
    userId: Types.ObjectId;
    amount: number;
    currency: string;
    status: "pending" | "succeeded" | "failed" | "canceled";
    paymentMethod: string;
    stripePaymentIntentId: string;
    stripeCustomerId?: string;
    paymentDate?: Date;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface CreatePaymentIntent {
    bookingId: string;
    userId: string;
    amount: number;
    currency?: string;
    paymentMethod?: string;
}

export interface ConfirmPayment {
    paymentIntentId: string;
    bookingId: string;
}

export interface PaymentWebhook {
    id: string;
    type: string;
    data: {
        object: {
            id: string;
            customer: string;
            amount: number;
            currency: string;
            status: string;
            metadata: {
                bookingId: string;
                userId: string;
            };
        };
    };
}