import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import { bookingRepository } from '../repository/booking.repo'; // Changed from payment.repo
import { EmailBookingDetails } from '../interfaces/booking.interface';

class QRService {
    // Generate JWT token with booking details
    static async generateBookingToken(bookingId: string): Promise<string> {
        try {
            // Get booking details using bookingRepository
            const bookingDetails = await bookingRepository.getCompleteBookingDetails(bookingId);
            
            if (!bookingDetails) {
                throw new Error('Booking not found');
            }

            const tokenData = {
                bookingId: bookingDetails._id.toString(),
                userId: bookingDetails.userId.toString(),
                userName: bookingDetails.user?.name || bookingDetails.user?.username || 'User',
                userEmail: bookingDetails.user?.email,
                movieName: bookingDetails.movie?.moviename || 'Movie',
                theaterName: bookingDetails.theater?.theatername || 'Theater',
                district: bookingDetails.theater?.district || 'District',
                room: bookingDetails.show?.room || 'Room',
                screen: bookingDetails.show?.screen || 'Screen 1',
                date: bookingDetails.show?.date ? new Date(bookingDetails.show.date).toISOString() : '',
                time: bookingDetails.show?.timeSlots?.[0] || 'Time not specified',
                seats: bookingDetails.seats || [],
                totalAmount: bookingDetails.totalAmount || 0,
                baseAmount: bookingDetails.baseAmount || 0,
                serviceCharge: bookingDetails.serviceCharge || 0,
                status: bookingDetails.status,
                paymentStatus: bookingDetails.paymentStatus
            };

            return jwt.sign(
                tokenData,
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '30d' }
            );
        } catch (error) {
            console.error('Error generating booking token:', error);
            throw error;
        }
    }

    // Generate QR code image as data URL
    static async generateQRCodeDataURL(token: string): Promise<string> {
        const verificationURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-ticket?token=${token}`;
        
        try {
            const qrCodeDataURL = await QRCode.toDataURL(verificationURL, {
                errorCorrectionLevel: 'H',
                margin: 1,
                width: 300
            });
            return qrCodeDataURL;
        } catch (error) {
            console.error('QR Code generation error:', error);
            throw error;
        }
    }

    // Generate QR code for booking
    static async generateBookingQRCode(bookingId: string): Promise<string> {
        try {
            const token = await this.generateBookingToken(bookingId);
            const qrCodeDataURL = await this.generateQRCodeDataURL(token);
            return qrCodeDataURL;
        } catch (error) {
            console.error('Error generating booking QR code:', error);
            throw error;
        }
    }

    // Verify QR code token
    static async verifyQRToken(token: string): Promise<{success: boolean; data?: any; message?: string}> {
        try {
            // Verify JWT token
            const decoded = jwt.verify(
                token, 
                process.env.JWT_SECRET || 'your-secret-key'
            ) as any;

            // Get booking details using bookingRepository
            const bookingDetails = await bookingRepository.getCompleteBookingDetails(decoded.bookingId);
            
            if (!bookingDetails) {
                throw new Error('Booking not found');
            }

            return {
                success: true,
                data: {
                    bookingId: bookingDetails._id.toString(),
                    userName: bookingDetails.user?.name || bookingDetails.user?.username || 'User',
                    movieName: bookingDetails.movie?.moviename || 'Movie',
                    theaterName: bookingDetails.theater?.theatername || 'Theater',
                    district: bookingDetails.theater?.district || 'District',
                    room: bookingDetails.show?.room || 'Room',
                    screen: bookingDetails.show?.screen || 'Screen 1',
                    date: bookingDetails.show?.date ? new Date(bookingDetails.show.date).toISOString() : '',
                    time: bookingDetails.show?.timeSlots?.[0] || 'Time not specified',
                    seats: bookingDetails.seats || [],
                    totalAmount: bookingDetails.totalAmount || 0,
                    baseAmount: bookingDetails.baseAmount || 0,
                    serviceCharge: bookingDetails.serviceCharge || 0,
                    status: bookingDetails.status,
                    paymentStatus: bookingDetails.paymentStatus,
                    bookingDate: bookingDetails.bookedAt ? new Date(bookingDetails.bookedAt).toISOString() : ''
                }
            };
        } catch (error: any) {
            console.error('QR token verification error:', error);
            
            if (error.name === 'TokenExpiredError') {
                return {
                    success: false,
                    message: 'QR code has expired'
                };
            }
            
            if (error.name === 'JsonWebTokenError') {
                return {
                    success: false,
                    message: 'Invalid QR code'
                };
            }
            
            return {
                success: false,
                message: error.message || 'Invalid QR code'
            };
        }
    }

    // Generate QR code as buffer (for email attachment)
    static async generateQRCodeBuffer(bookingId: string): Promise<Buffer> {
        try {
            const token = await this.generateBookingToken(bookingId);
            const verificationURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-ticket?token=${token}`;
            
            const qrCodeBuffer = await QRCode.toBuffer(verificationURL, {
                errorCorrectionLevel: 'H',
                margin: 1,
                width: 300
            });
            return qrCodeBuffer;
        } catch (error) {
            console.error('QR Code buffer generation error:', error);
            throw error;
        }
    }
}

export default QRService;