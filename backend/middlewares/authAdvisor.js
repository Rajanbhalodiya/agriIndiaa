import jwt from "jsonwebtoken";

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
    res.json({ success: false, message: error.message });
  }
};

export default authAdvisor;
