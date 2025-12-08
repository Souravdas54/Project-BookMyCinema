import { Request, Response } from "express";
import { chatModel } from "../models/chat.model";
import { userModel } from "../models/user.Model";
import mongoose from "mongoose";

class ChatController {
    async startChat(req: Request, res: Response) {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ 
                    success: false,
                    message: "User ID is required" 
                });
            }

            // Validate if user exists
            const user = await userModel.findById(userId);
            if (!user) {
                return res.status(404).json({ 
                    success: false,
                    message: "User not found" 
                });
            }

            // Find support admin - check for isSupportAdmin first
            let admin = await userModel.findOne({
                isSupportAdmin: true
            });

            // If no support admin found, find any admin and make them support admin
            if (!admin) {
                admin = await userModel.findOne({ 
                    role: "admin" 
                });
                
                if (!admin) {
                    return res.status(500).json({ 
                        success: false,
                        message: "No admin available for support" 
                    });
                }
                
                // Mark this admin as support admin
                admin.isSupportAdmin = true;
                await admin.save();
            }

            // Check for existing chat with this admin
            let chat = await chatModel.findOne({
                participants: { 
                    $all: [
                        new mongoose.Types.ObjectId(userId),
                        admin._id
                    ] 
                },
                isSupportChat: true,
            }).populate('participants', 'name email profilePicture');

            if (chat) {
                return res.json({
                    success: true,
                    message: "Chat retrieved successfully",
                    chat
                });
            }

            // Create welcome message
            const welcomeMessage = {
                _id: new mongoose.Types.ObjectId(),
                senderId: admin._id,
                receiverId: new mongoose.Types.ObjectId(userId),
                message: "Hello! I'm your support assistant. How can I help you today?",
                type: "text",
                read: false,
                createdAt: new Date()
            };

            // Create new chat
            chat = await chatModel.create({
                participants: [
                    new mongoose.Types.ObjectId(userId),
                    admin._id,
                ],
                isSupportChat: true,
                messages: [welcomeMessage],
                lastMessage: welcomeMessage,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            // Populate after creation
            chat = await chatModel.findById(chat._id)
                .populate('participants', 'name email profilePicture');

            res.status(201).json({
                success: true,
                message: "Chat started successfully",
                chat
            });
        } catch (err: any) {
            console.error("Error starting chat:", err);
            res.status(500).json({ 
                success: false,
                message: "Server error", 
                error: err.message 
            });
        }
    }

    async listAdminChats(req: Request, res: Response) {
        try {
            const { adminId } = req.query;

            if (!adminId) {
                return res.status(400).json({ 
                    success: false,
                    message: "Admin ID is required" 
                });
            }

            // Find admin to verify
            // const admin = await userModel.findOne({ 
            //     _id: adminId,
            //     $or: [
            //         { isSupportAdmin: true },
            //         { role: "admin" }
            //     ]
            // });
             const admin = await userModel.findOne({ 
            _id: new mongoose.Types.ObjectId(adminId as string),
            isSupportAdmin: true 
        });

            if (!admin) {
                return res.status(403).json({ 
                    success: false,
                    message: "Unauthorized: Not an admin" 
                });
            }

            const chats = await chatModel.find({ 
                participants: new mongoose.Types.ObjectId(adminId as string),
                isSupportChat: true 
            })
            .populate({
                path: 'participants',
                select: 'name email profilePicture isSupportAdmin', // ✅ ADDED: Populate lastMessage sender
                match: { _id: { $ne: new mongoose.Types.ObjectId(adminId as string) } }
            })
            .populate('messages.senderId', 'name profilePicture')
            .populate('lastMessage.senderId', 'name profilePicture') // ✅ ADDED: Populate lastMessage sender
            .sort({
                updatedAt: -1,
            });

            // Filter out chats where participants array might be empty after filtering
            const filteredChats = chats.filter(chat => 
                chat.participants && chat.participants.length > 0
            );

            res.json({
                success: true,
                count: filteredChats.length,
                chats: filteredChats
            });
        } catch (err: any) {
            console.error("Error listing admin chats:", err);
            res.status(500).json({ 
                success: false,
                message: "Server error",
                error: err.message 
            });
        }
    }

    async fetchMessages(req: Request, res: Response) {
        try {
            const { chatId } = req.params;

            const chat = await chatModel.findById(chatId)
                .populate('messages.senderId', 'name email profilePicture')
                .populate('messages.receiverId', 'name email profilePicture');

            if (!chat) {
                return res.status(404).json({ 
                    success: false,
                    message: "Chat not found" 
                });
            }

            res.json({
                success: true,
                messages: chat.messages,
                chatId: chat._id
            });
        } catch (err: any) {
            console.error("Error fetching messages:", err);
            res.status(500).json({ 
                success: false,
                message: "Server error",
                error: err.message 
            });
        }
    }

    // Add this new endpoint for user to get their chats
    async getUserChats(req: Request, res: Response) {
        try {
            const userId = req.params.userId;

            if (!userId) {
                return res.status(400).json({ 
                    success: false,
                    message: "User ID is required" 
                });
            }

            const chats = await chatModel.find({ 
                participants: new mongoose.Types.ObjectId(userId),
                isSupportChat: true 
            })
            .populate({
                path: 'participants',
                select: 'name email profilePicture isSupportAdmin',
                match: { isSupportAdmin: true }
            })
            .populate('lastMessage.senderId', 'name profilePicture')
            .sort({
                updatedAt: -1,
            })
            .limit(10);

            // Get support admin info for the sidebar
            const supportAdmin = await userModel.findOne({
                isSupportAdmin: true
            }).select('name email profilePicture');

            res.json({
                success: true,
                count: chats.length,
                chats,
                supportAdmin: supportAdmin || null
            });
        } catch (err: any) {
            console.error("Error getting user support chats:", err);
            res.status(500).json({ 
                success: false,
                message: "Server error",
                error: err.message 
            });
        }
    }

    // Add this endpoint to mark messages as read
    async markAsRead(req: Request, res: Response) {
        try {
            const { chatId } = req.params;
            const { userId } = req.body;

            const chat = await chatModel.findById(chatId);
            
            if (!chat) {
                return res.status(404).json({ 
                    success: false,
                    message: "Chat not found" 
                });
            }

            // Mark all messages where user is receiver as read
            chat.messages.forEach(message => {
                if (message.receiverId.toString() === userId && !message.read) {
                    message.read = true;
                    message.readAt = new Date();
                }
            });

            await chat.save();

            res.json({
                success: true,
                message: "Messages marked as read"
            });
        } catch (err: any) {
            console.error("Error marking messages as read:", err);
            res.status(500).json({ 
                success: false,
                message: "Server error",
                error: err.message 
            });
        }
    }
}

export const chatController = new ChatController();
