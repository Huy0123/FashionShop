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
