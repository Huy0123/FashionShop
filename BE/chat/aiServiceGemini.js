import Product from '../models/productModel.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { setConversationContext } from './conversationContext.js';
import dotenv from 'dotenv';
dotenv.config();

const productContextCache = {};
// Khởi tạo Gemini AI 
let gemini = null;
try {
   const apiKey = process.env.GEMINI_API_KEY?.trim();
   if (apiKey && apiKey.length > 10) {
      gemini = new GoogleGenerativeAI(apiKey);
      console.log('Gemini AI khởi tạo thành công');
   } else {
      console.log('Gemini API key không tìm thấy hoặc không hợp lệ');
   }
} catch (error) {
   console.error('Không thể khởi tạo Gemini AI:', error.message);
}

async function findProductsForGemini(message) {
   try {
      const searchQuery = message.toLowerCase();
      let products = [];
      let query = {};
      //chọn trường cần thiết
      const productProjection = {
         name: 1,
         _id: 1,
         price: 1,
         productType: 1,
         sizes: 1,
         bestseller: 1,
         date: 1
      };
      // tìm kiếm theo tên sản phẩm
      if (searchQuery.includes('áo') ||
         searchQuery.includes('shirt') ||
         searchQuery.includes('quần') ||
         searchQuery.includes('pants')) {

         const keywords = searchQuery
            .replace(/[^\w\sÀ-ỹ]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 1 && !['cho', 'tôi', 'xem', 'mình', 'một', 'của', 'với', 'và', 'có', 'là', 'này', 'đó'].includes(word));

         if (keywords.length > 0) {
            const namePattern = keywords.join('|');
            query.name = { $regex: namePattern, $options: 'i' };
            //đọc dữ liệu từ database
            products = await Product.find(query, productProjection)
               .sort({ bestseller: -1, date: -1 })
               .limit(20);
         }
      }

      // tìm kiếm theo loại sản phẩm
      if (products.length === 0) {
         const productTypes = await Product.distinct('productType');
         // loại bỏ các loại sản phẩm không liên quan
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
               products = await Product.find(query, productProjection)
                  .sort({ bestseller: -1, date: -1 })
                  .limit(15);
               break;
            }
         }
      }

      //radom quần áo ngẫu nhiên
      function pickRandom(arr, count = 1) {
         const shuffled = [...arr].sort(() => 0.5 - Math.random());
         return shuffled.slice(0, count);
      }

      // SET/OUTFIT 
      const isSetQuery = /(set|bộ|combo|outfit|phối|kết hợp|gợi ý.*đồ|cafe|chơi|đi|dự|tiệc)/i.test(message);
      if (isSetQuery || products.length === 0) {
         const allProductTypes = await Product.distinct('productType');

         const shirtTypes = allProductTypes.filter(type =>
            !type.toLowerCase().includes('jogger') &&
            !type.toLowerCase().includes('pants')
         );
         const pantsTypes = allProductTypes.filter(type =>
            type.toLowerCase().includes('jogger') ||
            type.toLowerCase().includes('pants')
         );

         const shirtProducts = shirtTypes.length > 0
            ? await Product.find({ productType: { $in: shirtTypes } }, productProjection)
               .sort({ bestseller: -1, date: -1 }).limit(10)
            : [];

         const pantsProducts = pantsTypes.length > 0
            ? await Product.find({ productType: { $in: pantsTypes } }, productProjection)
               .sort({ bestseller: -1, date: -1 }).limit(5)
            : [];

         const randomShirts = pickRandom(shirtProducts, 2);
         const randomPants = pickRandom(pantsProducts, 1);
         products = [...randomShirts, ...randomPants];
      }


      // dự phòng
      if (products.length === 0) {
         const recentProducts = await Product.find({}, productProjection)
            .sort({ date: -1 })
            .limit(10);
         const bestsellerProducts = await Product.find({ bestseller: true }, productProjection)
            .sort({ date: -1 })
            .limit(10);
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

export async function generateGeminiAI(message, roomId = null) {
   try {
      const isSimpleGreeting = /^(chào|hello|hi|xin chào|hey)$/i.test(message.trim());
      if (isSimpleGreeting) {
         return "Xin chào! 👋 Chevai Fashion rất vui được hỗ trợ bạn! Bạn muốn tìm sản phẩm gì ạ? 😊";
      }
      const contextProducts = await findProductsForGemini(message);
      // Thêm link cho từng sản phẩm
      let productContext = contextProducts.length > 0
         ? contextProducts.map((p, index) => {
            const price = Math.round(p.price / 1000) + 'k';
            return `${index + 1}. [${p.name}](/product/${p._id}) – Giá: ${price}`;
         }).join('\n')
         : 'Không có sản phẩm cụ thể.';
      if (roomId && contextProducts.length > 0) {
         productContextCache[roomId] = contextProducts;
      }

      const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `Bạn là tư vấn viên Chevai Fashion - cửa hàng thời trang. Giúp khách chọn quần áo phù hợp.

**KHÁCH YÊU CẦU**: "${message}"
**SẢN PHẨM CÓ SẴN TRONG KHO**: 
${productContext}
**QUY TẮC BẮT BUỘC**:
- Trả lời ngắn gọn (100-150 từ)
- Thân thiện, nhiệt tình, chuyên nghiệp
- Dùng ngôn ngữ tự nhiên, không gượng gạo
- Đa dạng mẫu câu, không lặp lại
- Hãy xưng hô với khách là "bạn"
- Nếu khách hỏi sản phẩm có size gì thì cứ trả lời có đủ size S, M, L, XL
- Tự động thích nghi và trả lời nếu nó nằm ngoài việc tư vấn quần áo
- Nếu khách hỏi về chính sách đổi trả thì hãy trả lời rằng "Chevai Fashion hỗ trợ đổi trả trong vòng 7 ngày nếu sản phẩm còn nguyên tem mác."
- Nếu khách hỏi về thời gian giao hàng thì hãy trả lời rằng "Thời gian giao hàng dự kiến từ 3-5 ngày làm việc."
- không được nói đưa ảnh hay cho xem ảnh
- Không được đưa [Sản phẩm không có sẵn] ra đoạn chat với khách
- Không đưa link sản phẩm trong đoạn chat với admin
**TUYỆT ĐỐI TUÂN THỦ**:
1. CHỈ được giới thiệu sản phẩm CÓ TRONG DANH SÁCH TRÊN
2. KHÔNG được tự tạo tên sản phẩm hay ID bất kỳ  
3. LUÔN dùng đúng ID từ danh sách, không được sửa đổi
4. Nếu không có sản phẩm phù hợp trong danh sách → nói "Hiện tại chưa có sản phẩm phù hợp"
5. Luôn dùng cú pháp Markdown [Tên sản phẩm](/product/ID) để chèn link.
6. Tuyệt đối không ghi “(/product/ID)” hoặc “Link sản phẩm:” thô ra ngoài.
7. Không hiển thị ID ngoài text.
8. Không viết chữ "Link sản phẩm:" trước đường link
9. nếu hiện tinh nhắn bên admin thì đừng đưa link sản phẩm
${/(set|bộ|combo|outfit|phối)/i.test(message) ? '\n🎯 Tư vấn SET từ danh sách - 1 áo + 1 quần có sẵn.' : ''}
Trả lời (chỉ dùng sản phẩm có trong danh sách):`;

      const result = await model.generateContent(prompt);
      let response = result.response.text();

      // lọc và sửa link hợp lệ
      const linkMatches = response.match(/\[.*?\]\(\/product\/([^)]+)\)/g);
      if (linkMatches && contextProducts.length > 0) {
         const validIds = contextProducts.map(p => p._id.toString());
         linkMatches.forEach(link => {
            const idMatch = link.match(/\/product\/([^)]+)/);
            if (idMatch) {
               const linkId = idMatch[1];
               if (!validIds.includes(linkId)) {
                  response = response.replace(link, '[Sản phẩm không có sẵn]');
               }
            }
         });
      }

      // lưu context
      if (roomId && contextProducts.length > 0) {
         setConversationContext(roomId, {
            lastProducts: contextProducts,
            lastResponse: response,
            originalQuery: message,
            aiProvider: 'Gemini'
         });
      }

      return response;
   } catch (error) {
      console.error(error);
      return "Xin lỗi, mình đang gặp sự cố nhỏ! 😅 Thử hỏi lại hoặc liên hệ admin nhé! 🛠️";
   }
}
