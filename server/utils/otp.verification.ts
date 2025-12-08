import { Request, Response } from 'express';
import otpModel, { OtpInterface } from '../models/otp.model';

import { userModel } from '../models/user.Model';
import { userInterface } from '../interfaces/user.interface';

import { sendOtpEmail } from '../services/send.otpmail.service';

interface VerifyOtpRequest extends Request {
    body: {
        userId: string;
        otp: string;
    }
}

interface ResendOtpRequest extends Request {
    body: {
        userId: string;
    }
}

class OtpVerification {
    async verify_Otp(req: VerifyOtpRequest, res: Response): Promise<Response> {
        try {
            const { userId, otp } = req.body;
            console.log('Verify OTP Request:', { userId, otp });
            // Validate input
            if (!otp || !userId) {
                console.log("OTP and User ID are required");
                return res.status(400).json({
                    success: false,
                    message: "OTP and User ID are required"
                });
            }

            // Find the OTP in database
            const otpRecord = await otpModel.findOne({
                userId: userId,
                otp: otp
            });

            if (!otpRecord) {
                console.log("Invalid OTP or OTP expired");
                return res.status(400).json({
                    success: false,
                    message: "Invalid OTP or OTP expired"
                });
            }

            // Update user's verification status
            const updatedUser = await userModel.findByIdAndUpdate(
                userId,
                { isVerified: true },
                { new: true }
            );

            if (!updatedUser) {
                console.log("User not found");
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Delete the OTP record after successful verification
            await otpModel.deleteOne({ _id: otpRecord._id });

            console.log("OTP verified successfully",userId);

            // Send success response
            return res.json({
                success: true,
                message: "OTP verified successfully",
                user: {
                    id: updatedUser._id,
                    isVerified: updatedUser.isVerified
                }
            });

        } catch (error) {
            console.log("Internal server error", error instanceof Error ? error.message : 'Unknown error');
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async resend_OTP(req: ResendOtpRequest, res: Response): Promise<Response> {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "User ID is required"
                });
            }

            const user: userInterface | null = await userModel.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Send new OTP
            const otpSent = await sendOtpEmail(user.email, user);

            if (otpSent) {
                return res.json({
                    success: true,
                    message: "OTP sent successfully"
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: "Failed to send OTP"
                });
            }

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}

export const otpVerification = new OtpVerification();