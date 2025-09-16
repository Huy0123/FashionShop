const orderSuccessTemplate = (orderData) => {
    const {
        orderId,
        customerName,
        customerEmail,
        items,
        totalAmount,
        shippingAddress,
        paymentMethod,
        orderDate
    } = orderData;

    const itemsHtml = items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;">
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <strong>${item.name}</strong><br>
                <span style="color: #666;">Size: ${item.size}</span>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                ${item.quantity}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                ${item.price.toLocaleString('vi-VN')}₫
            </td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác nhận đơn hàng - FashionShop</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background-color: #2c3e50; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">FashionShop</h1>
                <p style="color: #ecf0f1; margin: 10px 0 0 0; font-size: 16px;">Cảm ơn bạn đã mua sắm cùng chúng tôi!</p>
            </div>

            <!-- Success Message -->
            <div style="padding: 30px; text-align: center; background-color: #d4edda; border-left: 5px solid #28a745;">
                <h2 style="color: #155724; margin: 0 0 10px 0;">✅ Đặt hàng thành công!</h2>
                <p style="color: #155724; margin: 0;">Đơn hàng #${orderId} của bạn đã được xác nhận</p>
            </div>

            <!-- Customer Info -->
            <div style="padding: 30px;">
                <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Thông tin khách hàng</h3>
                <table style="width: 100%; margin-bottom: 20px;">
                    <tr>
                        <td style="padding: 8px 0; color: #666; width: 30%;">Họ tên:</td>
                        <td style="padding: 8px 0; font-weight: bold;">${customerName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Email:</td>
                        <td style="padding: 8px 0;">${customerEmail}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Ngày đặt:</td>
                        <td style="padding: 8px 0;">${new Date(orderDate).toLocaleDateString('vi-VN')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Thanh toán:</td>
                        <td style="padding: 8px 0;">${paymentMethod}</td>
                    </tr>
                </table>

                <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Địa chỉ giao hàng</h3>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <p style="margin: 0; line-height: 1.6;">${shippingAddress.street}<br>
                    ${shippingAddress.city}, ${shippingAddress.state}<br>
                    ${shippingAddress.zipCode}</p>
                </div>

                <!-- Order Items -->
                <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Chi tiết đơn hàng</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Ảnh</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Sản phẩm</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">SL</th>
                            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Giá</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <!-- Total -->
                <div style="text-align: right; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="color: #2c3e50; margin: 0;">Tổng cộng: <span style="color: #e74c3c;">${totalAmount.toLocaleString('vi-VN')}₫</span></h3>
                </div>

                <!-- Next Steps -->
                <div style="margin-top: 30px; padding: 20px; background-color: #e3f2fd; border-radius: 5px; border-left: 5px solid #2196f3;">
                    <h4 style="color: #1976d2; margin: 0 0 10px 0;">📋 Bước tiếp theo:</h4>
                    <ul style="color: #1565c0; margin: 0; padding-left: 20px;">
                        <li>Chúng tôi sẽ xử lý đơn hàng trong vòng 24h</li>
                        <li>Bạn sẽ nhận được thông báo khi đơn hàng được giao cho đơn vị vận chuyển</li>
                        <li>Thời gian giao hàng dự kiến: 2-5 ngày làm việc</li>
                        <li>Mọi thắc mắc vui lòng liên hệ hotline: <strong>1900-xxxx</strong></li>
                    </ul>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
                <p style="color: #bdc3c7; margin: 0 0 10px 0;">Cảm ơn bạn đã tin tưởng FashionShop!</p>
                <p style="color: #95a5a6; margin: 0; font-size: 12px;">
                    Email này được gửi tự động, vui lòng không trả lời.<br>
                    © 2025 FashionShop. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
};

export { orderSuccessTemplate };