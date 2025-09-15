import React, { useEffect, useState } from 'react';
import NavBar from './components/NavBar'
import Sidebar from './components/Sidebar';
import { Routes, Route } from 'react-router-dom';
import Add from './pages/Add'
import List from './pages/List'
import Orders from './pages/Orders'
import Chat from './pages/Chat'
import Dashboard from './pages/Dashboard'
import Login from './components/Login';
import { ToastContainer } from 'react-toastify';

export const backend_Url = import.meta.env.VITE_BE_URL
export const currency = "VND"
export const url = import.meta.env.VITE_BE_URL

// Hàm định dạng tiền tệ Việt Nam cho ADMIN
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}


const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : '');

  useEffect(() => {
    localStorage.setItem('token', token)
  }, [token])

  return (
    <div className='bg-gray-50 min-h-screen'>
      <ToastContainer />
      {token === ""
        ? <Login setToken={setToken} />
        : <>
          <NavBar setToken={setToken} />
          <hr />
          <div className='flex w-full'>
            <Sidebar />
            <div className='w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base'>
              <Routes>
                <Route path="/" element={<Dashboard token={token} />} />
                <Route path="/add" element={<Add token={token} />} />
                <Route path="/list" element={<List token={token} />} />
                <Route path="/orders" element={<Orders token={token} />} />
                <Route path="/chat" element={<Chat token={token} />} />
              </Routes>
            </div>
          </div>
        </>
      }

    </div>
  )
}
export default App