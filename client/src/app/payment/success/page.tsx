"use client";
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import { Check, Home } from '@mui/icons-material';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('bookingId');

  useEffect(() => {
    if (!bookingId) {
      router.push('/');
    }
  }, [bookingId, router]);

  // const handleViewTickets = () => {
  //   if (bookingId) {
  //     router.push(`/tickets/${bookingId}`);
  //   }
  // };

  const handleGoHome = () => {
    router.push('/');
  };
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ mb: 3 }}>
          <Check sx={{ fontSize: 64, color: '#22c55e' }} />
        </Box>
        <Typography variant="h4" gutterBottom color="#22c55e">
          Payment Successful!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
         Your payment was successful. Your ticket is booked. Please check your email for your ticket.
        </Typography>
     
          {/* <Button
            variant="contained"
            size="large"
            onClick={handleViewTickets}
          >
            View Tickets
          </Button> */}
          <Button
            variant="contained"
            // startIcon={<Home />}
            onClick={handleGoHome}
            size="large"
            // sx={{ml:5}}
          >
            Back
          </Button>
    
      </Paper>
    </Container>
  );
}