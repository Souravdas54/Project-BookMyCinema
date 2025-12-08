"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Box, Container, Paper, Typography, Button, Stepper, Step, StepLabel,
  Card, CardContent, Divider, Alert, CircularProgress, Chip, Stack
} from "@mui/material";
import { Check, ConfirmationNumber, LocalMovies, LocationOn, Schedule, ErrorOutline } from "@mui/icons-material";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { createPaymentIntent, confirmPayment, checkBookingStatus } from "@/app/api/payment.endpoint";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const steps = ['Booking Confirmed', 'Payment Processing', 'Ticket Generated'];

// Helper to get userId from sessionStorage
const getUserIdFromStorage = (): string | null => {
  if (typeof window !== 'undefined') {
    const userData = sessionStorage.getItem("userData");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user._id || user.id || null;
      } catch (error) {
        console.error('Error parsing userData:', error);
        return null;
      }
    }
  }
  return null;
};

// Payment Form Component
function CheckoutForm({ clientSecret, bookingId, totalAmount, onPaymentSuccess }: {
  clientSecret: string; bookingId: string; totalAmount: number; onPaymentSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?bookingId=${bookingId}`,
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message || "Payment failed");
        setLoading(false);
        return;
      }

      // Check payment status
      const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

      if (paymentIntent?.status === 'succeeded') {
        try {
          await confirmPayment(paymentIntent.id, bookingId);
          onPaymentSuccess();
        } catch (err: unknown) {
          console.error('Error confirming payment with backend:', err);
          // Still mark as success since Stripe succeeded
          onPaymentSuccess();
        }
      } else if (paymentIntent?.status === 'requires_action' || paymentIntent?.status === 'requires_confirmation') {
        setError("Additional authentication required. Please complete the verification.");
      } else {
        setError(`Payment status: ${paymentIntent?.status}. Please try again.`);
      }
    } catch (err: any) {
      setError(err.message || "Payment processing failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={!stripe || loading}
        sx={{
          py: 2,
          mt: 3,
          backgroundColor: "#3b82f6",
          fontSize: "1.1rem",
          fontWeight: "bold",
          "&:hover": {
            backgroundColor: "#2563eb",
          },
        }}
      >
        {loading ? (
          <CircularProgress size={24} sx={{ color: "white" }} />
        ) : (
          `Pay ₹${totalAmount}`
        )}
      </Button>
    </form>
  );
}

// Main Payment Page
export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const bookingId = searchParams.get('bookingId');
  const seats = searchParams.get('seats')?.split(',') || [];
  const baseAmount = parseFloat(searchParams.get('total') || "0");
  const movieName = searchParams.get('movieName') || "Movie";
  const theaterName = searchParams.get('theaterName') || "Theater";
  const showTime = searchParams.get('showTime') || "Show Time";

  // Calculate service charge (10%)
  const serviceCharge = baseAmount * 0.10;
  const totalAmount = baseAmount + serviceCharge;

  const [activeStep, setActiveStep] = useState(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [bookingChecked, setBookingChecked] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<any>(null);

  // Get userId from sessionStorage when component mounts
  useEffect(() => {
    const storedUserId = getUserIdFromStorage();
    setUserId(storedUserId);

    if (typeof window !== 'undefined') {
      console.log('sessionStorage check:', {
        accessToken: sessionStorage.getItem("accessToken"),
        userData: sessionStorage.getItem("userData"),
        parsedUserId: storedUserId
      });
    }
  }, []);

  // Check booking status first
  useEffect(() => {
    // if (!bookingId || !userId) return;
    if (!bookingId) {
      console.error('❌ No bookingId in URL params');
      setError('Invalid booking details. Please go back and try again.');
      return;
    }

    // Check if bookingId is actually "undefined" string
    if (bookingId === "undefined" || bookingId === "null") {
      console.error('❌ bookingId is string "undefined":', bookingId);
      setError('Invalid booking ID. Please go back and select seats again.');

      // Optional: Redirect back after delay
      setTimeout(() => {
        router.push('/movies');
      }, 3000);
      return;
    }

    // Validate MongoDB ObjectId format
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(bookingId)) {
      console.error('❌ Invalid bookingId format:', bookingId);
      setError(`Invalid booking ID format. Please check your booking.`);
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await checkBookingStatus(bookingId);
        if (response.success) {
          setBookingStatus(response.data);
          setBookingChecked(true);

          // If booking is already paid, show appropriate message
          if (response.data.paymentStatus === 'Paid') {
            setError('This booking is already paid. Please check your bookings page.');
            return false;
          }

          if (response.data.status === 'Cancelled') {
            setError('This booking has been cancelled.');
            return false;
          }

          return true;
        }
      } catch (err: unknown) {
        console.error('Error checking booking status:', err);
        setError(err instanceof Error ? err.message : 'Failed to check booking status');
        return false;
      }
    };

    checkStatus();
  }, [bookingId, userId,router]);

  // Create payment intent after booking is checked
  useEffect(() => {
    if (!bookingId || !seats.length || !userId || !bookingChecked) {
      return;
    }

    if (bookingStatus?.paymentStatus === 'Paid') {
      // Don't create payment intent for already paid booking
      return;
    }

    // Create payment intent when component mounts
    const createIntent = async () => {
      setPaymentLoading(true);
      setError("");

      try {
        const response = await createPaymentIntent({
          bookingId,
          seats,
          amount: totalAmount, // Send total amount with service charge
          movieName,
          theaterName,
          showTime,
          userId: userId,
          currency: "inr"
        });

        console.log('Payment intent creation response:', response);

        if (response.success && response.data?.clientSecret) {
          setClientSecret(response.data.clientSecret);
          setActiveStep(1); // Move to payment step
        } else {
          setError(response.message || "Failed to initialize payment");
        }
      } catch (err: any) {
        console.error('Payment intent error details:', err);
        setError(err.message || "Failed to initialize payment");

        // If token is invalid, redirect to login
        if (err.message.includes('token') || err.message.includes('login')) {
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      } finally {
        setPaymentLoading(false);
      }
    };

    createIntent();
  }, [bookingId, seats, userId, bookingChecked, bookingStatus, router, totalAmount, movieName, theaterName, showTime]);

  const handlePaymentSuccess = () => {
    setActiveStep(2);
    setPaymentSuccess(true);

    // Redirect to success page after delay
    setTimeout(() => {
      router.push(`/payment/success?bookingId=${bookingId}&seats=${seats.join(',')}&total=${totalAmount}`);
    }, 2000);
  };

  const handleViewBookings = () => {
    router.push('/bookings');
  };

  const handleNewBooking = () => {
    router.push('/movies');
  };

  if (error && error.includes('already paid')) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Paper sx={{ p: 4 }}>
          <ErrorOutline sx={{ fontSize: 64, color: '#f59e0b', mb: 2 }} />
          <Typography variant="h4" color="#f59e0b" gutterBottom>
            Booking Already Paid
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            This booking has already been paid. You can view your tickets in the bookings section.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            {/* <Button
              variant="contained"
              size="large"
              onClick={handleViewBookings}
            >
              View My Bookings
            </Button> */}
            {/* <Button
              variant="outlined"
              size="large"
              onClick={handleNewBooking}
            >
              Book New Tickets
            </Button> */}
          </Stack>
        </Paper>
      </Container>
    );
  }

  if (error && error.includes('login')) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => router.push('/')}
        >
          Go to Login
        </Button>
      </Container>
    );
  }

  if (!bookingId) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Invalid booking details</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ backgroundColor: "#f8fafc", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="md">
        {/* Header */}
        <Paper sx={{ p: 4, mb: 4, textAlign: "center" }}>
          <Typography variant="h4" fontWeight="bold" color="#1f2937" gutterBottom>
            {paymentSuccess ? "🎉 Payment Successful!" : "Complete Your Payment"}
          </Typography>
          <Typography variant="h6" color="#64748b">
            {paymentSuccess
              ? "Your tickets have been booked successfully!"
              : "Secure payment powered by Stripe"
            }
          </Typography>
        </Paper>

        <Box sx={{ display: "flex", gap: 4, flexDirection: { xs: "column", md: "row" } }}>
          {/* Payment Section */}
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 4, mb: 3 }}>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Paper>

            <Paper sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight="bold" color="#1f2937" gutterBottom>
                Payment Details
              </Typography>

              {error && !error.includes('already paid') && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {!paymentSuccess ? (
                <Box>
                  {paymentLoading ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress />
                      <Typography variant="body2" color="#64748b" sx={{ mt: 2 }}>
                        {bookingChecked ? 'Initializing payment...' : 'Checking booking status...'}
                      </Typography>
                    </Box>
                  ) : clientSecret ? (
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret,
                        appearance: {
                          theme: 'stripe',
                          variables: {
                            colorPrimary: '#3b82f6',
                            colorBackground: '#f8fafc',
                            colorText: '#1f2937',
                            fontFamily: 'Inter, system-ui, sans-serif',
                          }
                        }
                      }}
                    >
                      <CheckoutForm
                        clientSecret={clientSecret}
                        bookingId={bookingId}
                        totalAmount={totalAmount}
                        onPaymentSuccess={handlePaymentSuccess}
                      />
                    </Elements>
                  ) : (
                    <Alert severity="info">
                      {bookingChecked ? 'Preparing payment form...' : 'Checking booking details...'}
                    </Alert>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <Check sx={{ fontSize: 64, color: "#22c55e", mb: 2 }} />
                  <Typography variant="h6" color="#22c55e" gutterBottom>
                    Payment Successful!
                  </Typography>
                  <Typography variant="body2" color="#64748b">
                    Redirecting to your tickets...
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>

          {/* Booking Summary */}
          <Box sx={{ width: { xs: "100%", md: 300 } }}>
            <Paper sx={{ p: 3, position: "sticky", top: 24 }}>
              <Typography variant="h6" fontWeight="bold" color="#1f2937" gutterBottom>
                Booking Summary
              </Typography>

              {bookingStatus && (
                <Alert
                  severity={bookingStatus.paymentStatus === 'Paid' ? 'success' : 'info'}
                  sx={{ mb: 2 }}
                >
                  Status: {bookingStatus.status} | Payment: {bookingStatus.paymentStatus}
                </Alert>
              )}

              <Card sx={{ backgroundColor: "#f8fafc", mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <LocalMovies sx={{ color: "#3b82f6" }} />
                    <Typography variant="body1" fontWeight="600">
                      {movieName}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <LocationOn sx={{ color: "#64748b", fontSize: 18 }} />
                    <Typography variant="body2" color="#64748b">
                      {theaterName}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <Schedule sx={{ color: "#64748b", fontSize: 18 }} />
                    <Typography variant="body2" color="#64748b">
                      {showTime}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ConfirmationNumber sx={{ color: "#64748b", fontSize: 18 }} />
                    <Typography variant="body2" color="#64748b">
                      {seats.length} Ticket{seats.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="#64748b" gutterBottom>
                  Selected Seats
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {seats.map((seat) => (
                    <Chip key={seat} label={seat} size="small" />
                  ))}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Amount Breakdown */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" color="#64748b">
                    Ticket Price:
                  </Typography>
                  <Typography variant="body2" fontWeight="500">
                    ₹{baseAmount.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" color="#64748b">
                    Service Charge (10%):
                  </Typography>
                  <Typography variant="body2" fontWeight="500">
                    ₹{serviceCharge.toFixed(2)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body1" fontWeight="bold">
                    Total Amount:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="#3b82f6">
                    ₹{totalAmount.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
