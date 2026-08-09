import advisorModel from "../models/advisorModel.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import orderModel from "../models/orderModel.js"
import userModel from "../models/userModel.js"
import productOrderModel from "../models/productOrderModel.js"

const changeAvailability = async (req , res) => {
    try {
        const { advisorId, targetId: incomingTargetId, docId } = req.body
        const targetId = advisorId || incomingTargetId || docId

        if (!targetId) {
            return res.json({ success: false, message: 'Advisor ID is missing' })
        }

        const advisorData = await advisorModel.findById(targetId)
        if (!advisorData) {
            return res.json({ success: false, message: 'Advisor not found' })
        }

        await advisorModel.findByIdAndUpdate(targetId, { available: !advisorData.available })
        res.json({ success: true, message: 'Availability Changed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const advisorList = async (req, res) => {
    try {
        const advisores = await advisorModel.find({}).select(['-password', '-email'])
        res.json({ success: true, advisores })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for Advisor/Farm Login
const loginAdvisor = async (req, res) => {
    try {
        const { phone, password } = req.body
        const Advisor = await advisorModel.findOne({ phone })

        if (!Advisor) {
            return res.json({ success: false, message: 'wrong mobil number' })
        }

        const isMatch = await bcrypt.compare(password, Advisor.password)

        if (isMatch) {
            const token = jwt.sign({ id: Advisor._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: 'wrong passwor' }) 
        }
        
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message }) 
    }
}

// API for Advisor Registration
const registerAdvisor = async (req, res) => {
    try {
        const { name, phone, password, village } = req.body

        if (!name || !phone || !password || !village) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        const exists = await advisorModel.findOne({ phone })
        if (exists) {
            return res.json({ success: false, message: 'Advisor with this phone number already exists' })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const advisorData = {
            name,
            phone,
            village,
            password: hashedPassword,
            date: Date.now()
        }

        const newAdvisor = new advisorModel(advisorData)
        await newAdvisor.save()

        const token = jwt.sign({ id: newAdvisor._id }, process.env.JWT_SECRET)
        res.json({ success: true, message: 'Registration Successful', token })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get Advisor Orders for Advisor panel
const ordersAdvisor = async (req, res) => {
    try {
        const { advisorId } = req.body
        const orders = await orderModel.find({ advisorId })
        res.json({ success: true, appointments: orders }) // keep key as 'appointments' to match frontend, or return as 'orders' and 'appointments'
        
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })        
    }
}

// API to mark order as completed by Advisor panel
const orderCompleted = async (req, res) => {
    try {
        const { advisorId, appointmentId } = req.body // backend middleware passes authenticated Advisor ID as advisorId

        const orderData = await orderModel.findById(appointmentId)

        if (orderData && orderData.advisorId === advisorId) {
            await orderModel.findByIdAndUpdate(appointmentId, { isCompleted: true })
            return res.json({ success: true, message: 'Order Completed' })
        } else {
            return res.json({ success: false, message: 'Mark Failed' })
        }
        
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })            
    }
}

// API to cancel order for Advisor panel
const orderCancel = async (req, res) => {
    try {
        const { advisorId, appointmentId } = req.body

        const orderData = await orderModel.findById(appointmentId)

        if (orderData && orderData.advisorId === advisorId) {
            await orderModel.findByIdAndUpdate(appointmentId, { cancelled: true })
            return res.json({ success: true, message: 'Order Cancelled' })
        } else {
            return res.json({ success: false, message: 'Cancellation Failed' })
        }
        
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })            
    }
}

// API to get dashboard data for Advisor panel
const advisorDashboard = async (req, res) => {
    try {
        const { advisorId } = req.body
        const appointments = await orderModel.find({ advisorId })
        const productOrders = await productOrderModel.find({ advisorId }).sort({ createdAt: -1 })
        const farmers = await userModel.find({ assignedAdvisor: advisorId, role: 'farmer' })

        let totalRevenue = 0
        let pendingPaymentsAmount = 0
        let pendingPaymentsCount = 0

        productOrders.forEach((order) => {
            if (order.payment) {
                totalRevenue += order.totalAmount || 0
            } else {
                pendingPaymentsAmount += order.totalAmount || 0
                pendingPaymentsCount++
            }
        })

        // Format farmers and product orders with farmer names
        const recentOrdersWithFarmer = await Promise.all(productOrders.slice(0, 5).map(async (order) => {
            const farmer = await userModel.findById(order.farmerId).select('firstName lastName phone village')
            return {
                ...order.toObject(),
                farmerName: farmer ? `${farmer.firstName} ${farmer.lastName || ''}`.trim() : 'Unknown Farmer'
            }
        }))

        const dashData = {
            totalFarmers: farmers.length,
            totalOrders: productOrders.length,
            totalRevenue,
            pendingPaymentsAmount,
            pendingPaymentsCount,
            totalAppointments: appointments.length,
            appointments,
            recentOrders: recentOrdersWithFarmer,
            recentFarmers: farmers.slice(0, 5)
        }

        res.json({ success: true, dashData })
        
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })            
    }
}

