import express from 'express';
import { addProduct, listProducts, removeProduct, singleProduct, updateProduct } from '../controllers/productController.js';
import upload from '../middlewares/multer.js';
import authAdmin from '../middlewares/authAdmin.js';

const productRouter = express.Router();

productRouter.post('/add', authAdmin, upload.single('image'), addProduct);
productRouter.get('/list', listProducts);
productRouter.post('/remove', authAdmin, removeProduct);
productRouter.post('/single', singleProduct);
productRouter.get('/single', singleProduct);
productRouter.post('/update', authAdmin, upload.single('image'), updateProduct);

export default productRouter;
