import { PaymentIntentRequest, PaymentIntentResponse } from '@/types/payment';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8500';

// Helper to get auth data
const getAuthData = () => {
  if (typeof window !== 'undefined') {
    const userData = sessionStorage.getItem("userData");
    let parsedUserId = null;
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        parsedUserId = user._id || user.id;
      } catch (error) {
        console.error('Error parsing userData:', error);
      }
    }
    
    return {
      token: sessionStorage.getItem("accessToken"),
      userId: parsedUserId
    };
  }
  return { token: null, userId: null };
};

const handleApiError = (error: unknown, defaultMessage: string): never => {
  console.error('Payment API Error:', error);
  
  if (typeof error === 'object' && error !== null) {
    const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
    const errorMessage = axiosError.response?.data?.message || axiosError.message || defaultMessage;
    throw new Error(errorMessage);
  }
  
  throw new Error(defaultMessage);
};

export const createPaymentIntent = async (payload: PaymentIntentRequest): Promise<PaymentIntentResponse> => {
  try {
    const { token, userId } = getAuthData();
    
    console.log('Auth Data:', { tokenExists: !!token, userId });
    
    if (!token) {
      throw new Error('No authentication token found. Please login.');
    }

    if (!userId) {
      throw new Error('User ID not found. Please login again.');
    }
    
    const response = await fetch(`${API_URL}/payment/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        bookingId: payload.bookingId,
        userId: userId,
        amount: payload.amount,
        currency: payload.currency || 'inr',
        paymentMethod: 'card'
      }),
    });

    const data = await response.json();
    
    console.log('Payment intent response:', {
      status: response.status,
      data: data
    });

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 400 && data.message?.includes('already paid')) {
        throw new Error('Booking is already paid. Please check your bookings.');
      }
      if (response.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      if (response.status === 404) {
        throw new Error('Booking not found.');
      }
      throw new Error(data.message || 'Failed to create payment intent');
    }

    return data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to create payment intent');
  }
};

export const confirmPayment = async (paymentIntentId: string, bookingId: string): Promise<{ success: boolean; message?: string; data?: any }> => {
  try {
    const { token } = getAuthData();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/payment/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ paymentIntentId, bookingId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to confirm payment');
    }

    return data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to confirm payment');
  }
};

export const getPaymentStatus = async (paymentIntentId: string) => {
  try {
    const { token } = getAuthData();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/payment/status/${paymentIntentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get payment status');
    }

    return data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to get payment status');
  }
};

// New function to check booking status before payment
// export const checkBookingStatus = async (bookingId: string) => {
//   try {
//     const { token } = getAuthData();
    
//     if (!token) {
//       throw new Error('No authentication token found');
//     }

//     const response = await fetch(`${API_URL}/booking/${bookingId}`, {
//       headers: {
//         'Authorization': `Bearer ${token}`
//       },
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.message || 'Failed to get booking status');
//     }

//     return data;
//   } catch (error: unknown) {
//     return handleApiError(error, 'Failed to get booking status');
//   }
// };

export const checkBookingStatus = async (bookingId: string) => {
  try {
    console.log('🔍 checkBookingStatus called with bookingId:', bookingId);
    
    // Validate bookingId
    if (!bookingId || bookingId === "undefined" || bookingId === "null") {
      throw new Error("Invalid booking ID: " + bookingId);
    }

    // Validate it's a valid MongoDB ObjectId (24 hex chars)
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(bookingId)) {
      throw new Error(`Invalid booking ID format. Expected 24-character hex string, got: "${bookingId}"`);
    }

    const { token } = getAuthData();
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    console.log('🔍 Making API call to:', `${API_URL}/booking/${bookingId}`);

    const response = await fetch(`${API_URL}/booking/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });

    const data = await response.json();
    
    console.log('🔍 Booking status response:', {
      status: response.status,
      data: data
    });

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 404) {
        throw new Error('Booking not found. It may have been cancelled.');
      }
      if (response.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      if (response.status === 500 && data.message?.includes('ObjectId')) {
        throw new Error('Invalid booking ID format.');
      }
      throw new Error(data.message || `Failed to get booking status (HTTP ${response.status})`);
    }

    return data;
  } catch (error: unknown) {
    console.error('❌ Error in checkBookingStatus:', error);
    throw error;
  }
};