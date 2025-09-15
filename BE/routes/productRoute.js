import express from 'express';
import { addProduct, listProducts, removeProduct, singleProduct, tryOnClothes, updateProduct } from '../controllers/productController.js';
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';


const productRouter = express.Router();

productRouter.post('/add', adminAuth, upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 }
]), addProduct);
productRouter.get('/list', listProducts);
productRouter.post('/remove', adminAuth, removeProduct);
productRouter.post('/single', singleProduct)

productRouter.post('/tryOnClothes', upload.fields([
    { name: 'people', maxCount: 1 },
    { name: 'clothes', maxCount: 1 }
]), tryOnClothes)

productRouter.post('/update', adminAuth, upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 }
]), updateProduct);

export default productRouter