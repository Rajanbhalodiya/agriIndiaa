import jwt from "jsonwebtoken";
import advisorModel from "../models/advisorModel.js";

// advisor authentication middleware
const authAdvisor = async (req, res, next) => {
  try {
    // ✅ Read token from Authorization header or custom "dtoken" header
    const dtoken =
      req.headers["authorization"]?.split(" ")[1] || req.headers["dtoken"];

    if (!dtoken) {
      return res.json({
        success: false,
        message: "Not Authorized. Please login again",
      });
    }

    // ✅ Verify token
    const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET);

    // ✅ Check if advisor exists in database
    const advisor = await advisorModel.findById(token_decode.id);
    if (!advisor) {
      return res.json({
        success: false,
        message: "Not Authorized. Account not found. Please login again",
      });
    }

    // ✅ Check if password was changed after token issuance
    if (advisor.passwordChangedAt && token_decode.iat) {
      const passwordChangedTime = Math.floor(new Date(advisor.passwordChangedAt).getTime() / 1000);
      if (token_decode.iat < passwordChangedTime) {
        return res.json({
          success: false,
          message: "Password changed. Please login again",
        });
      }
    }

    // ✅ Safely create req.body if undefined
    req.body = req.body || {};

    // ✅ Attach advisor info safely
    req.advisor = { id: token_decode.id };
    req.advisorId = token_decode.id;
    req.body.advisorId = token_decode.id;

    // ✅ Continue to next middleware or controller
    next();
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Not Authorized. Please login again" });
  }
};

export default authAdvisor;
