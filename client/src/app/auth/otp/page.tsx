"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle, Typography, Box, TextField, Button, CircularProgress, Alert, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { verifyOtp, resendOtp } from '@/app/api/endpoint';

interface OtpPopupProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onVerifySuccess: () => void;
}

const OtpPopup: React.FC<OtpPopupProps> = ({ userId, isOpen, onClose, onVerifySuccess }) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  // Set ref callback with proper typing
  const setInputRef = useCallback((index: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[index] = el;
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(60);
      setOtp(['', '', '', '', '', '']);
      setError('');
      setMessage('');
      // Focus first input when popup opens
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (timeLeft === 0) return;

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are filled
    if (newOtp.every(digit => digit !== '') && index === 5) {
      handleVerify();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const pastedDigits = pastedData.replace(/\D/g, '').split('').slice(0, 6);

    if (pastedDigits.length === 6) {
      const newOtp = [...otp];
      pastedDigits.forEach((digit, index) => {
        newOtp[index] = digit;
      });
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    // Check if all digits are filled
    if (otp.some(digit => digit === '')) {
      setError('Please enter all 6 digits');
      return;
    }

    // Check if userId exists
    if (!userId) {
      setError('User ID is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const otpString = otp.join('');
      console.log('Verifying OTP for user:', userId);

      const result = await verifyOtp({
        userId: userId,
        otp: otpString
      });

      console.log('Verify OTP result:', result);

      if (result.success) {
        setMessage('OTP verified successfully!');
        setTimeout(() => {
          onVerifySuccess();
          onClose();
        }, 1000);
      } else {
        setError(result.message || 'Verification failed');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify OTP';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    console.log('resendOtp');

    if (!userId) {
      setError('User ID is required');
      return;

    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Resending OTP for user:', userId);
      const result = await resendOtp(userId);

      if (result.success) {
        setMessage('OTP sent successfully!');
        setTimeLeft(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(result.message || 'Failed to resend OTP');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend OTP';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          overflow: 'hidden'
        }
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative' }}>
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'text.secondary',
            zIndex: 10
          }}
        >
          <Close />
        </IconButton>

        <Box sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
              Verify OTP
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Enter the 6-digit code sent to your email
            </Typography>
          </Box>

          {/* OTP Inputs */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
              {otp.map((digit, index) => (
                <TextField
                  key={index}
                  inputRef={setInputRef(index)}
                  type="text"
                  inputMode="numeric"
                  inputProps={{
                    maxLength: 1,
                    style: {
                      textAlign: 'center',
                      fontSize: '20px',
                      fontWeight: 600
                    }
                  }}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={isLoading}
                  sx={{
                    width: '56px',
                    '& .MuiOutlinedInput-root': {
                      height: '56px',
                      '& input': {
                        textAlign: 'center',
                        padding: '16px 8px'
                      }
                    }
                  }}
                />
              ))}
            </Box>

            {/* Timer */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Time remaining: {' '}
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: timeLeft < 30 ? 'error.main' : 'success.main'
                  }}
                >
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </Typography>
              </Typography>
            </Box>
          </Box>

          {/* Messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {message && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}

          {/* Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleVerify}
              disabled={isLoading || otp.some(digit => digit === '')}
              sx={{
                py: 1.5,
                fontSize: '16px',
                fontWeight: 600
              }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Verify OTP'}
            </Button>

            {timeLeft === 0 ? (
              <Button
                variant="contained"
                size="large"
                onClick={handleResendOtp}
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  fontSize: '16px',
                  fontWeight: 600,
                  backgroundColor: 'grey.700',
                  '&:hover': {
                    backgroundColor: 'grey.800'
                  }
                }}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Resend OTP'}
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                disabled
                sx={{
                  py: 1.5,
                  fontSize: '16px',
                  fontWeight: 600,
                  backgroundColor: 'grey.400'
                }}
              >
                Resend OTP ({timeLeft}s)
              </Button>
            )}

            <Button
              variant="outlined"
              size="large"
              onClick={onClose}
              disabled={isLoading}
              sx={{
                py: 1.5,
                fontSize: '16px',
                fontWeight: 600
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default OtpPopup;