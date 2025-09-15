import Product from '../models/productModel.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { setConversationContext, getConversationContext, isImageConfirmation, getLastMentionedProduct } from './conversationContext.js';
import dotenv from 'dotenv';
dotenv.config();

// Simple in-memory cache for product context by roomId (or userId)
const productContextCache = {};

// Khởi tạo Gemini AI (FREE 15 requests/minute - 1500 requests/day)
let gemini = null;
try {
   const apiKey = process.env.GEMINI_API_KEY?.trim();
   if (apiKey && apiKey.length > 10) {
      gemini = new GoogleGenerativeAI(apiKey);
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
         }
      }

      // 2. PRODUCT TYPE SEARCH - Tìm theo loại sản phẩm  
      if (products.length === 0) {
         // Get all unique product types dynamically from database
         const productTypes = await Product.distinct('productType');
         
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
               break;
            }
         }
      }

      // 3. SET/OUTFIT SEARCH - Tìm kiếm cho outfit/set đồ
      const isSetQuery = /(set|bộ|combo|outfit|phối|kết hợp|gợi ý.*đồ|cafe|chơi|đi|dự|tiệc)/i.test(message);
      
      if (isSetQuery || products.length === 0) {
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

         // Get diverse products for comprehensive recommendations
         const shirtProducts = shirtTypes.length > 0 ? await Product.find({ 
            productType: { $in: shirtTypes } 
         }).sort({ bestseller: -1, date: -1 }).limit(10) : [];
         
         const pantsProducts = pantsTypes.length > 0 ? await Product.find({ 
            productType: { $in: pantsTypes } 
         }).sort({ bestseller: -1, date: -1 }).limit(5) : [];
         
         products = [...shirtProducts, ...pantsProducts];
      }

      // 4. FALLBACK - Lấy sản phẩm đa dạng từ toàn bộ database
      if (products.length === 0) {
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
      }
      
      return products;
      
   } catch (error) {
      return [];
   }
}

/**
 * Generate Gemini AI response với Smart Image Logic - ENHANCED FOR SET OUTFIT
 */
