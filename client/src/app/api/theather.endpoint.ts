import { ApiResponse } from "@/types/booking";
import axiosInstance from "./axios.instance";
import { Theater, TheatersByDistrictRequest, TheatersByStateRequest } from "@/types/theater";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8500';


// Theater endpoints
export const createTheater = async (theaterData: unknown): Promise<ApiResponse<Theater>> => {
    try {
        const response = await axiosInstance.post(`${API_URL}/theaters/theater/create`, theaterData);
        return response.data;
    } catch (error: unknown) {
        console.error('Error creating theater:', error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error('Failed to create theater');
    }
};

export const getTheatersByMovie = async (movieId: string): Promise<ApiResponse<Theater[]>> => {
    try {
        const response = await axiosInstance.get(`${API_URL}/theaters/movie/${movieId}`);
        return response.data;

    } catch (error: unknown) {
        console.error('Error fetching movie ID:', error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error('Failed to fetch Movie ID');
    }

};

// Fetch and Filter THeater and Movie
// export const getNearbyTheaters = async (params: { movieId: string; }): Promise<{ success: boolean; data: Theater[] }> => {
//     try {
//         const response = await axiosInstance.get(`${API_URL}/theaters/search/nearest-theaters`, {
//             params: {
//                 movieId: params.movieId
//             }
//         });
//         return response.data;
//     } catch (error: unknown) {
//         console.error('Error fetching nearby theaters:', error);
//         if (error instanceof Error) throw new Error(error.message);
//         throw new Error('Failed to fetch nearby theaters');
//     }
// };



// export const getNearbyTheaters = async (params: { longitude: number; latitude: number; movieId: string; maxDistance?: number; }): Promise<{ success: boolean; data: NearbyTheater[] }> => {
//     try {
//         // const { longitude, latitude, movieId, maxDistance } = params;

//         const response = await axiosInstance.get(`${API_URL}/theaters/search/nearest-theaters`, {
//             params: {
//                 latitude: params.latitude,
//                 longitude: params.longitude,
//                 movieId: params.movieId,
//                 maxDistance: params.maxDistance,
//                 // coordinates: [longitude, latitude]
//             }
//             // params
//         });
//         return response.data;

//     } catch (error: unknown) {
//         console.error('Error fetching nearby theaters:', error);
//         if (error instanceof Error) {
//             throw new Error(error.message);
//         }
//         throw new Error('Failed to fetch nearby theaters');
//     }
// };

export const getTheatersByState = async (payload: TheatersByStateRequest): Promise<ApiResponse<Theater[]>> => {
    try {
        const response = await axiosInstance.get(`${API_URL}/theaters/search/theaters-by-state`, {
            params: payload
        });
        return response.data;
    } catch (error: unknown) {
        console.error('Error fetching theaters by state:', error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error('Failed to fetch theaters by state');
    }
};

export const getTheatersByDistrict = async (payload: TheatersByDistrictRequest): Promise<ApiResponse<Theater[]>> => {
    try {
        const response = await axiosInstance.get(`${API_URL}/theaters/search/theaters-by-district`, {
            params: payload
        });
        return response.data;
    } catch (error: unknown) {
        console.error('Error fetching theaters by district:', error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error('Failed to fetch theaters by district');
    }
};

export const getTheaterById = async (theaterId: string): Promise<ApiResponse<Theater>> => {
    try {
        const response = await axiosInstance.get(`${API_URL}/theaters/${theaterId}`);
        return response.data;
    } catch (error: unknown) {
        console.error('Error fetching theater:', error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error('Failed to fetch theater');
    }
};

