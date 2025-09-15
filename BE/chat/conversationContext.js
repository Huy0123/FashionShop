/**
 * Conversation Context Management for Gemini AI
 * Manages conversation flow and product context
 */

// Store conversation contexts by roomId
const conversationContexts = {};

/**
 * Store conversation context
 */
export function setConversationContext(roomId, context) {
   if (!roomId) return;

   conversationContexts[roomId] = {
      ...context,
      timestamp: new Date(),
      ttl: Date.now() + (10 * 60 * 1000) // 10 minutes TTL
   };
}

/**
 * Get conversation context
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
 * Update conversation context
 */
export function updateConversationContext(roomId, updates) {
   if (!roomId) return;

   const existing = getConversationContext(roomId);
   if (existing) {
      conversationContexts[roomId] = {
         ...existing,
         ...updates,
         timestamp: new Date(),
         ttl: Date.now() + (10 * 60 * 1000) // Reset TTL
      };
   }
}

/**
 * Clear conversation context
 */
export function clearConversationContext(roomId) {
   if (!roomId) return;
   delete conversationContexts[roomId];
}

/**
 * Check if user is asking for image confirmation
 */
export function isImageConfirmation(message, roomId) {
   const context = getConversationContext(roomId);
   if (!context) return false;

   // DON'T treat as confirmation if user is asking for different product type
   const hasSpecificProductType = /(hoodie|sweater|jogger|t-shirt|áo thun|quần|ringer|relaxed)/i.test(message);
   if (hasSpecificProductType) {
      return false;
   }

   // DON'T treat as confirmation if user is asking about sizing, fit, or measurements
   const isSizeInquiry = /(cân\s*nặng|kg|size|vừa|không|fit|lớn|nhỏ|rộng|chật|mặc.*có|đi.*được|phù\s*hợp|fit.*không)/i.test(message);
   if (isSizeInquiry) {
      return false;
   }

   // More flexible confirmation patterns including explicit image requests
   const isConfirmation = /^(có|ok|yes|được|đồng\s*ý|ừ|ừm|vâng)$/i.test(message.trim()) ||
      /(có.*xem|xem.*ảnh|show.*image|muốn.*xem|cho.*xem|ảnh.*sản\s*phẩm|ảnh.*đó|cho.*mình.*xem.*ảnh|ảnh.*của.*sản.*phẩm)/i.test(message);

   const recentlyMentionedProduct = (context.lastAction === 'asked_for_image' || context.lastAction === 'mentioned_product') &&
      (Date.now() - new Date(context.timestamp).getTime()) < 5 * 60 * 1000; // 5 minutes

   return isConfirmation && recentlyMentionedProduct && !isSizeInquiry;
}

/**
 * Get last mentioned product for confirmations
 */
export function getLastMentionedProduct(roomId) {
   const context = getConversationContext(roomId);
   if (!context) return null;

   // Try to return the most relevant product based on context
   if (context.lastProducts && context.lastProducts.length > 1 && context.originalQuery) {
      const isShirtQuery = /(áo(?!\s*khoác)|shirt|tshirt|t-shirt|hoodie|sweater|ringer|relaxed)/i.test(context.originalQuery);
      const isPantsQuery = /(quần|pants|jogger|jean)/i.test(context.originalQuery);

      if (isShirtQuery) {
         const shirtTypes = ['T-shirt', 'RelaxedFit', 'Ringer', 'Hoodie', 'Sweater'];
         const shirtProduct = context.lastProducts.find(p => shirtTypes.includes(p.productType));
         if (shirtProduct) {
            return shirtProduct;
         }
      } else if (isPantsQuery) {
         const pantsProduct = context.lastProducts.find(p => p.productType === 'Jogger');
         if (pantsProduct) {
            return pantsProduct;
         }
      }
   }

   return context?.lastProduct || null;
}

/**
 * Cleanup expired contexts (call periodically)
 */
export function cleanupExpiredContexts() {
   const now = Date.now();
   for (const [roomId, context] of Object.entries(conversationContexts)) {
      if (now > context.ttl) {
         delete conversationContexts[roomId];
      }
   }
}

// Auto cleanup every 5 minutes
setInterval(cleanupExpiredContexts, 5 * 60 * 1000);
