// components/LoginModal.jsx
"use client";

import React, { useState } from "react";
import {Box,Typography,CircularProgress,Snackbar,Alert,Dialog,DialogContent,IconButton} from "@mui/material";
import { LocalMovies, Google, Close } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { signin } from "@/app/api/endpoint";

import "./signinstyle.css";

import { UserType } from "@/types/usertype";
import Image from "next/image";

interface Usertype {
    email: string;
    password: string;
}

interface LoginModalProps {
    open: boolean;
    onClose: () => void;
    onSwitchToSignup: () => void;
    onLoginSuccess: (user: UserType) => void;
}

interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        user: {
            _id: string;
            name: string;
            email: string;
            role: string;
            phone: string;
            profileImage: string;
            isActive: string;
            createdAt: string;
            updatedAt: string;
            __v: number;
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
            accessTokenExpires: string;
            refreshTokenExpires: string;
        };
    };
}


const LoginModal: React.FC<LoginModalProps> = ({ open, onClose, onSwitchToSignup, onLoginSuccess }) => {
    const [formData, setForm] = useState<Usertype>({
        email: "",
        password: "",
    });
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     setRememberMe(e.target.checked);
    // };

    const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpenSnackbar(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            setErrors({ general: 'Please fill in all fields' });
            return;
        }
        setLoading(true);

        try {
            const res = await signin(formData);
            console.log('Full API Response:', res);

            if (res && res.success) {
                setSnackbarMessage('Login successful! Redirecting...');
                setSnackbarSeverity('success');
                setOpenSnackbar(true);
                onLoginSuccess(res.data.user);
                setForm({
                    email: "",
                    password: "",
                });

                // Debug the actual structure
                console.log('Actual response structure for debugging:');
                console.log('- res:', res);
                console.log('- res.data:', res.data);

                const userData = res.data;
                const role = userData?.role;
                const accessToken = res.tokens?.accessToken;
                const refreshToken = res.tokens?.refreshToken;

                // console.log('Extracted values:');
                // console.log('- userData:', userData);
                // console.log('- role:', role);
                // console.log('- accessToken:', accessToken);
                // console.log('- refreshToken:', refreshToken);


                // Store authentication data
                if (accessToken) {
                    sessionStorage.setItem("accessToken", accessToken);
                    // console.log('Access token stored in sessionStorage');
                } else {
                    console.log('No access token found in response');
                }

                if (refreshToken) {
                    sessionStorage.setItem("refreshToken", refreshToken);
                    // console.log('Refresh token stored in sessionStorage');
                } else {
                    console.log('No refresh token found in response');
                }

                if (role) {
                    sessionStorage.setItem('userRole', role);
                    // console.log('Role stored in sessionStorage');
                }

                if (userData) {
                    sessionStorage.setItem('userData', JSON.stringify(userData));
                    // console.log('User data stored in sessionStorage');
                }



                // Log SessionStorage to verify
                console.log('sessionStorage after login:');
                // console.log('- userRole:', sessionStorage.getItem('userRole'));
                // console.log('- userData:', sessionStorage.getItem('userData'));

                // If using remember me, store in more persistent storage
                if (rememberMe) {
                    sessionStorage.setItem('rememberMe', 'true');
                }


                // Close modal and redirect after successful login
                setTimeout(() => {
                    onClose();
                    if (role === 'user') {
                        router.push('/');
                    }
                }, 1500);
                window.location.reload();

            } else {
                const errorMessage = res?.message || 'Login failed. Please check your credentials.';
                setSnackbarMessage(errorMessage);
                setSnackbarSeverity('error');
                setOpenSnackbar(true);
            }

        } catch (error: unknown) {
            // More detailed error handling
            let errorMessage = 'Login failed. Please check your credentials.';

            // Check if it's an Axios-like error
            if (typeof error === 'object' && error !== null) {
                const err = error as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                    message?: string;
                    code?: string;
                };

                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.message) {
                    errorMessage = err.message;
                } else if (err.code === 'NETWORK_ERROR') {
                    errorMessage = 'Network error. Please check your connection.';
                }
            }

            setSnackbarMessage(errorMessage);
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        // Implement Google OAuth logic here
        console.log('Google login clicked');
    };

    const handleClose = () => {
        setForm({ email: "", password: "" });
        setErrors({});
        setRememberMe(false);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '12px',
                    overflow: 'hidden'
                }
            }}
        >
            <DialogContent sx={{ p: 0 }}>
                <Box className="login-modal-container">
                    {/* Close Button */}
                    <IconButton
                        onClick={handleClose}
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

                    {/* Login Card */}
                    <Box className="login-card">
                        {/* Logo Section */}
                        <Box className="login-logo">
                            <Box sx={{ display: 'flex' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                                {/* Replace with your actual logo path */}
                                <Image
                                    src="/bookmycinema-logo.png"
                                    alt="BookMyCinema Logo"
                                    width={50}
                                    height={60}
                                    className="logo-image"
                                />
                            </Box>
                                {/* <LocalMovies className="logo-icon" /> */}
                                <Typography
                                    variant="h4"
                                    noWrap
                                    component="div"
                                    sx={{ display: { xs: 'none', sm: 'block' }, mt: 1,ml:3 }}
                                // className="logo-text"
                                >
                                    BookMyCinema
                                </Typography>
                            </Box>
                            <Typography variant="h2" className="login-title">
                                Welcome back
                            </Typography>
                            <Typography variant="body1" className="login-subtitle">
                                Sign in to your account to continue
                            </Typography>
                        </Box>

                        {/* Login Form */}
                        <Box component="form" onSubmit={handleSubmit} className="login-form">
                            {/* Email Field */}
                            <Box className="form-group">
                                <label htmlFor="email" className="form-label">
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className={`form-input ${errors.email ? 'error' : ''}`}
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    required
                                />
                                {errors.email && <div className="error-message">{errors.email}</div>}
                            </Box>

                            {/* Password Field */}
                            <Box className="form-group">
                                <label htmlFor="password" className="form-label">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    className={`form-input ${errors.password ? 'error' : ''}`}
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    required
                                />
                                {errors.password && <div className="error-message">{errors.password}</div>}
                            </Box>

                            {/* Remember Me & Forgot Password */}
                            {/* <Box className="remember-forgot">
                                <Box className="remember-me">
                                    <input
                                        type="checkbox"
                                        id="rememberMe"
                                        checked={rememberMe}
                                        onChange={handleRememberMeChange}
                                        className="remember-checkbox"
                                    />
                                    <label htmlFor="rememberMe" className="remember-label">
                                        Remember for 30 days
                                    </label>
                                </Box>
                                <a href="/components/resetpassword" className="forgot-link">
                                    Forgot password?
                                </a>
                            </Box> */}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="login-button"
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={20} /> : 'Sign in'}
                            </button>

                            <Snackbar
                                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                                open={openSnackbar}
                                autoHideDuration={3000}
                                onClose={handleCloseSnackbar}
                            >
                                <Alert
                                    onClose={handleCloseSnackbar}
                                    severity={snackbarSeverity}
                                    variant="filled"
                                    sx={{ width: '100%' }}
                                >
                                    {snackbarMessage}
                                </Alert>
                            </Snackbar>

                            {/* Divider */}
                            <Box className="divider">
                                <span className="divider-text">or</span>
                            </Box>

                            {/* Google Sign In */}
                            <button
                                type="button"
                                className="google-button"
                                onClick={handleGoogleLogin}
                            >
                                <Google className="google-icon" />
                                Sign in with Google
                            </button>

                            {/* Sign Up Link */}
                            <Box className="signup-link">
                                Don&apos;t have an account?{' '}
                                <a href="/auth/signup" onClick={(e) => {
                                    e.preventDefault();
                                    onClose();
                                    onSwitchToSignup();
                                    // You can add signup modal opening logic here
                                }}>
                                    Sign up
                                </a>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default LoginModal;