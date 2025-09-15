import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import axios from 'axios'
import { backend_Url } from '../App';
import { toast } from 'react-toastify';

const Add = ({ token }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const editProduct = location.state?.editProduct;

  const [image1, setImage1] = useState(false)
  const [image2, setImage2] = useState(false)
  const [image3, setImage3] = useState(false)
  const [image4, setImage4] = useState(false)

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [productType, setProductType] = useState("T-shirt");
  const [sizes, setSizes] = useState([]);
  const [bestseller, setBestseller] = useState(false);

  useEffect(() => {
    if (editProduct) {
      setName(editProduct.name || "");
      setPrice(editProduct.price || "");
      setDescription(editProduct.description || "");
      setProductType(editProduct.productType || "T-shirt");
      setSizes(editProduct.sizes || []);
      setBestseller(editProduct.bestseller || false);
      if (editProduct.image && editProduct.image.length > 0) {
        setImage1(editProduct.image[0] || false);
        setImage2(editProduct.image[1] || false);
        setImage3(editProduct.image[2] || false);
        setImage4(editProduct.image[3] || false);
      }
    }
  }, [editProduct]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('price', price)
      formData.append('description', description)
      formData.append('productType', productType)
      formData.append('sizes', JSON.stringify(sizes))
      formData.append('bestseller', bestseller)
      image1 && formData.append('image1', image1)
      image2 && formData.append('image2', image2)
      image3 && formData.append('image3', image3)
      image4 && formData.append('image4', image4)

      let response;
      if (editProduct) {
        formData.append('id', editProduct._id);
        response = await axios.post(backend_Url + "/api/product/update", formData, { headers: { token } })
      } else {
        response = await axios.post(backend_Url + "/api/product/add", formData, { headers: { token } })
      }

      if (response.data.success) {
        toast.success(response.data.message)
        if (editProduct) {
          navigate('/list');
        } else {
          setName('')
          setDescription('')
          setImage1(false)
          setImage2(false)
          setImage3(false)
          setImage4(false)
          setPrice('')
        }
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }



  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-3'>
      <div>
        <p className='mb-2'>Hình ảnh</p>

        <div className='flex gap-2'>
          <label htmlFor="image1">
            <img className='w-20' src={!image1 ? assets.upload_area : (typeof image1 === 'string' ? image1 : URL.createObjectURL(image1))} alt="" />
            <input onChange={(e) => setImage1(e.target.files[0])} type="file" id='image1' hidden />
          </label>
          <label htmlFor="image2">
            <img className='w-20' src={!image2 ? assets.upload_area : (typeof image2 === 'string' ? image2 : URL.createObjectURL(image2))} alt="" />
            <input onChange={(e) => setImage2(e.target.files[0])} type="file" id='image2' hidden />
          </label>
          <label htmlFor="image3">
            <img className='w-20' src={!image3 ? assets.upload_area : (typeof image3 === 'string' ? image3 : URL.createObjectURL(image3))} alt="" />
            <input onChange={(e) => setImage3(e.target.files[0])} type="file" id='image3' hidden />
          </label>
          <label htmlFor="image4">
            <img className='w-20' src={!image4 ? assets.upload_area : (typeof image4 === 'string' ? image4 : URL.createObjectURL(image4))} alt="" />
            <input onChange={(e) => setImage4(e.target.files[0])} type="file" id='image4' hidden />
          </label>
        </div>
      </div>
      <div className='w-full'>
        <p className='mb-2'>Tên sản phẩm</p>
        <input onChange={(e) => setName(e.target.value)} value={name} className=' w-full max-w-[500px] px-3 py-2' type="text" placeholder='Tên..' required />
      </div>

      <div className='w-full'>
        <p className='mb-2'>Mô tả sản phẩm</p>
        <textarea onChange={(e) => setDescription(e.target.value)} value={description} className=' w-full max-w-[500px] px-3 py-2' type="text" placeholder='Nội dung...' required />
      </div>

      <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>
        <div>
          <p className='mb-2'>Loại sản phẩm</p>
          <select onChange={(e) => setProductType(e.target.value)} value={productType} className='w-full px-3 py-2'>
            <option value="T-shirt">T-shirt</option>
            <option value="RelaxedFit">Áo Thun Relaxed Fit</option>
            <option value="Ringer">Áo Thun Ringer</option>
            <option value="Hoodie">Áo Hoodie</option>
            <option value="Sweater">Áo Sweater</option>
            <option value="Jogger">Quần Jogger & Ống Suông</option>
           
          </select>
        </div>
        <div>
          <p className='mb-2'>Giá sản phẩm (VND)</p>
          <input onChange={(e) => setPrice(e.target.value)} value={price} className='w-full px-3 py-2 sm:w-[120px]' type="number" placeholder="" required />
        </div>
      </div>
      <div>
        <p className='mb-2'>Kích thước sản phẩm</p>
        <div className='flex gap-3'>
          <div onClick={() => setSizes(prev => prev.includes("S") ? prev.filter(item => item !== "S") : [...prev, "S"])}>
            <p className={`${sizes.includes("S") ? "bg-slate-300" : "bg-white"} border border-black px-3 py-1 cursor-pointer`}>S</p>
          </div>

          <div onClick={() => setSizes(prev => prev.includes("M") ? prev.filter(item => item !== "M") : [...prev, "M"])}>
            <p className={`${sizes.includes("M") ? "bg-slate-300" : "bg-white"} border border-black px-3 py-1 cursor-pointer`}>M</p>
          </div>

          <div onClick={() => setSizes(prev => prev.includes("L") ? prev.filter(item => item !== "L") : [...prev, "L"])}>
            <p className={`${sizes.includes("L") ? "bg-slate-300" : "bg-white"} border border-black px-3 py-1 cursor-pointer`}>L</p>
          </div>

          <div onClick={() => setSizes(prev => prev.includes("XL") ? prev.filter(item => item !== "XL") : [...prev, "XL"])}>
            <p className={`${sizes.includes("XL") ? "bg-slate-300" : "bg-white"} border border-black px-3 py-1 cursor-pointer`}>XL</p>
          </div>
        </div>
      </div>
      <div className='flex gap-2 mt-2'>
        <input onChange={() => setBestseller(prev => !prev)} checked={bestseller} type="checkbox" id='bestseller' />
        <label className='cursor-pointer' htmlFor="bestseller">Thêm Bestseller</label>
      </div>

  <button type='submit' className='w-28 py-3 mt-4 bg-black text-white'>{editProduct ? 'Cập nhật' : 'Thêm'}</button>
    </form>
  )
}
export default Add