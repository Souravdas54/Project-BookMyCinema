import { Request, Response } from 'express';
import { bookingModel } from '../../models/booking.model';
import { movieModel } from '../../models/movie.model';
import { userModel } from '../../models/user.Model';
import { userRepositories } from '../../repository/user.repo';
import { TokenService } from '../../services/token.service';
import { roleModel } from '../../models/role.model';
import { UserValidation } from '../../validation/user.validation';
import bcrypt from 'bcryptjs';

class AdminController {

    async admin_login(req: Request, res: Response): Promise<any> {
        try {
            const data = {
                email: req.body.email,
                password: req.body.password,
            };

            const { error, value } = UserValidation.login.validate(data);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            const userData = await userRepositories.findByEmail(value.email);
            if (!userData) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            const isPasswordMatch = await bcrypt.compare(value.password, userData.password);
            if (!isPasswordMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid password"
                });
            }

            // Get role name
            let roleName: string;
            if (typeof userData.role === 'string') {
                roleName = userData.role;
            } else {
                const roleDoc = await roleModel.findById(userData.role);
                if (!roleDoc) {
                    return res.status(500).json({
                        success: false,
                        message: "Role not found"
                    });
                }
                roleName = roleDoc.name;
            }


            // Generate tokens
            const accessToken = TokenService.generateAccessToken(userData, roleName);
            const refreshToken = TokenService.generateRefreshToken(userData, roleName);

            await userRepositories.updateRefreshToken(userData._id.toString(), refreshToken);

            // Prepare user response without password
            const userResponse = {
                _id: userData._id,
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                profilePicture: userData.profilePicture,
                isVerified: userData.isVerified,
                role: roleName,
                createdAt: userData.createdAt,
                updatedAt: userData.updatedAt
            };

            const isAdmin = roleName.toLowerCase() === 'admin';

            const prefix = isAdmin ? 'admin' : 'user';

            res.cookie(`${prefix}AccessToken`, accessToken, {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                // maxAge: 15 * 60 * 1000
            });

            res.cookie(`${prefix}RefreshToken`, refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                maxAge: 24 * 60 * 60 * 1000
            });

            res.cookie(`${prefix}AccessTokenExpires`, process.env.JWT_ACCESS_EXPIRES_IN || '1h', {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                maxAge: 24 * 60 * 60 * 1000
            });

            res.cookie(`${prefix}RefreshTokenExpires`, process.env.JWT_REFRESH_EXPIRES_IN || '1d', {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                maxAge: 24 * 60 * 60 * 1000
            });

            return res.redirect('/admin/dashboard')

        } catch (error: any) {
            console.log("Login error:", error.message);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }

    async admin_refreshToken(req: Request, res: Response): Promise<any> {
        try {
            // const { refreshToken } = req.body;
            const refreshToken = req.cookies.adminRefreshToken || req.body.adminRefreshToken;;

            if (!refreshToken) {
                return res.redirect('/admin/login');
            }


            const user = await userRepositories.findByRefreshToken(refreshToken);
            if (!user) {
                return res.redirect('/admin/login');
            }

            const decoded = TokenService.verifyRefreshToken(refreshToken) as any;

            let roleName: string;
            if (typeof user.role === 'string') {
                roleName = user.role;
            } else {
                const roleDoc = await roleModel.findById(user.role);
                roleName = roleDoc?.name || 'user';
            }

            const newAccessToken = TokenService.generateAccessToken(user, roleName);

            const newRefreshToken = refreshToken

            await userRepositories.updateRefreshToken(user._id.toString(), newRefreshToken);

            // SET COOKIES
            res.cookie('adminAccessToken', newAccessToken, {
                httpOnly: true,
                sameSite: 'lax',
                secure: false,
            });

            res.cookie('adminRefreshToken', newRefreshToken, {
                httpOnly: true,
                sameSite: 'lax',
                secure: false,
            });

            return res.redirect('/admin/dashboard');

        } catch (error: any) {
            console.log("Refresh Token Error:", error.message);
            return res.redirect('/admin/login');
        }
    }

}

export const adminController = new AdminController()
