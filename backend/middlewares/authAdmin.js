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
        const token_decode = jwt.verify(atoken,process.env.JWT_SECRET)

        if(token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
            return res.json({success:false,message:"NOt Authorized Login Again"})
        }

        next()
        
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

export default authAdmin