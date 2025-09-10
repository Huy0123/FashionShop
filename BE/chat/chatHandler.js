import chatModel from '../models/chatModel.js';
import productModel from '../models/productModel.js';
import { isImageConfirmation, getConversationContext } from './conversationContext.js';

// 🤖 GEMINI AI ONLY - Simplified and Clean
import { generateGeminiAI, shouldGeminiRespond } from './aiServiceGemini.js';

console.log('🤖 AI Engine: Gemini AI');

// Track online admins
let onlineAdmins = new Set();

// Lưu sản phẩm gợi ý cuối cùng cho từng room
let lastSuggestedProductByRoom = {};

// Initialize chat handlers
export function initializeChatHandlers(io) {
   io.on('connection', (socket) => {
      // Join room handler
      socket.on('join_room', (roomId) => {
         socket.join(roomId);
         // Send current admin status to the user
         socket.emit('admin_status_changed', {
            isOnline: onlineAdmins.size > 0
         });
      });

      // Check admin status handler
      socket.on('check_admin_status', () => {
         socket.emit('admin_status_changed', {
            isOnline: onlineAdmins.size > 0
         });
         console.log('Admin status checked:', onlineAdmins.size > 0);
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

      // Handle new messages (compatible with frontend)
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

            // Broadcast message to room (this ensures users in same room get the message)
            io.to(roomId).emit('receive_message', messageToEmit);
            
            // Also send to admin room so all admins receive user messages
            io.to('admin-room').emit('receive_message', messageToEmit);

            // Check if user mentioned @ai or AI should respond
            const mentionedAI = message.toLowerCase().includes('@ai');
            const shouldAIRespond = senderType === 'user' && (onlineAdmins.size === 0 || mentionedAI);
            
            if (shouldAIRespond) {
               // 🚀 SMART AI - Automatically chooses best AI and learns!
               const cleanMessage = mentionedAI ? message.replace(/@ai\s*/gi, '').trim() : message;
               const aiModeText = mentionedAI ? ' (được gọi bằng @ai)' : '';
               
               console.log(`Smart AI Check - Message: "${cleanMessage}", Online admins: ${onlineAdmins.size}, Mentioned AI: ${mentionedAI}`);
               
               // Show AI typing indicator
               console.log(`🤖 AI typing started for room: ${roomId}${aiModeText}`);
               io.to(roomId).emit('ai_typing_start');
               
               try {
                  // Generate Gemini AI response directly
                  const aiResponse = await generateGeminiAI(cleanMessage, senderId);

                  // Handle response with multiple products or single product
                  let responseMessage = aiResponse.message || aiResponse;
                  let responseImage = aiResponse.image || null;
                  let aiProvider = 'Gemini AI';
                  
                  console.log(`${aiProvider} response generated - Message length: ${responseMessage.length}, Has image: ${!!responseImage}, Type: ${aiResponse.type || 'single'}`);

                  // Xử lý outfit với nhiều sản phẩm
                  if (aiResponse.type === 'outfit' && aiResponse.products) {
                     // Gửi từng sản phẩm riêng biệt
                     for (let i = 0; i < aiResponse.products.length; i++) {
                        const product = aiResponse.products[i];
                        
                        // Tạo message riêng cho từng sản phẩm
                        const aiMessage = new chatModel({
                           roomId,
                           senderId: 'ai-assistant',
                           senderName: `Ai-chan 🤖 (${aiProvider})`,
                           senderType: 'ai',
                           message: product.message,
                           image: product.image || null,
                           timestamp: new Date()
                        });

                        await aiMessage.save();
                        console.log(`Emitting AI message ${i+1}:`, aiMessage.toObject());
                        io.to(roomId).emit('new_message', aiMessage.toObject());
                        
                        // Delay nhỏ giữa các message để tự nhiên hơn
                        if (i < aiResponse.products.length - 1) {
                           await new Promise(resolve => setTimeout(resolve, 500));
                        }
                     }
                     
                     // Gửi message tổng kết
                     if (responseMessage && responseMessage.trim()) {
                        const summaryMessage = new chatModel({
                           roomId,
                           senderId: 'ai-assistant', 
                           senderName: `Ai-chan 🤖 (${aiProvider})`,
                           senderType: 'ai',
                           message: responseMessage,
                           timestamp: new Date()
                        });

                        await summaryMessage.save();
                        io.to(roomId).emit('new_message', summaryMessage.toObject());
                     }
                     
                     // QUAN TRỌNG: Stop typing indicator
                     console.log(`🤖 AI typing stopped for room: ${roomId}`);
                     io.to(roomId).emit('ai_typing_stop');
                     
                     return; // Exit early, đã xử lý xong
                  }

                  // Tìm sản phẩm được gợi ý trong message AI
                  let suggestedProduct = null;
                  // Nhận diện "sản phẩm số X"
                  const matchNum = responseMessage.match(/sản phẩm số\s*(\d+)/i);
                  if (matchNum) {
                     const index = parseInt(matchNum[1], 10) - 1;
                     // Lấy danh sách sản phẩm từ DB, sort theo thứ tự xuất hiện
                     const products = await productModel.find().sort({ date: 1 });
                     if (products[index]) {
                        suggestedProduct = {
                           name: products[index].name,
                           image: Array.isArray(products[index].image) ? products[index].image[0] : products[index].image
                        };
                     }
                  } else {
                     // Nhận diện tên sản phẩm trong message
                     const productNames = await productModel.find().select('name image');
                     for (const prod of productNames) {
                        if (responseMessage.toLowerCase().includes(prod.name.toLowerCase())) {
                           suggestedProduct = {
                              name: prod.name,
                              image: Array.isArray(prod.image) ? prod.image[0] : prod.image
                           };
                           break;
                        }
                     }
                  }

                  // Nếu có sản phẩm gợi ý, lưu lại cho room
                  if (suggestedProduct && suggestedProduct.image) {
                     lastSuggestedProductByRoom[roomId] = suggestedProduct;
                  } else {
                     lastSuggestedProductByRoom[roomId] = null;
                  }

                  // Save AI response to database
                  const aiSenderName = mentionedAI ? 
                     `Ai-chan 🤖 (@ai called - ${aiProvider})` : 
                     `Ai-chan 🤖 (${aiProvider})`;
                     
                  const aiMessage = new chatModel({
                     roomId,
                     senderId: 'ai-assistant',
                     senderName: aiSenderName,
                     senderType: 'ai',
                     message: responseMessage,
                     image: responseImage,
                     timestamp: new Date()
                  });

                  await aiMessage.save();

                  // Send AI response with delay for natural feel
                  setTimeout(() => {
                     // Stop AI typing indicator
                     io.to(roomId).emit('ai_typing_stop');
                     
                     const aiMessageToEmit = {
                        _id: aiMessage._id,
                        roomId,
                        senderId: 'ai-assistant',
                        senderName: aiSenderName,
                        senderType: 'ai',
                        message: responseMessage,
                        image: responseImage,
                        timestamp: aiMessage.timestamp
                     };

                     console.log('Emitting AI message:', aiMessageToEmit);
                     io.to(roomId).emit('receive_message', aiMessageToEmit);
                     io.to('admin-room').emit('receive_message', aiMessageToEmit);
                  }, Math.random() * 2000 + 1500); // Random delay 1.5-3.5s for more natural feel

               } catch (error) {
                  console.error('Error generating Smart AI response:', error);
                  // Stop AI typing indicator on error
                  io.to(roomId).emit('ai_typing_stop');
                  
                  // Send fallback message
                  const fallbackMessage = new chatModel({
                     roomId,
                     senderId: 'ai-assistant',
                     senderName: 'Ai-chan 🤖 (Fallback)',
                     senderType: 'ai', 
                     message: 'Xin lỗi, mình đang gặp sự cố kỹ thuật. Admin sẽ hỗ trợ bạn ngay! 🛠️✨',
                     timestamp: new Date()
                  });

                  await fallbackMessage.save();

                  setTimeout(() => {
                     const fallbackToEmit = {
                        _id: fallbackMessage._id,
                        roomId,
                        senderId: 'ai-assistant', 
                        senderName: 'Ai-chan 🤖 (Fallback)',
                        senderType: 'ai',
                        message: fallbackMessage.message,
                        timestamp: fallbackMessage.timestamp
                     };

                     io.to(roomId).emit('receive_message', fallbackToEmit);
                     io.to('admin-room').emit('receive_message', fallbackToEmit);
                  }, 2000); // 2 second delay for fallback
               }
            }
            
            // Use the conversation context system for image confirmations instead of legacy system

         } catch (error) {
            console.error('Error handling message:', error);
            socket.emit('message_error', { error: 'Failed to send message' });
         }
      });

      // Handle admin joining (stops AI responses)
      socket.on('adminOnline', () => {
         onlineAdmins.add(socket.id);
         // Admin joins all active rooms to receive all messages
         socket.join('admin-room');
         socket.broadcast.emit('adminStatus', { online: true });
         console.log('Admin came online, AI responses disabled');
      });

      // Handle admin leaving (enables AI responses)
      socket.on('adminOffline', () => {
         onlineAdmins.delete(socket.id);
         socket.leave('admin-room');
         socket.broadcast.emit('adminStatus', { online: false });
         console.log('Admin went offline, AI responses enabled');
      });

      // Admin login handler
      socket.on('admin_login', (adminData) => {
         onlineAdmins.add(socket.id);
         // Admin joins admin room to receive all messages
         socket.join('admin-room');
         socket.broadcast.emit('admin_status_changed', {
            isOnline: true,
            adminName: adminData.name || 'Admin'
         });
         console.log('Admin logged in:', adminData.name || 'Admin');
      });

      // Handle disconnection
      socket.on('disconnect', () => {
         // Remove admin from online list if they were admin
         if (onlineAdmins.has(socket.id)) {
            onlineAdmins.delete(socket.id);
            socket.leave('admin-room');
            // Notify if no more admins online
            if (onlineAdmins.size === 0) {
               socket.broadcast.emit('admin_status_changed', {
                  isOnline: false
               });
               console.log('All admins offline, AI responses enabled');
            }
         }
      });

      // Handle typing indicators
      socket.on('typing', (data) => {
         socket.broadcast.to(data.roomId).emit('userTyping', {
            sender: data.sender,
            isTyping: data.isTyping
         });
      });

      // Handle admin typing
      socket.on('admin_typing', (data) => {
         console.log('Admin typing event:', data);
         // Send to all users in the room (not just broadcast)
         io.to(data.roomId).emit('admin_typing', {
            isTyping: data.isTyping
         });
      });

      // Handle admin joining specific room
      socket.on('admin_join_room', (roomId) => {
         socket.join(roomId);
         console.log('Admin joined room:', roomId);
      });

      // Handle admin leaving specific room
      socket.on('admin_leave_room', (roomId) => {
         socket.leave(roomId);
         console.log('Admin left room:', roomId);
      });

      // Handle read receipts
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