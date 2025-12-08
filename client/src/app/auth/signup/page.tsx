// components/SignupModal.jsx
"use client";

import React, { useRef, useState } from "react";
import { Box, Typography, CircularProgress, Snackbar, Alert, Dialog, DialogContent, IconButton, InputAdornment, IconButton as MuiIconButton, Button, Avatar } from "@mui/material";
import { LocalMovies, Google, Close, Visibility, VisibilityOff, Person, Email, Phone, CloudUpload } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { signup } from "@/app/api/endpoint";
import "./signupstyle.css";
import OtpPopup from "../otp/page";
import Image from "next/image";

interface SignupType {
    name: string;
    email: string;
    phone: string;
    gender: string;
    password: string;
    confirmPassword: string;
}

interface SignupResponse {
    success: boolean;
    message: string;
    data: {
        user: {
            _id: string;
            name: string;
            email: string;
            phone: string;
            role: string;
            profilePicture: string;
            isActive: string;
            createdAt: string;
            updatedAt: string;
            __v: number;
        };
    };
}

interface SignupModalProps {
    open: boolean;
    onClose: () => void;
    onSwitchToLogin: () => void;
}

const SignupModal: React.FC<SignupModalProps> = ({ open, onClose, onSwitchToLogin }) => {

    const [form, setForm] = useState<SignupType>({
        name: "",
        email: "",
        phone: "",
        gender: "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const [msg, setMsg] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

    // OTP Popup State
    const [showOtpPopup, setShowOtpPopup] = useState(false);
    const [registeredUserId, setRegisteredUserId] = useState<string>('');

    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpenSnackbar(false);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

            if (file && allowedTypes.includes(file.type)) {
                setImage(file);
                setMsg('');
            } else {
                const errorMsg = 'Unsupported format: Only JPG, JPEG, WEBP and PNG files are allowed.';
                setMsg(errorMsg);
                showSnackbar(errorMsg, 'error');
                setImage(null);
                return;
            }
            setImage(file)
        } else {
            setImage(null)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (form.password !== form.confirmPassword) {
            showSnackbar("Passwords don't match!", 'error');
            return;
        }

        if (form.password.length < 6) {
            showSnackbar("Password must be at least 6 characters long!", 'error');
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("name", form.name || "");
            formData.append("email", form.email || "");
            formData.append("phone", form.phone || "");
            formData.append("gender", form.gender || "");
            formData.append("password", form.password || "");

            if (image) {
                formData.append("profilePicture", image);
            }

            console.log('Sending signup request...');
            const res = await signup(formData);
            console.log('Handle submit Response', res);

            // FIXED: Handle different response structures
            if (res && res.success) {
                // Get user ID from different possible response structures
                const userId = res.data?.user?._id ||
                    res.data?._id ||
                    res.user?._id ||
                    res.userId;

                console.log('Extracted user ID:', userId);

                if (userId) {
                    // Store the user ID for OTP verification
                    setRegisteredUserId(userId);

                    showSnackbar('Account created successfully! Please verify OTP.');

                    // Show OTP popup
                    setShowOtpPopup(true);

                    // Reset form
                    setForm({
                        name: "",
                        email: "",
                        phone: "",
                        gender: "",
                        password: "",
                        confirmPassword: "",
                    });
                } else {
                    console.error('User ID not found in response:', res);
                    showSnackbar('Registration successful but user ID not found. Please contact support.', 'error');
                }

            } else {
                const errorMessage = res?.message || 'Signup failed. Please try again.';
                showSnackbar(errorMessage, 'error');
            }

        } catch (error: unknown) {
            console.error('Signup error:', error);

            const err = error as {
                response?: { data?: { message?: string } };
                message?: string;
            };

            const errorMessage = err?.response?.data?.message ||
                err?.message ||
                'Signup failed. Please try again.';

            showSnackbar(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = () => {
        // Implement Google OAuth logic here
        console.log('Google signup clicked');
    };

    const handleClose = () => {
        setForm({
            name: "",
            gender: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: ""
        });
        setErrors({});
        setShowPassword(false);
        setRegisteredUserId(''); // Reset user ID
        setShowOtpPopup(false); // Close OTP popup if open
        onClose();
    };

    const handleSwitchToLogin = (e: React.MouseEvent) => {
        e.preventDefault();
        onClose();
        onSwitchToLogin();
    };

    const handleOtpVerifySuccess = () => {
        showSnackbar('OTP verified successfully! Redirecting to login...');

        // Close both modals and redirect to login
        setTimeout(() => {
            setShowOtpPopup(false);
            onClose();
            onSwitchToLogin(); // Switch to login modal
        }, 1500);
    };

    const handleCloseOtpPopup = () => {
        setShowOtpPopup(false);
        // Keep the signup modal open so user can try again
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '12px',
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogContent sx={{ p: 0 }}>
                    <Box className="signup-modal-container">
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

                        {/* Signup Card */}
                        <Box className="signup-card">
                            {/* Logo Section */}
                            <Box className="signup-logo">
                                {/* <LocalMovies className="logo-icon" /> */}
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
                                <Typography variant="h1"
                                    sx={{ fontSize: { xs: '2rem' } }}
                                >
                                    BookMyCinema
                                </Typography>
                                <Typography variant="body1"
                                    className="signup-subtitle"
                                    sx={{ fontSize: { xs: '0.9rem' } }}
                                >
                                    Sign up to start your movie journey
                                </Typography>
                            </Box>

                            {/* Signup Form */}
                            <Box component="form" onSubmit={handleSubmit} className="signup-form">
                                {/* Name Field */}
                                <Box className="form-group name-field">
                                    <label htmlFor="name" className="form-label">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        className={`form-input ${errors.name ? 'error' : ''}`}
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="Enter your full name"
                                        required
                                    />
                                    {errors.name && <div className="error-message">{errors.name}</div>}
                                </Box>

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
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="Enter your email"
                                        required
                                    />
                                    {errors.email && <div className="error-message">{errors.email}</div>}
                                </Box>

                                {/* Phone Field */}
                                <Box className="form-group">
                                    <label htmlFor="phone" className="form-label">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        className={`form-input ${errors.phone ? 'error' : ''}`}
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="Enter your phone number"
                                        required
                                    />
                                    {errors.phone && <div className="error-message">{errors.phone}</div>}
                                </Box>

                                <Box className="form-group name-field">
                                    <label htmlFor="gender" className="form-label">
                                        Gender
                                    </label>
                                    <select
                                        id="gender"
                                        name="gender"
                                        className={`form-input ${errors.gender ? 'error' : ''}`}
                                        value={form.gender}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                    {errors.gender && <div className="error-message">{errors.gender}</div>}
                                </Box>

                                {/* Password Field */}
                                <Box className="form-group">
                                    <label htmlFor="password" className="form-label">
                                        Password
                                    </label>
                                    <div className="password-input-container">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="password"
                                            name="password"
                                            className={`form-input ${errors.password ? 'error' : ''}`}
                                            value={form.password}
                                            onChange={handleChange}
                                            placeholder="Enter your password"
                                            required
                                        />
                                        <MuiIconButton
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                            type="button"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </MuiIconButton>
                                    </div>
                                    {errors.password && <div className="error-message">{errors.password}</div>}
                                </Box>

                                {/* Confirm Password Field */}
                                <Box className="form-group">
                                    <label htmlFor="confirmPassword" className="form-label">
                                        Confirm Password
                                    </label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm your password"
                                        required
                                    />
                                    {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
                                </Box>

                                <Box className="upload-container">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                        className="file-input"
                                    />
                                    <Button
                                        variant="outlined"
                                        startIcon={<CloudUpload />}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="upload-btn"
                                        fullWidth
                                    >
                                        {image ? 'Change Photo' : 'Choose Profile Photo'}
                                    </Button>

                                    {image && (
                                        <Box className="preview-container">
                                            <Avatar
                                                src={URL.createObjectURL(image)}
                                                alt={form.name}
                                                className="preview-avatar"
                                            />
                                            <Typography variant="body2" className="file-info">
                                                {image.name}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="signup-button"
                                    disabled={loading}
                                >
                                    {loading ? <CircularProgress size={20} /> : 'Create Account'}
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

                                {/* Google Sign Up */}
                                <button
                                    type="button"
                                    className="google-button"
                                    onClick={handleGoogleSignup}
                                >
                                    <Google className="google-icon" />
                                    Sign up with Google
                                </button>

                                {/* Login Link */}
                                <Box className="login-link">
                                    Already have an account?{' '}
                                    <a href="#" onClick={handleSwitchToLogin}>
                                        Sign in
                                    </a>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>

            {/* OTP Popup */}
            <OtpPopup
                userId={registeredUserId}
                isOpen={showOtpPopup}
                onClose={handleCloseOtpPopup}
                onVerifySuccess={handleOtpVerifySuccess}
            />
        </>
    );
};

export default SignupModal;