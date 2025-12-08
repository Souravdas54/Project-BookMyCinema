export interface PaymentIntentRequest {
  amount: number;
  currency?: string;
  bookingId: string;
  seats: string[];
  movieName: string;
  theaterName: string;
  showTime: string;
  userId: string;
}

export interface PaymentIntentResponse {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  amount?: number;
  currency?: string;
  error?: string;
  message?: string;
  data?: {
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
  };
}

export interface PaymentConfirmation {
  paymentIntentId: string;
  bookingId: string;
  amount: number;
  status: 'succeeded' | 'processing' | 'requires_payment_method';
}

export interface CreatePaymentIntent {
  bookingId: string;
  userId: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
}


// export interface PaymentIntentRequest {
//   amount: number;
//   currency?: string;
//   bookingId: string;
//   seats: string[];
//   movieName: string;
//   theaterName: string;
//   showTime: string;
// }

// export interface PaymentIntentResponse {
//   success: boolean;
//   clientSecret?: string;
//   error?: string;
// }

// export interface PaymentConfirmation {
//   paymentIntentId: string;
//   bookingId: string;
//   amount: number;
//   status: 'succeeded' | 'processing' | 'requires_payment_method';
// }