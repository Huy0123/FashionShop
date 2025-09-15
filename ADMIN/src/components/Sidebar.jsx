import React from 'react';
import {NavLink} from 'react-router-dom'
import { assets } from '../assets/assets';
const Sidebar = () =>{
  return (
    <div className='w-[18%] min-h-screen border-r-2'>
        <div className='flex flex-col gap-4 pt-6 pl-[20%] text-[15px]'>
            <NavLink className='flex items-center gap-3 border border-gray-400 border-r-0 px-3 py-2 rounded-l' to="/">
                <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-9 13V9m0 11h6a2 2 0 002-2v-7m-8 9H7a2 2 0 01-2-2v-5" />
                </svg>
                <p className='hidden md:block'>DASHBOARD</p>
            </NavLink>
            <NavLink className='flex items-center gap-3 border border-gray-400 border-r-0 px-3 py-2 rounded-l' to="/add">
                <img className='w-5 h-5' src={assets.add_icon} alt="" />
                <p className='hidden md:block'>THÊM SẢN PHẨM</p>
            </NavLink>

            <NavLink className='flex items-center gap-3 border border-gray-400 border-r-0 px-3 py-2 rounded-l' to="/list">
                <img className='w-5 h-5' src={assets.list_icon} alt="" />
                <p className='hidden md:block'>DANH SÁCH</p>
            </NavLink>

            <NavLink className='flex items-center gap-3 border border-gray-400 border-r-0 px-3 py-2 rounded-l' to="/orders">
                <img className='w-5 h-5' src={assets.order_icon} alt="" />
                <p className='hidden md:block'>ĐƠN HÀNG</p>
            </NavLink>

            <NavLink className='flex items-center gap-3 border border-gray-400 border-r-0 px-3 py-2 rounded-l' to="/chat">
                <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className='hidden md:block'>HỖ TRỢ KHÁCH HÀNG</p>
            </NavLink>
        </div>

    </div>
  )
}
export default Sidebar