"use client";
import React, { useState, useEffect } from "react";
import { Button, Box, Typography, IconButton, Chip, Divider, Alert, CircularProgress, Paper, Container } from "@mui/material";
import { Close, ConfirmationNumber, EventSeat, LocalMovies } from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "@/hooks/hookes";
import { toggleSeat, setLockedSeats, clearSeats, setSessionId } from "@/store/bookingSlice";
import { confirmBooking, lockSeats, releaseSeats } from "@/app/api/seatbooking.endpoint";
import { Show } from "@/types/booking";

interface SeatSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSeatsConfirmed: (bookingData: { seats: string[]; sessionId: string; showId: string }) => void;
  show: Show;
  selectedTime: string;
}

interface Seat {
  id: string;
  row: string;
  number: number;
  category: string;
  price: number;
}

// Add generateSessionId function here
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Add calculateTotalAmount function
const calculateTotalAmount = (seats: string[], allSeats: Seat[]): number => {
  return seats.reduce((total, seatId) => {
    const seat = allSeats.find(s => s.id === seatId);
    return total + (seat?.price || 0);
  }, 0);
};

const SeatSelectionDialog: React.FC<SeatSelectionDialogProps> = ({
  open,
  onClose,
  onSeatsConfirmed,
  show,
}) => {
  const dispatch = useAppDispatch();
  const { selectedSeats, lockedSeats, sessionId } = useAppSelector(
    (state) => state.booking
  );

  const [numSeats, setNumSeats] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [activeStep, setActiveStep] = useState<number>(0);
  const [showSeatPopup, setShowSeatPopup] = useState<boolean>(true); // Track popup visibility

  const steps = ["Select Seats", "Confirm Selection"];

  // Seat categories with prices and row assignments
  const seatCategories = [
    { type: "Platinum", price: 180, rows: ["A", "B", "C"] },
    { type: "Golden", price: 200, rows: ["D", "E", "F",] },
    { type: "Diamond", price: 220, rows: ["G", "H"] },
    { type: "Royal", price: 250, rows: ["I", "J"] },
  ];

  // Generate seats based on theater layout: 10 rows × 12 columns
  const generateSeats = (): Seat[] => {
    const seats: Seat[] = [];
    const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    const columns = 12;

    for (const row of rows) {
      const category = seatCategories.find(cat => cat.rows.includes(row));

      for (let seatNum = 1; seatNum <= columns; seatNum++) {
        seats.push({
          id: `${row}${seatNum}`,
          row,
          number: seatNum,
          category: category?.type || "Platinum",
          price: category?.price || 200,
        });
      }
    }
    return seats;
  };

  const allSeats = generateSeats();
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

  // Group rows by category for display
  const categoryGroups = [
    { name: "Platinum", rows: ["A", "B", "C"], price: 180 },
    { name: "Golden", rows: ["D", "E", "F"], price: 200 },
    { name: "Diamond", rows: ["G", "H"], price: 220 },
    { name: "Royal", rows: ["I", "J"], price: 250 },
  ];

  useEffect(() => {
    if (open) {
      dispatch(clearSeats());
      setNumSeats(1);
      setError("");
      setActiveStep(0);
      setLoading(false);
      setShowSeatPopup(true); // Show popup when dialog opens
    }
  }, [open, dispatch]);

  useEffect(() => {
    if (open && !sessionId) {
      dispatch(setSessionId(generateSessionId()));
    }
  }, [open, sessionId, dispatch]);

  const handleSeatSelect = (seatId: string): void => {
    if (selectedSeats.includes(seatId)) {
      dispatch(toggleSeat(seatId));
    } else if (selectedSeats.length < numSeats) {
      dispatch(toggleSeat(seatId));
    } else {
      setError(`You can only select ${numSeats} seat${numSeats !== 1 ? "s" : ""}`);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleNext = async (): Promise<void> => {
    if (selectedSeats.length !== numSeats) {
      setError(`Please select exactly ${numSeats} seat${numSeats !== 1 ? "s" : ""}`);
      return;
    }

    setLoading(true);
    setError("");

    const currentSessionId = sessionId || generateSessionId();
    if (!sessionId) {
      dispatch(setSessionId(currentSessionId));
    }

    try {
      const lockResponse = await lockSeats({
        showId: show._id,
        seats: selectedSeats,
        sessionId: currentSessionId,
        ttlSeconds: 300,
      });

      if (lockResponse.success) {
        const actuallyLockedSeats = lockResponse.data?.lockedSeats || selectedSeats;
        dispatch(setLockedSeats(actuallyLockedSeats));

        console.log('🔒 Locked seats:', actuallyLockedSeats);
        console.log('🎯 Selected seats:', selectedSeats);
        console.log('🆔 Session ID:', currentSessionId);

        setActiveStep(1);
        setError("");
      } else {
        if (lockResponse.alreadyBooked && lockResponse.alreadyBooked.length > 0) {
          setError(`Seats ${lockResponse.alreadyBooked.join(", ")} are already booked. Please select different seats.`);
        } else if (lockResponse.alreadyLocked && lockResponse.alreadyLocked.length > 0) {
          setError(`Seats ${lockResponse.alreadyLocked.join(", ")} are currently locked by another user. Please select different seats.`);
        } else {
          setError(lockResponse.message || "Failed to lock seats. Please try again.");
        }
        dispatch(clearSeats());
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Error locking seats:", msg);
      setError(msg || "Failed to lock seats. Please try again.");
      dispatch(clearSeats());
    } finally {
      setLoading(false);
    }
  };

  const handleBack = async (): Promise<void> => {
    if (sessionId && selectedSeats.length > 0) {
      try {
        await releaseSeats({
          showId: show._id,
          seats: selectedSeats,
          sessionId: sessionId,
        });
      } catch (err) {
        console.error("Error releasing seats:", err);
      }
    }
    dispatch(clearSeats());
    dispatch(setLockedSeats([]));
    setActiveStep(0);
    setError("");
    setShowSeatPopup(true); // Show popup again when going back
  };

  const handleConfirm = async (): Promise<void> => {
    setLoading(true);
    try {
      const seatsToConfirm = lockedSeats.length > 0 ? lockedSeats : selectedSeats;
      const currentSessionId = sessionId;

      console.log('✅ Final confirmation check:', {
        seatsToConfirm,
        sessionId: currentSessionId,
        showId: show._id,
        lockedSeats,
        selectedSeats
      });

      if (!currentSessionId) {
        throw new Error("Session ID is missing");
      }

      if (seatsToConfirm.length === 0) {
        throw new Error("No seats selected for confirmation");
      }

      // FIX: Pass simple array, not nested object
      onSeatsConfirmed({
        seats: seatsToConfirm, // Direct array
        sessionId: currentSessionId, // Same sessionId used for locking
        showId: show._id
      });

    } catch (error) {
      console.error('Error in handleConfirm:', error);
      setError('Failed to proceed to payment');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (): Promise<void> => {
    if (sessionId && selectedSeats.length > 0) {
      try {
        await releaseSeats({
          showId: show._id,
          seats: selectedSeats,
          sessionId: sessionId,
        });
      } catch (err) {
        console.error("Error releasing seats:", err);
      }
    }

    dispatch(clearSeats());
    dispatch(setLockedSeats([]));
    setNumSeats(1);
    setError("");
    setLoading(false);
    setActiveStep(0);
    setShowSeatPopup(true); // Reset popup state
    onClose();
  };

  const handleContinueFromPopup = (): void => {
    setShowSeatPopup(false); // Hide the popup
  };

  const handlePopupSeatSelect = (num: number): void => {
    setNumSeats(num);
    // Don't clear seats here, just set the number
  };

  const totalPrice = calculateTotalAmount(selectedSeats, allSeats);

  const getStepContent = (step: number): React.ReactNode => {
    switch (step) {
      case 0:
        return (
          <Container maxWidth="lg">
            {/* Popup for Seat Quantity Selection */}
            {showSeatPopup && (
              <Box
                sx={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.95)',
                  zIndex: 10000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Paper sx={{
                  p: 4,
                  textAlign: 'center',
                  maxWidth: 400,
                  width: '90%',
                  mx: 'auto',
                  boxShadow: 24
                }}>
                  <Typography variant="h5" gutterBottom>
                    How many Seats?
                  </Typography>
                  <Box sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: 1,
                    mt: 3
                  }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <Button
                        key={num}
                        variant={numSeats === num ? "contained" : "outlined"}
                        onClick={() => handlePopupSeatSelect(num)}
                        sx={{
                          minWidth: 40,
                          minHeight: 40,
                          fontSize: '1rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {num}
                      </Button>
                    ))}
                  </Box>
                  <Button
                    variant="contained"
                    onClick={handleContinueFromPopup}
                    sx={{ mt: 3, minWidth: 120 }}
                  >
                    Continue
                  </Button>
                </Paper>
              </Box>
            )}

            {/* Screen */}
            <Box sx={{
              textAlign: "center",
              mb: 4,
              p: 2,
              bgcolor: 'grey.900',
              color: 'white',
              borderRadius: 1,
              fontWeight: 'bold',
              fontSize: { xs: '1.2rem', sm: '1.5rem' },
              letterSpacing: 2
            }}>
              SCREEN
            </Box>

            {/* Seat Layout with Category Labels */}
            <Paper sx={{
              p: { xs: 1, sm: 2, md: 3 },
              mb: 3,
              overflow: 'auto'
            }}>
              {/* Category Legend */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-around',
                flexWrap: 'wrap',
                gap: 2,
                mb: 3,
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1
              }}>
                {categoryGroups.map((category) => (
                  <Box key={category.name} sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {category.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ₹{category.price}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Seat Rows Grouped by Category */}
              {categoryGroups.map((category) => (
                <Box key={category.name} sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{
                    mb: 2,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: 'primary.main',
                    fontSize: { xs: '1rem', sm: '1.2rem' }
                  }}>
                    {category.name} - ₹{category.price}
                  </Typography>

                  {category.rows.map((row) => (
                    <Box key={row} sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: { xs: 0.5, sm: 1 },
                      mb: { xs: 0.5, sm: 1 },
                      width: '100%',
                      justifyContent: 'center'
                    }}>
                      <Typography sx={{
                        minWidth: { xs: 20, sm: 30 },
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: { xs: '0.8rem', sm: '1rem' }
                      }}>
                        {row}
                      </Typography>
                      <Box sx={{
                        display: "flex",
                        flexWrap: 'nowrap',
                        gap: { xs: 0.25, sm: 0.5 }
                      }}>
                        {/* First half of seats (1-6) */}
                        {Array.from({ length: 6 }, (_, index) => {
                          const seatNumber = index + 1;
                          const seatId = `${row}${seatNumber}`;
                          const isSelected = selectedSeats.includes(seatId);
                          const isBooked = show.bookedSeats.includes(seatId);
                          const isLocked = lockedSeats.includes(seatId);

                          return (
                            <Button
                              key={seatId}
                              variant={isSelected ? "contained" : "outlined"}
                              disabled={isBooked || isLocked}
                              onClick={() => handleSeatSelect(seatId)}
                              sx={{
                                minWidth: { xs: 28, sm: 32, md: 36 },
                                width: { xs: 28, sm: 32, md: 36 },
                                height: { xs: 28, sm: 32, md: 36 },
                                p: 0,
                                fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.8rem' },
                                // Available seat: green border
                                borderColor: 'success.main',
                                // Selected seat: green background
                                bgcolor: isSelected ? 'success.main' : 'transparent',
                                color: isSelected ? 'white' : 'text.primary',
                                // Locked seat: green border with green background
                                ...(isLocked && {
                                  bgcolor: 'success.main',
                                  color: 'white',
                                  borderColor: 'success.main',
                                }),
                                // Booked seat: grey background
                                ...(isBooked && {
                                  bgcolor: 'grey.400',
                                  color: 'white',
                                  borderColor: 'grey.400',
                                }),
                                '&:hover': !isBooked && !isLocked ? {
                                  bgcolor: isSelected ? 'success.main' : 'action.hover',
                                  transform: 'scale(1.05)'
                                } : {},
                                transition: 'all 0.2s',
                                marginRight: seatNumber === 6 ? 2 : 0
                              }}
                            >
                              {seatNumber}
                            </Button>
                          );
                        })}

                        {/* Second half of seats (7-12) with gap */}
                        {Array.from({ length: 6 }, (_, index) => {
                          const seatNumber = index + 7;
                          const seatId = `${row}${seatNumber}`;
                          const isSelected = selectedSeats.includes(seatId);
                          const isBooked = show.bookedSeats.includes(seatId);
                          const isLocked = lockedSeats.includes(seatId);

                          return (
                            <Button
                              key={seatId}
                              variant={isSelected ? "contained" : "outlined"}
                              disabled={isBooked || isLocked}
                              onClick={() => handleSeatSelect(seatId)}
                              sx={{
                                minWidth: { xs: 28, sm: 32, md: 36 },
                                width: { xs: 28, sm: 32, md: 36 },
                                height: { xs: 28, sm: 32, md: 36 },
                                p: 0,
                                fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.8rem' },
                                // Available seat: green border
                                borderColor: 'success.main',
                                // Selected seat: green background
                                bgcolor: isSelected ? 'success.main' : 'transparent',
                                color: isSelected ? 'white' : 'text.primary',
                                // Locked seat: green border with green background
                                ...(isLocked && {
                                  bgcolor: 'success.main',
                                  color: 'white',
                                  borderColor: 'success.main',
                                }),
                                // Booked seat: grey background
                                ...(isBooked && {
                                  bgcolor: 'grey.400',
                                  color: 'white',
                                  borderColor: 'grey.400',
                                }),
                                '&:hover': !isBooked && !isLocked ? {
                                  bgcolor: isSelected ? 'success.main' : 'action.hover',
                                  transform: 'scale(1.05)'
                                } : {},
                                transition: 'all 0.2s',
                                marginLeft: seatNumber === 7 ? 2 : 0
                              }}
                            >
                              {seatNumber}
                            </Button>
                          );
                        })}
                      </Box>
                    </Box>
                  ))}
                </Box>
              ))}

              {/* Legend for seat status */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 3,
                mt: 4,
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 20,
                    height: 20,
                    border: '2px solid',
                    borderColor: 'success.main',
                    borderRadius: 1
                  }} />
                  <Typography variant="body2">Available</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 20,
                    height: 20,
                    bgcolor: 'success.main',
                    borderRadius: 1
                  }} />
                  <Typography variant="body2">Selected</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 20,
                    height: 20,
                    bgcolor: 'success.main',
                    border: '2px solid',
                    borderColor: 'success.main',
                    borderRadius: 1
                  }} />
                  <Typography variant="body2">Locked</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 20,
                    height: 20,
                    bgcolor: 'grey.400',
                    borderRadius: 1
                  }} />
                  <Typography variant="body2">Booked</Typography>
                </Box>
              </Box>
            </Paper>

            {/* Selected Seats and Total Amount - Always visible */}
            <Paper sx={{
              p: { xs: 1.5, sm: 2, md: 3 },
              bgcolor: 'primary.main',
              color: 'white',
              textAlign: 'center',
              mb: 2
            }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Selected: {selectedSeats.length > 0 ? selectedSeats.join(", ") : "None"}
              </Typography>
              <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                Total: ₹{totalPrice}
              </Typography>
            </Paper>
          </Container>
        );
      case 1:
        return (
          <Container maxWidth="sm">
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom align="center">
                Confirm Selection
              </Typography>

              <Box sx={{ textAlign: "center", mb: 3 }}>
                <EventSeat sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
                <Typography variant="h6" color="primary.main" gutterBottom>
                  {selectedSeats.length} Seat{selectedSeats.length !== 1 ? "s" : ""} Selected
                </Typography>
                <Chip label={selectedSeats.join(", ")} variant="outlined" />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Booking Summary
                </Typography>

                {selectedSeats.map((seatId) => {
                  const seat = allSeats.find(s => s.id === seatId);
                  return (
                    <Box key={seatId} sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography>Seat {seatId} ({seat?.category})</Typography>
                      <Typography fontWeight="bold">₹{seat?.price}</Typography>
                    </Box>
                  );
                })}

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography>Service Fee:</Typography>
                  <Typography>₹{(totalPrice * 0.1).toFixed(2)}</Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
                  <Typography variant="h6">Total Amount:</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    ₹{(totalPrice + (totalPrice * 0.1)).toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <Alert severity="info">
                Your seats are temporarily locked. You have 5 minutes to complete the booking.
              </Alert>
            </Paper>
          </Container>
        );
      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <Box sx={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      zIndex: 9999,
      overflow: "auto",
      p: { xs: 1, sm: 2 }
    }}>
      {/* Header */}
      <Container maxWidth="lg" sx={{ mb: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                Select Your Seats
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                {show.theaterId.theatername} • {show.room.name}
              </Typography>
            </Box>
            <IconButton onClick={handleClose} size="small">
              <Close />
            </IconButton>
          </Box>

          {/* Stepper */}
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
            {steps.map((step, index) => (
              <Box key={step} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  bgcolor: activeStep >= index ? "primary.main" : "grey.300",
                  color: activeStep >= index ? "white" : "grey.600",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold"
                }}>
                  {index + 1}
                </Box>
                <Typography fontWeight="600" color={activeStep >= index ? "primary.main" : "grey.600"}>
                  {step}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Container>

      {/* Error Alert */}
      {error && (
        <Container maxWidth="lg" sx={{ mb: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      )}

      {/* Content */}
      {getStepContent(activeStep)}

      {/* Navigation Buttons */}
      <Container maxWidth="lg" sx={{ mt: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: 'wrap' }}>
            <Button
              onClick={activeStep === 0 ? handleClose : handleBack}
              variant="outlined"
              sx={{ minWidth: { xs: 80, sm: 120 } }}
            >
              {activeStep === 0 ? "Cancel" : "Back"}
            </Button>

            <Button
              variant="contained"
              onClick={activeStep === 0 ? handleNext : handleConfirm}
              disabled={(activeStep === 0 && selectedSeats.length !== numSeats) || loading}
              sx={{ minWidth: { xs: 150, sm: 200 }, flexGrow: 1, maxWidth: 400 }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : activeStep === 0 ? (
                `Select ${numSeats} Seat${numSeats !== 1 ? "s" : ""}`
              ) : (
                "Confirm & Proceed to Payment"
              )}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default SeatSelectionDialog;