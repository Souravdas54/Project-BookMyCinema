import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { TokenService } from "../services/token.service";
import { decode } from "punycode";

interface JwtPayload {
    name?: string;
    profileImage?: string;
    userId?: string;
    email: string;
    role: string;
    type: 'access' | 'refresh'
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

// export interface AuthRequest extends Request {
//   user?: JwtPayload;
// }

export const protect = (req: Request, res: Response, next: NextFunction) => {

    let token;

    //  Try to read token from cookies (admin / user)
    if (req.cookies?.adminAccessToken) {
        token = req.cookies.adminAccessToken;
    } else if (req.cookies?.userAccessToken) {
        token = req.cookies.userAccessToken;
    }

    const authHeader = req.headers.authorization;

    if (!token && authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    }

    // const token = authHeader.split(" ")[1];

    if (!token) {
        // return res.status(401).json({ message: "No token provided" });
        return res.redirect('/admin/refresh-token');
    }

    try {
        const decoded = TokenService.verifyAccessToken(token);
        // const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as JwtPayload;

        if (decoded.type !== 'access') {
            return res.status(401).json({
                success: false,
                message: "Invalid token type"
            });
        }

        const userId = decoded.userId;
        // const userId = decode;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid token: user ID missing"
            });
        }

        req.user = decoded;

        return next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export const refreshTokenProtect = (req: Request, res: Response, next: NextFunction) => {

    const token = req.body.refreshToken;

    //  const refreshToken = req.cookies?.refreshToken || req.headers['refresh-token'];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No refresh token provided"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as JwtPayload;

        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                success: false,
                message: "Invalid token type"
            });
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired refresh token"
        });
    }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {

        if (!req.user) return res.status(401).json({ message: "Not authenticated" });

        if (allowedRoles.includes(req.user.role)) {
            console.log('Access granted');
            return next();
        } else {
            console.log('Access denied');
            return res.status(403).json({ message: "Forbidden: You don't have access" });
        }
        next();
    };
};