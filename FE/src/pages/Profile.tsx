import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { toast } from 'react-toastify';

const ProfilePage = () => {
    const apiBaseUrl = "http://localhost:4000";

    const [formData, setFormData] = useState({
        name: '',
        email: '',
    });
    const [loading, setLoading] = useState(false);

    // Lấy thông tin user khi component mount
    useEffect(() => {
        fetchUserProfile();
    }, []);

    // Fetch thông tin profile user
    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Vui lòng đăng nhập');
                return;
            }

            const response = await fetch(`${apiBaseUrl}/api/user/profile`, {
                method: 'GET',
                headers: { token }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setFormData({
                    name: data.user.name || '',
                    email: data.user.email || '',
                });
            } else {
                toast.error(data.message || 'Lỗi khi tải thông tin');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
            toast.error('Lỗi kết nối server: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Cập nhật thông tin profile
    const updateProfile = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Vui lòng đăng nhập');
                return;
            }
            const response = await fetch(`${apiBaseUrl}/api/user/profile/update`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    token
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Cập nhật thông tin thành công!');
            } else {
                toast.error(data.message || 'Lỗi khi cập nhật');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    // Handle input change
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <>
            <div className="w-full h-px bg-gray-300 shadow-sm"></div>
            <div className="flex items-center justify-center px-4" style={{ height: 'calc(100vh - 80px)' }}>
                <div className="w-full max-w-lg mx-auto">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <form onSubmit={updateProfile} className="p-8">
                            <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Thông tin cá nhân</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-800 mb-2" htmlFor="name">Name</label>
                                    <input
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange(e)}
                                        disabled={loading}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-800 mb-2" htmlFor="email">Email</label>
                                    <input
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange(e)}
                                        disabled={loading}
                                    />
                                </div>

                            </div>
                            <div className="mt-6 text-center">
                                <button
                                    className={`px-6 py-3 rounded-lg font-medium transition duration-300 ${loading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-500 hover:bg-blue-600'
                                        } text-white`}
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
export default ProfilePage;