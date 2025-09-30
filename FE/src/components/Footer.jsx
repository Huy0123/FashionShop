import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <div>
        <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'> 
            <div>
                <img src={assets.logo} className='mb-5 w-32' alt="" />
                <p className='w-full md:w-2/3 text-gray-600'>
                Nâng tầm phong cách của bạn với những thiết kế tinh tế và chất liệu cao cấp.
                </p>
                <p className='w-full md:w-2/3 text-gray-600'>
                Hơn cả một bộ trang phục, đó là tuyên ngôn về cá tính của bạn.
                </p>
                <p className='w-full md:w-2/3 text-gray-600'>
                Định nghĩa thời trang: Hiện đại, thanh lịch và luôn đi trước xu hướng.
                </p>
                <p className='w-full md:w-2/3 text-gray-600'>
                Biến mọi bộ trang phục thành một tuyên ngôn táo bạo về cá tính của bạn.
                </p>

            </div>
            <div>
                <p className='text-xl font-medium mb-5'>THÔNG TIN</p>
                <ul className='flex flex-col gap-1 text-gray-600'>
                    <li>Trang chủ</li>
                    <li>Giới thiệu</li>
                    <li>Giao hàng</li>
                    <li>Chính sách bảo mật</li>
                </ul>
            </div>
            <div>
                <p className='text-xl font-medium mb-5'>DỊCH VỤ</p>
                <ul className='flex flex-col gap-1 text-gray-600'>
                    <li>+89 01 363 148</li>
                    <li>@Chevai.com</li>
                </ul>
            </div>
        </div>
            <div>
                <hr />
                <p className='py-5 text-sm text-center'>Copyright 2025@Chevai.com </p>
            </div>
    </div>
  )
}
export default Footer