export async function generateGeminiAI(message, roomId = null) {
   try {
      console.log(`👤 User: "${message}"`);
      
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
               
               if (shirtProduct && pantsProduct && shirtProduct.image?.length > 0) {
                  const shirtPrice = Math.round(shirtProduct.price / 1000) + 'k';
                  const pantsPrice = Math.round(pantsProduct.price / 1000) + 'k';
                  
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
               return {
                  message: `Dạ! Đây là ảnh sản phẩm ạ! 😍\n\n📸 **${lastProduct.name}**\n💰 Giá: ${price}\n📏 Size: ${lastProduct.sizes?.join(', ') || 'S, M, L'}\n🎯 ${lastProduct.productType}\n\nBạn thích không? 🥰`,
                  image: lastProduct.image[0]
               };
            }
         }
      }
      
      // Handle simple greeting without product search
      const isSimpleGreeting = /^(chào|hello|hi|xin chào|hey)$/i.test(message.trim());
      
      if (isSimpleGreeting) {
         console.log(`🤖 AI: "Xin chào! Bạn muốn tìm sản phẩm gì ạ?"`);
         return "Xin chào! 👋 Chevai Fashion rất vui được hỗ trợ bạn! Bạn muốn tìm sản phẩm gì ạ? 😊";
      }
      
      // Find products for context
      const contextProducts = await findProductsForGemini(message);
      
      // Create product context with ID info for AI to build links
      let productContext = contextProducts.length > 0
         ? contextProducts.map((p, index) => {
            const price = Math.round(p.price / 1000) + 'k';
            return `${index + 1}. Tên: "${p.name}" | ID: ${p._id} | Giá: ${price}`;
         }).join('\n')
         : 'Không có sản phẩm cụ thể.';

      // Cache products by roomId
      if (roomId && contextProducts.length > 0) {
         productContextCache[roomId] = contextProducts;
      }

      // Use Gemini AI model
      const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Detect greeting vs product inquiry
      const isGreeting = /^(chào|hello|hi|xin chào|hey)$/i.test(message.trim());
      
      const prompt = `Bạn là tư vấn viên Chevai Fashion 👗

**KHÁCH YÊU CẦU**: "${message}"

**SẢN PHẨM CÓ SẴN TRONG KHO**: 
${productContext}

**QUY TẮC BẮT BUỘC**:
${isGreeting ? '- Chỉ chào hỏi đơn giản, hỏi khách muốn tìm gì (không liệt kê sản phẩm)' : '- Trả lời ngắn gọn (100-150 từ)'}

🚨 **TUYỆT ĐỐI TUÂN THỦ**:
1. CHỈ được giới thiệu sản phẩm CÓ TRONG DANH SÁCH TRÊN
2. KHÔNG được tự tạo tên sản phẩm hay ID bất kỳ  
3. LUÔN dùng đúng ID từ danh sách, không được sửa đổi
4. Nếu không có sản phẩm phù hợp trong danh sách → nói "Hiện tại chưa có sản phẩm phù hợp"

✅ **VÍ DỤ ĐÚNG**: 
Nếu danh sách có: "1. Tên: 'Áo Thun Basic' | ID: 507f1f77bcf86cd799439011 | Giá: 150k"
Thì viết: **Áo Thun Basic** [🔗](/product/507f1f77bcf86cd799439011)

❌ **TUYỆT ĐỐI CẤM**:
- Tự sáng tạo ID khác với danh sách
- Sửa đổi tên hoặc ID từ danh sách
- Tạo link cho sản phẩm không có trong danh sách

${/(cho.*xem|xem.*áo|xem.*quần|show.*me|muốn.*xem)/i.test(message) ? '\n🎯 Khách muốn XEM sản phẩm - chọn từ danh sách có sẵn.' : ''}
${/(set|bộ|combo|outfit|phối)/i.test(message) ? '\n🎯 Tư vấn SET từ danh sách - 1 áo + 1 quần có sẵn.' : ''}

Trả lời (chỉ dùng sản phẩm có trong danh sách):`;

      const result = await model.generateContent(prompt);
      let response = result.response.text();
      
      // VALIDATION: Check if AI created fake product links (silent validation)
      const linkMatches = response.match(/\[🔗\]\(\/product\/([^)]+)\)/g);
      if (linkMatches && contextProducts.length > 0) {
         const validIds = contextProducts.map(p => p._id.toString());
         
         linkMatches.forEach(link => {
            const idMatch = link.match(/\/product\/([^)]+)/);
            if (idMatch) {
               const linkId = idMatch[1];
               if (!validIds.includes(linkId)) {
                  // Silent fix: Replace fake link with warning message
                  response = response.replace(link, '[❌ Sản phẩm không có sẵn]');
               }
            }
         });
      }
      
      console.log(`🤖 AI: ${response}`);

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
               
               // If no pants found in context, dynamically find from database
               if (!pantsProduct && selectedShirtProduct && pantsTypes.length > 0) {
                  const extraPants = await Product.find({ 
                     productType: { $in: pantsTypes } 
                  }).sort({ bestseller: -1 }).limit(1);
                  
                  if (extraPants.length > 0) {
                     contextProducts.push(extraPants[0]);
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
            
            // AUTO-SHOW IMAGE: If user explicitly asks to see a product, show image immediately
            if (isExplicitImageRequest && productToStore.image && productToStore.image.length > 0) {
               const price = Math.round(productToStore.price / 1000) + 'k';
               
               return {
                  message: `Dạ! Đây là ảnh sản phẩm bạn yêu cầu ạ! 😍\n\n📸 **${productToStore.name}**\n💰 Giá: ${price}\n📏 Size: ${productToStore.sizes?.join(', ') || 'S, M, L'}\n🎯 ${productToStore.productType}\n\n[XEM SẢN PHẨM](/product/${productToStore._id})\n\nSản phẩm này rất đẹp! Bạn thích không? 🥰`,
                  image: productToStore.image[0]
               };
            }
         }
      }

      // Return text-only response
      return response;

   } catch (error) {
      // If it's a 503 Service Unavailable or rate limit error, throw it so hybrid can fallback to custom AI
      if (error.status === 503 || error.status === 429 || error.message?.includes('overloaded') || error.message?.includes('quota')) {
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


