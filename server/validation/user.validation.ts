import Joi from 'joi';

export const UserValidation = {

    // Signup validation
    signup: Joi.object({
        name: Joi.string().min(3).max(50).required().messages({
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 3 characters long',
            'string.max': 'Name cannot exceed 50 characters',
            'any.required': 'Name is required'
        }),
        email: Joi.string().email().required().messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
        phone: Joi.string()
            .pattern(/^[\+]?[1-9][\d]{0,15}$/)
            .min(10)
            .max(15)
            .required()
            .messages({
                'string.empty': 'Phone number is required',
                'string.pattern.base': 'Please provide a valid phone number (e.g., 1234567890 or +1234567890)',
                'string.min': 'Phone number must be at least 10 digits',
                'string.max': 'Phone number cannot exceed 15 digits',
                'any.required': 'Phone number is required'
            }),
        gender: Joi.string().required().messages({
            'string.empty': 'Gender is required',
            'any.required': 'Gender is required'
        }),
        password: Joi.string()
            .min(8)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .required()
            .messages({
                'string.empty': 'Password is required',
                'string.min': 'Password must be at least 8 characters long',
                'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                'any.required': 'Password is required'
            }),
        profilePicture: Joi.string().uri().optional().messages({
            'string.uri': 'Profile picture must be a valid URL'
        }),
        role: Joi.string().valid('admin', 'user').default('user').messages({
            'any.only': 'Role must be either "admin" or "user"'
        })
    }),

    // Login validation
    login: Joi.object({
        email: Joi.string().email().required().messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
        password: Joi.string().required().messages({
            'string.empty': 'Password is required',
            'any.required': 'Password is required'
        })
    }),

    // Update profile validation
    updateProfile: Joi.object({
        name: Joi.string().min(3).max(50).optional().messages({
            'string.min': 'Name must be at least 3 characters long',
            'string.max': 'Name cannot exceed 50 characters'
        }),
        phone: Joi.string()
            .pattern(/^[\+]?[1-9][\d]{0,15}$/)
            .min(10)
            .max(15)
            .optional()
            .messages({
                'string.pattern.base': 'Please provide a valid phone number (e.g., 1234567890 or +1234567890)',
                'string.min': 'Phone number must be at least 10 digits',
                'string.max': 'Phone number cannot exceed 15 digits'
            }),
        profilePicture: Joi.string().uri().optional().messages({
            'string.uri': 'Profile picture must be a valid URL'
        }),
        gender: Joi.string().optional()
    }),

    // Change password validation
    changePassword: Joi.object({
        currentPassword: Joi.string().required().messages({
            'string.empty': 'Current password is required',
            'any.required': 'Current password is required'
        }),
        newPassword: Joi.string()
            .min(8)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .required()
            .messages({
                'string.empty': 'New password is required',
                'string.min': 'New password must be at least 8 characters long',
                'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                'any.required': 'New password is required'
            }),
        confirmPassword: Joi.any().equal(Joi.ref('newPassword'))
            .required()
            .messages({
                'any.only': 'Confirm password must match new password',
                'any.required': 'Please confirm your password'
            })
    })
};