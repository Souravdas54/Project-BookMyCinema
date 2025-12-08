import axios from "axios";

import axiosInstance from "./axios.instance";
import { ReactMovieRequest, SimulateRatingRequest, SimulateRatingResponse } from "@/types/movie";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8500' // BACKEND - SERVER HTTP API

export const signup = async (formData: FormData) => {
    try {
        const res = await axios.post(`${API_URL}/auth/signup`, formData, {
            headers: { "Content-Type": "multipart/form-data" },

        })

        return res.data;
    } catch (error) {
        console.log(error);

    }
}

export const signin = async (formdata: { email: string, password: string }) => {
    try {
        const res = await axios.post(`${API_URL}/auth/signin`, formdata, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
        })

        console.log('API Response:', res);
        console.log('API Response data:', res.data);

        return res.data;

    } catch (error) {
        console.log(error);
    }
}

export const verifyOtp = async (data: { userId: string, otp: string }) => {
    try {
        console.log('Sending verify OTP request:', data);

        const response = await axios.post(`${API_URL}/auth/verify-otp`, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Verify OTP response:', response.data);
        return response.data;

    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error('Verify OTP API error:', error.response?.data);
            throw new Error(error.response?.data?.message || 'Failed to verify OTP');
        }
        throw new Error('Failed to verify OTP');
    }
}

// Resend OTP function - FIXED
export const resendOtp = async (userId: string) => {
    try {
        console.log('🔄 Sending resend OTP request for user:', userId);

        const response = await axios.post(`${API_URL}/auth/resend-otp`,
            { userId },
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        console.log('✅ Resend OTP response:', response.data);
        return response.data;

    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error('Resend OTP API error:', error.response?.data);
            throw new Error(error.response?.data?.message || 'Failed to resend OTP');
        }
        throw new Error('Failed to resend OTP');
    }
}

export const logout = async (role: string) => {
    try {
        const res = await axiosInstance.post(`${API_URL}/${role}/auth/logout`, {},
            {
                withCredentials: true
            }
        );
        window.location.href = '/'
        return res.data;

    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.message || 'Logout failed');
        }
        throw new Error('Logout failed');
    }
}

