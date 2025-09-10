import Product from '../models/productModel.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { setConversationContext, getConversationContext, isImageConfirmation, getLastMentionedProduct } from './conversationContext.js';
import dotenv from 'dotenv';
dotenv.config();

// Simple in-memory cache for product context by roomId (or userId)
const productContextCache = {};

// Khởi tạo Gemini AI (FREE 15 requests/minute - 1500 requests/day)
let genAI = null;
try {
   const apiKey = process.env.GEMINI_API_KEY?.trim();
   if (apiKey && apiKey.length > 10) {
      genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ Gemini AI initialized successfully');
   } else {
      console.log('⚠️ Gemini API key not found or invalid');
   }
} catch (error) {
   console.error('❌ Failed to initialize Gemini AI:', error.message);
}

/**
 * DYNAMIC PRODUCT SEARCH FOR GEMINI AI
 * Tìm kiếm sản phẩm thông minh dựa trên toàn bộ database
 * Không giới hạn cứng số lượng, luôn cập nhật theo dữ liệu thật
 */
async function findProductsForGemini(message) {
   try {
      console.log(`🔍 Dynamic product search for: "${message}"`);
      
      const searchQuery = message.toLowerCase();
      let products = [];
      let query = {};

      // 1. SPECIFIC PRODUCT NAME SEARCH - Tìm theo tên chính xác
      if (searchQuery.includes('áo') || searchQuery.includes('shirt') || searchQuery.includes('quần') || searchQuery.includes('pants')) {
         // Extract product keywords from message (remove stopwords)
         const keywords = searchQuery
            .replace(/[^\w\sÀ-ỹ]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 1 && !['cho', 'tôi', 'xem', 'mình', 'một', 'của', 'với', 'và', 'có', 'là', 'này', 'đó'].includes(word));
         
         if (keywords.length > 0) {
            const namePattern = keywords.join('|');
            query.name = { $regex: namePattern, $options: 'i' };
            
            products = await Product.find(query)
               .sort({ bestseller: -1, date: -1 })
               .limit(20); // Increased limit for better coverage
            
            console.log(`🎯 Name search found ${products.length} products with pattern: ${namePattern}`);
         }
      }

      // 2. PRODUCT TYPE SEARCH - Tìm theo loại sản phẩm  
      if (products.length === 0) {
         // Get all unique product types dynamically from database
         const productTypes = await Product.distinct('productType');
         console.log(`� Available product types: ${productTypes.join(', ')}`);
         
         // Map user queries to product types
         const typeMapping = {
            'áo': productTypes.filter(type => !type.toLowerCase().includes('jogger')),
            'shirt': productTypes.filter(type => !type.toLowerCase().includes('jogger')),
            'quần': productTypes.filter(type => type.toLowerCase().includes('jogger')),
            'pants': productTypes.filter(type => type.toLowerCase().includes('jogger')),
            'hoodie': productTypes.filter(type => type.toLowerCase().includes('hoodie')),
            'sweater': productTypes.filter(type => type.toLowerCase().includes('sweater')),
            'jogger': productTypes.filter(type => type.toLowerCase().includes('jogger'))
         };

         for (const [keyword, types] of Object.entries(typeMapping)) {
            if (searchQuery.includes(keyword) && types.length > 0) {
               query = { productType: { $in: types } };
               products = await Product.find(query)
                  .sort({ bestseller: -1, date: -1 })
                  .limit(15);
               console.log(`🏷️ Type search found ${products.length} products for types: ${types.join(', ')}`);
               break;
            }
         }
      }

      // 3. SET/OUTFIT SEARCH - Tìm kiếm cho outfit/set đồ
      const isSetQuery = /(set|bộ|combo|outfit|phối|kết hợp|gợi ý.*đồ|cafe|chơi|đi|dự|tiệc)/i.test(message);
      
      if (isSetQuery || products.length === 0) {
         console.log('🎯 SET/General query - Loading diverse product selection...');
         
         // Get all product types dynamically
         const allProductTypes = await Product.distinct('productType');
         
         // Separate shirt types and pants types dynamically
         const shirtTypes = allProductTypes.filter(type => 
            !type.toLowerCase().includes('jogger') && 
            !type.toLowerCase().includes('pants')
         );
         const pantsTypes = allProductTypes.filter(type => 
            type.toLowerCase().includes('jogger') || 
            type.toLowerCase().includes('pants')
         );

         console.log(`👔 Shirt types: ${shirtTypes.join(', ')}`);
         console.log(`👖 Pants types: ${pantsTypes.join(', ')}`);

         // Get diverse products for comprehensive recommendations
         const shirtProducts = shirtTypes.length > 0 ? await Product.find({ 
            productType: { $in: shirtTypes } 
         }).sort({ bestseller: -1, date: -1 }).limit(10) : [];
         
         const pantsProducts = pantsTypes.length > 0 ? await Product.find({ 
            productType: { $in: pantsTypes } 
         }).sort({ bestseller: -1, date: -1 }).limit(5) : [];
         
         products = [...shirtProducts, ...pantsProducts];
         console.log(`�️ Dynamic SET search: ${shirtProducts.length} shirts + ${pantsProducts.length} pants = ${products.length} total`);
      }

      // 4. FALLBACK - Lấy sản phẩm đa dạng từ toàn bộ database
      if (products.length === 0) {
         console.log('🔄 Fallback - Loading recent and popular products...');
         
         // Get recent products and bestsellers
         const recentProducts = await Product.find({})
            .sort({ date: -1 })
            .limit(10);
            
         const bestsellerProducts = await Product.find({ bestseller: true })
            .sort({ date: -1 })
            .limit(10);
            
         // Merge and deduplicate
         const allProducts = [...recentProducts, ...bestsellerProducts];
         const uniqueProducts = allProducts.filter((product, index, self) => 
            index === self.findIndex(p => p._id.toString() === product._id.toString())
         );
         
         products = uniqueProducts.slice(0, 15);
         console.log(`🌟 Fallback loaded ${products.length} diverse products (recent + bestsellers)`);
      }

      // 5. FINAL PROCESSING - Log and return
      console.log(`📦 Final result: ${products.length} products for Gemini processing`);
      
      if (products.length > 0) {
         const productSummary = products.map(p => ({
            name: p.name.substring(0, 25) + '...',
            type: p.productType,
            price: p.price,
            bestseller: p.bestseller
         }));
         console.log(`🏷️ Product summary:`, productSummary);
      }
      
      return products;
      
   } catch (error) {
      console.error('❌ Error in dynamic product search:', error);
      return [];
   }
}

