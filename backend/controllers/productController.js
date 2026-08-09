import productModel from "../models/productModel.js";
import { v2 as cloudinary } from "cloudinary";

// Add Product
const addProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock, unit, status } = req.body;
        const imageFile = req.file;

        if (!name || !description || !price || !category || !imageFile) {
            return res.json({ success: false, message: "Missing details" });
        }

        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
        const imageUrl = imageUpload.secure_url;

        const productData = {
            name,
            description,
            price: Number(price),
            category,
            stock: Number(stock) || 0,
            unit: unit || 'kg',
            image: imageUrl,
            status: status || 'active'
        };

        const product = new productModel(productData);
        await product.save();

        res.json({ success: true, message: "Product added successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// List Products
const listProducts = async (req, res) => {
    try {
        const products = await productModel.find({});
        res.json({ success: true, products });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Remove Product
const removeProduct = async (req, res) => {
    try {
        await productModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Product removed" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Single Product Info
const singleProduct = async (req, res) => {
    try {
        const id = req.body.id || req.query.id || req.body.productId;
        const product = await productModel.findById(id);
        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }
        res.json({ success: true, product, data: product });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update Product
const updateProduct = async (req, res) => {
    try {
        const { id, name, description, price, category, stock, unit, status } = req.body;
        const imageFile = req.file;

        const updateData = { name, description, price: Number(price), category, stock: Number(stock), unit, status };

        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            updateData.image = imageUpload.secure_url;
        }

        await productModel.findByIdAndUpdate(id, updateData);
        res.json({ success: true, message: "Product updated successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { addProduct, listProducts, removeProduct, singleProduct, updateProduct };
