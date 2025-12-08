import { Request, Response } from "express";
import { paymentRepository } from "../repository/payment.repositories";
import { bookingRepository } from "../repository/booking.repo";
import { CreatePaymentIntent, ConfirmPayment } from "../interfaces/payment.interface";
import Stripe from "stripe";
import bookingEmailService from "../services/booking.mail.service";
import { showModel } from "../models/show.model";
import mongoose from "mongoose";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: "2024-09-30.acacia",
// });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
// Stripe will use latest version automaticall

class PaymentController {

  async createPaymentIntent(req: Request, res: Response): Promise<Response> {
    try {
      const payload: CreatePaymentIntent = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      if (!payload.bookingId || !payload.amount) {
        return res.status(400).json({
          success: false,
          message: "Booking ID and amount are required"
        });
      }

      // Verify booking exists and belongs to user
      const booking = await bookingRepository.getBookingById(payload.bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found"
        });
      }

      if (booking.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized to pay for this booking"
        });
      }

      if (booking.paymentStatus === "Paid") {
        return res.status(400).json({
          success: false,
          message: "Booking is already paid"
        });
      }

      const result = await paymentRepository.createPaymentIntent({
        ...payload,
        userId,
      });

      return res.status(200).json({
        success: true,
        message: "Payment intent created successfully",
        data: result
      });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Internal server error";
      return res.status(500).json({
        success: false,
        message
      });
    }
  }

  async handleWebhook(req: Request, res: Response): Promise<Response> {
    const sig = req.headers['stripe-signature'] as string;

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      console.log("Webhook received:", event.type);

      await paymentRepository.handlePaymentWebhook(event);

      return res.status(200).json({ success: true, received: true });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Webhook error";
      console.error("Webhook error:", message);
      return res.status(400).json({
        success: false,
        message: `Webhook Error: ${message}`
      });
    }
  }

  async handlePaymentSuccess(req: Request, res: Response): Promise<Response> {
    try {
      const { bookingId, paymentId, paymentMethod } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      if (!bookingId) {
        return res.status(400).json({ success: false, message: "Booking ID is required" });
      }

      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        // Find the booking
        const booking = await bookingRepository.getCompleteBookingDetails(bookingId);
        if (!booking) {
          throw new Error("Booking not found");
        }

        // Check if booking belongs to user
        if (booking.userId.toString() !== userId) {
          // throw new Error("Unauthorized access to booking");
          return res.status(403).json({ success: false, message: "Unauthorized access to booking" })
        }

        // Update booking status to Confirmed and payment to Paid
        await bookingRepository.updateBooking(bookingId, {
          status: "Confirmed",
          paymentStatus: "Paid"
        });

        // Remove payment locks from show and mark seats as booked
        const paymentSessionId = `payment_${booking._id}`;
        await showModel.updateOne(
          { _id: booking.showId },
          {
            $pull: {
              locks: {
                sessionId: paymentSessionId,
                seat: { $in: booking.seats }
              }
            },
            $push: {
              bookedSeats: { $each: booking.seats }
            }
          },
          { session }
        );

        await session.commitTransaction();
        session.endSession();

        // Send payment confirmation email
        const emailResult = await bookingEmailService.sendPaymentConfirmation(bookingId);

        if (!emailResult.success) {
          console.warn("Payment confirmation email failed:", emailResult.error);
        }

        // Get updated booking details
        const updatedBooking = await bookingRepository.getCompleteBookingDetails(bookingId);

        return res.status(200).json({
          success: true,
          message: "Payment successful and booking confirmed",
          data: {
            booking: updatedBooking,
            emailSent: emailResult.success,
            emailError: emailResult.error
          }
        });

      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Server error";
      console.error("❌ Payment processing error:", msg);

      if (msg.includes("Booking not found")) {
        return res.status(404).json({ success: false, message: msg });
      }
      if (msg.includes("Unauthorized access")) {
        return res.status(403).json({ success: false, message: msg });
      }

      return res.status(500).json({ success: false, message: msg });
    }
  }

  // Optional Functions

  async confirmPayment(req: Request, res: Response): Promise<Response> {
    try {
      const payload: ConfirmPayment = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const payment = await paymentRepository.confirmPayment(
        payload.paymentIntentId,
        payload.bookingId
      );

      return res.status(200).json({
        success: true,
        message: "Payment confirmed successfully",
        data: payment
      });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Internal server error";
      return res.status(500).json({
        success: false,
        message
      });
    }
  }

  async getPaymentStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { paymentIntentId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const payment = await paymentRepository.getPaymentByIntentId(paymentIntentId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found"
        });
      }

      // Verify payment belongs to user
      if (payment.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized to access this payment"
        });
      }

      return res.status(200).json({
        success: true,
        data: payment
      });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Internal server error";
      return res.status(500).json({
        success: false,
        message
      });
    }
  }

  async cancelPayment(req: Request, res: Response): Promise<Response> {
    try {
      const { paymentIntentId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      // Verify payment belongs to user
      const payment = await paymentRepository.getPaymentByIntentId(paymentIntentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found"
        });
      }

      if (payment.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized to cancel this payment"
        });
      }

      await paymentRepository.cancelPayment(paymentIntentId);

      return res.status(200).json({
        success: true,
        message: "Payment canceled successfully"
      });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Internal server error";
      return res.status(500).json({
        success: false,
        message
      });
    }
  }

  async getUserPayments(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const payments = await paymentRepository.getPaymentsByUser(userId);

      return res.status(200).json({
        success: true,
        data: payments
      });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Internal server error";
      return res.status(500).json({
        success: false,
        message
      });
    }
  }

}

const paymentController = new PaymentController();
export { paymentController };