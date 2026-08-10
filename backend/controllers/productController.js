import productModel from "../models/productModel.js";
import { v2 as cloudinary } from "cloudinary";

// Add Product
const addProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock, unit, status, packSizes } = req.body;
        const imageFile = req.file;

        let parsedPackSizes = [];
        if (packSizes) {
            try {
                parsedPackSizes = JSON.parse(packSizes);
            } catch (error) {
                console.log("Error parsing packSizes", error);
            }
        }

        if (!name || !description || !category || !imageFile) {
            return res.json({ success: false, message: "Missing details" });
        }

        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
        const imageUrl = imageUpload.secure_url;

        parsedPackSizes = parsedPackSizes.map(p => ({
            size: p.size,
            price: Number(p.price) || 0,
            stock: Number(p.stock) || 0
        }));

        let finalPrice = Number(price) || 0;
        let finalUnit = unit || 'kg';
        let calculatedStock = Number(stock) || 0;

        if (parsedPackSizes.length > 0) {
            finalPrice = parsedPackSizes[0].price;
            finalUnit = parsedPackSizes[0].size;
            calculatedStock = parsedPackSizes.reduce((sum, p) => sum + (p.stock || 0), 0);
        } else if (!finalPrice) {
            return res.json({ success: false, message: "Missing price details" });
        }

        const productData = {
            name,
            description,
            price: finalPrice,
            category,
            stock: calculatedStock,
            unit: finalUnit,
            packSizes: parsedPackSizes,
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
        const { id, name, description, price, category, stock, unit, status, packSizes } = req.body;
        const imageFile = req.file;

        let parsedPackSizes = [];
        if (packSizes) {
            try {
                parsedPackSizes = JSON.parse(packSizes);
            } catch (error) {
                console.log("Error parsing packSizes", error);
            }
        }

        parsedPackSizes = parsedPackSizes.map(p => ({
            size: p.size,
            price: Number(p.price) || 0,
            stock: Number(p.stock) || 0
        }));

        let finalPrice = Number(price) || 0;
        let finalUnit = unit || 'kg';
        let calculatedStock = Number(stock) || 0;

        if (parsedPackSizes.length > 0) {
            finalPrice = parsedPackSizes[0].price;
            finalUnit = parsedPackSizes[0].size;
            calculatedStock = parsedPackSizes.reduce((sum, p) => sum + (p.stock || 0), 0);
        }

        const updateData = { 
            name, 
            description, 
            price: finalPrice, 
            category, 
            stock: calculatedStock, 
            unit: finalUnit, 
            status,
            packSizes: parsedPackSizes
        };

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
