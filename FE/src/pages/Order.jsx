import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';
import axios from 'axios';

const Order = () => {
  const { backendUrl, token, formatCurrency } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);

  const loadOrderData = async () => {
    try {
      if (!token) {
        return null;
      }
      const response = await axios.post(backendUrl + '/api/order/userorders', {}, { headers: { token } });
      if (response.data.success) {
        // Keep original orders and sort by date desc
        const sorted = [...response.data.order].sort((a, b) => (b.date || 0) - (a.date || 0));
        setOrders(sorted);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to fetch orders.');
    }
  };

  useEffect(() => {
    loadOrderData();
  }, [token]);

  return (
    <div className='border-t pt-16'>
      <div className='text-2xl'>
        <Title text2={'ĐƠN HÀNG CỦA TÔI'} />
      </div>
      <div className='space-y-4'>
        {orders.map((order, idx) => (
          <div key={order._id || idx} className='border rounded-md overflow-hidden bg-white'>
            {/* Order header */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 bg-gray-50 border-b'>
              <div className='flex flex-wrap items-center gap-3'>
                <span className='text-sm text-gray-500'>Ngày:</span>
                <span className='font-medium'>{new Date(order.date).toLocaleString('vi-VN')}</span>
                {order._id && (
                  <span className='text-xs text-gray-400'>• Mã đơn: {String(order._id).slice(-8).toUpperCase()}</span>
                )}
              </div>
              <div className='flex items-center gap-3'>
                <span className={`text-xs px-2 py-1 rounded ${order.payment ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {order.payment ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'}
                </span>
                <span className='text-xs px-2 py-1 rounded bg-gray-100 text-gray-700'>{order.paymentMethod}</span>
                <span className='text-sm font-semibold text-back'>{formatCurrency(order.amount)}</span>
              </div>
            </div>

            {/* Items list */}
            <div className='divide-y'>
              {order.items.map((item, i) => (
                <div key={i} className='px-4 py-3 flex items-start gap-4'>
                  <img className='w-16 h-16 object-cover rounded' src={item.image?.[0]} alt={item.name} />
                  <div className='flex-1 min-w-0'>
                    <p className='font-medium truncate'>{item.name}</p>
                    <div className='mt-1 text-sm text-gray-600 flex flex-wrap gap-3'>
                      <span>Giá: {formatCurrency(item.price)}</span>
                      <span>Số lượng: {item.quantity}</span>
                      {item.size && <span>Kích cỡ: {item.size}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer: status + actions */}
            <div className='px-4 py-3 flex items-center justify-between bg-gray-50'>
              <div className='flex items-center gap-2'>
                <span className='min-w-2 h-2 rounded-full bg-green-500'></span>
                <span className='text-sm'>{order.status}</span>
              </div>
              <button onClick={loadOrderData} className='border px-4 py-2 text-sm font-medium rounded-sm'>Theo dõi đơn hàng</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Order;