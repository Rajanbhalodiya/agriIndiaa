import validator from "validator"
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from "cloudinary"
import advisorModel from "../models/advisorModel.js"
import jwt from 'jsonwebtoken'
import orderModel from "../models/orderModel.js"
import userModel from "../models/userModel.js"
import productModel from "../models/productModel.js"
import { sendOrderCancellationEmail } from "../config/nodemailer.js"

// API for adding advisor variety
const addadvisor = async (req,res) => {

    try {

        const { name, category, grade, weight, about, price } = req.body
        const imageFile = req.file

        // checking for all data to add advisor
        if (!name || !category || !grade || !weight || !about || !price || !imageFile) {
            return res.json({success:false,message:"Missing Details"})
        }

        // Default values for fields no longer required in form
        const email = req.body.email || `advisor-${Date.now()}@rajanfarm.com`
        const password = req.body.password || "rajanfarm12345"
        const address = req.body.address || JSON.stringify({line1: "Talala Gir Foothills", line2: "Gujarat, India"})

        // hashing password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // upload image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type:"image"})
        const imageUrl = imageUpload.secure_url
        
        const advisorData = {
            name,
            email,
            image:imageUrl,
            password:hashedPassword,
            category,
            grade,
            weight,
            about,
            price: Number(price),
            address:JSON.parse(address),
            date:Date.now()
        }

        const newadvisor = new advisorModel(advisorData)
        await newadvisor.save()

        res.json({success:true,message:"advisor Product Added"})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

// API for admin Login
const loginAdmin = async (req,res) => {
    try {
        
        const {email,password} = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {

            const token = jwt.sign(email+password,process.env.JWT_SECRET)
            res.json({success:true,token})

        } else {
            res.json({success:false,message:"Invalid credentials"})
        }
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


// API to get all advisores list for admin panel
const alladvisores = async (req, res) => {
  try {
    const advisores = await advisorModel.find({}).select('-password')
    res.json({ success: true, advisores, doctors: advisores }) 
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}


// API to get all orders list for admin panel
const ordersAdmin = async (req,res) => {

    try {

        const orders = await orderModel.find({})
        res.json({success:true, orders, appointments: orders})
        
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message }) 
    }
}

// API for orders cancellation
const orderCancel = async (req,res) => {
    try {

        const { appointmentId } = req.body // appointmentId maps to order ID

        const orderData = await orderModel.findById(appointmentId)

        await orderModel.findByIdAndUpdate(appointmentId,{cancelled:true})

        // releasing delivery slot
        const {advisorId, slotDate, slotTime} = orderData

        const advisorData = await advisorModel.findById(advisorId)

        let slots_booked = advisorData.slots_booked

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await advisorModel.findByIdAndUpdate(advisorId,{slots_booked})

        // Send order cancellation email asynchronously
        const isOnlinePayment = orderData.payment === true || orderData.paymentMethod === 'Online';
        let refundDate = '';
        if (isOnlinePayment) {
            // Mentioning refund date 7 days from cancellation
            refundDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }

        sendOrderCancellationEmail(orderData.userData.email, {
            userName: orderData.userData.name,
            orderId: orderData._id,
            productName: orderData.advisorData.name,
            amount: orderData.amount,
            isRefundable: isOnlinePayment,
            refundDate: refundDate
        }).catch(err => console.log('Error sending cancellation email:', err.message));

        res.json({success:true,message:'Order Cancelled'})
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });   
    }
}

//API to get dashboard data for admin panel
const adminDashboard = async (req,res) => {
    try {
        const advisores = await advisorModel.find({})
        const users = await userModel.find({})
        const orders = await orderModel.find({})
        const productOrders = await productOrderModel.find({}).sort({ createdAt: -1 })
        const products = await productModel.find({})

        const totalOrdersCount = orders.length + productOrders.length;

        // Fetch latest product orders formatted for dashboard
        const recentProductOrders = await Promise.all(productOrders.slice(0, 5).map(async (order) => {
            const advisor = await advisorModel.findById(order.advisorId).select('name');
            const farmer = await userModel.findById(order.farmerId).select('firstName lastName');
            return {
                _id: order._id,
                userData: { name: farmer ? `${farmer.firstName} ${farmer.lastName || ''}`.trim() : 'Farmer' },
                slotDate: new Date(order.date).toLocaleDateString(),
                advisorData: { name: advisor ? advisor.name : 'Advisor' },
                amount: order.totalAmount,
                status: order.status,
                cancelled: order.status === 'Cancelled'
            };
        }));

        const dashData = {
            advisores: advisores.length,
            doctors: advisores.length, // legacy compat
            orders: totalOrdersCount,
            productOrdersCount: productOrders.length,
            appointments: totalOrdersCount, // legacy compat
            customers: users.length,
            patients: users.length, // legacy compat
            products: products.length,
            latestOrders: recentProductOrders.length > 0 ? recentProductOrders : orders.reverse().slice(0,5),
            latestAppointments: recentProductOrders.length > 0 ? recentProductOrders : orders.slice(0,5) // legacy compat
        }

        res.json({success:true,dashData})
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });      
    }
}

