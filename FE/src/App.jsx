import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Collection from './pages/Collection'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Order from './pages/Order'
import PlaceOrder from './pages/PlaceOrder'
import VerifyPayment from './pages/VerifyPayment'
import Footer from './components/Footer'
import SearchBar from './components/SearchBar'
import ChatWidget from './components/ChatWidget'
import { ToastContainer, toast } from 'react-toastify';
import ProfilePage from './pages/Profile'
import TryOnHistory from './pages/TryOnHistory'

const App = () => {
  return (
    <div className='px-4 sm:px-[5vw] md:px-[7vw] lg:px[9vw]'>
      <ToastContainer />
      <Navbar />
      <SearchBar />
      <Routes>
        <Route path='/profile' element={<ProfilePage />} />
        <Route path='/tryon-history' element={<TryOnHistory />} />
        <Route path='/' element={<Home />} />
        <Route path='/collection' element={<Collection />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/product/:productId' element={<Product />} />
        <Route path='/cart' element={<Cart />} />
        <Route path='/login' element={<Login />} />
        <Route path='/place-order' element={<PlaceOrder />} />
        <Route path='/order' element={<Order />} />
        <Route path='/verify-payment' element={<VerifyPayment />} />

      </Routes>
      <Footer />
      <ChatWidget />
    </div>
  )
}
export default App