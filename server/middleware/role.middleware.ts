import { Request, Response, NextFunction } from 'express';
import { roleModel } from '../models/role.model';

export const createDefaultRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const existingRoles = await roleModel.find();
        if (existingRoles.length === 0) {
            const defaultRoles = [
                {
                    name: 'admin',
                },
                {
                    name: 'user',
                },
            ]

            await roleModel.insertMany(defaultRoles);
            console.log("Default roles created successfully");
        }
        next();
    } catch (error) {
        console.error("Error creating default roles:", error);
        next(error);
    }
};


