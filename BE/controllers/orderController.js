import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js"
import { createVNPayUrl, verifyVNPayResponse } from "../config/vnpay.js";
import { orderSuccessTemplate } from "../config/template.js";
import { sendEmail } from './mailController.js'
// đặt hàng theo pp trả tiền sau khi nhận
const placeOrder = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;
        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod: "COD",
            payment: false,
            date: Date.now()
        }
        const newOrder = new orderModel(orderData);
        await newOrder.save()
        await userModel.findByIdAndUpdate(userId, { cartData: {} })
        res.json({ success: true, message: "Order success" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}
// đặt hàng theo pp momo
const placeOrderMomo = async (req, res) => {

}
// đặt hàng theo pp vnpay
const placeOrderVnpay = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;

        // Tạo đơn hàng trong database với trạng thái chờ thanh toán
        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod: "VNPay",
            payment: false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        // Lấy IP address của người dùng
        const ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

        // Tạo thông tin đơn hàng cho VNPay
        const orderInfo = `Thanh toan don hang ${newOrder._id}`;

        // Tạo URL thanh toán VNPay
        const paymentUrl = createVNPayUrl(
            newOrder._id.toString(),
            amount,
            orderInfo,
            ipAddr
        );

        res.json({
            success: true,
            paymentUrl,
            orderId: newOrder._id
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

//dữ liệu đơn hàng trên admin
const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({})
        res.json({ success: true, orders })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}
//dữ liệu đơn hàng trên user
const userOrders = async (req, res) => {
    try {
        const { userId } = req.body
        console.log('Getting orders for userId:', userId);

        const orders = await orderModel.find({ userId })
        console.log('Found orders count:', orders.length);
        console.log('Orders:', orders);

        res.json({ success: true, order: orders })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}
//update trạng thái từ admin
const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body
        await orderModel.findByIdAndUpdate(orderId, { status })
        res.json({ success: true, message: 'Status Update' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Xác minh kết quả thanh toán VNPay
const verifyVNPayPayment = async (req, res) => {
    try {
        let vnp_Params = req.query;
        console.log('VNPay callback params:', vnp_Params);

        // Xác thực chữ ký từ VNPay
        const isValid = verifyVNPayResponse(vnp_Params);
        console.log('Signature validation:', isValid);

        if (isValid) {
            const orderId = vnp_Params['vnp_TxnRef'];
            const responseCode = vnp_Params['vnp_ResponseCode'];
            console.log('OrderId:', orderId, 'ResponseCode:', responseCode);

            // Tìm đơn hàng trong database
            const order = await orderModel.findById(orderId);
            console.log('Found order:', order ? 'Yes' : 'No');

            if (!order) {
                return res.json({ success: false, message: 'Order not found' });
            }

            if (responseCode === '00') {
                // Thanh toán thành công
                const updatedOrder = await orderModel.findByIdAndUpdate(orderId, {
                    payment: true,
                    status: 'Đơn đã đặt'
                }, { new: true });

                console.log('Updated order:', updatedOrder);

                // Xóa giỏ hàng của user và lấy thông tin user
                const user = await userModel.findByIdAndUpdate(
                    order.userId,
                    { cartData: {} },
                    { new: true }
                );
                console.log('Cleared cart for user:', order.userId);

                // Gửi email xác nhận đơn hàng
                const emailHtml = orderSuccessTemplate({
                    orderId: orderId,
                    customerName: user.name,
                    customerEmail: user.email,
                    items: updatedOrder.items,
                    totalAmount: updatedOrder.amount,
                    shippingAddress: updatedOrder.address,
                    paymentMethod: updatedOrder.paymentMethod,
                    orderDate: updatedOrder.date
                });

                await sendEmail(
                    user.email,
                    'Xác nhận đơn hàng của bạn',
                    emailHtml
                );
                res.json({
                    success: true,
                    message: 'Payment successful',
                    orderId: orderId
                });
            } else {
                // Thanh toán thất bại
                await orderModel.findByIdAndUpdate(orderId, {
                    status: 'Payment Failed'
                });

                res.json({
                    success: false,
                    message: 'Payment failed',
                    responseCode: responseCode
                });
            }
        } else {
            console.log('Invalid signature');
            res.json({ success: false, message: 'Invalid signature' });
        }

    } catch (error) {
        console.log('VNPay verification error:', error);
        res.json({ success: false, message: error.message });
    }
}

export { placeOrder, placeOrderMomo, placeOrderVnpay, allOrders, userOrders, updateStatus, verifyVNPayPayment }