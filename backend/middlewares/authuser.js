// import jwt from  'jsonwebtoken'

// // user authentication middleware
// const authUser = async (req,res,next) => {
//     try {

//         const {token} = req.headers
//         if (!token) {
//             return res.json({success:false,message:"NOt Authorized Login Again"})
//         }
//         const token_decode = jwt.verify(token,process.env.JWT_SECRET)
//         req.body.userId = token_decode.id

//         next()
        
//     } catch (error) {
//         console.log(error)
//         res.json({success:false,message:error.message})
//     }
// }

// export default authUser


import jwt from "jsonwebtoken";

// user authentication middleware
const authUser = async (req, res, next) => {
  try {
    // Read token from Authorization header or custom "token" header
    const token =
      req.headers["authorization"]?.split(" ")[1] || req.headers["token"];

    if (!token) {
      return res.json({
        success: false,
        message: "Not Authorized. Please login again",
      });
    }

    // Verify token
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Save user info safely in req.user (not req.body)
    req.body = req.body || {};
    req.user = { id: token_decode.id };
    req.body.userId = token_decode.id;

    next();
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export default authUser;