// API to get Advisor profile for Advisor panel
const advisorProfile = async (req, res) => {
    try {
        const { advisorId } = req.body
        const profileData = await advisorModel.findById(advisorId).select('-password')
        res.json({ success: true, profileData })
        
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })        
    }
}

// API to update Advisor profile data from Advisor panel
const updateAdvisorProfile = async (req, res) => {
    try {
        const { advisorId, price, address, available } = req.body
        await advisorModel.findByIdAndUpdate(advisorId, { price, address, available })
        res.json({ success: true, message: 'Profile Updated' })
        
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to add a new farmer by Advisor
const addFarmer = async (req, res) => {
    try {
        const { advisorId, name, phone, village, totalLand, temporaryLand, landType, winterCrop, summerCrop, rainCrop } = req.body
        
        // Checking for all required data
        if (!name || !phone || !village || !totalLand || !landType) {
            return res.json({ success: false, message: 'Missing required details' })
        }

        // Check if phone number already exists
        const exists = await userModel.findOne({ phone })
        if (exists) {
            return res.json({ success: false, message: 'Farmer with this phone number already exists' })
        }

        // Normalize landType to match userModel enum ('farm' or 'open')
        const normalizedLandType = (landType || '').toLowerCase() === 'open' ? 'open' : 'farm';

        // Fetch Advisor's name to store directly on farmer record
        let advisorName = 'Unassigned';
        if (advisorId) {
            const advisorDoc = await advisorModel.findById(advisorId).select('name');
            if (advisorDoc) {
                advisorName = advisorDoc.name;
            }
        }

        // Create new farmer document
        const farmerData = {
            farmerName: name,
            firstName: name,
            phone,
            village,
            totalLand,
            temporaryLand: temporaryLand || '0',
            landType: normalizedLandType,
            winterCrop: winterCrop || '',
            summerCrop: summerCrop || '',
            rainCrop: rainCrop || '',
            role: 'farmer',
            assignedAdvisor: advisorId,
            advisorName: advisorName
        }

        const newFarmer = new userModel(farmerData)
        await newFarmer.save()

        res.json({ success: true, message: 'Farmer Added Successfully', farmer: newFarmer })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all farmers added by the logged-in Advisor
const advisorFarmers = async (req, res) => {
    try {
        const { advisorId } = req.body
        const farmers = await userModel.find({ assignedAdvisor: advisorId, role: 'farmer' }).select('-password').sort({ createdAt: -1 })
        res.json({ success: true, farmers })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get a single farmer's details and order history by ID for the logged-in Advisor
const getFarmer = async (req, res) => {
    try {
        const { advisorId, farmerId } = req.body
        const farmer = await userModel.findOne({ _id: farmerId, assignedAdvisor: advisorId, role: 'farmer' }).select('-password')
        if (!farmer) {
            return res.json({ success: false, message: 'Farmer not found' })
        }

        const orders = await productOrderModel.find({ farmerId, advisorId }).sort({ createdAt: -1 });

        res.json({ success: true, farmer, orders })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to send OTP for Advisor Forgot Password
const forgotPasswordAdvisor = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.json({ success: false, message: 'Phone number is required' });
        }

        const advisor = await advisorModel.findOne({ phone });
        if (!advisor) {
            return res.json({ success: false, message: 'No advisor account found with this phone number' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        advisor.resetOtp = otp;
        advisor.resetOtpExpire = expiry;
        await advisor.save();

        res.json({
            success: true,
            message: `Verification OTP sent to phone. (Testing OTP: ${otp})`,
            otp
        });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// API to Reset Password using OTP for Advisor
const resetPasswordAdvisor = async (req, res) => {
    try {
        const { phone, otp, newPassword } = req.body;
        if (!phone || !otp || !newPassword) {
            return res.json({ success: false, message: 'All fields are required' });
        }

        if (newPassword.length < 6) {
            return res.json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const advisor = await advisorModel.findOne({ phone });
        if (!advisor) {
            return res.json({ success: false, message: 'Advisor not found' });
        }

        if (!advisor.resetOtp || advisor.resetOtp !== otp) {
            return res.json({ success: false, message: 'Invalid OTP' });
        }

        if (new Date() > advisor.resetOtpExpire) {
            return res.json({ success: false, message: 'OTP has expired' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        advisor.password = hashedPassword;
        advisor.resetOtp = '';
        advisor.resetOtpExpire = undefined;
        await advisor.save();

        res.json({ success: true, message: 'Password reset successfully! Please login with your new password.' });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

export { 
    changeAvailability, 
    advisorList, 
    loginAdvisor, 
    ordersAdvisor, 
    orderCompleted, 
    orderCancel, 
    advisorDashboard, 
    advisorProfile, 
    updateAdvisorProfile,
    addFarmer,
    registerAdvisor,
    advisorFarmers,
    getFarmer,
    forgotPasswordAdvisor,
    resetPasswordAdvisor
}
