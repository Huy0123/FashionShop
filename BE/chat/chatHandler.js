import chatModel from '../models/chatModel.js';
import { generateGeminiAI } from './aiServiceGemini.js';

let onlineAdmins = new Set();

export function initializeChatHandlers(io) {
   io.on('connection', (socket) => {
      // Helper functions
      const emitAdminStatus = () => {
         socket.emit('admin_status_changed', { isOnline: onlineAdmins.size > 0 });
      };

      const handleAdminJoin = (adminData = {}) => {
         onlineAdmins.add(socket.id);
         socket.join('admin-room');
         socket.broadcast.emit('admin_status_changed', {
            isOnline: true,
            adminName: adminData.name || 'Admin'
         });
      };

      const handleAdminLeave = () => {
         if (onlineAdmins.has(socket.id)) {
            onlineAdmins.delete(socket.id);
            socket.leave('admin-room');
            if (onlineAdmins.size === 0) {
               socket.broadcast.emit('admin_status_changed', { isOnline: false });
            }
         }
      };

      //quản Room và admin 
      socket.on('join_room', (roomId) => {
         socket.join(roomId);
         emitAdminStatus();
      });

      socket.on('check_admin_status', emitAdminStatus);

      // Chat history
      socket.on('getChatHistory', async () => {
         try {
            const messages = await chatModel.find().sort({ timestamp: 1 }).limit(50);
            socket.emit('chatHistory', messages);
         } catch (error) {
            console.error('Error fetching chat history:', error);
            socket.emit('chatHistory', []);
         }
      });

      // Gửi tin nhắn
      socket.on('send_message', async (messageData) => {
         try {
            const { roomId, senderId, senderName, senderType, message } = messageData;

            // lưu tin nhắn vào mogoose
            const userMessage = await new chatModel({
               roomId, senderId, senderName, senderType, message,
               timestamp: new Date()
            }).save();
            const messageToEmit = {
               _id: userMessage._id, roomId, senderId, senderName,
               senderType, message, timestamp: userMessage.timestamp
            };
            // phát tin nhắn đến phòng và admin
            io.to(roomId).emit('receive_message', messageToEmit);
            io.to('admin-room').emit('receive_message', messageToEmit);

            // AI response logic
            const mentionedAI = message.toLowerCase().includes('@ai');
            const shouldAIRespond = senderType === 'user' && (onlineAdmins.size === 0 || mentionedAI);

            if (shouldAIRespond) {
               io.to(roomId).emit('typing', { userId: 'ai', isTyping: true });
               const aiResponse = await generateGeminiAI(message, roomId);
               const aiMessage = await new chatModel({
                  roomId,
                  senderId: 'ai-assistant',
                  senderName: 'Ai-chan (Gemini)',
                  senderType: 'ai',
                  message: aiResponse,
                  timestamp: new Date()
               }).save();

               const aiMessageToEmit = {
                  _id: aiMessage._id, roomId, senderId: 'ai-assistant',
                  senderName: aiMessage.senderName, senderType: 'ai',
                  message: aiMessage.message, timestamp: aiMessage.timestamp
               };
               io.to(roomId).emit('stop_typing', { userId: 'ai' });
               io.to(roomId).emit('receive_message', aiMessageToEmit);
               io.to('admin-room').emit('receive_message', aiMessageToEmit);
            }
         } catch (error) {
            console.error('Error handling message:', error);
            socket.emit('message_error', { error: 'Failed to send message' });
         }
      });

      // Admin events
      socket.on('adminOnline', () => handleAdminJoin());
      socket.on('admin_login', handleAdminJoin);
      socket.on('adminOffline', handleAdminLeave);
      socket.on('disconnect', handleAdminLeave);

      // Admin typing và room management
      socket.on('admin_typing', (data) => {
         io.to(data.roomId).emit('admin_typing', { isTyping: data.isTyping });
      });

      socket.on('admin_join_room', (roomId) => socket.join(roomId));
      socket.on('admin_leave_room', (roomId) => socket.leave(roomId));
   });
}

export async function sendAdminMessage(messageText, roomId, adminSender = 'Admin') {
   try {
      const adminMessage = await new chatModel({
         roomId,
         senderId: 'admin',
         senderName: adminSender,
         senderType: 'admin',
         message: messageText,
         timestamp: new Date()
      }).save();

      return adminMessage;
   } catch (error) {
      console.error('Error sending admin message:', error);
      throw error;
   }
}

export async function getChatHistory(limit = 50) {
   try {
      const messages = await chatModel.find()
         .sort({ timestamp: 1 })
         .limit(limit);
      return messages;
   } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
   }
}

