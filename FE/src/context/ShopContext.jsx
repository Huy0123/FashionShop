import { createContext, useEffect, useState } from "react";
/*import { products } from "../assets/assets";*/
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';
import axios from 'axios'


export const ShopContext = createContext();
const ShopContextProvider = (props) => {

    const currency = 'VND';
    const delivery_fee = 50000;
    const free_shipping_threshold = 2000000;
    const backendUrl = import.meta.env.VITE_BE_URL
    const [Search, setSearch] = useState('');
    const [ShowSearch, setShowSearch] = useState(false)
    const [Cart, setCart] = useState({});
    const [products, setProducts] = useState([]);
    const [token, setToken] = useState('')
    const [userData, setUserData] = useState(null)
    const navigate = useNavigate();


    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    const AddToCart = async (itemId, size) => {

        if (!size) {
            toast.error('Hãy chọn Size!!');
            return;
        }

        let cartData = structuredClone(Cart);
        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += 1;
            } else {
                cartData[itemId][size] = 1;
            }
        } else {
            cartData[itemId] = {};
            cartData[itemId][size] = 1;
        }
        setCart(cartData);

        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/add', { itemId, size }, { headers: { token } })
            } catch (error) {
                console.log(error)
                toast.error(error.message)
            }
        }

    }
    const getCartCount = () => {
        let count = 0;
        for (const items in Cart) {
            for (const item in Cart[items]) {
                try {
                    if (Cart[items][item] > 0) {
                        count += Cart[items][item];
                    }
                } catch (error) {

                }
            }
        }
        return count;
    }


    const upQuantity = async (itemId, size, quantity) => {
        let cartData = structuredClone(Cart);
        cartData[itemId][size] = quantity;
        setCart(cartData);

        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/update', { itemId, size, quantity }, { headers: { token } })
            } catch (error) {
                console.log(error)
                toast.error(error.message)
            }
        }
    }

    const CartAmount = () => {
        let TotalAmount = 0;
        for (const items in Cart) {
            let itemInfor = products.find((products) => products._id === items);
            for (const item in Cart[items]) {
                try {
                    if (Cart[items][item] > 0) {
                        TotalAmount += itemInfor.price * Cart[items][item]
                    }
                } catch (error) {

                }
            }
        }
        return TotalAmount;
    }

    const getProductsData = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/product/list')
            if (response.data) {
                setProducts(response.data.products)
            } else {
                toast.error(response.data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const getUserCart = async (token) => {
        try {
            const response = await axios.post(backendUrl + '/api/cart/get', {}, { headers: { token } })
            if (response.data.success) {
                setCart(response.data.cartData)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const getUserData = async (token) => {
        try {
            const response = await axios.get(backendUrl + '/api/user/profile', { headers: { token } })
            if (response.data.success) {
                setUserData(response.data.user)
            }
        } catch (error) {
            console.log(error)
        }
    }

    // Tính phí vận chuyển dựa trên tổng trước giảm giá
    const getDeliveryFee = (subtotal) => {
        if (!subtotal || subtotal === 0) return 0;
        return subtotal >= free_shipping_threshold ? 0 : delivery_fee;
    }

    useEffect(() => {
        getProductsData();
    }, [])

    useEffect(() => {
        if (!token && localStorage.getItem('token')) {
            setToken(localStorage.getItem('token'))
            getUserCart(localStorage.getItem('token'))
            getUserData(localStorage.getItem('token'))
        } else if (token) {
            getUserData(token)
        }
    }, [token])

    const value = {
        products, currency, delivery_fee, free_shipping_threshold, getDeliveryFee,
        Search, setSearch, ShowSearch, setShowSearch,
        Cart, AddToCart, setCart,
        getCartCount, upQuantity,
        CartAmount, navigate, backendUrl,
        token, setToken, formatCurrency, userData, setUserData
    }
    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    )
}
export default ShopContextProvider;