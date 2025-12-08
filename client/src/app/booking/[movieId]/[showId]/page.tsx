"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Box, Container, Card, CardContent, Button, Typography, Alert, CircularProgress, Paper, Chip, Divider, } from "@mui/material";
import { ArrowBack, LocationOn, ScreenShare, ConfirmationNumber, Movie, Schedule, } from "@mui/icons-material";
import { useAppDispatch } from "@/hooks/hookes";
import { setShow, clearBooking, setSessionId } from "@/store/bookingSlice";
import SeatSelectionDialog from "@/components/SeatSelectionDialog";
import { getShowById, confirmBooking, } from "@/app/api/seatbooking.endpoint";
import { Show, ConfirmBookingRequest, SeatPrice, ShowTimeSlot } from "@/types/booking";
// import { getShowByTheaterMovieDateTime } from "@/app/api/show.endpoint";
import { ScreenLockPortrait, TheaterComedy } from "@mui/icons-material";

import { getMovieById } from "@/app/api/movie.endpoint";

interface MovieData {
  moviename?: string;
  title?: string;
  _id?: string;
}

// Add calculateTotalAmount function
const calculateTotalAmount = (seats: string[]): number => {
  return seats.reduce((total, seatId) => {
    // Seat pricing based on row
    if (seatId.startsWith('A') || seatId.startsWith('B') || seatId.startsWith('C')) {
      return total + 200; // Golden
    } else if (seatId.startsWith('D') || seatId.startsWith('E') || seatId.startsWith('F')) {
      return total + 180; // Platinum
    } else if (seatId.startsWith('G') || seatId.startsWith('H')) {
      return total + 220; // Diamond
    } else if (seatId.startsWith('I') || seatId.startsWith('J')) {
      return total + 250; // Royal
    }
    return total + 200; // Default
  }, 0);
};

