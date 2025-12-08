import nodemailer from 'nodemailer';

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        this.verifyTransporter();
    }

    private async verifyTransporter(): Promise<void> {
        try {
            await this.transporter.verify();
            console.log('✅ Email transporter is ready');
        } catch (error) {
            console.error('Email transporter configuration error:', error);
        }
    }

    // Generic email method
    async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
        try {
            const mailOptions = {
                from: `"BookMyCinema" <${process.env.EMAIL_USER}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully:', result.messageId);
            return { success: true };
        } catch (error: any) {
            console.error('Error sending email:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Send welcome email after successful registration
    async sendWelcomeEmail(email: string, name: string): Promise<{ success: boolean; error?: string }> {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to BookMyCinema</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: #ffffff;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        .email-wrapper {
            max-width: 100%;
            width: 100%;
            margin: 0 auto;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            border: 1px solid #e8e8e8;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        .email-header {
            padding: 40px 32px 32px;
            text-align: center;
            border-bottom: 1px solid #e8e8e8;
        }
        
        .logo-section {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
            padding: 16px 24px;
            border: 2px solid #1a1a1a;
            border-radius: 12px;
        }
        
        .logo-icon {
            font-size: 24px;
        }
        
        .logo-text {
            font-size: 24px;
            font-weight: 800;
            color: #1a1a1a;
            letter-spacing: -0.5px;
        }
        
        .email-title {
            font-size: 32px;
            font-weight: 700;
            margin: 0 0 8px;
            color: #1a1a1a;
            line-height: 1.2;
        }
        
        .email-subtitle {
            font-size: 16px;
            color: #666666;
            font-weight: 500;
        }
        
        .email-content {
            padding: 40px 32px;
        }
        
        .greeting {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #1a1a1a;
            text-align: center;
        }
        
        .success-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            margin: 0 auto 24px;
            font-weight: 600;
            color: #1a1a1a;
        }
        
        .message {
            color: #4a5568;
            margin-bottom: 24px;
            font-size: 16px;
            text-align: center;
            line-height: 1.6;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin: 32px 0;
        }
        
        .feature-card {
            padding: 20px;
            border: 1px solid #e8e8e8;
            border-radius: 8px;
            text-align: center;
            transition: all 0.2s ease;
        }
        
        .feature-card:hover {
            border-color: #1a1a1a;
            transform: translateY(-2px);
        }
        
        .feature-icon {
            font-size: 32px;
            margin-bottom: 12px;
            display: block;
            height: 40px;
        }
        
        .feature-title {
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 6px;
            font-size: 14px;
        }
        
        .feature-desc {
            font-size: 12px;
            color: #666666;
            line-height: 1.4;
        }
        
        .cta-section {
            text-align: center;
            margin: 32px 0 24px;
            padding: 24px;
            border: 2px solid #1a1a1a;
            border-radius: 8px;
        }
        
        .cta-title {
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 16px;
            font-size: 16px;
        }
        
        .cta-button {
            display: inline-block;
            background: #1a1a1a;
            color: #ffffff;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            border: 2px solid #1a1a1a;
            transition: all 0.2s ease;
        }
        
        .cta-button:hover {
            background: #ffffff;
            color: #1a1a1a;
        }
        
        .stats-section {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin: 24px 0;
            text-align: center;
        }
        
        .stat-item {
            padding: 16px;
            border: 1px solid #e8e8e8;
            border-radius: 6px;
        }
        
        .stat-number {
            font-size: 20px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 4px;
            display: block;
        }
        
        .stat-label {
            font-size: 11px;
            color: #666666;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .email-footer {
            padding: 32px;
            border-top: 1px solid #e8e8e8;
            text-align: center;
        }
        
        .social-links {
            display: flex;
            justify-content: center;
            gap: 12px;
            margin: 20px 0;
        }
        
        .social-icon {
            width: 36px;
            height: 36px;
            border: 1px solid #1a1a1a;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #1a1a1a;
            text-decoration: none;
            font-size: 14px;
            transition: all 0.2s ease;
        }
        
        .social-icon:hover {
            background: #1a1a1a;
            color: #ffffff;
        }
        
        .footer-text {
            font-size: 12px;
            color: #666666;
            margin-bottom: 6px;
            line-height: 1.4;
        }
        
        .footer-links {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 16px 0;
        }
        
        .footer-link {
            color: #1a1a1a;
            text-decoration: none;
            font-size: 12px;
            font-weight: 500;
        }
        
        .footer-link:hover {
            text-decoration: underline;
        }
        
        /* Responsive Design */
        @media (max-width: 640px) {
            .email-container {
                margin: 0 16px;
                border-radius: 8px;
            }
            
            .email-header {
                padding: 32px 24px 24px;
            }
            
            .email-content {
                padding: 32px 24px;
            }
            
            .email-title {
                font-size: 24px;
            }
            
            .greeting {
                font-size: 20px;
            }
            
            .features-grid {
                grid-template-columns: 1fr;
                gap: 12px;
            }
            
            .stats-section {
                grid-template-columns: 1fr;
                gap: 12px;
            }
            
            .cta-section {
                padding: 20px;
                margin: 24px 0 20px;
            }
            
            .cta-button {
                padding: 12px 24px;
                font-size: 13px;
            }
            
            .logo-section {
                padding: 12px 20px;
            }
            
            .logo-text {
                font-size: 20px;
            }
        }
        
        @media (max-width: 480px) {
            .email-header {
                padding: 24px 20px 20px;
            }
            
            .email-content {
                padding: 24px 20px;
            }
            
            .footer-links {
                flex-direction: column;
                gap: 8px;
            }
            
            .social-links {
                gap: 8px;
            }
            
            .social-icon {
                width: 32px;
                height: 32px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <!-- Header with Logo -->
            <div class="email-header">
                <div class="logo-section">
                    <span class="logo-icon">🎬</span>
                    <span class="logo-text">BookMyCinema</span>
                </div>
                <h1 class="email-title">Welcome Aboard</h1>
                <p class="email-subtitle">Your cinematic journey begins now</p>
            </div>
            
            <!-- Main Content -->
            <div class="email-content">
                <h2 class="greeting">Hello ${name},</h2>
                
                <div class="success-badge">
                    <span>✅</span>
                    <span>Account Successfully Created</span>
                </div>
                
                <p class="message">
                    Welcome to BookMyCinema! We're thrilled to have you join our community of movie enthusiasts. 
                    Get ready to discover amazing films and book your tickets seamlessly.
                </p>
                
                <!-- Stats Section -->
                <div class="stats-section">
                    <div class="stat-item">
                        <span class="stat-number">500+</span>
                        <span class="stat-label">Movies</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">50+</span>
                        <span class="stat-label">Theaters</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">10K+</span>
                        <span class="stat-label">Movie Lovers</span>
                    </div>
                </div>
                
                <!-- Features Grid -->
                <div class="features-grid">
                    <div class="feature-card">
                        <span class="feature-icon">🎫</span>
                        <div class="feature-title">Quick Booking</div>
                        <div class="feature-desc">Reserve seats in seconds</div>
                    </div>
                    <div class="feature-card">
                        <span class="feature-icon">💺</span>
                        <div class="feature-title">Smart Seating</div>
                        <div class="feature-desc">Choose perfect spots</div>
                    </div>
                    <div class="feature-card">
                        <span class="feature-icon">📱</span>
                        <div class="feature-title">Digital Tickets</div>
                        <div class="feature-desc">Access anywhere, anytime</div>
                    </div>
                    <div class="feature-card">
                        <span class="feature-icon">⭐</span>
                        <div class="feature-title">Rewards</div>
                        <div class="feature-desc">Earn with every booking</div>
                    </div>
                </div>
                
                <!-- Call to Action -->
                <div class="cta-section">
                    <div class="cta-title">Ready for your first movie adventure?</div>
                    <a href="${process.env.FRONTEND_URL || 'https://bookmycinema.com'}/movies" class="cta-button">
                        Explore Movies
                    </a>
                </div>
                
                <p style="text-align: center; color: #666666; font-style: italic; font-size: 13px; margin-top: 24px;">
                    "The cinema is a mirror by which we often see ourselves." 
                </p>
            </div>
            
            <!-- Footer -->
            <div class="email-footer">
                <div class="social-links">
                    <a href="#" class="social-icon">📘</a>
                    <a href="#" class="social-icon">🐦</a>
                    <a href="#" class="social-icon">📷</a>
                    <a href="#" class="social-icon">💼</a>
                </div>
                
                <div class="footer-links">
                    <a href="#" class="footer-link">Help Center</a>
                    <a href="#" class="footer-link">Contact Support</a>
                    <a href="#" class="footer-link">Privacy Policy</a>
                    <a href="#" class="footer-link">Terms of Service</a>
                </div>
                
                <p class="footer-text">
                    BookMyCinema &copy; ${new Date().getFullYear()} All rights reserved.
                </p>
                <p class="footer-text">
                    Revolutionizing your movie experience
                </p>
                <p class="footer-text" style="color: #999999; margin-top: 12px;">
                    This is an automated message. Please do not reply to this email.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `;

        return this.sendEmail({
            to: email,
            subject: 'Welcome to BookMyCinema! 🎬 Your Account is Ready',
            html
        });
    }

    // Send password reset email
    async sendPasswordResetEmail(email: string, resetToken: string, name: string): Promise<{ success: boolean; error?: string }> {
        const resetUrl = `${process.env.FRONTEND_URL || 'https://bookmycinema.com'}/reset-password?token=${resetToken}`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - BookMyCinema</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: #ffffff;
        }
        
        .email-wrapper {
            max-width: 100%;
            width: 100%;
            margin: 0 auto;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            border: 1px solid #e8e8e8;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        .email-header {
            padding: 32px;
            text-align: center;
            border-bottom: 1px solid #e8e8e8;
        }
        
        .logo-section {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
        }
        
        .logo-icon {
            font-size: 20px;
        }
        
        .logo-text {
            font-size: 20px;
            font-weight: 700;
            color: #1a1a1a;
        }
        
        .security-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        
        .email-title {
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 8px;
            color: #1a1a1a;
        }
        
        .email-content {
            padding: 32px;
        }
        
        .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #1a1a1a;
        }
        
        .reset-section {
            border: 2px solid #1a1a1a;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
            text-align: center;
        }
        
        .reset-button {
            display: inline-block;
            background: #1a1a1a;
            color: #ffffff;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            border: 2px solid #1a1a1a;
            transition: all 0.2s ease;
        }
        
        .reset-button:hover {
            background: #ffffff;
            color: #1a1a1a;
        }
        
        .email-footer {
            padding: 24px 32px;
            border-top: 1px solid #e8e8e8;
            text-align: center;
        }
        
        .footer-text {
            font-size: 12px;
            color: #666666;
            margin-bottom: 4px;
        }
        
        @media (max-width: 640px) {
            .email-container {
                margin: 0 16px;
                border-radius: 8px;
            }
            
            .email-header, .email-content {
                padding: 24px;
            }
            
            .reset-section {
                padding: 20px;
                margin: 20px 0;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <!-- Header -->
            <div class="email-header">
                <div class="logo-section">
                    <span class="logo-icon">🎬</span>
                    <span class="logo-text">BookMyCinema</span>
                </div>
                <div class="security-icon">🔒</div>
                <h1 class="email-title">Password Reset</h1>
                <p style="color: #666666; font-size: 14px;">Secure your account access</p>
            </div>
            
            <!-- Content -->
            <div class="email-content">
                <h2 class="greeting">Hello ${name},</h2>
                
                <p style="color: #4a5568; margin-bottom: 20px; font-size: 14px; line-height: 1.5;">
                    We received a request to reset your BookMyCinema account password. 
                    Click the button below to create a new secure password.
                </p>
                
                <div class="reset-section">
                    <a href="${resetUrl}" class="reset-button">
                        Reset Password
                    </a>
                    <p style="font-size: 12px; color: #666666; margin-top: 12px;">
                        This link expires in 1 hour for security
                    </p>
                </div>
                
                <p style="color: #4a5568; margin-bottom: 20px; font-size: 14px; line-height: 1.5;">
                    If you didn't request this reset, please ignore this email. 
                    Your account security remains intact.
                </p>
            </div>
            
            <!-- Footer -->
            <div class="email-footer">
                <p class="footer-text">&copy; ${new Date().getFullYear()} BookMyCinema. All rights reserved.</p>
                <p class="footer-text" style="color: #999999;">This is an automated security message.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;

        return this.sendEmail({
            to: email,
            subject: 'Reset Your Password - BookMyCinema Security',
            html
        });
    }

    
}

export const emailService = new EmailService();
export default emailService;