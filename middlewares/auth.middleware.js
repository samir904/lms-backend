import AppError from "../utils/error.util.js";
import jwt from "jsonwebtoken"
const isLoggedIn = async (req, res, next) => {
    console.log('Cookies:', req.cookies);
    const { token } = req.cookies;
    if (!token) {
      console.log('No token found in cookies');
      return next(new AppError('unauthenticated, please login again', 401));
    }
    try {
      const userDetails = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded Token:', userDetails);
      req.user = userDetails;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return next(new AppError('unauthenticated, please login again', 401));
    }
  };

const authorizedRoles=(...roles)=>async(req,res,next)=>{
    const currentUserRoles=req.user.role;
    
    if(!roles.includes(currentUserRoles)){
        return next(new AppError("you do not have permission to access this route",403))
    }
    next();
}
const authorizedSubscriber=async(req,res,next)=>{
    const subscription=req.user.subscription;
    const currentUserRoles=req.user.role;
    console.log(subscription)
    console.log(req.user)
    if(currentUserRoles!=="ADMIN"&&subscription.status!=="active"){
        return next(new AppError("please subscribe to acces this routes",403))
    }
    next()
}


export {
    isLoggedIn,
    authorizedRoles,
    authorizedSubscriber
}



// middlewares/auth.middleware.js
// import jwt from "jsonwebtoken";
// import AppError from "../utils/error.util.js";
// import User from "../models/users.model.js";

// const isLoggedIn = async (req, res, next) => {
//     console.log("Cookies received:", req.cookies); // Debug
//     const { token } = req.cookies;

//     if (!token) {
//         return next(new AppError("Unauthenticated, please login again", 401));
//     }

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         console.log("Decoded token:", decoded); // Debug
//         const user = await User.findById(decoded.id);
//         if (!user) {
//             return next(new AppError("User not found", 401));
//         }
//         req.user = user;
//         next();
//     } catch (error) {
//         console.error("Token verification error:", error);
//         return next(new AppError("Invalid or expired token, please login again", 401));
//     }
// };

// export { isLoggedIn };