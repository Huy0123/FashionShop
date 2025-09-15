import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext';

const VerifyPayment = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const { setCart } = useContext(ShopContext);

    const backendUrl = import.meta.env.VITE_BE_URL;

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                const queryString = window.location.search;
                const response = await axios.get(backendUrl + '/api/order/vnpay-return' + queryString);

                if (response.data.success) {
                    setPaymentStatus('success');
                    toast.success('Thanh toán thành công!');
                    setCart({});
                    setTimeout(() => {
                        navigate('/order');
                    }, 5000);
                } else {
                    setPaymentStatus('failed');
                    toast.error('Thanh toán thất bại: ' + response.data.message);
                    setTimeout(() => {
                        navigate('/cart');
                    }, 5000);
                }
            } catch (error) {
                console.error(error);
                setPaymentStatus('error');
                toast.error('Có lỗi xảy ra khi xác minh thanh toán');
                setTimeout(() => {
                    navigate('/cart');
                }, 5000);
            } finally {
                setLoading(false);
            }
        };

        verifyPayment();
    }, [navigate, backendUrl]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-lg">Đang xác minh thanh toán...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
                {paymentStatus === 'success' ? (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-green-600 mb-2">Thanh toán thành công!</h2>
                        <p className="text-gray-600 mb-4">
                            Đơn hàng của bạn đã được thanh toán thành công.
                            Bạn sẽ được chuyển hướng đến trang đơn hàng trong giây lát.
                        </p>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-red-600 mb-2">Thanh toán thất bại!</h2>
                        <p className="text-gray-600 mb-4">
                            Có lỗi xảy ra trong quá trình thanh toán.
                            Bạn sẽ được chuyển hướng về giỏ hàng để thử lại.
                        </p>
                    </>
                )}

                <div className="flex gap-4 justify-center mt-6">
                    <button
                        onClick={() => navigate('/order')}
                        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                    >
                        Xem đơn hàng
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                    >
                        Về trang chủ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyPayment;
