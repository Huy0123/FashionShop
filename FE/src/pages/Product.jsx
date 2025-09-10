import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets'
import RelatedProducts from '../components/RelatedProducts'
import { toast } from 'react-toastify'


const Product = () => {

  const sizeGuideImages = {
    'T-shirt': assets.tshirt,
    'RelaxedFit': assets.tshirt,
    'Ringer': assets.ringer,
    'Hoodie': assets.hoodie,
    'Sweater': assets.sweeter,
    'Jogger': assets.pant,

  };
  const [tab, setTab] = useState('size');

  const toggleTab = (key) => {
    setTab(tab === key ? '' : key);
  };
  const { productId } = useParams();
  const { products, formatCurrency, AddToCart } = useContext(ShopContext);
  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState('')
  const [size, setSize] = useState('')

  // Try-on states
  const [showTryOnModal, setShowTryOnModal] = useState(false)
  const [userImage, setUserImage] = useState(null)
  const [userImagePreview, setUserImagePreview] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [tryOnResult, setTryOnResult] = useState(null)


  const fetchProductData = async () => {


    products.map((item) => {
      if (item._id === productId) {

        setProductData(item)
        setImage(item.image[0])
        return null;
      }
    })
  }
  useEffect(() => {
    fetchProductData();
  }, [productId, products])


  // Handle user image selection
  const handleUserImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước file quá lớn. Tối đa 10MB');
      return;
    }

    setUserImage(file);
    const previewUrl = URL.createObjectURL(file);
    setUserImagePreview(previewUrl);
  };

  // Handle try-on process
  const handleTryOn = async () => {
    if (!userImage) {
      toast.error('Vui lòng chọn ảnh của bạn');
      return;
    }

    if (!productData || !productData.image || productData.image.length === 0) {
      toast.error('Sản phẩm không có ảnh để thử đồ');
      return;
    }

    setIsLoading(true);

    try {
      const toastId = toast.info('Đang xử lý thử đồ, vui lòng đợi...', {
        autoClose: false,
        hideProgressBar: false
      });


      // Tải ảnh sản phẩm từ URL và chuyển thành Blob
      const productImageResponse = await fetch(productData.image[0]);
      const productImageBlob = await productImageResponse.blob();

      const formData = new FormData();
      formData.append('people', userImage, 'user-image.jpg');
      formData.append('clothes', productImageBlob, 'product-image.jpg');

      // Call try-on API
      const response = await fetch(`http://localhost:4000/api/product/tryOnClothes`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      toast.dismiss(toastId);

      console.log('Try-on result:', result);

      if (result.success) {
        setTryOnResult(result.imageUrl);
        toast.success(result.message || 'Try-on thành công!');
      } else {
        toast.error(result.message || 'Không thể thực hiện try-on');
      }

    } catch (error) {
      console.error('Error in try-on:', error);
      toast.error('Có lỗi xảy ra khi thử đồ: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Close modal and reset states
  const closeTryOnModal = () => {
    setShowTryOnModal(false);
    setUserImage(null);
    setUserImagePreview('');
    setTryOnResult(null);
    setIsLoading(false);
  };

  return productData ? (
    <div className='border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100'>
      {/*dữ liệu sản phẫm */}
      <div className='flex gap-12 sm:gap-12 flex-col sm:flex-row'>
        {/*dữ liệu hình ảnh */}
        <div className='flex-1 flex flex-col-reverse gap-3 sm:flex-row'>
          <div className='flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full'>
            {
              productData.image.map((item, index) => (
                <img onClick={() => setImage(item)} src={item} key={index} className='w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer' alt="" />
              ))
            }
          </div>
          <div className='w-full sm:w-[80%]'>
            <img className='w-full h-aut0' src={image} alt="" />
          </div>
        </div>
        {/*thông tin sản phẫm */}
        <div className='flex-1'>
          <h1 className='font-medium text-2xl my-2'>{productData.name}</h1>
          <div className='flex items-center gap-1 mt-2'>
            <img src={assets.star_icon} alt="" className="w-3 5" />
            <img src={assets.star_icon} alt="" className="w-3 5" />
            <img src={assets.star_icon} alt="" className="w-3 5" />
            <img src={assets.star_icon} alt="" className="w-3 5" />
            <img src={assets.star_dull_icon} alt="" className="w-3 5" />
            <p className='pl-2'>(245)</p>
          </div>
          <p className='mt-5 text-3xl font-medium'>{formatCurrency(productData.price)}</p>
          <p className='mt-5 text-gray-500 md:w-4/5'>{productData.description}</p>
          <div className='flex flex-col gap-4 my-8'>
            <p>Kích cỡ</p>
            <div className='flex gap-2'>
              {productData.sizes.map((item, index) => (
                <button onClick={() => setSize(item)} className={`border py-2 px-4 bg-gray-100 ${item == size ? 'border-black' : ''}`} key={index}>{item}</button>
              ))}
            </div>
          </div>
          <div className='flex flex-wrap gap-3 mt-2'>
            <button onClick={() => AddToCart(productData._id, size)} className='bg-black text-white px-8 py-3 text-sm active:bg-gray-700 rounded-full'>
              THÊM VÀO GIỎ
            </button>
            <button
              onClick={() => setShowTryOnModal(true)}
              className=' text-white px-8 py-3 text-sm bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-full'>
              THỬ NGAY VỚI AI
            </button>
          </div>
          <hr className='mt-8 sm:w-4/5' />
          <div className='text-sm text-gray-500 mt-5 flex flex-col gap-1'>
            <p>- Vui lòng kiểm tra size cẩn thận trước khi đặt hàng.</p>
            <p>- Vui lòng quay video khi mở gói hàng.</p>
            <p>- Cửa hàng chỉ chấp nhận đổi hoặc trả lại áo nếu khách hàng có video.</p>

          </div>
          {/*các hướng dẫn */}
          <div className='mt-20 '>
            <div className='flex flex-col gap-2 w-full mx-auto'>
              {/* HƯỚNG DẪN ĐẶT SIZE */}
              <button
                className={`flex items-center justify-between border px-5 py-3 text-sm w-full font-bold ${tab === 'size' ? ' border-black' : 'bg-white'}`}
                onClick={() => toggleTab('size')}
              >
                <span>HƯỚNG DẪN CHỌN KÍCH CỠ</span>
                <span>{tab === 'size' ? '▲' : '▼'}</span>
              </button>
              {tab === 'size' && (
                <div className='flex flex-col gap-2 border-l border-r border-b px-6 py-4 text-sm text-gray-700 items-center w-full '>
                  {sizeGuideImages[productData.productType] && (
                    <img src={sizeGuideImages[productData.productType]} alt={`Bảng size ${productData.productType}`} className='max-w-md w-full mb-4' />
                  )}
                  <p>Nếu bạn không chắc, hãy liên hệ shop để được tư vấn nhé</p>
                </div>
              )}
              {/* BẢO QUẢN */}
              <button
                className={`flex items-center justify-between border px-5 py-3 text-sm w-full font-bold ${tab === 'care' ? 'border-black' : 'bg-white'}`}
                onClick={() => toggleTab('care')}
              >
                <span>BẢO QUẢN</span>
                <span>{tab === 'care' ? '▲' : '▼'}</span>
              </button>
              {tab === 'care' && (
                <div className='flex flex-col gap-2 border-l border-r border-b px-6 py-4 text-sm text-gray-700 w-full '>
                  <p>Để bảo quản sản phẩm đúng cách, luôn mới và bền đẹp thì bạn nên giặt ở nhiệt độ thấp, sử dụng các chế độ vắt nhẹ nhàng sẽ có lợi hơn cho sản phẩm, giúp duy trì màu sắc, hình dạng và cấu trúc của vải.</p>
                  <p>+ Không sử dụng nước tẩy / thuốc tẩy</p>
                  <p>+ Phơi sản phẩm ở nơi thoáng mát, tránh ánh nắng trực tiếp</p>
                  <p>+ Ủi ở nhiệt độ thấp, không ủi trực tiếp lên họa tiết</p>
                  <p>+ Lộn trái sản phẩm khi giặt và phơi</p>
                </div>
              )}
              {/* CHÍNH SÁCH ĐỔI TRẢ */}
              <button
                className={`flex items-center justify-between border px-5 py-3 text-sm w-full font-bold ${tab === 'policy' ? 'border-black' : 'bg-white'}`}
                onClick={() => toggleTab('policy')}
              >
                <span>CHÍNH SÁCH ĐỔI TRẢ</span>
                <span>{tab === 'policy' ? '▲' : '▼'}</span>
              </button>
              {tab === 'policy' && (
                <div className='flex flex-col gap-2 border-l border-r border-b px-6 py-4 text-sm text-gray-700 w-full '>
                  <p>+ Vui lòng quay video khi mở gói hàng</p>
                  <p>+ Cửa hàng chỉ chấp nhận đổi hoặc trả lại áo nếu khách hàng có video</p>
                  <p>+ Giao hàng toàn quốc, hỗ trợ đổi trả trong 3 ngày</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Try-On Modal */}
      {showTryOnModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-6'>
              {/* Modal Header */}
              <div className='flex justify-between items-center mb-6'>
                <h2 className='text-2xl font-bold'>Thử đồ AI</h2>
                <button
                  onClick={closeTryOnModal}
                  className='text-gray-500 hover:text-gray-700 text-2xl'
                >
                  ×
                </button>
              </div>

              {/* Content */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Left side - Upload user image */}
                <div>
                  <h3 className='text-lg font-semibold mb-4'>1. Chọn ảnh của bạn</h3>
                  <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative'>
                    {userImagePreview ? (
                      <div className='w-full h-64 flex items-center justify-center bg-gray-50 rounded overflow-hidden'>
                        <img
                          src={userImagePreview}
                          alt="User preview"
                          className='max-w-full max-h-full object-contain'
                        />
                        <button
                          onClick={() => {
                            setUserImage(null);
                            setUserImagePreview('');
                          }}
                          className='absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600'
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className='text-gray-500 mb-4'>
                          <svg className='mx-auto h-12 w-12' stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <label className='cursor-pointer'>
                          <span className='bg-black text-white px-4 py-2 rounded hover:bg-blue-700'>
                            Chọn ảnh
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUserImageChange}
                            className='hidden'
                          />
                        </label>
                        <p className='text-gray-500 text-sm mt-2'>
                          Định dạng: JPG, PNG (tối đa 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side - Product info and try-on result */}
                <div>
                  <h3 className='text-lg font-semibold mb-4'>2. Sản phẩm sẽ thử</h3>
                  <div className='border rounded-lg p-4 mb-4'>
                    <div className='w-full h-48 flex items-center justify-center bg-gray-50 rounded mb-2 overflow-hidden'>
                      <img
                        src={productData.image[0]}
                        alt={productData.name}
                        className='max-w-full max-h-full object-contain'
                      />
                    </div>
                    <p className='font-medium'>{productData.name}</p>
                    <p className='text-gray-600'>{formatCurrency(productData.price)}</p>
                  </div>

                  {/* Try-on result */}
                  {tryOnResult && (
                    <div>
                      <h3 className='text-lg font-semibold mb-4'>3. Kết quả thử đồ</h3>
                      <div className='border rounded-lg p-4 '>
                        <div className='w-full h-64 flex items-center justify-center bg-gray-50 rounded overflow-hidden'>
                          <img
                            src={tryOnResult}
                            alt="Try-on result"
                            className='max-w-full max-h-full object-contain '
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Try-on button */}
              <div className='mt-6 flex justify-center'>
                <button
                  onClick={handleTryOn}
                  disabled={!userImage || isLoading}
                  className={`px-8 py-3 rounded text-white font-medium ${!userImage || isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-black hover:bg-gray-700'
                    }`}
                >
                  {isLoading ? 'Đang xử lý...' : 'Thử đồ'}
                </button>
              </div>

              {/* Instructions */}
              <div className='mt-6 text-sm text-gray-600'>
                <h4 className='font-bold mb-2'>Lưu ý:</h4>
                <ul className='list-disc list-inside space-y-1'>
                  <li>Ảnh của bạn nên rõ nét, không bị mờ</li>
                  <li>Nên chụp toàn thân để có kết quả tốt nhất</li>
                  <li>Quá trình xử lý có thể mất 30-60 giây</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*sản phẫm liên quan*/}
      <RelatedProducts category={productData.category} subCategory={productData.subCategory} />
    </div>
  ) : <div className='opacity-0'></div>
}

export default Product