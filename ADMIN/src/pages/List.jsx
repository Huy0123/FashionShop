import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { backend_Url, formatCurrency } from '../App';
import { toast } from 'react-toastify';

const List = ({ token }) => {

  const [list, setList] = useState([])

  const fetchList = async () => {
    try {
      const response = await axios.get(backend_Url + '/api/product/list')
      if (response.data.success) {
        setList(response.data.products)
      } else {
        toast.error(response.data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const removeProduct = async (id) => {
    try {
      const response = await axios.post(backend_Url + '/api/product/remove', { id }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        await fetchList();
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  const navigate = useNavigate();
  const handleEdit = (item) => {
    navigate('/add', { state: { editProduct: item } });
  }
  return (
    <>
      <p className='mb-2 font-bold'> DANH SÁCH SẢN PHẨM</p>
      <div className='flex flex-col gap-2'>
        {/*tiêu đề */}
        <div className='hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-300 text-sm'>
          <b>Hình ảnh</b>
          <b>Tên</b>
          <b>Loại</b>
          <b>Giá</b>
          <b className='text-center'>Hành động</b>
        </div>
        {/*hiện danh sách sp */}
        {
          list.map((item, index) => (
            <div className='grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center gap-2 py-1 px-2 border text-sm ' key={index}>
              <img className='w-12' src={item.image[0]} />
              <p>{item.name}</p>
              <p>{item.productType}</p>
              <p>{formatCurrency(item.price)}</p>
              <div className='flex items-center justify-center gap-2'>
                <button className='text-black px-2' onClick={() => handleEdit(item)}>Sửa</button>
                <span className='mx-1'>/</span>
                <p onClick={() => removeProduct(item._id)} className='cursor-pointer text-lg text-black'>X</p>
              </div>
            </div>
          ))
        }
      </div>

    </>
  )
}
export default List