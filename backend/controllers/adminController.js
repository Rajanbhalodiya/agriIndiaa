import validator from "validator"
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from "cloudinary"
import advisorModel from "../models/advisorModel.js"
import jwt from 'jsonwebtoken'
import userModel from "../models/userModel.js"
import productModel from "../models/productModel.js"
import productOrderModel from "../models/productOrderModel.js"

// API for adding advisor
const addAdvisor = async (req, res) => {
    try {
        const { name, phone, area, village, pincode, aadhar, password } = req.body

        if (!name || !phone || !area || !village || !pincode || !aadhar || !password) {
            return res.json({ success: false, message: "Missing Details" })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        
        const advisorData = {
            name,
            phone,
            area,
            village,
            pincode,
            aadhar,
            password: hashedPassword,
            plainPassword: password,
            date: Date.now()
        }

        const newAdvisor = new advisorModel(advisorData)
        await newAdvisor.save()

        res.json({ success: true, message: "Advisor Added Successfully" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for admin Login (supports Phone number)
const loginAdmin = async (req, res) => {
    try {
        const { phone, password } = req.body

        if (!phone || !password) {
            return res.json({ success: false, message: "Please provide phone number and password" })
        }

        // 1. Check MongoDB user with role 'admin'
        let adminUser = await userModel.findOne({
            role: 'admin',
            phone: phone
        }).select('+password')

        // Fallback: If no DB admin found yet, seed from env if credentials match
        if (!adminUser) {
            const adminPhoneEnv = process.env.ADMIN_PHONE || '9510459100'
            if (phone === adminPhoneEnv && password === process.env.ADMIN_PASSWORD) {
                adminUser = new userModel({
                    firstName: 'System',
                    lastName: 'Admin',
                    phone: adminPhoneEnv,
                    password: process.env.ADMIN_PASSWORD || 'admin@123',
                    role: 'admin'
                })
                await adminUser.save()
                adminUser = await userModel.findById(adminUser._id).select('+password')
            }
        }

        if (!adminUser) {
            return res.json({ success: false, message: "Invalid admin credentials" })
        }

        // Verify password
        let isPasswordCorrect = await bcrypt.compare(password, adminUser.password)
        if (!isPasswordCorrect && password === process.env.ADMIN_PASSWORD) {
            isPasswordCorrect = true
            adminUser.password = password
            await adminUser.save()
        }

        if (isPasswordCorrect) {
            const token = jwt.sign(
                { id: adminUser._id, role: 'admin', phone: adminUser.phone },
                process.env.JWT_SECRET
            )
            res.json({ success: true, token, phone: adminUser.phone })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to Send OTP for Admin Forgot Password
const sendAdminResetOTP = async (req, res) => {
    try {
        const { phone } = req.body
        if (!phone) {
            return res.json({ success: false, message: "Phone number is required" })
        }

        let admin = await userModel.findOne({ phone, role: 'admin' })
        
        // If not in DB, seed admin if phone matches env
        const adminPhoneEnv = process.env.ADMIN_PHONE || '9510459100'
        if (!admin && phone === adminPhoneEnv) {
            admin = new userModel({
                firstName: 'System',
                lastName: 'Admin',
                phone: adminPhoneEnv,
                password: process.env.ADMIN_PASSWORD || 'admin@123',
                role: 'admin'
            })
            await admin.save()
        }

        if (!admin) {
            return res.json({ success: false, message: "No admin user found with this phone number" })
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const expiry = new Date(Date.now() + 10 * 60 * 1000)

        admin.resetOtp = otp
        admin.resetOtpExpire = expiry
        await admin.save()

        console.log(`[ADMIN OTP] Generated OTP for Admin (${phone}): ${otp}`)

        res.json({
            success: true,
            message: `OTP sent to phone number ${phone}.`,
            otp
        })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to Verify Admin OTP
const verifyAdminOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body
        if (!phone || !otp) {
            return res.json({ success: false, message: "Phone and OTP are required" })
        }

        const admin = await userModel.findOne({ phone, role: 'admin' })
        if (!admin) {
            return res.json({ success: false, message: "Admin user not found" })
        }

        if (!admin.resetOtp || admin.resetOtp !== otp.toString().trim()) {
            return res.json({ success: false, message: "Invalid OTP" })
        }

        if (new Date() > admin.resetOtpExpire) {
            return res.json({ success: false, message: "OTP has expired. Please request a new one." })
        }

        res.json({ success: true, message: "OTP verified successfully" })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to Reset Admin Password
const resetAdminPassword = async (req, res) => {
    try {
        const { phone, otp, newPassword } = req.body
        if (!phone || !otp || !newPassword) {
            return res.json({ success: false, message: "Missing required fields" })
        }

        if (newPassword.length < 6) {
            return res.json({ success: false, message: "Password must be at least 6 characters long" })
        }

        const admin = await userModel.findOne({ phone, role: 'admin' })
        if (!admin) {
            return res.json({ success: false, message: "Admin user not found" })
        }

        if (!admin.resetOtp || admin.resetOtp !== otp.toString().trim()) {
            return res.json({ success: false, message: "Invalid OTP verification state" })
        }

        if (new Date() > admin.resetOtpExpire) {
            return res.json({ success: false, message: "OTP has expired" })
        }

        admin.password = newPassword
        admin.resetOtp = ''
        admin.resetOtpExpire = undefined
        await admin.save()

        res.json({ success: true, message: "Admin password reset successfully! Please sign in with your new password." })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all advisors list for admin panel
const allAdvisors = async (req, res) => {
    try {
        const advisors = await advisorModel.find({}).select('-password')
        res.json({ success: true, advisors, advisores: advisors }) 
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
    try {
        const advisors = await advisorModel.find({})
        const farmers = await userModel.find({ role: 'farmer' })
        const productOrders = await productOrderModel.find({}).sort({ createdAt: -1 })
        const products = await productModel.find({})

        const totalRevenue = productOrders.reduce((acc, curr) => curr.payment ? acc + (curr.totalAmount || 0) : acc, 0);

        const recentProductOrders = await Promise.all(productOrders.slice(0, 5).map(async (order) => {
            const advisor = await advisorModel.findById(order.advisorId).select('name');
            const farmer = await userModel.findById(order.farmerId).select('firstName lastName');
            return {
                _id: order._id,
                farmerName: farmer ? `${farmer.firstName} ${farmer.lastName || ''}`.trim() : 'Farmer',
                advisorName: advisor ? advisor.name : 'Advisor',
                date: new Date(order.date).toLocaleDateString('en-IN'),
                totalAmount: order.totalAmount,
                status: order.status,
                cancelled: order.status === 'Cancelled'
            };
        }));

        const dashData = {
            advisors: advisors.length,
            advisores: advisors.length,
            farmers: farmers.length,
            productOrdersCount: productOrders.length,
            totalOrders: productOrders.length,
            products: products.length,
            totalRevenue,
            latestOrders: recentProductOrders
        }

        res.json({ success: true, dashData })
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });      
    }
}

// API to get all farmers for admin panel
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

// API to get all product orders for admin panel
const productOrdersAdmin = async (req, res) => {
    try {
        const orders = await productOrderModel.find({}).sort({ createdAt: -1 });

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

        if ((winterCrop && /\d/.test(winterCrop)) || (summerCrop && /\d/.test(summerCrop)) || (rainCrop && /\d/.test(rainCrop))) {
            return res.json({ success: false, message: 'Crop details cannot contain numbers' });
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

// API to update advisor details (admin)
const updateAdvisorAdmin = async (req, res) => {
    try {
        const { advisorId, name, phone, area, village, pincode, aadhar, password, available } = req.body;

        if (!advisorId) {
            return res.json({ success: false, message: 'Advisor ID is required' });
        }

        const advisor = await advisorModel.findById(advisorId);
        if (!advisor) {
            return res.json({ success: false, message: 'Advisor not found' });
        }

        if (phone && phone !== advisor.phone) {
            const existingAdvisor = await advisorModel.findOne({ phone, _id: { $ne: advisorId } });
            if (existingAdvisor) {
                return res.json({ success: false, message: 'Another advisor already exists with this phone number' });
            }
        }

        if (aadhar && aadhar.length !== 12) {
            return res.json({ success: false, message: 'Aadhar number must be exactly 12 digits' });
        }

        const updateData = {
            name: name || advisor.name,
            phone: phone || advisor.phone,
            area: area !== undefined ? area : advisor.area,
            village: village !== undefined ? village : advisor.village,
            pincode: pincode !== undefined ? pincode : advisor.pincode,
            aadhar: aadhar !== undefined ? aadhar : advisor.aadhar,
        };

        if (available !== undefined) {
            updateData.available = Boolean(available);
        }

        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
            updateData.plainPassword = password;
        }

        const updatedAdvisor = await advisorModel.findByIdAndUpdate(advisorId, updateData, { new: true }).select('-password');

        res.json({ success: true, message: 'Advisor details updated successfully', advisor: updatedAdvisor });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get all advisor locations for GPS map
const getAdvisorLocationsAdmin = async (req, res) => {
    try {
        const advisors = await advisorModel.find({}).select('name phone area village pincode image available location locationHistory');
        const formattedAdvisors = advisors.map((adv, index) => {
            const advObj = adv.toObject();
            const defaultLat = 22.3072 + (index * 0.08) - 0.04;
            const defaultLng = 73.1812 + (index * 0.07) - 0.04;
            
            if (!advObj.location || typeof advObj.location.lat !== 'number' || typeof advObj.location.lng !== 'number' || isNaN(advObj.location.lat) || isNaN(advObj.location.lng) || advObj.location.lat === 0) {
                advObj.location = {
                    lat: defaultLat,
                    lng: defaultLng,
                    address: `${advObj.village || 'Area'}, ${advObj.area || 'Gujarat'}`,
                    speed: 0,
                    lastUpdated: advObj.date || new Date(),
                    isMoving: false
                };
            }
            return advObj;
        });
        res.json({ success: true, advisors: formattedAdvisors });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    addAdvisor,
    addAdvisor as addadvisor,
    loginAdmin,
    sendAdminResetOTP,
    verifyAdminOTP,
    resetAdminPassword,
    allAdvisors,
    allAdvisors as alladvisores,
    adminDashboard,
    allFarmers,
    productOrdersAdmin,
    updateProductOrderStatus,
    updateFarmerAdmin,
    updateAdvisorAdmin,
    getAdvisorLocationsAdmin
}

