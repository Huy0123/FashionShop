import chatModel from '../models/chatModel.js';
import { generateGeminiAI } from './aiServiceGemini.js';

let onlineAdmins = new Set();
export function initializeChatHandlers(io) {
   io.on('connection', (socket) => {
      socket.on('join_room', (roomId) => {
         socket.join(roomId);
         // cập nhật trạng thái admin
         socket.emit('admin_status_changed', {
            isOnline: onlineAdmins.size > 0
         });
      });
      // Check admin xem có hoạt động hay không
      socket.on('check_admin_status', () => {
         socket.emit('admin_status_changed', {
            isOnline: onlineAdmins.size > 0
         });
      });
      // Send chat history when user connects  
      socket.on('getChatHistory', async () => {
         try {
            const messages = await chatModel.find().sort({ timestamp: 1 }).limit(50);
            socket.emit('chatHistory', messages);
         } catch (error) {
            console.error('Error fetching chat history:', error);
            socket.emit('chatHistory', []);
         }
      });
      // gửi tin nhắn vào chat và gọi ai khi admin online
      socket.on('send_message', async (messageData) => {
         try {
            const { roomId, senderId, senderName, senderType, message } = messageData;
            // Save user message to database
            const userMessage = new chatModel({
               roomId,
               senderId,
               senderName,
               senderType,
               message,
               timestamp: new Date()
            });
            await userMessage.save();
            // Create message object to emit
            const messageToEmit = {
               _id: userMessage._id,
               roomId,
               senderId,
               senderName,
               senderType,
               message,
               timestamp: userMessage.timestamp
            };
            io.to(roomId).emit('receive_message', messageToEmit);
            io.to('admin-room').emit('receive_message', messageToEmit);

            // Check if user đề cập @ai
            const mentionedAI = message.toLowerCase().includes('@ai');
            const shouldAIRespond = senderType === 'user' && (onlineAdmins.size === 0 || mentionedAI);
            if (shouldAIRespond) {
               io.to(roomId).emit('typing', {
                  userId: 'ai',
                  isTyping: true
               });
               const aiResponse = await generateGeminiAI(message, roomId);

               const aiMessage = new chatModel({
                  roomId,
                  senderId: 'ai-assistant',
                  senderName: `Ai-chan 🤖 (Gemini)`,
                  senderType: 'ai',
                  message: aiResponse,
                  timestamp: new Date()
               });
               await aiMessage.save();

               const aiMessageToEmit = {
                  _id: aiMessage._id,
                  roomId,
                  senderId: 'ai-assistant',
                  senderName: aiMessage.senderName,
                  senderType: 'ai',
                  message: aiMessage.message,
                  timestamp: aiMessage.timestamp
               };

               io.to(roomId).emit('stop_typing', {
                  userId: 'ai'
               });
               io.to(roomId).emit('receive_message', aiMessageToEmit);
               io.to('admin-room').emit('receive_message', aiMessageToEmit);
            }
         } catch (error) {
            console.error('Error handling message:', error);
            socket.emit('message_error', { error: 'Failed to send message' });
         }
      });

      // admin online thì sẽ dừng ai
      socket.on('adminOnline', () => {
         onlineAdmins.add(socket.id);
         // admin join vào phòng và nhận tất cả tin nhắn
         socket.join('admin-room');
         socket.broadcast.emit('adminStatus', { online: true });
      });

      // admin off thì cho ai hoạt động lại
      socket.on('adminOffline', () => {
         onlineAdmins.delete(socket.id);
         socket.leave('admin-room');
         socket.broadcast.emit('adminStatus', { online: false });
      });

      // Admin login 
      socket.on('admin_login', (adminData) => {
         onlineAdmins.add(socket.id);
         // admin join vào phòng và nhận tất cả tin nhắn
         socket.join('admin-room');
         socket.broadcast.emit('admin_status_changed', {
            isOnline: true,
            adminName: adminData.name || 'Admin'
         });
      });

      // Admin logout
      socket.on('disconnect', () => {
         if (onlineAdmins.has(socket.id)) {
            onlineAdmins.delete(socket.id);
            socket.leave('admin-room');
            // Notify if no more admins online
            if (onlineAdmins.size === 0) {
               socket.broadcast.emit('admin_status_changed', {
                  isOnline: false
               });
            }
         }
      });

      // admin typing
      socket.on('admin_typing', (data) => {
         io.to(data.roomId).emit('admin_typing', {
            isTyping: data.isTyping
         });
      });

      // admin vào hoặc ra
      socket.on('admin_join_room', (roomId) => {
         socket.join(roomId);
      });
      socket.on('admin_leave_room', (roomId) => {
         socket.leave(roomId);
      });

      // đọc tin nhắn
      socket.on('messageRead', (messageId) => {
         socket.broadcast.emit('messageRead', { messageId });
      });
   });
}

// Admin chat functions
export async function sendAdminMessage(messageText, adminSender = 'Admin') {
   try {
      const adminMessage = new chatModel({
         sender: adminSender,
         message: messageText,
         timestamp: new Date(),
         isAdmin: true
      });

      await adminMessage.save();
      return adminMessage;
   } catch (error) {
      console.error('Error sending admin message:', error);
      throw error;
   }
}

export async function getChatHistory(limit = 50) {
   try {
      const messages = await chatModel.find()
         .sort({ timestamp: -1 })
         .limit(limit)
         .sort({ timestamp: 1 });
      return messages;
   } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
   }
}

export async function deleteMessage(messageId) {
   try {
      await chatModel.findByIdAndDelete(messageId);
      return true;
   } catch (error) {
      console.error('Error deleting message:', error);
      return false;
   }
}