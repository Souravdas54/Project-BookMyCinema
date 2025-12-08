export interface SeatPrice {
  category: "Golden" | "Platinum" | "Diamond" | "Royal";
  price: number;
}

export interface ShowTimeSlot {
  time: string;
  availableCategories: SeatPrice[];
}

export interface Show {
  _id: string;
  movieId: string;
  theaterId: {
    _id: string;
    theatername: string;
    district?: string;
  };
  room: {
    name: string;
    rows: number;
    columns: number;
  };
  screenNumber: string;
  showTime: string[];
  date: string;
   timeSlots: ShowTimeSlot[];
  totalSeats: number;
  bookedSeats: string[];
  locks: Lock[];
  price: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lock {
  seat: string;
  sessionId: string;
  expiresAt: string;
}

export interface Booking {
  _id: string;
  userId: string;
  movieId: string;
  theaterId: string;
  showId: string;
  seats: string[];
  totalAmount: number;
  status: "Confirmed" | "Cancelled" | "Pending";
  paymentStatus: "Paid" | "Unpaid";
  bookedAt: string;
  booking:string; // add new 
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  // date: string;
  movieId?: string;
  bookingId:string;// add new
  date?: string;
  availableTimes?: string[];
}

export interface LockSeatRequest {
  showId: string;
  seats: string[];
  sessionId: string;
  ttlSeconds?: number;
}

export interface ConfirmBookingRequest {
  showId: string;
  userId: string;
  seats: string[];
  totalAmount: number;
  sessionId: string;
}

export interface ShowDetails {
  room: {
    name: string;
    rows: number;
    columns: number;
  };
  date: string;
  showTime: string[];
}

export interface SeatLockResponse {
  success: boolean;
  message?: string;
  alreadyBooked?: string[];
  alreadyLocked?: string[];
  data?: {
    lockedSeats: string[];
  };
}