export default function SeatBookingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const movieId = params.movieId as string;
  const showId = params.showId as string; // FIXED: Using showId instead of theaterId
  const selectedTime = searchParams.get("time");
  const selectedDate = searchParams.get("date");

  const [show, setShowData] = useState<Show | null>(null);
  const [movie, setMovie] = useState<MovieData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [timeSelectionLoading, setTimeSelectionLoading] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string>(""); // Store session ID

  useEffect(() => {
    if (showId && showId !== "undefined") {
      fetchShowData();
    } else {
      setError("Invalid show ID");
      setLoading(false);
    }

    return () => {
      dispatch(clearBooking());
    };
  }, [dispatch, showId]); // FIXED: Using showId instead of theaterId

  const fetchShowData = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Fetching show data for ID:", showId);
      console.log("Selected time:", selectedTime);
      console.log("Selected date:", selectedDate);

      // Fetch show data - using showId (correct)
      const showResponse = await getShowById(showId);

      if (!showResponse.success || !showResponse.data) {
        throw new Error(showResponse.message || "Show not found");
      }

      const showData: Show = showResponse.data;
      setShowData(showData);

      // Fetch movie data
      const movieResponse = await getMovieById(showData.movieId);

      if (!movieResponse.success || !movieResponse.data) {
        throw new Error("Failed to fetch movie details");
      }

      const movieData: MovieData = movieResponse.data as MovieData;
      setMovie(movieData);

      // Generate session ID and store it
      const newSessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      setCurrentSessionId(newSessionId); // Store session ID
      dispatch(setSessionId(newSessionId));

      // Get default category for selected time
      const timeSlot = showData.timeSlots.find((slot: ShowTimeSlot) => slot.time === selectedTime);
      const defaultCategory = timeSlot?.availableCategories[0];

      if (!defaultCategory) {
        throw new Error("No available seat categories for selected time");
      }

      // Initialize booking state
      dispatch(
        setShow({
          showId: showData._id,
          price: defaultCategory.price,
          sessionId: newSessionId, // Use the same session ID
          theaterName: showData.theaterId.theatername,
          movieName: movieData.moviename || movieData.title || "Movie",
          showTime: selectedTime || showData.timeSlots[0]?.time || "",
          date: selectedDate || showData.date,
          category: defaultCategory,
        })
      );

    } catch (err: unknown) {
      console.error("Error fetching show data:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load show details");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fixed handleSeatsConfirmed function
  // const handleSeatsConfirmed = async (bookingData: {
  //   seats: string[];
  //   sessionId: string;
  //   showId: string;
  // }) => {
  //   if (!show) return;

  //   setBookingLoading(true);
  //   try {
  //     console.log('🎯 Parent component - confirming booking:', bookingData);

  //     // Calculate total amount using the function
  //     const totalAmount = calculateTotalAmount(bookingData.seats);

  //     console.log('💰 Calculated total amount:', totalAmount, 'for seats:', bookingData.seats);

  //     // CRITICAL FIX: Create the correct payload structure
  //     const confirmPayload: ConfirmBookingRequest = {
  //       showId: bookingData.showId,
  //       seats: bookingData.seats, // Direct array - NOT nested
  //       sessionId: bookingData.sessionId, // Use the SAME sessionId from dialog
  //       totalAmount: totalAmount, // This was NULL - now calculated
  //       userId: "current-user-id" // This should come from auth context
  //     };

  //     console.log('📦 FINAL booking payload:', confirmPayload);

  //     const response = await confirmBooking(confirmPayload);

  //     if (response.success) {
        
  //       console.log('✅ Booking confirmed successfully!', response.data);
  //       router.push(
  //         `/payment?bookingId=${response.data._id}&seats=${bookingData.seats.join(
  //           ","
  //         )}&total=${totalAmount}`
  //       );
  //     } else {
  //       setError(response.message || "Failed to confirm booking");
  //     }
  //   } catch (err: unknown) {
  //     console.error("Error confirming booking:", err);
  //     if (err instanceof Error) {
  //       setError(err.message);
  //     } else {
  //       setError("Failed to confirm booking");
  //     }
  //   } finally {
  //     setBookingLoading(false);
  //     setDialogOpen(false);
  //   }
  // };

  // Fixed handleSeatsConfirmed function
const handleSeatsConfirmed = async (bookingData: {
  seats: string[];
  sessionId: string;
  showId: string;
}) => {
  if (!show) return;

  setBookingLoading(true);
  try {
    console.log('🎯 Parent component - confirming booking:', bookingData);

    // Calculate total amount using the function
    const totalAmount = calculateTotalAmount(bookingData.seats);

    console.log('💰 Calculated total amount:', totalAmount, 'for seats:', bookingData.seats);

    // Get user ID from session storage
    let userId = "current-user-id";
    if (typeof window !== 'undefined') {
      const userData = sessionStorage.getItem("userData");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          userId = user._id || user.id || userId;
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    }

    // Create payload
    const confirmPayload: ConfirmBookingRequest = {
      showId: bookingData.showId,
      seats: bookingData.seats,
      sessionId: bookingData.sessionId,
      totalAmount: totalAmount,
      userId: userId // Use actual user ID
    };

    console.log('📦 FINAL booking payload:', confirmPayload);

    const response = await confirmBooking(confirmPayload);

    // DEBUG: Log the full response to understand structure
    console.log('🔍 FULL BOOKING RESPONSE:', {
      success: response.success,
      message: response.message,
      data: response.data,
      dataType: typeof response.data,
      dataKeys: response.data ? Object.keys(response.data) : 'No data',
      fullResponse: JSON.stringify(response, null, 2)
    });

    if (response.success) {
      // CRITICAL FIX: Based on your backend response structure
      // The booking ID could be in multiple places. Let's try all possibilities.
      let bookingId = '';
      
      // Check different possible locations
      if (response.data && typeof response.data === 'object') {
        // 1. Check if data itself has _id (if data is the booking)
        if (response.data._id && typeof response.data._id === 'string') {
          bookingId = response.data._id;
        }
        // 2. Check if data has booking object with _id
        else if (response.data.booking && response.data.booking._id) {
          bookingId = response.data.booking._id;
        }
        // 3. Check if data has bookingId field
        else if (response.data.bookingId) {
          bookingId = response.data.bookingId;
        }
        // 4. Try to find any ID field in the response data
        else {
          // Deep search for ID fields
          const findIdInObject = (obj: any): string => {
            if (!obj || typeof obj !== 'object') return '';
            
            // Check common ID field names
            const idFields = ['_id', 'id', 'bookingId', 'booking_id'];
            for (const field of idFields) {
              if (obj[field] && typeof obj[field] === 'string') {
                return obj[field];
              }
            }
            
            // Recursively search nested objects
            for (const key in obj) {
              if (typeof obj[key] === 'object') {
                const found = findIdInObject(obj[key]);
                if (found) return found;
              }
            }
            
            return '';
          };
          
          bookingId = findIdInObject(response.data);
        }
      }
      
      // 5. Check root level
      if (!bookingId && response.bookingId) {
        bookingId = response.bookingId;
      }

      console.log('✅ Extracted bookingId:', bookingId);
      
      // Validate bookingId format
      if (!bookingId) {
        console.error('❌ No booking ID found. Response structure:', response);
        throw new Error('Booking ID not found. Please contact support.');
      }
      
      // Validate it's a valid MongoDB ObjectId (24 hex chars)
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(bookingId)) {
        console.error('❌ Invalid booking ID format:', bookingId);
        throw new Error('Invalid booking ID format. Please try again.');
      }

      console.log('✅ Booking confirmed successfully! Booking ID:', bookingId);

      // Redirect to payment page with the CORRECT bookingId
      router.push(
        `/payment?bookingId=${bookingId}&seats=${bookingData.seats.join(",")}&total=${totalAmount}`
      );
    } else {
      setError(response.message || "Failed to confirm booking");
    }
  } catch (err: unknown) {
    console.error("Error confirming booking:", err);
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("Failed to confirm booking");
    }
  } finally {
    setBookingLoading(false);
    setDialogOpen(false);
  }
};

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1f2937",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress
            sx={{
              color: "#3b82f6",
              width: "60px !important",
              height: "60px !important",
              mb: 2,
            }}
          />
          <Typography variant="h6" color="white">
            Loading show details...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error || !show || !movie) {
    return (
      <Box sx={{ backgroundColor: "#1f2937", minHeight: "100vh", p: 3 }}>
        <Container maxWidth="lg">
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
            }}
            action={
              <Button color="inherit" size="small" onClick={() => router.back()}>
                GO BACK
              </Button>
            }
          >
            {error || "Show not found"}
          </Alert>
        </Container>
      </Box>
    );
  }

  const availableSeats = show.totalSeats - show.bookedSeats.length;
  const isFewSeatsLeft = availableSeats > 0 && availableSeats <= 10;

  // Get available categories for selected time
  const selectedTimeSlot = show.timeSlots.find((slot: ShowTimeSlot) => slot.time === selectedTime);
  const availableCategories = selectedTimeSlot?.availableCategories || [];

  return (
    <Box sx={{ backgroundColor: "#1f2937", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Card
          sx={{
            mb: 4,
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            backgroundImage: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => router.back()}
              sx={{ color: "white", mb: 3 }}
            >
              Back to Theaters
            </Button>

            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}>
              <Box sx={{ flex: 1, mb: { xs: 2, md: 0 } }}>
                <Typography variant="h3" fontWeight="bold" color="white" gutterBottom>
                  {movie.moviename || movie.title || "Movie"}
                </Typography>
                <Typography variant="h5" color="#3b82f6" gutterBottom>
                  {show.theaterId.theatername}
                </Typography>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, alignItems: "center", mt: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationOn sx={{ color: "#94a3b8" }} />
                    <Typography variant="body1" color="#94a3b8">
                      {show.theaterId.district || show.theaterId.district || "Location not specified"}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ScreenShare sx={{ color: "#94a3b8" }} />
                    <Typography variant="body1" color="#94a3b8">
                      {show.room.name} • Screen {show.screenNumber}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ConfirmationNumber sx={{ color: "#94a3b8" }} />
                    <Typography
                      variant="body1"
                      color={isFewSeatsLeft ? "#f59e0b" : "#94a3b8"}
                      fontWeight={isFewSeatsLeft ? "bold" : "normal"}
                    >
                      {availableSeats} seats available
                      {isFewSeatsLeft && " - Hurry!"}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
                <Typography variant="h4" color="#3b82f6" fontWeight="bold">
                  ₹{availableCategories[0]?.price || 0}
                </Typography>
                <Typography variant="body2" color="#94a3b8" sx={{ mt: 1 }}>
                  starting from
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
          {/* Show Details - Left Side */}
          <Box sx={{ flex: 1 }}>
            <Card sx={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" color="white" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Movie />
                  Show Information
                </Typography>

                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, mt: 2 }}>
                  <Paper sx={{ p: 2, backgroundColor: "rgba(255, 255, 255, 0.02)", flex: 1 }}>
                    <Typography variant="h6" color="#3b82f6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Schedule />
                      Show Time
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                      <Chip
                        label={selectedTime || "No time selected"}
                        color="primary"
                        sx={{
                          color: "white",
                          backgroundColor: "#3b82f6",
                          fontWeight: "bold",
                          fontSize: "1rem",
                          padding: "8px 16px",
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="#94a3b8" sx={{ mt: 1 }}>
                      Date: {selectedDate || show.date}
                    </Typography>
                  </Paper>

                  <Paper sx={{ p: 2, backgroundColor: "rgba(255, 255, 255, 0.02)", flex: 1 }}>
                    <Typography variant="h6" color="#3b82f6" gutterBottom>
                      Theater Layout
                    </Typography>
                    <Typography variant="body1" color="white">
                      {show.room.rows} rows × {show.room.columns} columns
                    </Typography>
                    <Typography variant="body2" color="#94a3b8">
                      Total capacity: {show.totalSeats} seats
                    </Typography>
                    <Typography variant="body2" color="#94a3b8">
                      Booked: {show.bookedSeats.length} seats
                    </Typography>
                  </Paper>
                </Box>

                {/* Available Categories */}
                <Paper sx={{ p: 2, mt: 2, backgroundColor: "rgba(255, 255, 255, 0.02)" }}>
                  <Typography variant="h6" color="#3b82f6" gutterBottom>
                    Available Seat Categories
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                    {availableCategories.map((category: SeatPrice, index: number) => (
                      <Chip
                        key={index}
                        label={`${category.category} - ₹${category.price}`}
                        variant="outlined"
                        sx={{
                          color: "#3b82f6",
                          borderColor: "#3b82f6",
                          fontWeight: "bold",
                        }}
                      />
                    ))}
                  </Box>
                </Paper>

                {/* Additional Show Info */}
                <Paper sx={{ p: 2, mt: 2, backgroundColor: "rgba(255, 255, 255, 0.02)" }}>
                  <Typography variant="h6" color="#3b82f6" gutterBottom>
                    Additional Information
                  </Typography>
                  <Typography variant="body2" color="#94a3b8">
                    • Please arrive at least 15 minutes before the show
                  </Typography>
                  <Typography variant="body2" color="#94a3b8">
                    • Seats are automatically released after 5 minutes if not confirmed
                  </Typography>
                  <Typography variant="body2" color="#94a3b8">
                    • Food and beverages available at the theater
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          </Box>

          {/* Booking Card - Right Side */}
          <Box sx={{ width: { xs: "100%", md: 350 } }}>
            <Card
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                position: "sticky",
                top: 24,
                border: "1px solid rgba(59, 130, 246, 0.3)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" color="white" gutterBottom sx={{ textAlign: "center" }}>
                  Ready to Book?
                </Typography>

                <Divider sx={{ borderColor: "#374151", my: 2 }} />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={() => setDialogOpen(true)}
                    disabled={availableSeats === 0 || bookingLoading}
                    sx={{
                      py: 2,
                      backgroundColor: "#3b82f6",
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      "&:hover": {
                        backgroundColor: "#2563eb",
                        transform: "translateY(-2px)",
                      },
                      "&:disabled": {
                        backgroundColor: "#374151",
                        transform: "none",
                      },
                      transition: "all 0.2s ease-in-out",
                    }}
                  >
                    {bookingLoading ? (
                      <CircularProgress size={24} sx={{ color: "white" }} />
                    ) : availableSeats === 0 ? (
                      "Show Sold Out"
                    ) : (
                      "Select Seats"
                    )}
                  </Button>

                  {isFewSeatsLeft && (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      <Typography variant="body2" fontWeight="bold">
                        Only {availableSeats} seats left!
                      </Typography>
                    </Alert>
                  )}

                  <Typography variant="body2" color="#94a3b8" sx={{ textAlign: "center" }}>
                    Click to select your preferred seats and proceed to payment
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Seat Selection Dialog */}
        {show && selectedTime && (
          <SeatSelectionDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            onSeatsConfirmed={handleSeatsConfirmed}
            show={show}
            selectedTime={selectedTime}
          />
        )}
      </Container>
    </Box>
  );
}
