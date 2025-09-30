// lưu cuộc trò chuyện theo roomId
const conversationContexts = {};
/**
 * lưu context cho roomid với ttl là 10p
 */
export function setConversationContext(roomId, context) {
   if (!roomId) return;

   conversationContexts[roomId] = {
      ...context,
      timestamp: new Date(),
      ttl: Date.now() + (10 * 60 * 1000) 
   };
}
/**
 * lấy context theo roomId nếu hết hạn thì xóa và trả về null
 */
export function getConversationContext(roomId) {
   if (!roomId || !conversationContexts[roomId]) return null;
   const context = conversationContexts[roomId];
   // Check TTL
   if (Date.now() > context.ttl) {
      delete conversationContexts[roomId];
      return null;
   }
   return context;
}
/**
 * xóa thủ công khi reset hội thoại
 */
export function clearConversationContext(roomId) {
   if (!roomId) return;
   delete conversationContexts[roomId];
}
/**
 * xóa các context hết hạn mỗi 5 phút
 */
export function cleanupExpiredContexts() {
   const now = Date.now();
   for (const [roomId, context] of Object.entries(conversationContexts)) {
      if (now > context.ttl) {
         delete conversationContexts[roomId];
      }
   }
}
setInterval(cleanupExpiredContexts, 5 * 60 * 1000);
