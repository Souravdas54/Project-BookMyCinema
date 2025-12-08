import axios from "axios";

import axiosInstance from "./axios.instance";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8500' // BACKEND - SERVER HTTP API


export const fetchNearbyTheaters = async (latitude: number, longitude: number) => {
    try {
        const res = await axios.get(
            `${API_URL}/nearest-theaters`, {
            params: { latitude, longitude }
        }
        );

        return res.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error('Please login to view theaters details:', error.response?.data);
            throw new Error(error.response?.data?.message || 'Error fetching nearby theaters');
        }
        throw new Error('Error fetching nearby theaters');
    }

};

export const fetchTheatersByState = async (state: string) => {
    try {
        const res = await axiosInstance.get(`${API_URL}/theaters-by-state?state=${state}`);
        return res.data;
    } catch (error) {
        console.error("Error fetching state theaters", error);
    }
};

export const fetchTheatersByDistrict = async (district: string) => {
    try {
        const res = await axios.get(
            `${API_URL}/theaters-by-district?district=${district}`
        );
        return res.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error("Error fetching state theaters:", error.response?.data);
            throw new Error(error.response?.data?.message || 'Error fetching theaters by state');
        }
        throw new Error('Error fetching theaters by state');
    }
};