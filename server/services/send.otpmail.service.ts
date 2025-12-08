import nodemailer from 'nodemailer';
import otpModel from '../models/otp.model';
import { userInterface } from '../interfaces/user.interface';

interface TransporterConfig {
    service: string;
    auth: {
        user: string;
        pass: string;
    };
}

interface EmailOptions {
    from: string;
    to: string;
    subject: string;
    html: string;
}

// CORRECTED: Use createTransport instead of createTransporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER as string,
        pass: process.env.EMAIL_PASS as string
    }
} as TransporterConfig);

const sendOtpEmail = async (email: string, user: userInterface): Promise<boolean> => {
    try {
        // Generate a random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Remove any existing OTP for this user
        await otpModel.deleteMany({ userId: user._id });

        // Save OTP in database with expiry
        await new otpModel({
            userId: user._id,
            otp: otp
        }).save();

        const emailOptions: EmailOptions = {
            from: process.env.EMAIL_USER as string,
            to: email,
            subject: "Your OTP verification code",
            html: ` <div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e1e5e9; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 40px 24px; text-align: center; position: relative;">
        <div style="width: 60px; height: 60px; background: rgba(255, 255, 255, 0.2); border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Security Verification</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 18px; font-weight: 400;">Service Management System</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 48px 32px;">
        <!-- Greeting -->
        <div style="margin-bottom: 32px;">
            <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px; font-weight: 600; line-height: 1.3;">
                Hello ${user.name || 'Valued Customer'},
            </h2>
            <p style="color: #6b7280; margin: 0; line-height: 1.6; font-size: 16px;">
                To complete your request and ensure the security of your account, please use the One-Time Password (OTP) below:
            </p>
        </div>
        
        <!-- OTP Display -->
        <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px solid #e2e8f0; border-radius: 12px; padding: 32px 24px; text-align: center; margin: 40px 0; position: relative;">
            <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #2563eb; color: white; padding: 6px 20px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                VERIFICATION CODE
            </div>
            <div style="font-size: 48px; font-weight: 800; color: #1e40af; letter-spacing: 12px; margin: 16px 0; font-family: 'Courier New', monospace; line-height: 1.2;">
                ${otp}
            </div>
            <div style="background: #dbeafe; padding: 12px; border-radius: 8px; margin-top: 16px;">
                <p style="color: #1e40af; margin: 0; font-size: 14px; font-weight: 600;">
                    ⏱️ Valid for 1 minute only
                </p>
            </div>
        </div>
        
        <!-- Instructions -->
        <div style="margin-bottom: 32px;">
            <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
                <div style="background: #dcfce7; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
                    <span style="color: #16a34a; font-size: 14px; font-weight: bold;">✓</span>
                </div>
                <p style="color: #374151; margin: 0; line-height: 1.6; font-size: 15px;">
                    Enter this code in the verification field to proceed with your action
                </p>
            </div>
            
            <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
                <div style="background: #fef3c7; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
                    <span style="color: #d97706; font-size: 14px; font-weight: bold;">!</span>
                </div>
                <p style="color: #374151; margin: 0; line-height: 1.6; font-size: 15px;">
                    This code expires automatically after 1 minute for security protection
                </p>
            </div>
        </div>
        
        <!-- Security Alert -->
        <div style="background: linear-gradient(135deg, #fef3f2 0%, #fff6f6 100%); border: 1px solid #fecaca; border-radius: 12px; padding: 24px; margin-top: 32px;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="background: #dc2626; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <span style="color: white; font-size: 12px; font-weight: bold;">!</span>
                </div>
                <h3 style="color: #dc2626; margin: 0; font-size: 16px; font-weight: 700;">Security Alert</h3>
            </div>
            <p style="color: #7f1d1d; margin: 0; font-size: 14px; line-height: 1.5;">
                <strong>Never share this code</strong> with anyone. Our support team will never ask for your verification code. 
                If you didn't request this, please secure your account immediately.
            </p>
        </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8fafc; padding: 32px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
        <div style="margin-bottom: 20px;">
            <h3 style="color: #374151; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">Service Management System</h3>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Streamlining your service operations</p>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <p style="color: #9ca3af; margin: 0 0 8px 0; font-size: 14px;">
                &copy; 2024 Service Management System. All rights reserved.
            </p>
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                This is an automated security message. Please do not reply to this email.
            </p>
            <p style="color: #9ca3af; margin: 12px 0 0 0; font-size: 12px;">
                Need help? Contact our support team at <a href="mailto:support@servicemanagement.com" style="color: #2563eb; text-decoration: none;">support@servicemanagement.com</a>
            </p>
        </div>
    </div>
</div>

<!-- Mobile Responsive Meta -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
    @media (max-width: 640px) {
        .mobile-container {
            max-width: 100% !important;
            margin: 0 16px !important;
            border-radius: 12px !important;
        }
        .mobile-padding {
            padding: 32px 20px !important;
        }
        .mobile-header {
            padding: 32px 20px !important;
        }
        .mobile-otp {
            font-size: 36px !important;
            letter-spacing: 8px !important;
            padding: 24px 16px !important;
        }
        .mobile-text {
            font-size: 14px !important;
        }
        .mobile-title {
            font-size: 24px !important;
        }
        .mobile-subtitle {
            font-size: 16px !important;
        }
    }
    
    @media (max-width: 480px) {
        .mobile-otp {
            font-size: 28px !important;
            letter-spacing: 6px !important;
        }
        .mobile-padding {
            padding: 24px 16px !important;
        }
    }
    
    @media (min-width: 1920px) {
        .desktop-container {
            max-width: 700px !important;
        }
    }
</style>`
        };

        await transporter.sendMail(emailOptions);
        console.log(`OTP sent successfully to ${email}`);
        return true;

    } catch (error) {
        console.error('Email sending error:', error);
        return false;
    }
}

export { sendOtpEmail };