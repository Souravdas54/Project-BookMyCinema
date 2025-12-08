import nodemailer from 'nodemailer';
import QRService from './qrcode.service';
import { bookingRepository } from '../repository/booking.repo';

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    attachments?: Array<{
        filename: string;
        path?: string;
        cid?: string;
    }>;
}

class BookingEmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD,
            },
        });

        this.verifyTransporter();
    }

    private async verifyTransporter(): Promise<void> {
        try {
            await this.transporter.verify();
            console.log('✅ Email transporter is ready');
        } catch (error) {
            console.error('❌ Email transporter configuration error:', error);
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
                attachments: options.attachments || []
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

    // Format date for display
    private formatDate(dateString: string | Date): string {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Date not specified';
        }
    }

    // Format time for display - FIXED to handle object/array
    private formatTime(timeData: any): string {
        try {
            // If timeData is an object, extract the time
            if (typeof timeData === 'object') {
                // Check if it's an array
                if (Array.isArray(timeData)) {
                    // Get first time slot from array
                    timeData = timeData[0];
                } else if (timeData.time) {
                    // If object has time property
                    timeData = timeData.time;
                } else if (timeData.startTime) {
                    // If object has startTime property
                    timeData = timeData.startTime;
                } else {
                    // Try to convert object to string
                    timeData = String(timeData);
                }
            }

            // Now process as string
            const timeString = String(timeData);
            
            // If time is in 24-hour format, convert to 12-hour format
            const timeMatch = timeString.match(/(\d{1,2}):(\d{2})/);
            if (timeMatch) {
                const hour = parseInt(timeMatch[1]);
                const minutes = timeMatch[2];
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 || 12;
                return `${hour12}:${minutes} ${ampm}`;
            }
            
            return timeString;
        } catch (error) {
            console.error('Error formatting time:', timeData, error);
            return 'Time not specified';
        }
    }

    // Get short booking ID (last 6 characters)
    private getShortBookingId(bookingId: string): string {
        try {
            if (bookingId && bookingId.length > 6) {
                return bookingId.slice(-6).toLowerCase();
            }
            return bookingId || 'N/A';
        } catch (error) {
            return 'N/A';
        }
    }

    // Get screen number safely
    private getScreenNumber(bookingDetails: any): string {
        try {
            // Try different possible field names for screen
            if (bookingDetails.show?.screen) {
                return String(bookingDetails.show.screen);
            }
            if (bookingDetails.show?.screenNumber) {
                return String(bookingDetails.show.screenNumber);
            }
            if (bookingDetails.screen) {
                return String(bookingDetails.screen);
            }
            if (bookingDetails.screenNumber) {
                return String(bookingDetails.screenNumber);
            }
            return '1'; // Default screen number
        } catch (error) {
            return '1';
        }
    }

    // Get room name safely
    private getRoomName(bookingDetails: any): string {
        try {
            if (typeof bookingDetails.show?.room === 'string') {
                return bookingDetails.show.room;
            }
            if (typeof bookingDetails.room === 'string') {
                return bookingDetails.room;
            }
            if (bookingDetails.show?.room?.name) {
                return bookingDetails.show.room.name;
            }
            if (bookingDetails.room?.name) {
                return bookingDetails.room.name;
            }
            return 'Main Hall';
        } catch (error) {
            return 'Main Hall';
        }
    }

    // Generate email HTML with booking details and QR code - FIXED VERSION
    private generateBookingEmailHTML(bookingDetails: any, qrCodeDataURL: string): string {
        const formattedDate = this.formatDate(bookingDetails.show?.date || bookingDetails.date);
        
        // Fixed time formatting
        const timeData = bookingDetails.show?.timeSlots || bookingDetails.show?.time || bookingDetails.time;
        const formattedTime = this.formatTime(timeData);
        
        const seatsList = bookingDetails.seats?.join(', ') || '';
        const shortBookingId = this.getShortBookingId(bookingDetails._id || bookingDetails.bookingId);
        const screenNumber = this.getScreenNumber(bookingDetails);
        const roomName = this.getRoomName(bookingDetails);

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmed - BookMyCinema</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body {
            font-family: 'Poppins', sans-serif;
            line-height: 1.6;
            color: #333333;
            background: #f5f7fa;
            margin: 0;
            padding: 20px;
        }
        
        .email-wrapper {
            max-width: 100%;
            width: 100%;
            margin: 0 auto;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            background: white;
        }
        
        /* Header Section */
        .email-header {
            padding: 40px 30px;
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            position: relative;
        }
        
        .header-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.1);
        }
        
        .logo-section {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
        }
        
        .logo-icon {
            font-size: 24px;
            background: white;
            color: #667eea;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .logo-text {
            font-size: 22px;
            font-weight: 700;
            color: white;
        }
        
        .confirmation-icon { 
            font-size: 60px; 
            margin-bottom: 20px; 
            position: relative;
            z-index: 1;
        }
        
        .email-title {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 10px;
            color: white;
            position: relative;
            z-index: 1;
        }
        
        .email-subtitle {
            color: rgba(255, 255, 255, 0.95);
            font-size: 16px;
            font-weight: 400;
            position: relative;
            z-index: 1;
        }
        
        /* Content Section */
        .email-content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 25px;
            color: #2c3e50;
        }
        
        /* Booking Summary Card */
        .booking-summary {
            border-radius: 15px;
            padding: 30px;
            margin: 30px 0;
            background: #f8f9fa;
            border: 1px solid #e8e8e8;
        }
        
        .summary-title {
            color: #2c3e50;
            margin-bottom: 25px;
            font-size: 20px;
            font-weight: 700;
            text-align: center;
            position: relative;
            padding-bottom: 15px;
        }
        
        .summary-title::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 3px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 2px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
        }
        
        .summary-item {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        
        .summary-label {
            font-size: 12px;
            color: #666666;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .summary-value {
            font-size: 15px;
            color: #2c3e50;
            font-weight: 600;
        }
        
        .seats-value {
            background: #e8f4fd;
            padding: 8px 12px;
            border-radius: 8px;
            font-weight: 600;
            color: #3498db;
            display: inline-block;
        }
        
        .booking-id-value {
            background: #f0f0f0;
            padding: 8px 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            font-weight: 700;
            color: #2c3e50;
            letter-spacing: 1px;
            display: inline-block;
        }
        
        /* Amount Breakdown */
        .amount-section {
            background: #e8f4fd;
            border: 2px solid #b3d9ff;
            border-radius: 12px;
            padding: 20px;
            margin: 25px 0;
        }
        
        .amount-title {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 600;
            text-align: center;
        }
        
        .amount-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
            padding: 5px 0;
        }
        
        .amount-item.total {
            font-weight: 700;
            font-size: 16px;
            color: #2c3e50;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 2px solid #b3d9ff;
        }
        
        /* QR Code Section */
        .qr-section {
            text-align: center;
            margin: 35px 0;
            padding: 25px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 15px;
            border: 2px dashed #3498db;
        }
        
        .qr-title {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 18px;
            font-weight: 600;
        }
        
        .qr-code {
            width: 180px;
            height: 180px;
            margin: 0 auto 15px;
            padding: 10px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .qr-code img {
            width: 100%;
            height: 100%;
            border-radius: 5px;
        }
        
        .qr-instruction {
            color: #666666;
            font-size: 13px;
            font-style: italic;
            margin-top: 10px;
        }
        
        /* Instructions Section */
        .instructions {
            background: #fff3cd;
            border: 2px solid #ffeaa7;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        
        .instructions-title {
            color: #856404;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .instructions-list {
            padding-left: 20px;
            font-size: 13px;
            color: #856404;
        }
        
        .instructions-list li {
            margin-bottom: 8px;
            line-height: 1.5;
        }
        
        /* Footer */
        .email-footer {
            padding: 25px 30px;
            border-top: 1px solid #e8e8e8;
            text-align: center;
            background: #f8f9fa;
        }
        
        .footer-text {
            font-size: 12px;
            color: #666666;
            margin-bottom: 5px;
        }
        
        .footer-note {
            color: #999999;
            font-size: 11px;
            font-style: italic;
        }
        
        /* Responsive Design */
        @media (max-width: 640px) {
            .email-container {
                margin: 0;
                border-radius: 15px;
            }
            
            .email-header, .email-content {
                padding: 25px;
            }
            
            .summary-grid {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
            .booking-summary {
                padding: 20px;
                margin: 20px 0;
            }
            
            .qr-code {
                width: 150px;
                height: 150px;
            }
            
            .email-title {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <!-- Header -->
            <div class="email-header">
                <div class="header-overlay"></div>
                <div class="logo-section">
                    <span class="logo-icon">🎬</span>
                    <span class="logo-text">BookMyCinema</span>
                </div>
                <div class="confirmation-icon">🎫</div>
                <h1 class="email-title">Booking Confirmed!</h1>
                <p class="email-subtitle">Your tickets are ready for pickup</p>
            </div>
            
            <!-- Content -->
            <div class="email-content">
                <h2 class="greeting">Hello ${bookingDetails.user?.name || bookingDetails.user?.username || 'Valued Customer'},</h2>
                
                <p style="color: #4a5568; margin-bottom: 25px; font-size: 15px; line-height: 1.6;">
                    Thank you for booking with BookMyCinema! Your movie tickets have been successfully confirmed. 
                    Here are all the details of your booking:
                </p>
                
                <!-- Booking Summary -->
                <div class="booking-summary">
                    <h3 class="summary-title">Booking Details</h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span class="summary-label">Movie</span>
                            <span class="summary-value">${bookingDetails.movie?.moviename || 'Movie'}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Date</span>
                            <span class="summary-value">${formattedDate}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Time</span>
                            <span class="summary-value">${formattedTime}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Theater</span>
                            <span class="summary-value">${bookingDetails.theater?.theatername || 'Theater'}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">District</span>
                            <span class="summary-value">${bookingDetails.theater?.district || 'District'}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Room</span>
                            <span class="summary-value">${roomName}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Screen</span>
                            <span class="summary-value">${screenNumber}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Seats</span>
                            <span class="summary-value seats-value">${seatsList}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Booking ID</span>
                            <span class="summary-value booking-id-value">${shortBookingId}</span>
                        </div>
                    </div>
                    
                    <!-- Amount Breakdown -->
                    <div class="amount-section">
                        <h4 class="amount-title">Payment Summary</h4>
                        <div class="amount-item">
                            <span>Base Amount:</span>
                            <span>$${(bookingDetails.baseAmount || 0).toFixed(2)}</span>
                        </div>
                        <div class="amount-item">
                            <span>Service Charge (10%):</span>
                            <span>$${(bookingDetails.serviceCharge || 0).toFixed(2)}</span>
                        </div>
                        <div class="amount-item total">
                            <span>Total Amount Paid:</span>
                            <span style="color: #27ae60; font-weight: 700;">$${(bookingDetails.totalAmount || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                <!-- QR Code Section -->
                <div class="qr-section">
                    <h4 class="qr-title">🎟️ Your Digital Ticket</h4>
                    <div class="qr-code">
                        <img src="${qrCodeDataURL}" alt="Booking QR Code">
                    </div>
                    <p class="qr-instruction">Present this QR code at the theater entrance for verification</p>
                </div>
                
                <!-- Instructions -->
                <div class="instructions">
                    <h4 class="instructions-title">📋 Important Instructions</h4>
                    <ul class="instructions-list">
                        <li>Arrive at least <strong>30 minutes</strong> before the show time</li>
                        <li>Present this QR code at the theater entrance for scanning</li>
                        <li>Carry a valid photo ID proof with you</li>
                        <li>Tickets are non-transferable and non-refundable</li>
                        <li>For any queries, contact: <strong>support@bookmycinema.com</strong></li>
                    </ul>
                </div>
                
                <p style="color: #4a5568; font-size: 14px; line-height: 1.6; text-align: center; margin-top: 25px;">
                    We hope you enjoy the movie experience! 🍿<br>
                    <strong>Note:</strong> Please keep this email safe for future reference.
                </p>
            </div>
            
            <!-- Footer -->
            <div class="email-footer">
                <p class="footer-text">&copy; ${new Date().getFullYear()} BookMyCinema. All rights reserved.</p>
                <p class="footer-note">This is an automated email. Please do not reply to this message.</p>
            </div>
        </div>
    </div>
</body>
</html>
        `;
    }

    // Send booking confirmation email - Main method
    async sendBookingConfirmation(bookingId: string): Promise<{ success: boolean; error?: string }> {
        try {
            // Get booking details from repository
            const bookingDetails = await bookingRepository.getCompleteBookingDetails(bookingId);
            
            if (!bookingDetails) {
                throw new Error("Booking details not found");
            }

            // Check if user email exists
            if (!bookingDetails.user?.email) {
                throw new Error("User email not found");
            }

            // Log booking details for debugging
            console.log('📧 Email - Booking Details:', {
                movieName: bookingDetails.movie?.moviename,
                date: bookingDetails.show?.date,
                timeSlots: bookingDetails.show?.timeSlots,
                screen: bookingDetails.show?.screen,
                room: bookingDetails.show?.room
            });

            // Generate QR code
            const qrCodeDataURL = await QRService.generateBookingQRCode(bookingId);

            // Update booking with QR code data
            await bookingRepository.updateBookingQRCode(bookingId, qrCodeDataURL);

            // Generate email HTML
            const html = this.generateBookingEmailHTML(bookingDetails, qrCodeDataURL);

            // Send email
            const result = await this.sendEmail({
                to: bookingDetails.user.email,
                subject: `🎬 Booking Confirmed: ${bookingDetails.movie?.moviename} | ${this.formatDate(bookingDetails.show?.date)} ${this.formatTime(bookingDetails.show?.timeSlots)}`,
                html: html,
                attachments: [{
                    filename: `ticket-${bookingId.slice(-6)}.png`,
                    path: qrCodeDataURL,
                    cid: 'qrcode'
                }]
            });

            console.log(`✅ Booking confirmation email sent for booking: ${bookingId}`);
            return result;

        } catch (error) {
            console.error('❌ Error sending booking confirmation email:', error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to send email' 
            };
        }
    }

    // Send payment confirmation email
    async sendPaymentConfirmation(bookingId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const bookingDetails = await bookingRepository.getCompleteBookingDetails(bookingId);
            
            if (!bookingDetails) {
                throw new Error("Booking details not found");
            }

            if (!bookingDetails.user?.email) {
                throw new Error("User email not found");
            }

            const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Poppins', sans-serif; line-height: 1.6; color: #333; background: #f5f7fa; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .header { background: #27ae60; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .details { background: #e8f4fd; border-radius: 10px; padding: 20px; margin: 20px 0; border: 2px solid #b3d9ff; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f8f9fa; border-top: 1px solid #e8e8e8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🎉 Payment Successful!</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Your booking is now confirmed</p>
        </div>
        <div class="content">
            <p>Dear <strong>${bookingDetails.user?.name || bookingDetails.user?.username || 'Customer'},</strong></p>
            <p>Your payment has been successfully processed. Here are the details:</p>
            
            <div class="details">
                <p><strong>Booking ID:</strong> ${this.getShortBookingId(bookingDetails._id)}</p>
                <p><strong>Movie:</strong> ${bookingDetails.movie?.moviename}</p>
                <p><strong>Date & Time:</strong> ${this.formatDate(bookingDetails.show?.date)} at ${this.formatTime(bookingDetails.show?.timeSlots)}</p>
                <p><strong>Theater:</strong> ${bookingDetails.theater?.theatername}</p>
                <p><strong>Seats:</strong> ${bookingDetails.seats?.join(', ')}</p>
                <p><strong>Amount Paid:</strong> <span style="color: #27ae60; font-weight: bold;">$${(bookingDetails.totalAmount || 0).toFixed(2)}</span></p>
                <p><strong>Payment Status:</strong> <span style="color: #27ae60; font-weight: bold;">✅ Paid & Confirmed</span></p>
            </div>
            
            <p>Your tickets are now confirmed and ready for the show! Check your email for the booking confirmation with your digital ticket and QR code.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BookMyCinema</p>
        </div>
    </div>
</body>
</html>
            `;

            return await this.sendEmail({
                to: bookingDetails.user.email,
                subject: `✅ Payment Successful - ${bookingDetails.movie?.moviename} | Booking ID: ${this.getShortBookingId(bookingDetails._id)}`,
                html: html
            });

        } catch (error) {
            console.error('❌ Error sending payment confirmation email:', error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to send email' 
            };
        }
    }
}

// Create singleton instance
export const bookingEmailService = new BookingEmailService();
export default bookingEmailService;