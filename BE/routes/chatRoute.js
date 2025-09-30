import express from "express";
import { getChatHistory, saveMessage, getChatRooms, deleteChatRoom } from "../controllers/chatController.js";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/auth.js";

const chatRouter = express.Router();

// User routes
chatRouter.get('/history/:roomId', authUser, getChatHistory);
chatRouter.post('/message', authUser, saveMessage);

// Admin routes
chatRouter.get('/rooms', adminAuth, getChatRooms);
chatRouter.get('/admin/history/:roomId', adminAuth, getChatHistory);
chatRouter.post('/admin/message', adminAuth, saveMessage);
chatRouter.delete('/admin/room/:roomId', adminAuth, deleteChatRoom);

export default chatRouter;
