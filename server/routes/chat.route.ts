// src/routes/chat.route.ts
import express from "express";
import { chatController } from "../controllers/chat.controller";
import { protect, refreshTokenProtect, authorizeRoles } from '../middleware/user.middleaware';

const chatRouter = express.Router();

chatRouter.post("/start", protect, chatController.startChat);
// chatRouter.get("/user/:userId", protect, chatController.getUserChats);
chatRouter.get("/user/:userId/support-chat", protect, chatController.getUserChats);

chatRouter.get("/:chatId/messages", protect, chatController.fetchMessages);
chatRouter.patch("/:chatId/read", protect, chatController.markAsRead);

// ADMIN 
chatRouter.get("/admin/list", protect, chatController.listAdminChats);

export { chatRouter }