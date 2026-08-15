import advisorModel from "../models/advisorModel.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import userModel from "../models/userModel.js"
import productOrderModel from "../models/productOrderModel.js"
import { v2 as cloudinary } from 'cloudinary'

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
        const advisors = await advisorModel.find({}).select(['-password', '-email'])
        res.json({ success: true, advisors, advisores: advisors })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for Advisor/Farm Login
const loginAdvisor = async (req, res) => {
    try {
        const { phone, password } = req.body
        const advisor = await advisorModel.findOne({ phone })

        if (!advisor) {
            return res.json({ success: false, message: 'Invalid mobile number' })
        }

        const isMatch = await bcrypt.compare(password, advisor.password)

        if (isMatch) {
            const token = jwt.sign({ id: advisor._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: 'Invalid password' }) 
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

// API to get dashboard data for Advisor panel
const advisorDashboard = async (req, res) => {
    try {
        const advisorId = req.advisor?.id || req.body.advisorId;
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
        const advisorId = req.advisor?.id || req.body.advisorId;
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
        const advisorId = req.advisor?.id || req.body.advisorId;
        const { price, address, removePhoto } = req.body;
        const imageFile = req.file;

        let updateData = {};
        if (price !== undefined) updateData.price = Number(price);
        if (address !== undefined) updateData.address = address;

        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            updateData.image = imageUpload.secure_url;
        } else if (removePhoto === 'true' || removePhoto === true) {
            updateData.image = '';
        }

        await advisorModel.findByIdAndUpdate(advisorId, updateData)
        const updatedProfile = await advisorModel.findById(advisorId).select('-password')

        res.json({ success: true, message: 'Profile Updated', profileData: updatedProfile })
        
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to add a new farmer by Advisor
const addFarmer = async (req, res) => {
    try {
        const advisorId = req.advisor?.id || req.body.advisorId;
        const { name, phone, village, totalLand, temporaryLand, landType, winterCrop, summerCrop, rainCrop } = req.body
        
        // Checking for all required data
        if (!name || !phone || !village || !totalLand || !temporaryLand || !landType || !winterCrop || !summerCrop || !rainCrop) {
            return res.json({ success: false, message: 'All fields are required' })
        }

        if (/\d/.test(winterCrop) || /\d/.test(summerCrop) || /\d/.test(rainCrop)) {
            return res.json({ success: false, message: 'Crop details cannot contain numbers' })
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

        const imageFile = req.file;
        let imageUrl = '';
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            imageUrl = imageUpload.secure_url;
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
            advisorName: advisorName,
            ...(imageUrl ? { profileImage: imageUrl, image: imageUrl } : {})
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
        const advisorId = req.advisor?.id || req.body.advisorId;
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
        const advisorId = req.advisor?.id || req.body.advisorId;
        const farmerId = req.body.farmerId || req.body.id || req.body._id;
        const farmer = await userModel.findOne({ _id: farmerId, role: 'farmer' }).select('-password')
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

// API to update a farmer's details by Advisor
const updateFarmer = async (req, res) => {
    try {
        const advisorId = req.advisor?.id || req.body.advisorId;
        const farmerId = req.body.farmerId || req.body.id || req.body._id;
        const { name, phone, village, totalLand, temporaryLand, landType, winterCrop, summerCrop, rainCrop } = req.body;

        if (!farmerId) {
            return res.json({ success: false, message: 'Farmer ID is required' })
        }

        // Verify farmer exists
        let farmer;
        if (advisorId) {
            farmer = await userModel.findOne({ _id: farmerId, assignedAdvisor: advisorId, role: 'farmer' });
        }
        if (!farmer) {
            farmer = await userModel.findOne({ _id: farmerId, role: 'farmer' });
        }
        if (!farmer) {
            return res.json({ success: false, message: 'Farmer not found or unauthorized' })
        }

        if (!name || !phone || !village || !totalLand || !temporaryLand || !landType || !winterCrop || !summerCrop || !rainCrop) {
            return res.json({ success: false, message: 'All fields are required' })
        }

        if (/\d/.test(winterCrop) || /\d/.test(summerCrop) || /\d/.test(rainCrop)) {
            return res.json({ success: false, message: 'Crop details cannot contain numbers' })
        }

        // If phone is changed, check if new phone number is taken by another user
        if (phone && phone !== farmer.phone) {
            const existingUser = await userModel.findOne({ phone, _id: { $ne: farmerId } })
            if (existingUser) {
                return res.json({ success: false, message: 'Another user already exists with this phone number' })
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
        }

        const { removePhoto } = req.body;
        const imageFile = req.file;
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            updateData.profileImage = imageUpload.secure_url;
            updateData.image = imageUpload.secure_url;
        } else if (removePhoto === 'true' || removePhoto === true) {
            updateData.profileImage = 'default.jpg';
            updateData.image = '';
        }

        const updatedFarmer = await userModel.findByIdAndUpdate(farmerId, updateData, { new: true }).select('-password');

        res.json({ success: true, message: 'Farmer details updated successfully', farmer: updatedFarmer })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}



// API for Advisor to update live location
const updateLocationAdvisor = async (req, res) => {
    try {
        const { advisorId, lat, lng, speed, address, isMoving } = req.body;
        const numLat = Number(lat);
        const numLng = Number(lng);
        
        if (!advisorId || lat === undefined || lng === undefined || isNaN(numLat) || isNaN(numLng)) {
            return res.json({ success: false, message: 'Invalid location parameters' });
        }

        const advisor = await advisorModel.findById(advisorId);
        if (!advisor) {
            return res.json({ success: false, message: 'Advisor not found' });
        }

        const locationObj = {
            lat: numLat,
            lng: numLng,
            speed: speed ? Number(speed) : 0,
            address: address || `${advisor.village || 'Area'}, ${advisor.area || ''}`,
            lastUpdated: new Date(),
            isMoving: Boolean(isMoving)
        };

        const newPoint = { lat: numLat, lng: numLng, timestamp: new Date() };
        const history = [...(advisor.locationHistory || []), newPoint].slice(-50);

        await advisorModel.findByIdAndUpdate(advisorId, {
            location: locationObj,
            locationHistory: history
        });

        res.json({ success: true, message: 'Location updated successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to change Advisor Password from Advisor Panel
const changeAdvisorPassword = async (req, res) => {
    try {
        const advisorId = req.advisor?.id || req.body.advisorId;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.json({ success: false, message: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.json({ success: false, message: 'New password must be at least 6 characters long' });
        }

        const advisor = await advisorModel.findById(advisorId);
        if (!advisor) {
            return res.json({ success: false, message: 'Advisor account not found' });
        }

        const isMatch = await bcrypt.compare(oldPassword, advisor.password);
        if (!isMatch) {
            return res.json({ success: false, message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        advisor.password = hashedPassword;
        advisor.plainPassword = newPassword;
        advisor.passwordChangedAt = new Date();
        await advisor.save();

        res.json({ success: true, message: 'Password updated successfully. Please login with your new password.' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { 
    changeAvailability, 
    advisorList, 
    loginAdvisor, 
    advisorDashboard, 
    advisorProfile, 
    updateAdvisorProfile,
    addFarmer,
    registerAdvisor,
    advisorFarmers,
    getFarmer,
    updateFarmer,
    updateLocationAdvisor,
    changeAdvisorPassword
}
