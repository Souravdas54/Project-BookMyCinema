// socketServer.ts
import { Server } from "socket.io";
import mongoose from "mongoose";
import { chatModel } from "./models/chat.model";

export const socketHandler = (io: Server) => {
    // Store online users
    const onlineUsers = new Map(); // userId -> socketId
    
    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        // Register user when they connect
        socket.on("register", (userId: string) => {
            // Validate userId format
            if (mongoose.Types.ObjectId.isValid(userId)) {
                onlineUsers.set(userId, socket.id);
                console.log(`User ${userId} connected`);
                
                // Broadcast online users update
                io.emit('onlineUsers', Array.from(onlineUsers.keys()));
            } else {
                console.error(`Invalid user ID format: ${userId}`);
            }
        });

        // Join Chat Room
        socket.on("join", ({ chatId, userId }) => {
            socket.join(chatId);
            socket.data.userId = userId;
            console.log(`User ${userId} joined chat ${chatId}`);
        });

        // Send Message
        socket.on("sendMessage", async (msg: {
            chatId: string;
            senderId: string;
            receiverId: string;
            message: string;
        }) => {
            try {
                console.log("Received message:", msg);
                
                // Validate ObjectIds
                if (!mongoose.Types.ObjectId.isValid(msg.senderId) || 
                    !mongoose.Types.ObjectId.isValid(msg.receiverId) ||
                    !mongoose.Types.ObjectId.isValid(msg.chatId)) {
                    console.error("Invalid ObjectId format in message:", msg);
                    return;
                }

                const chat = await chatModel.findById(msg.chatId);
                if (!chat) {
                    console.error("Chat not found:", msg.chatId);
                    return;
                }

                // Validate participants
                const isValidParticipant = chat.participants.some(
                    (participant: any) => participant.toString() === msg.senderId
                );

                if (!isValidParticipant) {
                    console.error("Sender not in chat participants");
                    return;
                }
                
                // Create message object with proper ObjectIds
                const messageObj = {
                    _id: new mongoose.Types.ObjectId(),
                    senderId: new mongoose.Types.ObjectId(msg.senderId),
                    receiverId: new mongoose.Types.ObjectId(msg.receiverId),
                    message: msg.message,
                    type: "text",
                    read: false,
                    createdAt: new Date(),
                };

                // Add to chat messages
                chat.messages.push(messageObj);
                // Update lastMessage
                chat.lastMessage = messageObj;
                chat.updatedAt = new Date();

                await chat.save();

                // Emit to chat room
                io.to(msg.chatId).emit("message", {
                    ...messageObj,
                    chatId: msg.chatId,
                    senderId: msg.senderId,
                    receiverId: msg.receiverId,
                    _id: messageObj._id.toString(),
                    createdAt: messageObj.createdAt.toISOString()
                });
                
                console.log("Message saved and broadcasted successfully");
            } catch (error) {
                console.error("Message error:", error);
            }
        });

        // Typing indicator
        socket.on("typing", ({ chatId, userId, isTyping }) => {
            socket.to(chatId).emit("typing", {
                userId,
                isTyping,
                chatId,
            });
        });

        // Mark messages as read
        socket.on("markAsRead", async ({ chatId, userId }) => {
            try {
                // Validate ObjectIds
                if (!mongoose.Types.ObjectId.isValid(chatId) || 
                    !mongoose.Types.ObjectId.isValid(userId)) {
                    console.error("Invalid ObjectId format in markAsRead");
                    return;
                }

                const chat = await chatModel.findById(chatId);
                if (chat) {
                    let hasUpdates = false;

                    chat.messages.forEach((msg: any) => {
                        if (msg.receiverId.toString() === userId && !msg.read) {
                            msg.read = true;
                            msg.readAt = new Date();
                            hasUpdates = true;
                        }
                    });
                    
                    if (hasUpdates) {
                        await chat.save();
                        io.to(chatId).emit("messagesRead", { chatId, userId });
                    }
                }
            } catch (error) {
                console.error("Error marking messages as read:", error);
            }
        });

        // Handle disconnect
        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
            
            // Remove user from online users
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    console.log(`User ${userId} disconnected`);
                    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
                    break;
                }
            }
        });
    });
};