// API to get all farmers (users) for admin panel
const allFarmers = async (req, res) => {
    try {
        const farmers = await userModel.find({ role: 'farmer' }).select('-password').sort({ createdAt: -1 });

        const farmersWithAdvisor = await Promise.all(farmers.map(async (farmer) => {
            let advisorName = farmer.advisorName || 'Direct / Unassigned';
            if (advisorName === 'Direct / Unassigned' && farmer.assignedAdvisor) {
                const advisor = await advisorModel.findById(farmer.assignedAdvisor).select('name');
                if (advisor) {
                    advisorName = advisor.name;
                }
            }
            return {
                ...farmer.toObject(),
                advisorName
            };
        }));

        res.json({ success: true, farmers: farmersWithAdvisor });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

import productOrderModel from "../models/productOrderModel.js"

// API to get all product orders for admin panel
const productOrdersAdmin = async (req, res) => {
    try {
        const orders = await productOrderModel.find({}).sort({ createdAt: -1 });

        // Populate advisor and farmer data manually or using mongoose
        const populatedOrders = await Promise.all(orders.map(async (order) => {
            const advisor = await advisorModel.findById(order.advisorId).select('name image');
            const farmer = await userModel.findById(order.farmerId).select('firstName lastName phone');
            return {
                ...order.toObject(),
                advisorName: advisor ? advisor.name : 'Unknown Advisor',
                advisorImage: advisor ? advisor.image : '',
                farmerName: farmer ? `${farmer.firstName} ${farmer.lastName || ''}`.trim() : 'Unknown Farmer',
                farmerPhone: farmer ? farmer.phone : ''
            };
        }));

        res.json({ success: true, orders: populatedOrders });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to update product order status (admin)
const updateProductOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        await productOrderModel.findByIdAndUpdate(orderId, { status });
        res.json({ success: true, message: 'Status Updated' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to update a farmer's details by Admin
const updateFarmerAdmin = async (req, res) => {
    try {
        const { farmerId, name, phone, village, totalLand, temporaryLand, landType, winterCrop, summerCrop, rainCrop } = req.body;

        if (!farmerId) {
            return res.json({ success: false, message: 'Farmer ID is required' });
        }

        const farmer = await userModel.findById(farmerId);
        if (!farmer) {
            return res.json({ success: false, message: 'Farmer not found' });
        }

        if (phone && phone !== farmer.phone) {
            const existingUser = await userModel.findOne({ phone, _id: { $ne: farmerId } });
            if (existingUser) {
                return res.json({ success: false, message: 'Another user already exists with this phone number' });
            }
        }

        const normalizedLandType = (landType || '').toLowerCase() === 'open' ? 'open' : 'farm';

        const updateData = {
            farmerName: name || farmer.farmerName,
            firstName: name || farmer.firstName,
            phone: phone || farmer.phone,
            village: village !== undefined ? village : farmer.village,
            totalLand: totalLand !== undefined ? totalLand : farmer.totalLand,
            temporaryLand: temporaryLand !== undefined ? temporaryLand : farmer.temporaryLand,
            landType: normalizedLandType,
            winterCrop: winterCrop !== undefined ? winterCrop : farmer.winterCrop,
            summerCrop: summerCrop !== undefined ? summerCrop : farmer.summerCrop,
            rainCrop: rainCrop !== undefined ? rainCrop : farmer.rainCrop,
        };

        const updatedFarmer = await userModel.findByIdAndUpdate(farmerId, updateData, { new: true }).select('-password');

        res.json({ success: true, message: 'Farmer details updated successfully', farmer: updatedFarmer });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {addadvisor,loginAdmin,alladvisores, ordersAdmin, orderCancel, adminDashboard, allFarmers, productOrdersAdmin, updateProductOrderStatus, updateFarmerAdmin}
