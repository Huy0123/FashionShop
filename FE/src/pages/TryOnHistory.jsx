import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Title from '../components/Title';
import { useNavigate } from 'react-router-dom';

const TryOnHistory = () => {
    const navigate = useNavigate();
    const [tryOnResults, setTryOnResults] = useState([]);
    const [loading, setLoading] = useState(true);

    const getToken = () => localStorage.getItem('token');
    const getBackendUrl = () => import.meta.env.VITE_BE_URL || 'http://localhost:4000';

    const fetchTryOnHistory = async () => {
        try {
            setLoading(true);
            const token = getToken();
            const backendUrl = getBackendUrl();

            if (!token) {
                toast.error('Vui lòng đăng nhập lại');
                navigate('/login');
                return;
            }

            const response = await fetch(`${backendUrl}/api/tryon/user`, {
                method: 'GET',
                headers: {
                    token,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setTryOnResults(data.data);
            } else {
                toast.error(data.message || 'Lỗi khi tải lịch sử thử đồ');
            }
        } catch (error) {
            console.error('Error fetching try-on history:', error);
            toast.error('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    const deleteTryOnResult = async (resultId) => {
        try {
            const token = getToken();
            const backendUrl = getBackendUrl();

            const response = await fetch(`${backendUrl}/api/tryon/result/${resultId}`, {
                method: 'DELETE',
                headers: {
                    token,
                    'Content-Type': 'application/json'
                },
            });

            console.log('Delete response status:', response.status);

            const data = await response.json();

            if (data.success) {
                toast.success('Đã xóa ảnh thử đồ');
                setTryOnResults(prev => prev.filter(item => item._id !== resultId));
            } else {
                toast.error(data.message || 'Lỗi khi xóa');
            }
        } catch (error) {
            console.error('Error deleting try-on result:', error);
            toast.error('Lỗi kết nối server');
        }
    };

    const confirmDelete = (resultId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa ảnh này?')) {
            deleteTryOnResult(resultId);
        }
    };

    const downloadImage = async (imageUrl, filename) => {
        try {
            // Fetch image as blob
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            const defaultFilename = filename || `tryon-result-${Date.now()}.jpg`;

            if ('showSaveFilePicker' in window) {
                try {
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: defaultFilename,
                        types: [
                            {
                                description: 'Images',
                                accept: {
                                    'image/jpeg': ['.jpg', '.jpeg'],
                                    'image/png': ['.png']
                                }
                            }
                        ]
                    });

                    const writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();

                    toast.success('Đã lưu ảnh thành công!');
                    return;
                } catch (saveError) {
                    if (saveError.name === 'AbortError') {
                        console.log('User cancelled download');
                        return;
                    }
                    console.error('Save picker error:', saveError);
                }
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = defaultFilename;

            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Đã tải xuống ảnh thành công!');

        } catch (error) {
            console.error('Error downloading image:', error);
            toast.error('Lỗi khi tải xuống ảnh');
        }
    };

    useEffect(() => {
        const token = getToken();
        if (!token) {
            navigate('/login');
            return;
        }
        fetchTryOnHistory();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải lịch sử thử đồ...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="border-t pt-16">
            <div className="text-2xl mb-8">
                <Title text1={'LỊCH SỬ'} text2={'THỬ ĐỒ AI'} />
            </div>

            {tryOnResults.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-6xl mb-4">🤖</div>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">Chưa có lịch sử thử đồ</h3>
                    <p className="text-gray-500 mb-6">Hãy thử tính năng thử đồ AI trên các sản phẩm!</p>
                    <button
                        onClick={() => navigate('/collection')}
                        className="bg-black text-white px-8 py-3 text-sm active:bg-gray-700"
                    >
                        XEM SẢN PHẨM
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {tryOnResults.map((result) => (
                        <div key={result._id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                            {/* Ảnh kết quả */}
                            <div className="relative group">
                                <img
                                    src={result.resultImageUrl}
                                    alt="Try-on result"
                                    className="w-full h-100 object-cover"
                                />

                                {/* Overlay với các nút action */}
                                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => downloadImage(result.resultImageUrl, `${result.productName}.jpg`)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors"
                                            title="Tải xuống"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </button>

                                        <button
                                            onClick={() => confirmDelete(result._id)}
                                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                                            title="Xóa"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin */}
                            <div className="p-4">
                                {/* Tên sản phẩm */}
                                {result.productName && (
                                    <div className="mb-2">
                                        <h4 className="font-medium text-gray-800 text-sm truncate">
                                            {result.productName}
                                        </h4>
                                        {result.productPrice && (
                                            <p className="text-sm text-blue-600 font-semibold">
                                                {result.productPrice.toLocaleString('vi-VN')}₫
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <span>
                                        {new Date(result.createdAt).toLocaleDateString('vi-VN', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs ${result.status === 'completed'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {result.status === 'completed' ? 'Hoàn thành' : 'Thất bại'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Refresh button */}
            <div className="text-center mt-8">
                <button
                    onClick={fetchTryOnHistory}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-colors"
                >
                    🔄 Làm mới
                </button>
            </div>
        </div>
    );
};

export default TryOnHistory;