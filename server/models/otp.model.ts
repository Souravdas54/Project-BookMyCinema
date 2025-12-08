import mongoose, { Schema } from "mongoose";

export interface OtpInterface {
    userId: mongoose.Types.ObjectId;
    otp: string;
    createdAt: Date;
}

const OtpSchema = new Schema<OtpInterface>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        otp: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 120 // OTP expires in 120 seconds 2 minutes
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// OtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 });

export default mongoose.model<OtpInterface>("otp", OtpSchema);