/**
 * Generate Gemini AI response với Smart Image Logic - ENHANCED FOR SET OUTFIT
 */
export async function generateGeminiAI(message, roomId = null) {
   try {
      console.log(`🤖 Gemini AI Processing: "${message}"`);
      console.log(`🔍 genAI status: ${genAI ? 'Initialized' : 'NULL - Using fallback'}`);
      
      // Check if user is asking for specific product type
      const hasSpecificProductType = /(hoodie|sweater|jogger|t-shirt|áo thun|quần|ringer|relaxed)/i.test(message);
      
      // Check if user is asking about sizing/fit
      const isSizeInquiry = /(cân\s*nặng|kg|size|vừa|không|fit|lớn|nhỏ|rộng|chật|mặc.*có|đi.*được|phù\s*hợp|fit.*không)/i.test(message);
      
      // Check if user wants to see pants image specifically
      const isPantsImageRequest = /(xem.*ảnh.*quần|ảnh.*quần|quần.*ảnh|cho.*xem.*quần)/i.test(message);
      
      // Define image confirmation pattern - UPDATED to exclude size inquiries and include pants request
      const isImageConfirmation = ((/\b(có|yes|ok|được|show|xem|hiển thị|cho xem|oke|đc|muốn|want|ừ|ừm|vâng)\b/i.test(message) ||
                                 message.trim().toLowerCase() === 'có' ||
                                 message.trim().toLowerCase() === 'ok' ||
                                 message.trim().toLowerCase() === 'yes' ||
                                 message.trim().toLowerCase() === 'ừ') && !isSizeInquiry) || isPantsImageRequest;

      // ENHANCED: Check for SET image confirmation first
      if (isImageConfirmation && !hasSpecificProductType && !isSizeInquiry) {
         const context = getConversationContext(roomId);
         
         // Check if user is asking for a specific product by name - DYNAMIC DETECTION
         const isSpecificProductRequest = /\b(xem|cho|tôi|muốn)\s+(xem\s+)?(áo|quần|sản\s*phẩm)\s+[\wÀ-ỹ\s]{3,}/i.test(message);
         
         if (isSpecificProductRequest) {
            console.log(`🎯 User requesting specific product, skipping image confirmation logic`);
            // Don't process as image confirmation, let it fall through to main AI processing
         } else {
            // Check if user originally asked for a SET (áo + quần)
            const isSetQuery = context?.originalQuery && /(set|bộ|combo|outfit|phối|kết hợp|gợi ý.*đồ)/i.test(context.originalQuery);
            
            if (isSetQuery && context?.lastProducts?.length >= 2) {
               // For SET queries - Use the EXACT products that were stored in context
               // This ensures consistency with what AI recommended
               const shirtProduct = context.lastProduct; // This should be the shirt AI recommended
               
               // Dynamically find pants from context
               const allProductTypes = await Product.distinct('productType');
               const pantsTypes = allProductTypes.filter(type => 
                  type.toLowerCase().includes('jogger') || 
                  type.toLowerCase().includes('pants')
               );
               
               const pantsProduct = context.lastProducts.find(p => pantsTypes.includes(p.productType));
               
               console.log(`🔄 SET Confirmation - Using stored products:`);
               console.log(`   👕 Shirt from context: ${shirtProduct?.name}`);
               console.log(`   👖 Pants from context: ${pantsProduct?.name || 'NOT FOUND'}`);
               
               if (shirtProduct && pantsProduct && shirtProduct.image?.length > 0) {
                  const shirtPrice = Math.round(shirtProduct.price / 1000) + 'k';
                  const pantsPrice = Math.round(pantsProduct.price / 1000) + 'k';
                  console.log(`👔👖 Showing SET with SHIRT image: ${shirtProduct.name} + ${pantsProduct.name}`);
                  
                  // Update context to track SET state
                  setConversationContext(roomId, {
                     ...context,
                     lastAction: 'showed_shirt_in_set',
                     setShirtShown: true,
                     pantsToShow: pantsProduct
                  });
                  
                  return {
                     message: `Dạ! Đây là set đồ mình gợi ý ạ! 😍\n\n👕 **${shirtProduct.name}**\n💰 Giá: ${shirtPrice} | 📏 Size: ${shirtProduct.sizes?.join(', ') || 'S, M, L'}\n\n👖 **${pantsProduct.name}**\n💰 Giá: ${pantsPrice} | 📏 Size: ${pantsProduct.sizes?.join(', ') || 'S, M, L'}\n\n📸 Đây là ảnh áo ạ! Muốn xem ảnh quần, bạn nói "xem ảnh quần" nhé! 😊`,
                     image: shirtProduct.image[0]
                  };
               }
            }
            
            // Check if user wants to see PANTS after seeing shirt in set
            if ((isPantsImageRequest || isImageConfirmation) && context?.setShirtShown && context?.pantsToShow) {
               const pantsProduct = context.pantsToShow;
               if (pantsProduct.image?.length > 0) {
                  const pantsPrice = Math.round(pantsProduct.price / 1000) + 'k';
                  console.log(`👖 Showing PANTS image in SET: ${pantsProduct.name}`);
                  
                  // Clear set state
                  setConversationContext(roomId, {
                     ...context,
                     lastAction: 'showed_pants_in_set',
                     setShirtShown: false,
                     pantsToShow: null
                  });
                  
                  return {
                     message: `Đây là ảnh quần trong set ạ! 😍\n\n👖 **${pantsProduct.name}**\n💰 Giá: ${pantsPrice}\n📏 Size: ${pantsProduct.sizes?.join(', ') || 'S, M, L'}\n\nSet này hoàn hảo cho buổi cafe!`,
                     image: pantsProduct.image[0]
                  };
               }
            }
            
            // Fallback to single product (original logic) - only if not a specific product request
            const lastProduct = getLastMentionedProduct(roomId);
            if (lastProduct && lastProduct.image && lastProduct.image.length > 0 && !isSpecificProductRequest) {
               const price = Math.round(lastProduct.price / 1000) + 'k';
               console.log(`📸 Showing single product image: ${lastProduct.name}`);
               return {
                  message: `Dạ! Đây là ảnh sản phẩm ạ! 😍\n\n📸 **${lastProduct.name}**\n💰 Giá: ${price}\n📏 Size: ${lastProduct.sizes?.join(', ') || 'S, M, L'}\n🎯 ${lastProduct.productType}\n\nBạn thích không? 🥰`,
                  image: lastProduct.image[0]
               };
            }
         }
      }

      if (!genAI) {
         // Fallback đơn giản khi không có Gemini
         console.log('⚠️ Using fallback response - Gemini not initialized');
         return "Xin chào! 👋 Chevai Fashion có đa dạng sản phẩm: T-shirt, Hoodie, Sweater, Jogger và nhiều loại khác! Bạn muốn xem gì? 😊";
      }
      
      console.log(`🚀 Using real Gemini AI for: "${message}"`);
      
      // Find products for context
      const contextProducts = await findProductsForGemini(message);
      console.log(`🛍️ Found ${contextProducts.length} products for Gemini`);
      
      // Create product context ngắn gọn với links
      let productContext = contextProducts.length > 0
         ? contextProducts.map((p, index) => {
            const price = Math.round(p.price / 1000) + 'k';
            return `${index + 1}. **${p.name}** [🔗](/product/${p._id}) - ${price}`;
         }).join('\n')
         : 'Không có sản phẩm cụ thể.';

      // Cache products by roomId
      if (roomId && contextProducts.length > 0) {
         productContextCache[roomId] = contextProducts;
      }

      // Use Gemini AI model
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log('🎯 Using Gemini Fashion Consultant: gemini-1.5-flash');
      
      // Analyze user intent
      const isShirtQuery = /(áo(?!\s*khoác)|shirt|tshirt|t-shirt|hoodie|sweater|ringer|relaxed)/i.test(message);
      const isPantsQuery = /(quần|pants|jogger|jean)/i.test(message);
      const isGeneralProductQuery = /(có.*gì|sản\s*phẩm.*gì|shop.*có|hàng.*có|bán.*gì)/i.test(message) && !isShirtQuery && !isPantsQuery;
      const isShirtListQuery = /(có.*áo|áo.*khác|áo.*gì|loại.*áo|shirt.*available)/i.test(message);
      const isPantsListQuery = /(có.*quần|quần.*khác|quần.*gì|loại.*quần|pants.*available)/i.test(message);
      const isPaymentQuery = /(thanh\s*toán|payment|phương\s*thức|hình\s*thức|trả\s*tiền|vnpay|cod|online|có.*thanh.*toán.*gì|thanh.*toán.*gì|trả.*tiền.*gì)/i.test(message);
      
      const queryType = isPaymentQuery ? "thanh toán" :
                       isShirtListQuery || (isShirtQuery && /(có.*gì|gì)/i.test(message)) ? "danh sách áo" :
                       isPantsListQuery || (isPantsQuery && /(có.*gì|gì)/i.test(message)) ? "danh sách quần" :
                       isGeneralProductQuery ? "tổng quan sản phẩm" : 
                       isShirtQuery ? "áo/shirt" : 
                       isPantsQuery ? "quần/pants" : "general";
      
      console.log(`🔍 Query analysis: message="${message}", queryType="${queryType}", isPaymentQuery=${isPaymentQuery}`);
      
      const prompt = `Bạn là tư vấn viên Chevai Fashion 👗

**KHÁCH YÊU CẦU**: "${message}"

**SẢN PHẨM CÓ SẴN**: 
${productContext}

**YÊU CẦU QUAN TRỌNG**:
- Trả lời ngắn gọn (100-150 từ)
- Chỉ tư vấn sản phẩm có trong danh sách trên
- PHẢI COPY CHÍNH XÁC tên sản phẩm và link từ danh sách
- VÍ DỤ: Nếu danh sách có "**Áo ABC** [🔗](/product/123)" thì phải viết y hệt "**Áo ABC** [🔗](/product/123)"
- TUYỆT ĐỐI KHÔNG tự tạo link khác
- Không nhắc đến ảnh

${/(cho.*xem|xem.*áo|xem.*quần|show.*me|muốn.*xem)/i.test(message) ? 'Khách muốn XEM - giới thiệu ngắn gọn.' : ''}
${/(set|bộ|combo|outfit|phối)/i.test(message) ? 'Tư vấn SET ÁO + QUẦN từ danh sách, COPY CHÍNH XÁC links.' : ''}

Trả lời:`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      console.log(`🤖 Gemini response: ${response.length} chars`);

      // Store conversation context for SET queries - ENHANCED
      const isAskingForImage = /(muốn xem ảnh|có muốn xem|xem ảnh không|want to see|see image|ảnh của sản phẩm|ảnh không|cho.*xem)/i.test(response);
      const mentionsProduct = /(hoodie|sweater|jogger|t-shirt|áo|quần)/i.test(response) && contextProducts.length > 0;
      const isSpecificProductRequest = /\b(xem|cho|tôi|muốn)\s+(xem\s+)?(áo|quần|sản\s*phẩm)\s+[\wÀ-ỹ\s]{3,}/i.test(message);
      
      // Check if user explicitly asks to see a product with image request
      const isExplicitImageRequest = /(cho.*xem|xem.*áo|xem.*quần|show.*me|muốn.*xem|tôi.*xem|mình.*xem)/i.test(message) && contextProducts.length > 0;
      
      if (roomId && (isAskingForImage || mentionsProduct || isSpecificProductRequest)) {
         // Check if this is a SET query (gợi ý set đồ, outfit, combo)
         const isSetQuery = /(set|bộ|combo|outfit|phối|kết hợp|gợi ý.*đồ|set.*đồ)/i.test(message);
         
         let productToStore = null;
         
         if (contextProducts.length > 0) {
            if (isSetQuery) {
               // For SET queries - DYNAMIC product type detection with RESPONSE CONSISTENCY
               const allProductTypes = await Product.distinct('productType');
               const shirtTypes = allProductTypes.filter(type => 
                  !type.toLowerCase().includes('jogger') && 
                  !type.toLowerCase().includes('pants')
               );
               const pantsTypes = allProductTypes.filter(type => 
                  type.toLowerCase().includes('jogger') || 
                  type.toLowerCase().includes('pants')
               );

               const shirtProducts = contextProducts.filter(p => shirtTypes.includes(p.productType));
               const pantsProduct = contextProducts.find(p => pantsTypes.includes(p.productType));
               
               // SMART SHIRT SELECTION - Find the shirt mentioned in AI response
               let selectedShirtProduct = null;
               
               if (shirtProducts.length > 0) {
                  // Try to find shirt mentioned in the AI response
                  const responseLower = response.toLowerCase();
                  
                  selectedShirtProduct = shirtProducts.find(shirt => {
                     const shirtNameWords = shirt.name.toLowerCase().split(/\s+/);
                     // Check if significant words from shirt name appear in response
                     const significantWords = shirtNameWords.filter(word => 
                        word.length > 3 && 
                        !['thun', 'relaxed', 'fit', 'ringer', 'áo'].includes(word)
                     );
                     
                     return significantWords.some(word => responseLower.includes(word));
                  });
                  
                  // Fallback to first shirt if none found in response
                  selectedShirtProduct = selectedShirtProduct || shirtProducts[0];
               }
               
               productToStore = selectedShirtProduct || contextProducts[0];
               
               console.log(`👔👖 Dynamic SET context with CONSISTENCY CHECK:`);
               console.log(`   📝 AI Response mentioned: ${selectedShirtProduct ? 'Found matching shirt' : 'Using fallback shirt'}`);
               console.log(`   👕 Selected Shirt: ${productToStore?.name}`);
               console.log(`   👖 Pants: ${pantsProduct?.name || 'NOT FOUND'}`);
               
               // If no pants found in context, dynamically find from database
               if (!pantsProduct && selectedShirtProduct && pantsTypes.length > 0) {
                  console.log('🔍 No pants in context, searching database dynamically...');
                  const extraPants = await Product.find({ 
                     productType: { $in: pantsTypes } 
                  }).sort({ bestseller: -1 }).limit(1);
                  
                  if (extraPants.length > 0) {
                     contextProducts.push(extraPants[0]);
                     console.log(`➕ Added pants to context: ${extraPants[0].name} (${extraPants[0].productType})`);
                  }
               }
            } else if (isSpecificProductRequest) {
               // For specific product requests - DYNAMIC INTELLIGENT MATCHING
               const requestLower = message.toLowerCase();
               
               // Extract meaningful keywords from user request
               const requestKeywords = requestLower
                  .replace(/[^\w\sÀ-ỹ]/g, ' ')
                  .split(/\s+/)
                  .filter(word => word.length > 2 && !['cho', 'tôi', 'xem', 'mình', 'một', 'của', 'với', 'và', 'có', 'là', 'này', 'đó', 'áo', 'quần'].includes(word));
               
               console.log(`🔍 Request keywords: ${requestKeywords.join(', ')}`);
               
               // Find exact product by name from user request
               productToStore = contextProducts.find(p => {
                  const productName = p.name.toLowerCase();
                  const requestLower = message.toLowerCase();
                  
                  // Extract the product name from user request (after "xem")
                  const nameMatch = requestLower.match(/(?:xem|show)\s+(.+)/i);
                  if (nameMatch) {
                     const requestedName = nameMatch[1].trim().toLowerCase();
                     // Check if the requested name is contained in the product name
                     return productName.includes(requestedName) || requestedName.includes(productName);
                  }
                  
                  // Fallback: check if product name appears in the message
                  return requestLower.includes(productName) || productName.includes(requestKeywords.join(' '));
               });
               
               // If no keyword match, find by similarity
               if (!productToStore) {
                  productToStore = contextProducts.reduce((best, current) => {
                     const currentName = current.name.toLowerCase();
                     const bestName = best ? best.name.toLowerCase() : '';
                     
                     const currentMatches = requestKeywords.filter(keyword => currentName.includes(keyword)).length;
                     const bestMatches = requestKeywords.filter(keyword => bestName.includes(keyword)).length;
                     
                     return currentMatches > bestMatches ? current : best;
                  }, null);
               }
               
               // Final fallback to first product
               productToStore = productToStore || contextProducts[0];
               
               console.log(`🎯 Dynamic specific product match: ${productToStore?.name}`);
            } else {
               // Find most relevant single product - DYNAMIC TYPE DETECTION
               const isShirtQuery = /(áo(?!\s*khoác)|shirt|tshirt|t-shirt|hoodie|sweater|ringer|relaxed)/i.test(message);
               const isPantsQuery = /(quần|pants|jogger|jean)/i.test(message);
               
               if (isShirtQuery) {
                  // Dynamically get all shirt types
                  const allTypes = await Product.distinct('productType');
                  const shirtTypes = allTypes.filter(type => 
                     !type.toLowerCase().includes('jogger') && 
                     !type.toLowerCase().includes('pants')
                  );
                  productToStore = contextProducts.find(p => shirtTypes.includes(p.productType)) || contextProducts[0];
               } else if (isPantsQuery) {
                  // Dynamically get all pants types  
                  const allTypes = await Product.distinct('productType');
                  const pantsTypes = allTypes.filter(type => 
                     type.toLowerCase().includes('jogger') || 
                     type.toLowerCase().includes('pants')
                  );
                  productToStore = contextProducts.find(p => pantsTypes.includes(p.productType)) || contextProducts[0];
               } else {
                  productToStore = contextProducts[0];
               }
            }
         }
         
         if (productToStore) {
            setConversationContext(roomId, {
               lastAction: isAskingForImage ? 'asked_for_image' : 'mentioned_product',
               lastProduct: productToStore,
               lastProducts: contextProducts,
               lastResponse: response,
               originalQuery: message, // Store original query for SET detection
               isSetQuery: isSetQuery, // Flag for SET queries
               aiProvider: 'Gemini'
            });
            console.log(`💭 Stored context - ${isSetQuery ? 'SET' : isSpecificProductRequest ? 'SPECIFIC' : 'single'} ${isAskingForImage ? 'asking for image' : 'mentioned product'}: ${productToStore.name}`);
            
            // AUTO-SHOW IMAGE: If user explicitly asks to see a product, show image immediately
            if (isExplicitImageRequest && productToStore.image && productToStore.image.length > 0) {
               const price = Math.round(productToStore.price / 1000) + 'k';
               console.log(`🖼️ Auto-showing image for explicit request: ${productToStore.name}`);
               
               return {
                  message: `Dạ! Đây là ảnh sản phẩm bạn yêu cầu ạ! 😍\n\n📸 **${productToStore.name}**\n💰 Giá: ${price}\n📏 Size: ${productToStore.sizes?.join(', ') || 'S, M, L'}\n🎯 ${productToStore.productType}\n\n[**XEM SẢN PHẨM**](/product/${productToStore._id})\n\nSản phẩm này rất đẹp! Bạn thích không? 🥰`,
                  image: productToStore.image[0]
               };
            }
         }
      }

      // Return text-only response
      console.log(`📝 Returning text-only response (${contextProducts.length > 0 ? 'product found but no image needed' : 'no matching product'})`);
      return response;

   } catch (error) {
      console.error('🚨 Gemini AI Error:', error);

      // If it's a 503 Service Unavailable or rate limit error, throw it so hybrid can fallback to custom AI
      if (error.status === 503 || error.status === 429 || error.message?.includes('overloaded') || error.message?.includes('quota')) {
         console.log('🔄 Gemini overloaded/quota exceeded - throwing error for hybrid fallback');
         throw error;
      }

      // For other errors, provide intelligent fallback
      const keywords = ['chào', 'hello', 'hi', 'xin chào', 'áo', 'quần', 'giá', 'price'];
      const hasKeyword = keywords.some(keyword => message.toLowerCase().includes(keyword));

      if (hasKeyword) {
         return "Xin chào! 👋 Mình là AI của Chevai Fashion! Chevai có nhiều sản phẩm thời trang đẹp lắm! Bạn muốn xem gì? 😊✨";
      }

      return "Xin lỗi, mình đang gặp sự cố nhỏ! 😅 Thử hỏi lại hoặc liên hệ admin nhé! 🛠️";
   }
}

