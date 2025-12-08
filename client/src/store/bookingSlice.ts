import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SeatPrice } from "@/types/booking";

// Add this to your bookingSlice
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

interface BookingState {
  selectedShowId: string | null;
  selectedSeats: string[];
  lockedSeats: string[];
  selectedCategory: SeatPrice | null;
  pricePerSeat: number;
  sessionId: string | null;
  showDetails: {
    theaterName: string;
    movieName: string;
    showTime: string;
    date: string;
  } | null;
}

const initialState: BookingState = {
  selectedShowId: null,
  selectedSeats: [],
  lockedSeats: [],
  selectedCategory: null,
  pricePerSeat: 0,
  sessionId: generateSessionId(),
  showDetails: null,
};

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    setShow(
      state,
      action: PayloadAction<{
        showId: string;
        price: number;
        sessionId: string;
        theaterName: string;
        movieName: string;
        showTime: string;
        date: string;
        category: SeatPrice;
      }>
    ) {
      state.selectedShowId = action.payload.showId;
      state.pricePerSeat = action.payload.price;
      if (!state.sessionId) {
        state.sessionId = generateSessionId();
      }
      // state.sessionId = generateSessionId();
      state.sessionId = action.payload.sessionId;
      state.selectedSeats = [];
      state.lockedSeats = [];
      state.selectedCategory = action.payload.category;
      state.showDetails = {
        theaterName: action.payload.theaterName,
        movieName: action.payload.movieName,
        showTime: action.payload.showTime,
        date: action.payload.date,
      };
    },
    setSelectedCategory(state, action: PayloadAction<SeatPrice>) {
      state.selectedCategory = action.payload;
    },
    toggleSeat(state, action: PayloadAction<string>) {
      const seat = action.payload;
      const index = state.selectedSeats.indexOf(seat);
      if (index > -1) {
        state.selectedSeats.splice(index, 1);
      } else {
        state.selectedSeats.push(seat);
      }
    },
    setLockedSeats(state, action: PayloadAction<string[]>) {
      state.lockedSeats = action.payload;
    },
    clearSeats(state) {
      state.selectedSeats = [];
    },
    clearBooking(state) {
      state.selectedShowId = null;
      state.selectedSeats = [];
      state.lockedSeats = [];
      state.selectedCategory = null;
      state.pricePerSeat = 0;
      state.sessionId = generateSessionId();
      state.showDetails = null;
    },
    setSessionId(state, action: PayloadAction<string>) {
      state.sessionId = action.payload;
    },
    // NEW: Reset session ID (useful for retries)
    resetSessionId(state) {
      state.sessionId = generateSessionId();
    },

    // NEW: Add specific seat (for programmatic selection)
    addSeat(state, action: PayloadAction<string>) {
      if (!state.selectedSeats.includes(action.payload)) {
        state.selectedSeats.push(action.payload);
      }
    },

    // NEW: Remove specific seat
    removeSeat(state, action: PayloadAction<string>) {
      const index = state.selectedSeats.indexOf(action.payload);
      if (index > -1) {
        state.selectedSeats.splice(index, 1);
      }
    },

    // NEW: Clear only locked seats (keep selected seats)
    clearLockedSeats(state) {
      state.lockedSeats = [];
    }
  }
});

export const {
  setShow,
  setSelectedCategory,
  toggleSeat,
  setLockedSeats,
  clearSeats,
  clearBooking,
  setSessionId,
  resetSessionId,
  addSeat,
  removeSeat,
  clearLockedSeats

} = bookingSlice.actions;
export default bookingSlice.reducer;
