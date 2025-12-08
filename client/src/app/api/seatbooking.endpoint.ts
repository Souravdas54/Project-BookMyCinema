// import {ApiResponse,Booking,ConfirmBookingRequest,LockSeatRequest,Show,SeatLockResponse} from "@/types/booking";
import { ApiResponse, Booking, ConfirmBookingRequest, LockSeatRequest, Show, SeatLockResponse } from "@/types/booking";
import axiosInstance from "./axios.instance";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8500';

// Helper function for consistent error handling
const handleApiError = (error: unknown, defaultMessage: string): never => {
  console.error('API Error:', error);

  if (typeof error === 'object' && error !== null) {
    const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
    const errorMessage = axiosError.response?.data?.message || axiosError.message || defaultMessage;
    throw new Error(errorMessage);
  }

  throw new Error(defaultMessage);
};

// Show endpoints
export const getShowsByMovie = async (movieId: string, date?: string): Promise<ApiResponse<Show[]>> => {
  try {
    const url = date
      ? `${API_URL}/shows/movie/${movieId}?date=${date}`
      : `${API_URL}/shows/movie/${movieId}`;

    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to fetch shows');
  }
};

export const getShowById = async (showId: string): Promise<ApiResponse<Show>> => {
  try {
    const response = await axiosInstance.get(`${API_URL}/shows/${showId}`);
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to fetch show details');
  }
};



// Booking endpoints
export const lockSeats = async (payload: LockSeatRequest): Promise<SeatLockResponse> => {
  try {
    const response = await axiosInstance.post(`${API_URL}/booking/lock`, payload);
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to lock seats');
  }
};

export const confirmBooking = async (payload: {
  showId: string;
  seats: string[];
  sessionId: string;
  totalAmount: number;
  // userId: string;
}): Promise<ApiResponse<Booking>> => {
  try {
    console.log('🚀 Sending confirmation request with payload:', {
      showId: payload.showId,
      seats: payload.seats, // Should be direct array
      sessionId: payload.sessionId,
      totalAmount: payload.totalAmount,
      // userId: payload.userId
    });
    
    const response = await axiosInstance.post(`${API_URL}/booking/confirm`, {
      showId: payload.showId,
      seats: payload.seats, // Direct array
      sessionId: payload.sessionId,
      totalAmount: payload.totalAmount,
      // userId: payload.userId
    });
    
    return response.data;
  } catch (error: unknown) {
    console.error('❌ API Error in confirmBooking:', error);
    return handleApiError(error, 'Failed to confirm booking');
  }
};
export const releaseSeats = async (payload: LockSeatRequest): Promise<{ success: boolean }> => {
  try {
    const response = await axiosInstance.post(`${API_URL}/booking/release`, payload);
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to release seats');
  }
};

export const getUserBookings = async (): Promise<ApiResponse<Booking[]>> => {
  try {
    const response = await axiosInstance.get(`${API_URL}/booking/my-bookings`);
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to fetch bookings');
  }
};

// Movie endpoints
export const getMovieById = async (movieId: string): Promise<ApiResponse<unknown>> => {
  try {
    const response = await axiosInstance.get(`${API_URL}/movies/${movieId}`);
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to fetch movie details');
  }
};

export const getAllMovies = async (): Promise<ApiResponse<unknown[]>> => {
  try {
    const response = await axiosInstance.get(`${API_URL}/movies`);
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to fetch movies');
  }
};