/**
 * Kiểm tra có nên dùng Gemini không - CẢI TIẾN
 */
export function shouldGeminiRespond(message) {
   const trimmed = message.trim();
   
   // Quá ngắn hoặc chỉ có ký tự đặc biệt
   if (trimmed.length < 2 || /^[\d\s\-_.,!?]*$/i.test(trimmed)) {
      return false;
   }
   
   // Chỉ emoji hoặc sticker
   if (/^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u.test(trimmed)) {
      return false;
   }
   
   // Tin nhắn admin only
   if (/(admin\s+only|private\s+message)/i.test(trimmed)) {
      return false;
   }
   
   // Có từ khóa thời trang hoặc câu hỏi hợp lệ hoặc yêu cầu xem hình
   const fashionKeywords = /(áo|quần|thời trang|fashion|clothes|shirt|pants|hoodie|sweater|jogger|tshirt|ringer|relaxed)/i;
   const validQuestion = /(gì|nào|sao|như|khi|có|bao|price|giá|size|màu|color)/i;
   const greeting = /(chào|hello|hi|xin)/i;
   const imageRequest = /(hình|ảnh|image|photo|pic|xem|show|cho.*xem|muốn.*xem|tôi.*xem|mình.*xem)/i;
   
   return fashionKeywords.test(trimmed) || validQuestion.test(trimmed) || greeting.test(trimmed) || imageRequest.test(trimmed);
}

/**
 * Stats về Gemini usage
 */
export function getGeminiStats() {
   return {
      provider: 'Google Gemini',
      cost: 'FREE',
      limits: '15 requests/minute, 1500/day',
      getApiKey: 'https://makersuite.google.com/app/apikey'
   };
}
