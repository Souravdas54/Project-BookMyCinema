import mongoose, { Types, ClientSession } from "mongoose";
import { PaymentInterface, CreatePaymentIntent } from "../interfaces/payment.interface";
import { paymentModel } from "../models/payment.model";
import { bookingModel } from "../models/booking.model";
import { showModel } from "../models/show.model";
import Stripe from "stripe";
import bookingEmailService from "../services/booking.mail.service";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: "2025-11-17.clover",
// });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
// Stripe will use latest version automaticall

class PaymentRepository {

  async createPaymentIntent(params: CreatePaymentIntent & { stripeCustomerId?: string }): Promise<{
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
    paymentMethodTypes: string[];
  }> {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

       // ✅ FIRST: Check booking status (এইটা আগে চেক করুন)
      const booking = await bookingModel.findById(params.bookingId).session(session);
      if (!booking) {
        throw new Error("Booking not found");
      }

      // Verify the booking belongs to the user
      if (booking.userId.toString() !== params.userId) {
        throw new Error("Unauthorized: Booking does not belong to user");
      }

      // ✅ IMPORTANT: Check booking payment status FIRST
      if (booking.paymentStatus === "Paid") {
        throw new Error("Booking is already paid");
      }

      // Check if payment already exists for this booking
      const existingPayment = await paymentModel.findOne({
        bookingId: new Types.ObjectId(params.bookingId),
        status: { $in: ["succeeded", "pending"] }
      }).session(session);

      if (existingPayment) {
        if (existingPayment.status === "succeeded") {
          throw new Error("Booking is already paid");
        } else if (existingPayment.status === "pending") {
          // Return existing payment intent if it's still valid
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(
              existingPayment.stripePaymentIntentId
            );

            // Check if payment intent is still valid
            if (paymentIntent.status === "requires_payment_method" ||
              paymentIntent.status === "requires_confirmation" ||
              paymentIntent.status === "requires_action") {

              return {
                clientSecret: paymentIntent.client_secret!,
                paymentIntentId: paymentIntent.id,
                amount: existingPayment.amount,
                currency: existingPayment.currency,
                paymentMethodTypes: paymentIntent.payment_method_types || ['card']
              };
            }
          } catch (stripeError) {
            // If stripe payment intent doesn't exist, continue to create new one
            console.log("Existing payment intent not found in Stripe, creating new one");
          }
        }
      }


      // Verify booking exists and get details
      // const booking = await bookingModel.findById(params.bookingId).session(session);
      // if (!booking) {
      //   throw new Error("Booking not found");
      // }

      // Verify the booking belongs to the user
      // if (booking.userId.toString() !== params.userId) {
      //   throw new Error("Unauthorized: Booking does not belong to user");
      // }

      // // Verify booking is not already paid
      // if (booking.paymentStatus === "Paid") {
      //   throw new Error("Booking is already paid");
      // }

