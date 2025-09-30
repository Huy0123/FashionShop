import React, { useContext, useState } from 'react'
import Title from '../components/Title'
import TotalCart from '../components/TotalCart'
import { assets } from '../assets/assets'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const PlaceOrder = () => {

  const [method, setMethod] = useState('cod');
  const { navigate, backendUrl, token, Cart, setCart, CartAmount, getDeliveryFee, products } = useContext(ShopContext);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    homeNumber: '',
    stress: '',
    ward: '',
    district: '',
    city: ''
  })
  const onChangeHandler = (event) => {
    const name = event.target.name
    const value = event.target.value
    setFormData(data => ({ ...data, [name]: value }))
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    try {
      let orderItems = []

      for (const items in Cart) {
        for (const item in Cart[items]) {
          if (Cart[items][item] > 0) {
            const itemInfo = structuredClone(products.find(product => product._id === items))
            if (itemInfo) {
              itemInfo.size = item
              itemInfo.quantity = Cart[items][item]
              orderItems.push(itemInfo)
            }
          }
        }
      }
      
      const totalProductPrice = CartAmount();
      const discount = totalProductPrice >= 10000000 ? parseFloat((totalProductPrice * 0.2).toFixed(2)) : 0;
      const finalProductPrice = totalProductPrice - discount;
      const finalDeliveryFee = getDeliveryFee(totalProductPrice);
      const totalAmount = finalProductPrice + finalDeliveryFee;
      
      let orderData = {
        address: formData,
        items: orderItems,
        amount: totalAmount,
        paymentMethod: method,
      }

      switch (method) {
        //api cho cod
        case 'cod':
          const response = await axios.post(backendUrl + '/api/order/place', orderData, { headers: { token } })
          if (response.data.success) {
            setCart({})
            navigate('/order')
          } else {
            toast.error(response.data.message)
          }
          break;
        
        //api cho vnpay
        case 'vnpay':
          const vnpayResponse = await axios.post(backendUrl + '/api/order/vnpay', orderData, { headers: { token } })
          if (vnpayResponse.data.success) {
            // Chuyển hướng đến trang thanh toán VNPay
            window.location.href = vnpayResponse.data.paymentUrl;
          } else {
            toast.error(vnpayResponse.data.message)
          }
          break;
                   
        default:
          break;
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t'>
      {/* slide bên trái*/}
      <div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>
        <div className='text-xl sm:text-2xl my-3'>
          <Title  text2={'THÔNG TIN VẬN CHUYỂN'} />
        </div>
        <div className='flex gap-3'>
          <input required onChange={onChangeHandler} name='firstName' value={formData.firstName} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Họ' />
          <input required onChange={onChangeHandler} name='lastName' value={formData.lastName} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Tên' />
        </div>
        <input required onChange={onChangeHandler} name='email' value={formData.email} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="email" placeholder='Email' />
        <input required onChange={onChangeHandler} name='phoneNumber' value={formData.phoneNumber} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="number" placeholder='Số Điện Thoại' />
        <input required onChange={onChangeHandler} name='homeNumber' value={formData.homeNumber} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Số Nhà' />
        <div className='flex gap-3'>
          <input required onChange={onChangeHandler} name='stress' value={formData.stress} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Đường' />
          <input required onChange={onChangeHandler} name='ward' value={formData.ward} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Phường' />
        </div>
        <div className='flex gap-3'>
          <input required onChange={onChangeHandler} name='district' value={formData.district} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Quận' />
          <input required onChange={onChangeHandler} name='city' value={formData.city} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Thành Phố' />
        </div>
      </div>
      {/*slide bên phải */}
      <div className='mt-8'>
        <div className='mt-8 min-w-80'>
          <TotalCart />
        </div>
        {/*phương thức thanh toán */}
        <div className='mt-10'>
          <Title text2={'PHƯƠNG THỨC THANH TOÁN'} />
          <div className='flex gap-3 flex-col lg:flex-row'>
            {/* <div onClick={() => setMethod('momo')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'momo' ? 'bg-gray-400' : ''}`}></p>
              <img className='max-w-[70px] max-h-[100px] mx-4' src={assets.momo_logo} alt="" />
            </div> */}
            <div onClick={() => setMethod('vnpay')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'vnpay' ? 'bg-gray-400' : ''}`}></p>
              <img className='max-w-[70px] max-h-[100px] mx-4' src={assets.vnpay_logo} alt="" />
            </div>
            <div onClick={() => setMethod('cod')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'cod' ? 'bg-gray-400' : ''}`}></p>
              <p className='text-gray-500 text-sm font-medium mx-4'>THANH TOÁN KHI NHẬN HÀNG</p>
            </div>
          </div>
          <div className='w-full text-xl mt-8'>
            <button type='submit' className='bg-black text-white px-16 py-3 text-sm'>ĐẶT HÀNG</button>
          </div>
        </div>
      </div>
    </form>
  )
}
export default PlaceOrder