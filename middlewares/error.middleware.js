import AppError from "../utils/error.util.js";

const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log the error for debugging
    console.log("Error in errorMiddleware:", err);

    // Send the error response
    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
};

export default errorMiddleware;