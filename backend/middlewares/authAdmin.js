import jwt from 'jsonwebtoken'
import adminModel from '../models/adminModel.js'

// admin authentication middleware
const authAdmin = async (req, res, next) => {
    try {

        let atoken = req.headers.atoken;
        
        // Also support standard Authorization Bearer token
        if (!atoken && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            atoken = req.headers.authorization.split(' ')[1];
        }

        if (!atoken) {
            return res.json({ success: false, message: "Not Authorized Login Again" });
        }
        const token_decode = jwt.verify(atoken, process.env.JWT_SECRET);

        let admin = null;
        if (token_decode && token_decode.id) {
            admin = await adminModel.findById(token_decode.id);
        } else if (token_decode && token_decode.phone) {
            admin = await adminModel.findOne({ phone: token_decode.phone });
        } else {
            // Legacy token fallback
            const adminPhone = process.env.ADMIN_PHONE || '9876543210';
            admin = await adminModel.findOne({ phone: adminPhone });
        }

        if (!admin) {
            return res.json({ success: false, message: "Not Authorized Login Again" });
        }

        req.admin = admin;
        next();
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export default authAdmin