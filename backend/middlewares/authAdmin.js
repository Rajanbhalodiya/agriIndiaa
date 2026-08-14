import jwt from 'jsonwebtoken'

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
        const adminPhone = (process.env.ADMIN_PHONE || '9510459100').replace(/['"]/g, '').trim();

        if (!token_decode) {
            return res.json({ success: false, message: "Not Authorized Login Again" });
        }

        // Accept tokens containing phone or role: admin
        if (token_decode.phone && token_decode.phone !== adminPhone && token_decode.role !== 'admin') {
            return res.json({ success: false, message: "Not Authorized Login Again" });
        }

        req.admin = {
            name: 'Admin',
            phone: adminPhone,
            role: 'admin'
        };
        next();
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export default authAdmin