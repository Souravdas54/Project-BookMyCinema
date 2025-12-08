import { userModel } from "../models/user.Model";
import { userInterface } from "../interfaces/user.interface";
import { roleModel } from "../models/role.model";
import mongoose from "mongoose";
import fs from "fs";

class UserRepositories {
    //Register - Fix the save method
    async save(userData: any) { // Change parameter type to any to avoid type issues
        try {
            const roleDoc = await roleModel.findOne({ name: userData.role });
            if (!roleDoc) throw new Error("Invalid role");

            // Create user data with proper role ObjectId
            const userToCreate = {
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                gender:userData.gender,
                password: userData.password,
                profilePicture: userData.profilePicture || null,
                isVerified: userData.isVerified,
                role: roleDoc._id
            };

            // Fix the create method - remove 'new' keyword
            const newDataCreate = await userModel.create(userToCreate);
            return newDataCreate;

        } catch (error) {
            console.log("Repository Error - save:", error);
            throw error;
        }
    }

    async findByEmail(email: string) {
        try {
            const findEmailId = await userModel.findOne({ email });
            return findEmailId;
        } catch (error) {
            console.log("Repository Error - findByEmail:", error);
            throw error;
        }
    }

    async find() {
        try {
            const getAllUsers = await userModel.find().populate('role');
            return getAllUsers;
        } catch (error) {
            console.log("Repository Error - find:", error);
            throw error;
        }
    }

    //single user
    async getUserById(id: string) {
        try {
            const getuser = await userModel.findById(id).populate('role');
            if (!getuser) {
                return null;
            }
            return getuser;
        } catch (error) {
            console.log("Repository Error - getUserById:", error);
            throw error;
        }
    }

    //update a profile
    async update_user(id: string, data: Partial<userInterface>, newProfilePicture?: string) {
        try {
            const user = await userModel.findById(id);
            if (!user) return null;

            if (data.name) user.name = data.name;
            if (data.phone) user.phone = data.phone;

            // Update profile picture
            if (newProfilePicture) {
                const oldPic = user.profilePicture;
                // Delete old image 
                if (oldPic && fs.existsSync(oldPic)) {
                    fs.unlinkSync(oldPic);
                }
                user.profilePicture = newProfilePicture;
            }

            const updatedUser = await user.save();
            return updatedUser;

        } catch (error) {
            console.log("Repository Error - update_user:", error);
            throw error;
        }
    }

    async updateRefreshToken(id: string, refreshToken: string | null) {
        try {
            const user = await userModel.findByIdAndUpdate(
                id,
                { refreshToken },
                { new: true }
            );
            return user;
        } catch (error) {
            console.log("Repository Error - updateRefreshToken:", error);
            throw error;
        }
    }

    async findByRefreshToken(refreshToken: string) {
        try {
            const user = await userModel.findOne({ refreshToken }).populate('role');
            return user;
        } catch (error) {
            console.log("Repository Error - findByRefreshToken:", error);
            throw error;
        }
    }
}

const userRepositories = new UserRepositories();
export { userRepositories };