      // Create Stripe Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(params.amount * 100), // Convert to cents/paisa
        currency: params.currency || "inr",
        customer: params.stripeCustomerId,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          bookingId: params.bookingId,
          userId: params.userId,
        },
      });

      // Create payment record
      await paymentModel.create([{
        bookingId: new Types.ObjectId(params.bookingId),
        userId: new Types.ObjectId(params.userId),
        amount: params.amount,
        currency: params.currency || "inr",
        status: "pending",
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: params.stripeCustomerId,
      }], { session });

      await session.commitTransaction();
      session.endSession();

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
        amount: params.amount,
        currency: params.currency || "inr",
        paymentMethodTypes: paymentIntent.payment_method_types || ['card']
      };

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async confirmPayment(paymentIntentId: string, bookingId: string): Promise<PaymentInterface> {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Verify payment intent exists and is successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== "succeeded") {
        throw new Error(`Payment not successful. Status: ${paymentIntent.status}`);
      }

      // Find and update payment record
      const payment = await paymentModel.findOne({
        stripePaymentIntentId: paymentIntentId
      }).session(session);

      if (!payment) {
        throw new Error("Payment record not found");
      }

      // Update payment status
      payment.status = "succeeded";
      payment.paymentDate = new Date();
      await payment.save({ session });

      // Update booking payment status
      await bookingModel.findByIdAndUpdate(
        bookingId,
        {
          paymentStatus: "Paid",
          status: "Confirmed"
        },
        { session }
      );

      // Get booking to update show seats permanently
      const booking = await bookingModel.findById(bookingId).session(session);
      if (booking) {
        // Remove locks and confirm booked seats permanently
        await showModel.findByIdAndUpdate(
          booking.showId,
          {
            $addToSet: { bookedSeats: { $each: booking.seats } },
            $pull: { locks: { seat: { $in: booking.seats } } }
          },
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();

      // Send booking confirmation email AFTER successful payment
      await this.sendBookingConfirmationEmail(bookingId);

      return payment.toObject();

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async handlePaymentWebhook(event: Stripe.Event): Promise<void> {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { bookingId } = paymentIntent.metadata;

        // Update payment status
        await paymentModel.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntent.id },
          {
            status: "succeeded",
            paymentDate: new Date(),
          },
          { session }
        );

        // Update booking status
        if (bookingId) {
          await bookingModel.findByIdAndUpdate(
            bookingId,
            {
              paymentStatus: "Paid",
              status: "Confirmed",
            },
            { session }
          );

          // Get booking to update show seats
          const booking = await bookingModel.findById(bookingId).session(session);
          if (booking) {
            await showModel.findByIdAndUpdate(
              booking.showId,
              {
                $addToSet: { bookedSeats: { $each: booking.seats } },
                $pull: { locks: { seat: { $in: booking.seats } } }
              },
              { session }
            );
          }
        }
      } else if (event.type === "payment_intent.payment_failed") {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        await paymentModel.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntent.id },
          { status: "failed" },
          { session }
        );

        // Optionally: Release locked seats after payment failure
        const payment = await paymentModel.findOne({
          stripePaymentIntentId: paymentIntent.id
        }).session(session);

        if (payment) {
          const booking = await bookingModel.findById(payment.bookingId).session(session);
          if (booking) {
            await showModel.findByIdAndUpdate(
              booking.showId,
              {
                $pull: {
                  locks: { seat: { $in: booking.seats } },
                  bookedSeats: { $in: booking.seats }
                }
              },
              { session }
            );
          }
        }
      }

      await session.commitTransaction();
      session.endSession();

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async getPaymentByIntentId(paymentIntentId: string): Promise<PaymentInterface | null> {
    return await paymentModel.findOne({ stripePaymentIntentId: paymentIntentId });
  }

  // Check if booking is already paid
  async isBookingPaid(bookingId: string): Promise<boolean> {
    const booking = await bookingModel.findById(bookingId);
    return booking?.paymentStatus === "Paid";
  }

  async sendBookingConfirmationEmail(bookingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get booking details
      const bookingDetails = await this.getBookingWithDetails(bookingId);
      if (!bookingDetails) {
        throw new Error("Booking not found");
      }

      // Send email
      const emailResult = await bookingEmailService.sendBookingConfirmation(bookingId);

      return {
        success: emailResult.success,
        error: emailResult.error
      };
    } catch (error) {
      console.error("Error sending booking confirmation email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async getPaymentsByUser(userId: string): Promise<PaymentInterface[]> {
    return await paymentModel.find({ userId: new Types.ObjectId(userId) })
      .populate("bookingId")
      .sort({ createdAt: -1 });
  }

  async cancelPayment(paymentIntentId: string): Promise<void> {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Cancel payment intent in Stripe
      await stripe.paymentIntents.cancel(paymentIntentId);

      // Update payment status
      await paymentModel.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntentId },
        { status: "canceled" },
        { session }
      );

      // Release locked seats
      const payment = await paymentModel.findOne({
        stripePaymentIntentId: paymentIntentId
      }).session(session);

      if (payment) {
        const booking = await bookingModel.findById(payment.bookingId).session(session);
        if (booking) {
          await showModel.findByIdAndUpdate(
            booking.showId,
            {
              $pull: { locks: { seat: { $in: booking.seats } } }
            },
            { session }
          );
        }

        // Delete the booking since payment was canceled
        await bookingModel.findByIdAndDelete(payment.bookingId, { session });
      }

      await session.commitTransaction();
      session.endSession();

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async getBookingWithDetails(bookingId: string) {
    const booking = await bookingModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(bookingId) } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "movies",
          localField: "movieId",
          foreignField: "_id",
          as: "movie"
        }
      },
      { $unwind: { path: "$movie", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "theaters",
          localField: "theaterId",
          foreignField: "_id",
          as: "theater"
        }
      },
      { $unwind: { path: "$theater", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "shows",
          localField: "showId",
          foreignField: "_id",
          as: "show"
        }
      },
      { $unwind: { path: "$show", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          seats: 1,
          baseAmount: 1,
          serviceCharge: 1,
          totalAmount: 1,
          status: 1,
          paymentStatus: 1,
          bookedAt: 1,
          qrCodeData: 1,
          createdAt: 1,
          "user.username": 1,
          "user.name": 1,
          "user.email": 1,
          "movie.moviename": 1,
          "theater.theatername": 1,
          "theater.district": 1,
          "show.room": 1,
          "show.screen": 1,
          "show.date": 1,
          "show.timeSlots": 1
        }
      }
    ]);

    return booking[0] || null;
  }

  // Update booking QR code
  async updateBookingQRCode(bookingId: string, qrCodeData: string) {
    return await bookingModel.findByIdAndUpdate(
      bookingId,
      { qrCodeData: qrCodeData },
      { new: true }
    );
  }

  // Get booking for QR verification
  async getBookingByTokenData(tokenData: any) {
    try {
      const booking = await bookingModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(tokenData.bookingId) } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "movies",
            localField: "movieId",
            foreignField: "_id",
            as: "movie"
          }
        },
        { $unwind: { path: "$movie", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "theaters",
            localField: "theaterId",
            foreignField: "_id",
            as: "theater"
          }
        },
        { $unwind: { path: "$theater", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "shows",
            localField: "showId",
            foreignField: "_id",
            as: "show"
          }
        },
        { $unwind: { path: "$show", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            seats: 1,
            totalAmount: 1,
            baseAmount: 1,
            serviceCharge: 1,
            status: 1,
            paymentStatus: 1,
            createdAt: 1,
            "user.username": 1,
            "user.name": 1,
            "movie.moviename": 1,
            "theater.theatername": 1,
            "theater.district": 1,
            "show.room": 1,
            "show.screen": 1,
            "show.date": 1,
            "show.timeSlots": 1
          }
        }
      ]);

      if (!booking || booking.length === 0) {
        return null;
      }

      const bookingData = booking[0];

      return {
        bookingId: bookingData._id.toString(),
        userName: bookingData.user?.username || bookingData.user?.name || "User",
        movieName: bookingData.movie?.moviename || "Movie",
        theaterName: bookingData.theater?.theatername || "Theater",
        district: bookingData.theater?.district || "District",
        room: bookingData.show?.room || "Room",
        screen: bookingData.show?.screen || "Screen 1",
        date: bookingData.show?.date ? new Date(bookingData.show.date).toISOString().split('T')[0] : "",
        time: bookingData.show?.timeSlots?.[0] || "Time not specified",
        seats: bookingData.seats || [],
        totalAmount: bookingData.totalAmount || 0,
        baseAmount: bookingData.baseAmount || 0,
        serviceCharge: bookingData.serviceCharge || 0,
        status: bookingData.status || "Pending",
        paymentStatus: bookingData.paymentStatus || "Unpaid",
        bookingDate: bookingData.createdAt ? new Date(bookingData.createdAt).toISOString().split('T')[0] : ""
      };
    } catch (error) {
      console.error("Error getting booking by token data:", error);
      return null;
    }
  }



}

export const paymentRepository = new PaymentRepository();