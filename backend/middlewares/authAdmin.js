import jwt from  'jsonwebtoken'

// admin authentication middleware
const authAdmin = async (req,res,next) => {
    try {

        let atoken = req.headers.atoken;
        
        // Also support standard Authorization Bearer token
        if (!atoken && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            atoken = req.headers.authorization.split(' ')[1];
        }

        if (!atoken) {
            return res.json({success:false,message:"NOt Authorized Login Again"})
        }
        const token_decode = jwt.verify(atoken, process.env.JWT_SECRET);

        const isLegacyToken =
            token_decode === (process.env.ADMIN_PHONE || '9510459100') + process.env.ADMIN_PASSWORD;

        const isObjectToken = typeof token_decode === 'object' && token_decode !== null && token_decode.role === 'admin';

        if (!isLegacyToken && !isObjectToken) {
            return res.json({ success: false, message: "Not Authorized Login Again" });
        }

        req.admin = typeof token_decode === 'object' ? token_decode : { phone: process.env.ADMIN_PHONE || '9510459100' };
        next();
        
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

export default authAdmin