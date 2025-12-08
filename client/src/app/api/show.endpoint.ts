import axios from "axios";

import axiosInstance from "./axios.instance";
import { ApiResponse, Show } from "@/types/booking";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8500' // BACKEND - SERVER HTTP API

const handleApiError = (error: unknown, defaultMessage: string): never => {
    console.error('API Error:', error);

    if (typeof error === 'object' && error !== null) {
        const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
        const errorMessage = axiosError.response?.data?.message || axiosError.message || defaultMessage;
        throw new Error(errorMessage);
    }

    throw new Error(defaultMessage);
};

export const createShow = async (showData: unknown): Promise<ApiResponse<Show>> => {
  try {
    const response = await axiosInstance.post(`${API_URL}/shows/create`, showData);
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to create show');
  }
};

export const getShowsByMovieAndDate = async (movieId: string, date: string, theaterId?: string): Promise<ApiResponse<Show[]>> => {
    try {
        let url = `${API_URL}/shows/${movieId}/times?date=${date}`;
        if (theaterId) {
            url += `&theaterId=${theaterId}`;
        }

        const response = await axiosInstance.get(url);
        return response.data;
    } catch (error: unknown) {
        console.error('Error fetching shows:', error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error('Failed to fetch shows');
    }
};

export const getShowByTheaterMovieDateTime = async (
    theaterId: string,
    movieId: string,
    date: string,
    time: string
): Promise<ApiResponse<Show>> => {
    try {
        const response = await axiosInstance.get(`${API_URL}/shows/theater/${theaterId}/movie/${movieId}?date=${date}&time=${time}`);

        return response.data;

    } catch (error: unknown) {
        return handleApiError(error, 'Failed to fetch show details');
    }
};


// export const getShowsByMovieAndDate = async (movieId: string, date: string): Promise<ApiResponse<Show[]>> => {
//     try {
//         const response = await axiosInstance.get(`${API_URL}/shows/${movieId}/times?date=${date}`);
//         return response.data;
//     } catch (error: unknown) {
//         console.error('Error fetching shows:', error);
//         if (error instanceof Error) {
//             throw new Error(error.message);
//         }
//         throw new Error('Failed to fetch shows');
//     }
// };